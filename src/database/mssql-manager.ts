import sql from 'mssql';
import { DatabaseConfig } from '../types/database.js';

export class MSSQLManager {
  private pool: sql.ConnectionPool | null = null;
  private config: DatabaseConfig;

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): DatabaseConfig {
    const config: DatabaseConfig = {
      // 基本連線設定
      server: process.env.MSSQL_SERVER || 'localhost',
      port: process.env.MSSQL_PORT ? parseInt(process.env.MSSQL_PORT) : 1433,
      database: process.env.MSSQL_DATABASE || 'master',
      user: process.env.MSSQL_USER || 'sa',
      password: process.env.MSSQL_PASSWORD || '',

      // 安全和加密設定
      encrypt: process.env.MSSQL_ENCRYPT === 'true',
      trustServerCertificate: process.env.MSSQL_TRUST_SERVER_CERTIFICATE === 'true',
      domain: process.env.MSSQL_DOMAIN || undefined,
      instanceName: process.env.MSSQL_INSTANCE_NAME || undefined,

      // 連線逾時設定
      connectionTimeout: process.env.MSSQL_CONNECTION_TIMEOUT 
        ? parseInt(process.env.MSSQL_CONNECTION_TIMEOUT) 
        : 15000,
      requestTimeout: process.env.MSSQL_REQUEST_TIMEOUT 
        ? parseInt(process.env.MSSQL_REQUEST_TIMEOUT) 
        : 15000,
      cancelTimeout: process.env.MSSQL_CANCEL_TIMEOUT 
        ? parseInt(process.env.MSSQL_CANCEL_TIMEOUT) 
        : 5000,

      // 進階設定
      enableArithAbort: process.env.MSSQL_ENABLE_ARITH_ABORT === 'true',
      useUTC: process.env.MSSQL_USE_UTC !== 'false',
      parseJSON: process.env.MSSQL_PARSE_JSON === 'true',
      arrayRowMode: process.env.MSSQL_ARRAY_ROW_MODE === 'true',
      appName: process.env.MSSQL_APP_NAME || 'mssql-server-mcp',
      workstationId: process.env.MSSQL_WORKSTATION_ID || undefined,
      readOnlyIntent: process.env.MSSQL_READ_ONLY_INTENT === 'true',
      stream: process.env.MSSQL_STREAM === 'true',
      fallbackToDefaultDb: process.env.MSSQL_FALLBACK_TO_DEFAULT_DB === 'true',

      // 連線池設定
      pool: {
        max: process.env.MSSQL_POOL_MAX ? parseInt(process.env.MSSQL_POOL_MAX) : 10,
        min: process.env.MSSQL_POOL_MIN ? parseInt(process.env.MSSQL_POOL_MIN) : 0,
        idleTimeoutMillis: process.env.MSSQL_POOL_IDLE_TIMEOUT 
          ? parseInt(process.env.MSSQL_POOL_IDLE_TIMEOUT) 
          : 30000,
        acquireTimeoutMillis: process.env.MSSQL_POOL_ACQUIRE_TIMEOUT 
          ? parseInt(process.env.MSSQL_POOL_ACQUIRE_TIMEOUT) 
          : 60000,
        createTimeoutMillis: process.env.MSSQL_POOL_CREATE_TIMEOUT 
          ? parseInt(process.env.MSSQL_POOL_CREATE_TIMEOUT) 
          : 30000,
        destroyTimeoutMillis: process.env.MSSQL_POOL_DESTROY_TIMEOUT 
          ? parseInt(process.env.MSSQL_POOL_DESTROY_TIMEOUT) 
          : 5000,
        reapIntervalMillis: process.env.MSSQL_POOL_REAP_INTERVAL 
          ? parseInt(process.env.MSSQL_POOL_REAP_INTERVAL) 
          : 1000,
        createRetryIntervalMillis: process.env.MSSQL_POOL_CREATE_RETRY_INTERVAL 
          ? parseInt(process.env.MSSQL_POOL_CREATE_RETRY_INTERVAL) 
          : 200,
      },
    };

    // Azure Active Directory 驗證設定
    if (process.env.MSSQL_AUTH_TYPE && process.env.MSSQL_AUTH_TYPE !== 'default') {
      config.authentication = {
        type: process.env.MSSQL_AUTH_TYPE as any,
        options: {}
      };

      if (process.env.MSSQL_AUTH_DOMAIN) {
        config.authentication.options!.domain = process.env.MSSQL_AUTH_DOMAIN;
      }
      if (process.env.MSSQL_AUTH_TOKEN) {
        config.authentication.options!.token = process.env.MSSQL_AUTH_TOKEN;
      }
      if (process.env.MSSQL_AUTH_CLIENT_ID) {
        config.authentication.options!.clientId = process.env.MSSQL_AUTH_CLIENT_ID;
      }
      if (process.env.MSSQL_AUTH_CLIENT_SECRET) {
        config.authentication.options!.clientSecret = process.env.MSSQL_AUTH_CLIENT_SECRET;
      }
      if (process.env.MSSQL_AUTH_TENANT_ID) {
        config.authentication.options!.tenantId = process.env.MSSQL_AUTH_TENANT_ID;
      }
    }

    return config;
  }

  async connect(): Promise<void> {
    try {
      if (this.pool) {
        await this.pool.close();
      }

      const poolConfig: any = {
        server: this.config.server,
        port: this.config.port,
        database: this.config.database,
        user: this.config.user,
        password: this.config.password,
        domain: this.config.domain,
        options: {
          encrypt: this.config.encrypt,
          trustServerCertificate: this.config.trustServerCertificate,
          enableArithAbort: this.config.enableArithAbort,
          instanceName: this.config.instanceName,
          useUTC: this.config.useUTC,
          appName: this.config.appName,
          workstationId: this.config.workstationId,
          readOnlyIntent: this.config.readOnlyIntent,
          fallbackToDefaultDb: this.config.fallbackToDefaultDb,
        },
        connectionTimeout: this.config.connectionTimeout,
        requestTimeout: this.config.requestTimeout,
        cancelTimeout: this.config.cancelTimeout,
        parseJSON: this.config.parseJSON,
        arrayRowMode: this.config.arrayRowMode,
        stream: this.config.stream,
        pool: this.config.pool,
      };

      // 添加驗證設定
      if (this.config.authentication) {
        poolConfig.authentication = this.config.authentication;
      }

      // 清理 undefined 值
      Object.keys(poolConfig).forEach(key => {
        if (poolConfig[key] === undefined) {
          delete poolConfig[key];
        }
      });

      Object.keys(poolConfig.options).forEach(key => {
        if (poolConfig.options[key] === undefined) {
          delete poolConfig.options[key];
        }
      });

      this.pool = new sql.ConnectionPool(poolConfig);

      await this.pool.connect();
      
      if (process.env.MSSQL_DEBUG === 'true') {
        console.error('MSSQL 連線配置:', JSON.stringify({
          server: this.config.server,
          port: this.config.port,
          database: this.config.database,
          user: this.config.user,
          encrypt: this.config.encrypt,
          authType: this.config.authentication?.type || 'default',
          poolMax: this.config.pool?.max,
          poolMin: this.config.pool?.min,
        }, null, 2));
      }
      
      console.error(`已連線到 MSSQL 伺服器: ${this.config.server}:${this.config.port}`);
    } catch (error) {
      console.error('MSSQL 連線失敗:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.close();
      this.pool = null;
      console.error('MSSQL 連線已關閉');
    }
  }

  async query(queryText: string, parameters?: any[]): Promise<sql.IResult<any>> {
    if (!this.pool) {
      throw new Error('資料庫未連線');
    }

    try {
      const request = this.pool.request();
      
      if (parameters) {
        parameters.forEach((param, index) => {
          if (param.name && param.value !== undefined) {
            if (param.type) {
              request.input(param.name, this.getSqlType(param.type), param.value);
            } else {
              request.input(param.name, param.value);
            }
          }
        });
      }

      const result = await request.query(queryText);
      return result;
    } catch (error) {
      console.error('查詢執行失敗:', error);
      throw error;
    }
  }

  private getSqlType(typeString: string): any {
    switch (typeString.toLowerCase()) {
      case 'int':
        return sql.Int;
      case 'bigint':
        return sql.BigInt;
      case 'varchar':
        return sql.VarChar;
      case 'nvarchar':
        return sql.NVarChar;
      case 'text':
        return sql.Text;
      case 'ntext':
        return sql.NText;
      case 'datetime':
        return sql.DateTime;
      case 'datetime2':
        return sql.DateTime2;
      case 'date':
        return sql.Date;
      case 'time':
        return sql.Time;
      case 'bit':
        return sql.Bit;
      case 'float':
        return sql.Float;
      case 'decimal':
        return sql.Decimal;
      case 'money':
        return sql.Money;
      case 'uniqueidentifier':
        return sql.UniqueIdentifier;
      default:
        return sql.VarChar;
    }
  }

  isConnected(): boolean {
    return this.pool !== null && this.pool.connected;
  }

  getConnectionInfo(): Partial<DatabaseConfig> {
    return {
      server: this.config.server,
      port: this.config.port,
      database: this.config.database,
      user: this.config.user,
    };
  }
}