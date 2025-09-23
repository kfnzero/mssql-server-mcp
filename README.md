# MSSQL Server MCP

一個支援 STDIO 協定的 Microsoft SQL Server MCP (Model Context Protocol) 伺服器，提供資料庫 Schema 查詢、Trigger 管理和 SQL 查詢執行功能。

## 功能特色

- 🔌 **STDIO 協定支援** - 與 MCP 客戶端無縫整合
- 🗄️ **Schema 查詢** - 查詢資料庫結構、資料表、欄位和索引
- ⚡ **Trigger 管理** - 查看和分析觸發器
- 🔧 **預存程序管理** - 查詢、執行和分析預存程序
- 📊 **SQL 查詢執行** - 支援 SELECT、INSERT、UPDATE、DELETE 操作
- 🔒 **安全設計** - 參數化查詢和權限控制
- 🌍 **環境變數配置** - 靈活的連線設定

## 快速開始

### 使用 Claude Code (最簡單)

如果您使用 Claude Code，可以直接使用以下指令：

```bash
# 自動配置到 Claude Desktop
claude mcp add mssql-server-mcp
```

然後在 Claude Desktop 中就可以直接使用所有 MSSQL 功能！

### 使用 npx

無需安裝，直接使用：

```bash
# 使用 npx 直接執行 (自動下載最新版本)
npx -y mssql-server-mcp
```

### 全域安裝

```bash
npm install -g mssql-server-mcp
mssql-server-mcp
```

## MCP 客戶端整合

### Claude Code 快速配置 (推薦)

使用 Claude Code 的 `add mcp` 指令快速配置：

```bash
# 快速新增 MCP 伺服器
claude mcp add mssql-server-mcp

# 或者指定自訂名稱
claude mcp add mssql-server-mcp --name my-mssql-server
```

此指令會自動：
- 安裝或更新到最新版本
- 在 Claude Desktop 配置中新增 MCP 伺服器
- 引導您設定環境變數

執行後請設定以下環境變數：
- `MSSQL_SERVER`: 您的 SQL Server 位址
- `MSSQL_DATABASE`: 目標資料庫名稱
- `MSSQL_USER`: 資料庫使用者名稱
- `MSSQL_PASSWORD`: 資料庫密碼
- `MSSQL_ENCRYPT`: 是否啟用加密 (建議設為 true)
- `MSSQL_TRUST_SERVER_CERTIFICATE`: 是否信任伺服器憑證

### Claude Desktop 手動配置

在 Claude Desktop 的設定檔中加入以下配置：

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

#### 方法 1: 使用 npx (推薦)

```json
{
  "mcpServers": {
    "mssql-server": {
      "command": "npx",
      "args": ["-y", "mssql-server-mcp"],
      "env": {
        "MSSQL_SERVER": "your_server_ip",
        "MSSQL_PORT": "1433",
        "MSSQL_DATABASE": "your_database",
        "MSSQL_USER": "your_username",
        "MSSQL_PASSWORD": "your_password",
        "MSSQL_ENCRYPT": "true",
        "MSSQL_TRUST_SERVER_CERTIFICATE": "true"
      }
    }
  }
}
```

#### 方法 2: 使用全域安裝

```json
{
  "mcpServers": {
    "mssql-server": {
      "command": "mssql-server-mcp",
      "env": {
        "MSSQL_SERVER": "your_server_ip",
        "MSSQL_PORT": "1433",
        "MSSQL_DATABASE": "your_database",
        "MSSQL_USER": "your_username",
        "MSSQL_PASSWORD": "your_password",
        "MSSQL_ENCRYPT": "true",
        "MSSQL_TRUST_SERVER_CERTIFICATE": "true"
      }
    }
  }
}
```

#### 方法 3: 本地開發路徑

```json
{
  "mcpServers": {
    "mssql-server": {
      "command": "node",
      "args": ["dist/index.js"],
      "cwd": "/absolute/path/to/mssql-server-mcp",
      "env": {
        "MSSQL_SERVER": "localhost",
        "MSSQL_PORT": "1433",
        "MSSQL_DATABASE": "your_database",
        "MSSQL_USER": "sa",
        "MSSQL_PASSWORD": "your_password",
        "MSSQL_ENCRYPT": "false",
        "MSSQL_TRUST_SERVER_CERTIFICATE": "true",
        "MSSQL_DEBUG": "true"
      }
    }
  }
}
```

### 其他 MCP 客戶端

對於其他 MCP 客戶端，請參考上述配置範例，調整為對應的配置格式。

⚠️ **重要安全提醒：**
- 請勿將包含真實密碼的配置檔案提交到版本控制
- 建議在測試環境中使用專用的測試帳戶
- 在生產環境中啟用 SSL 加密連線
- 確保 MCP 客戶端配置檔案權限設為僅當前使用者可讀 (chmod 600)

## 可用工具

### Schema 查詢
- `list_schemas` - 列出所有資料庫 Schema
- `list_tables` - 列出指定 Schema 的資料表
- `describe_table` - 描述資料表結構

### Trigger 管理
- `list_triggers` - 列出觸發器
- `describe_trigger` - 描述觸發器詳細資訊

### 預存程序管理
- `list_stored_procedures` - 列出預存程序
- `describe_stored_procedure` - 描述預存程序詳細資訊
- `execute_stored_procedure` - 執行預存程序
- `search_stored_procedures` - 搜尋預存程序
- `get_procedure_dependencies` - 取得預存程序相依關係

### SQL 查詢
- `execute_query` - 執行 SQL 查詢

## 環境變數

### 基本連線設定
| 變數名稱 | 描述 | 預設值 |
|---------|------|--------|
| `MSSQL_SERVER` | SQL Server 伺服器位址 | localhost |
| `MSSQL_PORT` | 連接埠 | 1433 |
| `MSSQL_DATABASE` | 資料庫名稱 | master |
| `MSSQL_USER` | 使用者名稱 | sa |
| `MSSQL_PASSWORD` | 密碼 | - |

### 安全設定
| 變數名稱 | 描述 | 預設值 |
|---------|------|--------|
| `MSSQL_ENCRYPT` | 啟用加密 | true |
| `MSSQL_TRUST_SERVER_CERTIFICATE` | 信任伺服器憑證 | true |
| `MSSQL_DOMAIN` | Windows 網域 | - |
| `MSSQL_INSTANCE_NAME` | SQL Server 實例名稱 | - |

### 連線逾時設定
| 變數名稱 | 描述 | 預設值 |
|---------|------|--------|
| `MSSQL_CONNECTION_TIMEOUT` | 連線逾時 (ms) | 15000 |
| `MSSQL_REQUEST_TIMEOUT` | 請求逾時 (ms) | 15000 |
| `MSSQL_CANCEL_TIMEOUT` | 取消逾時 (ms) | 5000 |

### 連線池設定
| 變數名稱 | 描述 | 預設值 |
|---------|------|--------|
| `MSSQL_POOL_MAX` | 連線池最大連線數 | 10 |
| `MSSQL_POOL_MIN` | 連線池最小連線數 | 0 |
| `MSSQL_POOL_IDLE_TIMEOUT` | 連線池閒置逾時 (ms) | 30000 |
| `MSSQL_POOL_ACQUIRE_TIMEOUT` | 取得連線逾時 (ms) | 60000 |
| `MSSQL_POOL_CREATE_TIMEOUT` | 建立連線逾時 (ms) | 30000 |
| `MSSQL_POOL_DESTROY_TIMEOUT` | 銷毀連線逾時 (ms) | 5000 |
| `MSSQL_POOL_REAP_INTERVAL` | 連線回收間隔 (ms) | 1000 |
| `MSSQL_POOL_CREATE_RETRY_INTERVAL` | 重試建立連線間隔 (ms) | 200 |

### 進階設定
| 變數名稱 | 描述 | 預設值 |
|---------|------|--------|
| `MSSQL_ENABLE_ARITH_ABORT` | 啟用算術中斷 | true |
| `MSSQL_USE_UTC` | 使用 UTC 時間 | true |
| `MSSQL_PARSE_JSON` | 解析 JSON | false |
| `MSSQL_ARRAY_ROW_MODE` | 陣列行模式 | false |
| `MSSQL_APP_NAME` | 應用程式名稱 | mssql-server-mcp |
| `MSSQL_WORKSTATION_ID` | 工作站 ID | - |
| `MSSQL_READ_ONLY_INTENT` | 唯讀意圖 | false |
| `MSSQL_STREAM` | 串流模式 | false |
| `MSSQL_FALLBACK_TO_DEFAULT_DB` | 回退到預設資料庫 | false |

### Azure Active Directory 驗證
| 變數名稱 | 描述 | 預設值 |
|---------|------|--------|
| `MSSQL_AUTH_TYPE` | 驗證類型 | default |
| `MSSQL_AUTH_DOMAIN` | 驗證網域 | - |
| `MSSQL_AUTH_TOKEN` | 存取權杖 | - |
| `MSSQL_AUTH_CLIENT_ID` | 客戶端 ID | - |
| `MSSQL_AUTH_CLIENT_SECRET` | 客戶端密鑰 | - |
| `MSSQL_AUTH_TENANT_ID` | 租戶 ID | - |

### 除錯設定
| 變數名稱 | 描述 | 預設值 |
|---------|------|--------|
| `MSSQL_DEBUG` | 啟用除錯模式 | false |
| `MSSQL_LOG_LEVEL` | 記錄層級 | info |

## 開發

### 建置

```bash
git clone https://github.com/yourusername/mssql-server-mcp.git
cd mssql-server-mcp
npm install
npm run build
```

### 開發模式

```bash
npm run dev
```

### 測試

```bash
npm test
```

### 程式碼檢查

```bash
npm run lint
```

## 安全考量

- 僅支援 SELECT、INSERT、UPDATE、DELETE 操作
- 使用參數化查詢防止 SQL 注入
- 不支援 DDL 操作以確保資料庫安全
- 支援 SSL/TLS 加密連線

## 授權

MIT License

## 貢獻

歡迎提交 Issue 和 Pull Request！