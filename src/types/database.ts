export interface DatabaseConfig {
  server: string;
  port?: number;
  database: string;
  user: string;
  password: string;
  domain?: string;
  encrypt?: boolean;
  trustServerCertificate?: boolean;
  enableArithAbort?: boolean;
  instanceName?: string;
  useUTC?: boolean;
  connectionTimeout?: number;
  requestTimeout?: number;
  cancelTimeout?: number;
  parseJSON?: boolean;
  arrayRowMode?: boolean;
  appName?: string;
  workstationId?: string;
  readOnlyIntent?: boolean;
  authentication?: {
    type?: 'default' | 'ntlm' | 'azure-active-directory-password' | 'azure-active-directory-access-token' | 'azure-active-directory-msi-vm' | 'azure-active-directory-msi-app-service' | 'azure-active-directory-service-principal-secret';
    options?: {
      userName?: string;
      password?: string;
      domain?: string;
      token?: string;
      clientId?: string;
      clientSecret?: string;
      tenantId?: string;
    };
  };
  pool?: {
    max?: number;
    min?: number;
    idleTimeoutMillis?: number;
    acquireTimeoutMillis?: number;
    createTimeoutMillis?: number;
    destroyTimeoutMillis?: number;
    reapIntervalMillis?: number;
    createRetryIntervalMillis?: number;
  };
  stream?: boolean;
  beforeConnect?: (conn: any) => void;
  fallbackToDefaultDb?: boolean;
}

export interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue: string | null;
  isIdentity: boolean;
  isPrimaryKey: boolean;
  maxLength?: number;
  precision?: number;
  scale?: number;
}

export interface TableInfo {
  schema: string;
  tableName: string;
  columns: ColumnInfo[];
  indexes: IndexInfo[];
  foreignKeys: ForeignKeyInfo[];
}

export interface IndexInfo {
  name: string;
  type: string;
  isUnique: boolean;
  isPrimaryKey: boolean;
  columns: string[];
}

export interface ForeignKeyInfo {
  name: string;
  column: string;
  referencedTable: string;
  referencedColumn: string;
  referencedSchema: string;
}

export interface TriggerInfo {
  name: string;
  schema: string;
  tableName: string;
  type: string;
  events: string[];
  definition: string;
  isEnabled: boolean;
}

export interface QueryParameter {
  name: string;
  value: any;
  type?: string;
}

export interface QueryResult {
  recordset?: any[];
  rowsAffected?: number[];
  returnValue?: number;
}

export interface StoredProcedureInfo {
  name: string;
  schema: string;
  definition: string;
  createDate: Date;
  modifyDate: Date;
  parameters: StoredProcedureParameter[];
}

export interface StoredProcedureParameter {
  name: string;
  type: string;
  maxLength: number;
  precision: number;
  scale: number;
  isOutput: boolean;
  hasDefaultValue: boolean;
  defaultValue?: string;
  isReadonly: boolean;
}