import { MSSQLManager } from '../database/mssql-manager.js';
import { TriggerInfo } from '../types/database.js';

export class TriggerService {
  constructor(private dbManager: MSSQLManager) {}

  async listTriggers(tableName?: string, schema: string = 'dbo') {
    let query = `
      SELECT 
        tr.name as trigger_name,
        s.name as schema_name,
        t.name as table_name,
        tr.type_desc,
        tr.is_disabled,
        tr.create_date,
        tr.modify_date,
        CASE 
          WHEN EXISTS (SELECT 1 FROM sys.trigger_events te WHERE te.object_id = tr.object_id AND te.type = 1) THEN 'INSERT'
          ELSE ''
        END +
        CASE 
          WHEN EXISTS (SELECT 1 FROM sys.trigger_events te WHERE te.object_id = tr.object_id AND te.type = 2) THEN 
            CASE WHEN LEN(CASE WHEN EXISTS (SELECT 1 FROM sys.trigger_events te WHERE te.object_id = tr.object_id AND te.type = 1) THEN 'INSERT' ELSE '' END) > 0 THEN ', UPDATE' ELSE 'UPDATE' END
          ELSE ''
        END +
        CASE 
          WHEN EXISTS (SELECT 1 FROM sys.trigger_events te WHERE te.object_id = tr.object_id AND te.type = 3) THEN 
            CASE WHEN LEN(CASE WHEN EXISTS (SELECT 1 FROM sys.trigger_events te WHERE te.object_id = tr.object_id AND te.type = 1) THEN 'INSERT' ELSE '' END + CASE WHEN EXISTS (SELECT 1 FROM sys.trigger_events te WHERE te.object_id = tr.object_id AND te.type = 2) THEN ', UPDATE' ELSE '' END) > 0 THEN ', DELETE' ELSE 'DELETE' END
          ELSE ''
        END as events
      FROM sys.triggers tr
      INNER JOIN sys.tables t ON tr.parent_id = t.object_id
      INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
      WHERE s.name = @schema
    `;

    const parameters = [{ name: 'schema', value: schema, type: 'varchar' }];

    if (tableName) {
      query += ' AND t.name = @tableName';
      parameters.push({ name: 'tableName', value: tableName, type: 'varchar' });
    }

    query += ' ORDER BY tr.name';

    try {
      const result = await this.dbManager.query(query, parameters);
      
      const triggerList = result.recordset?.map((row: any) => ({
        name: row.trigger_name,
        schema: row.schema_name,
        tableName: row.table_name,
        type: row.type_desc,
        events: row.events ? row.events.split(', ') : [],
        isEnabled: !row.is_disabled,
        createDate: row.create_date,
        modifyDate: row.modify_date,
      })) || [];

      const title = tableName 
        ? `資料表 "${schema}.${tableName}" 的觸發器列表：`
        : `Schema "${schema}" 的所有觸發器列表：`;

      return {
        content: [
          {
            type: 'text',
            text: `${title}\n${JSON.stringify(triggerList, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`取得觸發器列表失敗: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async describeTrigger(triggerName: string, schema: string = 'dbo') {
    const query = `
      SELECT 
        tr.name as trigger_name,
        s.name as schema_name,
        t.name as table_name,
        tr.type_desc,
        tr.is_disabled,
        tr.create_date,
        tr.modify_date,
        sm.definition,
        CASE 
          WHEN EXISTS (SELECT 1 FROM sys.trigger_events te WHERE te.object_id = tr.object_id AND te.type = 1) THEN 'INSERT'
          ELSE ''
        END +
        CASE 
          WHEN EXISTS (SELECT 1 FROM sys.trigger_events te WHERE te.object_id = tr.object_id AND te.type = 2) THEN 
            CASE WHEN LEN(CASE WHEN EXISTS (SELECT 1 FROM sys.trigger_events te WHERE te.object_id = tr.object_id AND te.type = 1) THEN 'INSERT' ELSE '' END) > 0 THEN ', UPDATE' ELSE 'UPDATE' END
          ELSE ''
        END +
        CASE 
          WHEN EXISTS (SELECT 1 FROM sys.trigger_events te WHERE te.object_id = tr.object_id AND te.type = 3) THEN 
            CASE WHEN LEN(CASE WHEN EXISTS (SELECT 1 FROM sys.trigger_events te WHERE te.object_id = tr.object_id AND te.type = 1) THEN 'INSERT' ELSE '' END + CASE WHEN EXISTS (SELECT 1 FROM sys.trigger_events te WHERE te.object_id = tr.object_id AND te.type = 2) THEN ', UPDATE' ELSE '' END) > 0 THEN ', DELETE' ELSE 'DELETE' END
          ELSE ''
        END as events
      FROM sys.triggers tr
      INNER JOIN sys.tables t ON tr.parent_id = t.object_id
      INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
      INNER JOIN sys.sql_modules sm ON tr.object_id = sm.object_id
      WHERE tr.name = @triggerName AND s.name = @schema
    `;

    try {
      const result = await this.dbManager.query(query, [
        { name: 'triggerName', value: triggerName, type: 'varchar' },
        { name: 'schema', value: schema, type: 'varchar' }
      ]);

      if (!result.recordset || result.recordset.length === 0) {
        throw new Error(`找不到觸發器 "${schema}.${triggerName}"`);
      }

      const row = result.recordset[0];
      const triggerInfo: TriggerInfo = {
        name: row.trigger_name,
        schema: row.schema_name,
        tableName: row.table_name,
        type: row.type_desc,
        events: row.events ? row.events.split(', ') : [],
        definition: row.definition,
        isEnabled: !row.is_disabled,
      };

      return {
        content: [
          {
            type: 'text',
            text: `觸發器 "${schema}.${triggerName}" 詳細資訊：\n${JSON.stringify(triggerInfo, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`描述觸發器失敗: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getTriggerDependencies(triggerName: string, schema: string = 'dbo') {
    const query = `
      SELECT 
        d.referencing_schema_name,
        d.referencing_entity_name,
        d.referencing_class_desc,
        d.referenced_schema_name,
        d.referenced_entity_name,
        d.referenced_class_desc
      FROM sys.dm_sql_referencing_entities(@triggerFullName, 'OBJECT') d
      UNION ALL
      SELECT 
        d.referencing_schema_name,
        d.referencing_entity_name,
        d.referencing_class_desc,
        d.referenced_schema_name,
        d.referenced_entity_name,
        d.referenced_class_desc
      FROM sys.dm_sql_referenced_entities(@triggerFullName, 'OBJECT') d
    `;

    try {
      const triggerFullName = `${schema}.${triggerName}`;
      const result = await this.dbManager.query(query, [
        { name: 'triggerFullName', value: triggerFullName, type: 'varchar' }
      ]);

      return {
        content: [
          {
            type: 'text',
            text: `觸發器 "${triggerFullName}" 的相依關係：\n${JSON.stringify(result.recordset, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `無法取得觸發器相依關係資訊: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }
}