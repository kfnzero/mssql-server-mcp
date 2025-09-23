import { MSSQLManager } from '../database/mssql-manager.js';
import { ColumnInfo, TableInfo, IndexInfo, ForeignKeyInfo } from '../types/database.js';

export class SchemaService {
  constructor(private dbManager: MSSQLManager) {}

  async listSchemas() {
    const query = `
      SELECT 
        name as schema_name,
        principal_id,
        schema_id
      FROM sys.schemas 
      WHERE name NOT IN ('sys', 'INFORMATION_SCHEMA')
      ORDER BY name
    `;

    try {
      const result = await this.dbManager.query(query);
      return {
        content: [
          {
            type: 'text',
            text: `資料庫 Schema 列表：\n${JSON.stringify(result.recordset, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`取得 Schema 列表失敗: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async listTables(schema: string = 'dbo') {
    const query = `
      SELECT 
        t.name as table_name,
        s.name as schema_name,
        t.object_id,
        t.type_desc,
        t.create_date,
        t.modify_date
      FROM sys.tables t
      INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
      WHERE s.name = @schema
      ORDER BY t.name
    `;

    try {
      const result = await this.dbManager.query(query, [
        { name: 'schema', value: schema, type: 'varchar' }
      ]);
      
      return {
        content: [
          {
            type: 'text',
            text: `Schema "${schema}" 的資料表列表：\n${JSON.stringify(result.recordset, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`取得資料表列表失敗: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async describeTable(tableName: string, schema: string = 'dbo'): Promise<any> {
    try {
      const tableInfo: TableInfo = {
        schema,
        tableName,
        columns: await this.getTableColumns(tableName, schema),
        indexes: await this.getTableIndexes(tableName, schema),
        foreignKeys: await this.getTableForeignKeys(tableName, schema),
      };

      return {
        content: [
          {
            type: 'text',
            text: `資料表 "${schema}.${tableName}" 結構：\n${JSON.stringify(tableInfo, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`描述資料表失敗: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async getTableColumns(tableName: string, schema: string): Promise<ColumnInfo[]> {
    const query = `
      SELECT 
        c.name,
        t.name as type,
        c.max_length,
        c.precision,
        c.scale,
        c.is_nullable,
        c.is_identity,
        dc.definition as default_value,
        CASE 
          WHEN pk.column_id IS NOT NULL THEN 1 
          ELSE 0 
        END as is_primary_key
      FROM sys.columns c
      INNER JOIN sys.types t ON c.user_type_id = t.user_type_id
      INNER JOIN sys.tables tb ON c.object_id = tb.object_id
      INNER JOIN sys.schemas s ON tb.schema_id = s.schema_id
      LEFT JOIN sys.default_constraints dc ON c.default_object_id = dc.object_id
      LEFT JOIN (
        SELECT ic.object_id, ic.column_id
        FROM sys.index_columns ic
        INNER JOIN sys.indexes i ON ic.object_id = i.object_id AND ic.index_id = i.index_id
        WHERE i.is_primary_key = 1
      ) pk ON c.object_id = pk.object_id AND c.column_id = pk.column_id
      WHERE tb.name = @tableName AND s.name = @schema
      ORDER BY c.column_id
    `;

    const result = await this.dbManager.query(query, [
      { name: 'tableName', value: tableName, type: 'varchar' },
      { name: 'schema', value: schema, type: 'varchar' }
    ]);

    return result.recordset?.map((row: any) => ({
      name: row.name,
      type: row.type,
      nullable: row.is_nullable,
      defaultValue: row.default_value,
      isIdentity: row.is_identity,
      isPrimaryKey: row.is_primary_key === 1,
      maxLength: row.max_length,
      precision: row.precision,
      scale: row.scale,
    })) || [];
  }

  private async getTableIndexes(tableName: string, schema: string): Promise<IndexInfo[]> {
    const query = `
      SELECT 
        i.name,
        i.type_desc as type,
        i.is_unique,
        i.is_primary_key,
        STRING_AGG(c.name, ', ') WITHIN GROUP (ORDER BY ic.key_ordinal) as columns
      FROM sys.indexes i
      INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
      INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
      INNER JOIN sys.tables t ON i.object_id = t.object_id
      INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
      WHERE t.name = @tableName AND s.name = @schema
      GROUP BY i.name, i.type_desc, i.is_unique, i.is_primary_key
      ORDER BY i.name
    `;

    const result = await this.dbManager.query(query, [
      { name: 'tableName', value: tableName, type: 'varchar' },
      { name: 'schema', value: schema, type: 'varchar' }
    ]);

    return result.recordset?.map((row: any) => ({
      name: row.name,
      type: row.type,
      isUnique: row.is_unique,
      isPrimaryKey: row.is_primary_key,
      columns: row.columns ? row.columns.split(', ') : [],
    })) || [];
  }

  private async getTableForeignKeys(tableName: string, schema: string): Promise<ForeignKeyInfo[]> {
    const query = `
      SELECT 
        fk.name,
        c1.name as column_name,
        t2.name as referenced_table,
        c2.name as referenced_column,
        s2.name as referenced_schema
      FROM sys.foreign_keys fk
      INNER JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
      INNER JOIN sys.columns c1 ON fkc.parent_object_id = c1.object_id AND fkc.parent_column_id = c1.column_id
      INNER JOIN sys.columns c2 ON fkc.referenced_object_id = c2.object_id AND fkc.referenced_column_id = c2.column_id
      INNER JOIN sys.tables t1 ON fkc.parent_object_id = t1.object_id
      INNER JOIN sys.tables t2 ON fkc.referenced_object_id = t2.object_id
      INNER JOIN sys.schemas s1 ON t1.schema_id = s1.schema_id
      INNER JOIN sys.schemas s2 ON t2.schema_id = s2.schema_id
      WHERE t1.name = @tableName AND s1.name = @schema
      ORDER BY fk.name
    `;

    const result = await this.dbManager.query(query, [
      { name: 'tableName', value: tableName, type: 'varchar' },
      { name: 'schema', value: schema, type: 'varchar' }
    ]);

    return result.recordset?.map((row: any) => ({
      name: row.name,
      column: row.column_name,
      referencedTable: row.referenced_table,
      referencedColumn: row.referenced_column,
      referencedSchema: row.referenced_schema,
    })) || [];
  }
}