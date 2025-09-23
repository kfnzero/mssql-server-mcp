import { MSSQLManager } from '../database/mssql-manager.js';
import { StoredProcedureInfo, StoredProcedureParameter, QueryParameter } from '../types/database.js';

export class StoredProcedureService {
  constructor(private dbManager: MSSQLManager) {}

  async listStoredProcedures(schema: string = 'dbo') {
    const query = `
      SELECT 
        p.name as procedure_name,
        s.name as schema_name,
        p.object_id,
        p.create_date,
        p.modify_date,
        p.type_desc
      FROM sys.procedures p
      INNER JOIN sys.schemas s ON p.schema_id = s.schema_id
      WHERE s.name = @schema
      ORDER BY p.name
    `;

    try {
      const result = await this.dbManager.query(query, [
        { name: 'schema', value: schema, type: 'varchar' }
      ]);
      
      return {
        content: [
          {
            type: 'text',
            text: `Schema "${schema}" 的預存程序列表：\n${JSON.stringify(result.recordset, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`取得預存程序列表失敗: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async describeStoredProcedure(procedureName: string, schema: string = 'dbo'): Promise<any> {
    try {
      const procedureInfo: StoredProcedureInfo = {
        name: procedureName,
        schema,
        definition: await this.getProcedureDefinition(procedureName, schema),
        createDate: new Date(),
        modifyDate: new Date(),
        parameters: await this.getProcedureParameters(procedureName, schema),
      };

      // 取得建立和修改日期
      const dateInfo = await this.getProcedureDateInfo(procedureName, schema);
      if (dateInfo) {
        procedureInfo.createDate = dateInfo.createDate;
        procedureInfo.modifyDate = dateInfo.modifyDate;
      }

      return {
        content: [
          {
            type: 'text',
            text: `預存程序 "${schema}.${procedureName}" 詳細資訊：\n${JSON.stringify(procedureInfo, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`描述預存程序失敗: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async executeStoredProcedure(procedureName: string, schema: string = 'dbo', parameters?: QueryParameter[]) {
    try {
      const fullName = `${schema}.${procedureName}`;
      
      // 建構 EXEC 語句
      let execQuery = `EXEC ${fullName}`;
      
      if (parameters && parameters.length > 0) {
        const paramNames = parameters.map(p => `@${p.name} = @${p.name}`).join(', ');
        execQuery += ` ${paramNames}`;
      }

      const startTime = Date.now();
      const result = await this.dbManager.query(execQuery, parameters);
      const executionTime = Date.now() - startTime;

      return {
        content: [
          {
            type: 'text',
            text: `預存程序執行結果：\n${JSON.stringify({
              procedureName: fullName,
              executionTime: `${executionTime}ms`,
              recordCount: result.recordset?.length || 0,
              records: result.recordset || [],
              rowsAffected: result.rowsAffected || [0],
              returnValue: (result as any).returnValue,
            }, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`執行預存程序失敗: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async getProcedureDefinition(procedureName: string, schema: string): Promise<string> {
    const query = `
      SELECT sm.definition
      FROM sys.procedures p
      INNER JOIN sys.schemas s ON p.schema_id = s.schema_id
      INNER JOIN sys.sql_modules sm ON p.object_id = sm.object_id
      WHERE p.name = @procedureName AND s.name = @schema
    `;

    const result = await this.dbManager.query(query, [
      { name: 'procedureName', value: procedureName, type: 'varchar' },
      { name: 'schema', value: schema, type: 'varchar' }
    ]);

    return result.recordset?.[0]?.definition || '';
  }

  private async getProcedureDateInfo(procedureName: string, schema: string) {
    const query = `
      SELECT p.create_date, p.modify_date
      FROM sys.procedures p
      INNER JOIN sys.schemas s ON p.schema_id = s.schema_id
      WHERE p.name = @procedureName AND s.name = @schema
    `;

    const result = await this.dbManager.query(query, [
      { name: 'procedureName', value: procedureName, type: 'varchar' },
      { name: 'schema', value: schema, type: 'varchar' }
    ]);

    const row = result.recordset?.[0];
    return row ? {
      createDate: row.create_date,
      modifyDate: row.modify_date
    } : null;
  }

  private async getProcedureParameters(procedureName: string, schema: string): Promise<StoredProcedureParameter[]> {
    const query = `
      SELECT 
        par.name,
        t.name as type_name,
        par.max_length,
        par.precision,
        par.scale,
        par.is_output,
        par.has_default_value,
        par.default_value,
        par.is_readonly
      FROM sys.parameters par
      INNER JOIN sys.procedures p ON par.object_id = p.object_id
      INNER JOIN sys.schemas s ON p.schema_id = s.schema_id
      INNER JOIN sys.types t ON par.user_type_id = t.user_type_id
      WHERE p.name = @procedureName AND s.name = @schema
      ORDER BY par.parameter_id
    `;

    const result = await this.dbManager.query(query, [
      { name: 'procedureName', value: procedureName, type: 'varchar' },
      { name: 'schema', value: schema, type: 'varchar' }
    ]);

    return result.recordset?.map((row: any) => ({
      name: row.name,
      type: row.type_name,
      maxLength: row.max_length,
      precision: row.precision,
      scale: row.scale,
      isOutput: row.is_output,
      hasDefaultValue: row.has_default_value,
      defaultValue: row.default_value,
      isReadonly: row.is_readonly,
    })) || [];
  }

  async searchStoredProcedures(searchTerm: string, schema?: string) {
    let query = `
      SELECT 
        p.name as procedure_name,
        s.name as schema_name,
        p.create_date,
        p.modify_date,
        CASE 
          WHEN sm.definition LIKE @searchPattern THEN 'Definition contains term'
          WHEN p.name LIKE @searchPattern THEN 'Name contains term'
          ELSE 'Match found'
        END as match_type
      FROM sys.procedures p
      INNER JOIN sys.schemas s ON p.schema_id = s.schema_id
      LEFT JOIN sys.sql_modules sm ON p.object_id = sm.object_id
      WHERE (p.name LIKE @searchPattern OR sm.definition LIKE @searchPattern)
    `;

    const parameters = [
      { name: 'searchPattern', value: `%${searchTerm}%`, type: 'varchar' }
    ];

    if (schema) {
      query += ' AND s.name = @schema';
      parameters.push({ name: 'schema', value: schema, type: 'varchar' });
    }

    query += ' ORDER BY p.name';

    try {
      const result = await this.dbManager.query(query, parameters);
      
      const title = schema 
        ? `Schema "${schema}" 中包含 "${searchTerm}" 的預存程序：`
        : `包含 "${searchTerm}" 的預存程序：`;

      return {
        content: [
          {
            type: 'text',
            text: `${title}\n${JSON.stringify(result.recordset, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`搜尋預存程序失敗: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getProcedureDependencies(procedureName: string, schema: string = 'dbo') {
    const query = `
      SELECT DISTINCT
        'REFERENCED_BY' as dependency_type,
        OBJECT_SCHEMA_NAME(d.referencing_id) as referencing_schema,
        OBJECT_NAME(d.referencing_id) as referencing_object,
        o.type_desc as referencing_type
      FROM sys.sql_expression_dependencies d
      INNER JOIN sys.objects o ON d.referencing_id = o.object_id
      WHERE d.referenced_id = OBJECT_ID(@procedureFullName)
      
      UNION ALL
      
      SELECT DISTINCT
        'REFERENCES' as dependency_type,
        OBJECT_SCHEMA_NAME(d.referenced_id) as referenced_schema,
        OBJECT_NAME(d.referenced_id) as referenced_object,
        o.type_desc as referenced_type
      FROM sys.sql_expression_dependencies d
      INNER JOIN sys.objects o ON d.referenced_id = o.object_id
      WHERE d.referencing_id = OBJECT_ID(@procedureFullName)
      
      ORDER BY dependency_type, referencing_schema, referencing_object
    `;

    try {
      const procedureFullName = `${schema}.${procedureName}`;
      const result = await this.dbManager.query(query, [
        { name: 'procedureFullName', value: procedureFullName, type: 'varchar' }
      ]);

      return {
        content: [
          {
            type: 'text',
            text: `預存程序 "${procedureFullName}" 的相依關係：\n${JSON.stringify(result.recordset, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `無法取得預存程序相依關係資訊: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }
}