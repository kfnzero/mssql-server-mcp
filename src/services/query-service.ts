import { MSSQLManager } from '../database/mssql-manager.js';
import { QueryParameter, QueryResult } from '../types/database.js';

export class QueryService {
  constructor(private dbManager: MSSQLManager) {}

  async executeQuery(queryText: string, parameters?: QueryParameter[]) {
    try {
      if (!queryText.trim()) {
        throw new Error('查詢語句不能為空');
      }

      queryText = queryText.trim();
      const queryType = this.getQueryType(queryText);
      
      if (!this.isAllowedQueryType(queryType)) {
        throw new Error(`不允許的查詢類型: ${queryType}`);
      }

      const startTime = Date.now();
      const result = await this.dbManager.query(queryText, parameters);
      const executionTime = Date.now() - startTime;

      return this.formatQueryResult(result, queryType, executionTime);
    } catch (error) {
      throw new Error(`查詢執行失敗: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private getQueryType(query: string): string {
    const cleanQuery = query.replace(/^[\s\n\r]+|[\s\n\r]+$/g, '').toLowerCase();
    
    if (cleanQuery.startsWith('select')) return 'SELECT';
    if (cleanQuery.startsWith('insert')) return 'INSERT';
    if (cleanQuery.startsWith('update')) return 'UPDATE';
    if (cleanQuery.startsWith('delete')) return 'DELETE';
    if (cleanQuery.startsWith('exec') || cleanQuery.startsWith('execute')) return 'EXECUTE';
    if (cleanQuery.startsWith('with')) return 'WITH_SELECT';
    
    return 'UNKNOWN';
  }

  private isAllowedQueryType(queryType: string): boolean {
    const allowedTypes = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'EXECUTE', 'WITH_SELECT'];
    return allowedTypes.includes(queryType);
  }

  private formatQueryResult(result: QueryResult, queryType: string, executionTime: number) {
    const response: any = {
      queryType,
      executionTime: `${executionTime}ms`,
      success: true,
    };

    switch (queryType) {
      case 'SELECT':
      case 'WITH_SELECT':
      case 'EXECUTE':
        response.recordCount = result.recordset?.length || 0;
        response.records = result.recordset || [];
        break;

      case 'INSERT':
      case 'UPDATE':
      case 'DELETE':
        response.rowsAffected = result.rowsAffected || [0];
        response.totalRowsAffected = Array.isArray(result.rowsAffected) 
          ? result.rowsAffected.reduce((sum, count) => sum + count, 0)
          : result.rowsAffected || 0;
        
        if (result.recordset && result.recordset.length > 0) {
          response.records = result.recordset;
        }
        break;
    }

    if (result.returnValue !== undefined) {
      response.returnValue = result.returnValue;
    }

    return {
      content: [
        {
          type: 'text',
          text: `查詢執行結果：\n${JSON.stringify(response, null, 2)}`,
        },
      ],
    };
  }

  async executeTransaction(queries: Array<{ query: string; parameters?: QueryParameter[] }>) {
    try {
      if (!queries || queries.length === 0) {
        throw new Error('交易中必須至少包含一個查詢');
      }

      for (const queryItem of queries) {
        const queryType = this.getQueryType(queryItem.query);
        if (!this.isAllowedQueryType(queryType)) {
          throw new Error(`交易中包含不允許的查詢類型: ${queryType}`);
        }
      }

      const startTime = Date.now();
      const results = [];

      await this.dbManager.query('BEGIN TRANSACTION');

      try {
        for (const queryItem of queries) {
          const result = await this.dbManager.query(queryItem.query, queryItem.parameters);
          results.push({
            query: queryItem.query,
            result: result,
            queryType: this.getQueryType(queryItem.query),
          });
        }

        await this.dbManager.query('COMMIT TRANSACTION');
        
        const executionTime = Date.now() - startTime;

        return {
          content: [
            {
              type: 'text',
              text: `交易執行成功：\n${JSON.stringify({
                success: true,
                executionTime: `${executionTime}ms`,
                queryCount: queries.length,
                results: results.map(r => ({
                  queryType: r.queryType,
                  rowsAffected: r.result.rowsAffected || [0],
                  recordCount: r.result.recordset?.length || 0,
                })),
              }, null, 2)}`,
            },
          ],
        };
      } catch (error) {
        await this.dbManager.query('ROLLBACK TRANSACTION');
        throw error;
      }
    } catch (error) {
      throw new Error(`交易執行失敗: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async explainQuery(queryText: string, parameters?: QueryParameter[]) {
    try {
      const explainQuery = `SET SHOWPLAN_ALL ON; ${queryText}; SET SHOWPLAN_ALL OFF;`;
      const result = await this.dbManager.query(explainQuery, parameters);

      return {
        content: [
          {
            type: 'text',
            text: `查詢執行計畫：\n${JSON.stringify(result.recordset, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`取得執行計畫失敗: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getQueryStatistics(queryText: string, parameters?: QueryParameter[]) {
    try {
      const statsQuery = `
        SET STATISTICS IO ON;
        SET STATISTICS TIME ON;
        ${queryText};
        SET STATISTICS IO OFF;
        SET STATISTICS TIME OFF;
      `;
      
      const result = await this.dbManager.query(statsQuery, parameters);

      return {
        content: [
          {
            type: 'text',
            text: `查詢統計資訊：\n${JSON.stringify({
              recordCount: result.recordset?.length || 0,
              records: result.recordset || [],
              note: '詳細的 IO 和時間統計會顯示在 SQL Server 的訊息輸出中',
            }, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`取得查詢統計失敗: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}