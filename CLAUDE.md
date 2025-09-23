# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 專案概述

這是一個 MSSQL Server MCP (Model Context Protocol) 伺服器，提供通過 STDIO 協定與 Microsoft SQL Server 資料庫進行互動的功能。支援 Schema 查詢、Trigger 管理和各種 SQL 查詢操作。

## 建置和執行指令

### 開發環境
```bash
# 安裝相依套件
npm install

# 開發模式執行
npm run dev

# 建置專案
npm run build

# 正式環境執行
npm start

# 程式碼檢查
npm run lint

# 執行測試
npm test
```

### 發布到 npm
```bash
# 建置專案
npm run build

# 發布到 npm registry
npm publish
```

## 架構設計

### 核心模組
- **src/index.ts** - MCP 伺服器主程式，處理 STDIO JSON-RPC 通信
- **src/database/mssql-manager.ts** - MSSQL 連線池管理
- **src/services/** - 業務邏輯服務
  - **schema-service.ts** - Schema 和資料表結構查詢
  - **trigger-service.ts** - 觸發器管理
  - **stored-procedure-service.ts** - 預存程序管理
  - **query-service.ts** - SQL 查詢執行
- **src/types/database.ts** - TypeScript 型別定義

### MCP Tools
- `list_schemas` - 列出所有資料庫 Schema
- `list_tables` - 列出指定 Schema 的資料表
- `describe_table` - 描述資料表結構（欄位、索引、外鍵）
- `list_triggers` - 列出觸發器
- `describe_trigger` - 描述觸發器詳細資訊
- `list_stored_procedures` - 列出預存程序
- `describe_stored_procedure` - 描述預存程序詳細資訊（參數、定義）
- `execute_stored_procedure` - 執行預存程序
- `search_stored_procedures` - 搜尋預存程序（按名稱或內容）
- `get_procedure_dependencies` - 取得預存程序的相依關係
- `execute_query` - 執行 SQL 查詢（SELECT、INSERT、UPDATE、DELETE）

## 環境設定

複製 `.env.example` 為 `.env` 並根據需要設定參數。主要環境變數包括：

### 基本連線設定
```bash
MSSQL_SERVER=localhost
MSSQL_PORT=1433
MSSQL_DATABASE=master
MSSQL_USER=sa
MSSQL_PASSWORD=your_password
```

### 安全設定
```bash
MSSQL_ENCRYPT=true
MSSQL_TRUST_SERVER_CERTIFICATE=true
MSSQL_DOMAIN=
MSSQL_INSTANCE_NAME=
```

### 連線逾時設定
```bash
MSSQL_CONNECTION_TIMEOUT=15000
MSSQL_REQUEST_TIMEOUT=15000
MSSQL_CANCEL_TIMEOUT=5000
```

### 連線池設定
```bash
MSSQL_POOL_MAX=10
MSSQL_POOL_MIN=0
MSSQL_POOL_IDLE_TIMEOUT=30000
MSSQL_POOL_ACQUIRE_TIMEOUT=60000
MSSQL_POOL_CREATE_TIMEOUT=30000
MSSQL_POOL_DESTROY_TIMEOUT=5000
MSSQL_POOL_REAP_INTERVAL=1000
MSSQL_POOL_CREATE_RETRY_INTERVAL=200
```

### 進階設定
```bash
MSSQL_ENABLE_ARITH_ABORT=true
MSSQL_USE_UTC=true
MSSQL_PARSE_JSON=false
MSSQL_ARRAY_ROW_MODE=false
MSSQL_APP_NAME=mssql-server-mcp
MSSQL_WORKSTATION_ID=
MSSQL_READ_ONLY_INTENT=false
MSSQL_STREAM=false
MSSQL_FALLBACK_TO_DEFAULT_DB=false
```

### Azure Active Directory 驗證
```bash
MSSQL_AUTH_TYPE=default
MSSQL_AUTH_DOMAIN=
MSSQL_AUTH_TOKEN=
MSSQL_AUTH_CLIENT_ID=
MSSQL_AUTH_CLIENT_SECRET=
MSSQL_AUTH_TENANT_ID=
```

### 除錯設定
```bash
MSSQL_DEBUG=false
MSSQL_LOG_LEVEL=info
```

## 使用方式

### 作為 MCP 伺服器
此專案被設計為 MCP 客戶端（如 Claude Desktop）的伺服器。配置 MCP 客戶端時，使用以下設定：

```json
{
  "mcpServers": {
    "mssql-server": {
      "command": "npx",
      "args": ["mssql-server-mcp"],
      "env": {
        "MSSQL_SERVER": "your_server",
        "MSSQL_DATABASE": "your_database",
        "MSSQL_USER": "your_user",
        "MSSQL_PASSWORD": "your_password"
      }
    }
  }
}
```

### 直接執行
```bash
# 設定環境變數
export MSSQL_SERVER=localhost
export MSSQL_DATABASE=master
export MSSQL_USER=sa
export MSSQL_PASSWORD=your_password

# 執行伺服器
npm start
```

## 安全考量

- 支援 SQL Server 加密連線（MSSQL_ENCRYPT=true）
- 使用參數化查詢防止 SQL 注入
- 僅允許 SELECT、INSERT、UPDATE、DELETE 操作
- 不支援 DDL 操作（CREATE、DROP、ALTER）以確保安全

## 開發注意事項

- 使用 TypeScript 進行開發
- 遵循 ESLint 規則
- 所有資料庫操作都透過 MSSQLManager 進行
- 錯誤處理會返回中文錯誤訊息
- 支援環境變數動態配置資料庫連線參數

## 故障排除

### 常見問題
1. **連線失敗** - 檢查 MSSQL_SERVER、MSSQL_PORT 和認證資訊
2. **SSL 錯誤** - 設定 MSSQL_TRUST_SERVER_CERTIFICATE=true
3. **權限錯誤** - 確保資料庫使用者有適當的權限

### 除錯模式
設定環境變數 `DEBUG=1` 可以看到更詳細的除錯資訊。