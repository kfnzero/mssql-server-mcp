#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { MSSQLManager } from './database/mssql-manager.js';
import { SchemaService } from './services/schema-service.js';
import { TriggerService } from './services/trigger-service.js';
import { QueryService } from './services/query-service.js';
import { StoredProcedureService } from './services/stored-procedure-service.js';
import dotenv from 'dotenv';

dotenv.config();

const server = new Server(
  {
    name: 'mssql-server-mcp',
    version: '1.0.0',
  },
);

const mssqlManager = new MSSQLManager();
const schemaService = new SchemaService(mssqlManager);
const triggerService = new TriggerService(mssqlManager);
const queryService = new QueryService(mssqlManager);
const storedProcedureService = new StoredProcedureService(mssqlManager);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'list_schemas',
        description: '列出所有資料庫 Schema',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'list_tables',
        description: '列出指定 Schema 的所有資料表',
        inputSchema: {
          type: 'object',
          properties: {
            schema: {
              type: 'string',
              description: 'Schema 名稱，預設為 dbo',
              default: 'dbo',
            },
          },
        },
      },
      {
        name: 'describe_table',
        description: '描述資料表結構，包含欄位、型別、約束等資訊',
        inputSchema: {
          type: 'object',
          properties: {
            table_name: {
              type: 'string',
              description: '資料表名稱',
            },
            schema: {
              type: 'string',
              description: 'Schema 名稱，預設為 dbo',
              default: 'dbo',
            },
          },
          required: ['table_name'],
        },
      },
      {
        name: 'list_triggers',
        description: '列出觸發器',
        inputSchema: {
          type: 'object',
          properties: {
            table_name: {
              type: 'string',
              description: '特定資料表的觸發器，留空則列出所有觸發器',
            },
            schema: {
              type: 'string',
              description: 'Schema 名稱，預設為 dbo',
              default: 'dbo',
            },
          },
        },
      },
      {
        name: 'describe_trigger',
        description: '描述觸發器的詳細資訊',
        inputSchema: {
          type: 'object',
          properties: {
            trigger_name: {
              type: 'string',
              description: '觸發器名稱',
            },
            schema: {
              type: 'string',
              description: 'Schema 名稱，預設為 dbo',
              default: 'dbo',
            },
          },
          required: ['trigger_name'],
        },
      },
      {
        name: 'execute_query',
        description: '執行 SQL 查詢，支援 SELECT、UPDATE、INSERT、DELETE 等操作',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: '要執行的 SQL 查詢語句',
            },
            parameters: {
              type: 'array',
              description: 'SQL 參數陣列',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  value: { type: 'string' },
                  type: { type: 'string' },
                },
                required: ['name', 'value'],
              },
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'list_stored_procedures',
        description: '列出預存程序',
        inputSchema: {
          type: 'object',
          properties: {
            schema: {
              type: 'string',
              description: 'Schema 名稱，預設為 dbo',
              default: 'dbo',
            },
          },
        },
      },
      {
        name: 'describe_stored_procedure',
        description: '描述預存程序的詳細資訊，包含參數和定義',
        inputSchema: {
          type: 'object',
          properties: {
            procedure_name: {
              type: 'string',
              description: '預存程序名稱',
            },
            schema: {
              type: 'string',
              description: 'Schema 名稱，預設為 dbo',
              default: 'dbo',
            },
          },
          required: ['procedure_name'],
        },
      },
      {
        name: 'execute_stored_procedure',
        description: '執行預存程序',
        inputSchema: {
          type: 'object',
          properties: {
            procedure_name: {
              type: 'string',
              description: '預存程序名稱',
            },
            schema: {
              type: 'string',
              description: 'Schema 名稱，預設為 dbo',
              default: 'dbo',
            },
            parameters: {
              type: 'array',
              description: '預存程序參數陣列',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  value: { type: 'string' },
                  type: { type: 'string' },
                },
                required: ['name', 'value'],
              },
            },
          },
          required: ['procedure_name'],
        },
      },
      {
        name: 'search_stored_procedures',
        description: '搜尋預存程序（按名稱或內容）',
        inputSchema: {
          type: 'object',
          properties: {
            search_term: {
              type: 'string',
              description: '搜尋關鍵字',
            },
            schema: {
              type: 'string',
              description: 'Schema 名稱，留空則搜尋所有 Schema',
            },
          },
          required: ['search_term'],
        },
      },
      {
        name: 'get_procedure_dependencies',
        description: '取得預存程序的相依關係',
        inputSchema: {
          type: 'object',
          properties: {
            procedure_name: {
              type: 'string',
              description: '預存程序名稱',
            },
            schema: {
              type: 'string',
              description: 'Schema 名稱，預設為 dbo',
              default: 'dbo',
            },
          },
          required: ['procedure_name'],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'list_schemas':
        return await schemaService.listSchemas();

      case 'list_tables':
        return await schemaService.listTables((args as any)?.schema || 'dbo');

      case 'describe_table':
        if (!(args as any)?.table_name) {
          throw new Error('table_name 參數為必填');
        }
        return await schemaService.describeTable(
          (args as any).table_name,
          (args as any)?.schema || 'dbo'
        );

      case 'list_triggers':
        return await triggerService.listTriggers(
          (args as any)?.table_name,
          (args as any)?.schema || 'dbo'
        );

      case 'describe_trigger':
        if (!(args as any)?.trigger_name) {
          throw new Error('trigger_name 參數為必填');
        }
        return await triggerService.describeTrigger(
          (args as any).trigger_name,
          (args as any)?.schema || 'dbo'
        );

      case 'execute_query':
        if (!(args as any)?.query) {
          throw new Error('query 參數為必填');
        }
        return await queryService.executeQuery((args as any).query, (args as any)?.parameters);

      case 'list_stored_procedures':
        return await storedProcedureService.listStoredProcedures((args as any)?.schema || 'dbo');

      case 'describe_stored_procedure':
        if (!(args as any)?.procedure_name) {
          throw new Error('procedure_name 參數為必填');
        }
        return await storedProcedureService.describeStoredProcedure(
          (args as any).procedure_name,
          (args as any)?.schema || 'dbo'
        );

      case 'execute_stored_procedure':
        if (!(args as any)?.procedure_name) {
          throw new Error('procedure_name 參數為必填');
        }
        return await storedProcedureService.executeStoredProcedure(
          (args as any).procedure_name,
          (args as any)?.schema || 'dbo',
          (args as any)?.parameters
        );

      case 'search_stored_procedures':
        if (!(args as any)?.search_term) {
          throw new Error('search_term 參數為必填');
        }
        return await storedProcedureService.searchStoredProcedures(
          (args as any).search_term,
          (args as any)?.schema
        );

      case 'get_procedure_dependencies':
        if (!(args as any)?.procedure_name) {
          throw new Error('procedure_name 參數為必填');
        }
        return await storedProcedureService.getProcedureDependencies(
          (args as any).procedure_name,
          (args as any)?.schema || 'dbo'
        );

      default:
        throw new Error(`未知的工具: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `錯誤: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
    };
  }
});

async function main() {
  try {
    await mssqlManager.connect();
    console.error('MSSQL MCP 伺服器已啟動');
    
    const transport = new StdioServerTransport();
    await server.connect(transport);
  } catch (error) {
    console.error('啟動伺服器時發生錯誤:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('主程序發生錯誤:', error);
    process.exit(1);
  });
}

export { server, mssqlManager };