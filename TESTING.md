# MSSQL MCP 伺服器測試指南

## 概述

本文件說明如何測試 MSSQL MCP 伺服器的功能，確保其正常運作。

## 測試檔案

### 1. `.mcp.json` - MCP 客戶端配置

⚠️ **重要：此檔案包含敏感資訊，不應提交到版本控制！**

```bash
# 複製範例配置檔案
cp .mcp.example.json .mcp.json

# 編輯 .mcp.json 填入真實連線資訊
vim .mcp.json
```

範例配置結構：
```json
{
  "mcpServers": {
    "mssql-server-local": {
      "command": "node",
      "args": ["dist/index.js"],
      "cwd": "/path/to/mssql-server-mcp",
      "env": {
        "MSSQL_SERVER": "your_actual_server",
        "MSSQL_PORT": "your_actual_port",
        "MSSQL_DATABASE": "your_actual_database",
        "MSSQL_USER": "your_actual_user",
        "MSSQL_PASSWORD": "your_actual_password",
        "MSSQL_ENCRYPT": "true",
        "MSSQL_TRUST_SERVER_CERTIFICATE": "false",
        "MSSQL_DEBUG": "false"
      }
    }
  }
}
```

### 2. `test-mcp.js` - 完整 MCP 功能測試
- 測試所有 MCP 工具功能
- 模擬完整的 JSON-RPC 通信
- 測試資料庫連線和查詢

### 3. `test-stored-procedures.js` - 預存程序專項測試
- 專門測試預存程序相關功能
- 包含列出、搜尋預存程序
- 驗證工具註冊狀態

## 執行測試

### 前置準備
1. 確保專案已建置：
   ```bash
   npm run build
   ```

2. 設定資料庫連線資訊：
   ```bash
   # 複製並編輯 MCP 配置
   cp .mcp.example.json .mcp.json
   vim .mcp.json
   
   # 或者複製並編輯環境變數檔案  
   cp .env.example .env
   vim .env
   ```

3. 確保 SQL Server 可以正常連線

### 執行測試

#### 完整功能測試
```bash
node test-mcp.js
```

預期結果：
- ✅ 資料庫連線成功
- ✅ MCP 初始化成功
- ✅ 工具列表包含 11 個工具
- ✅ Schema 查詢返回結果
- ✅ 資料表查詢返回結果

#### 預存程序專項測試
```bash
node test-stored-procedures.js
```

預期結果：
- ✅ 列出預存程序
- ✅ 搜尋功能正常
- ✅ 所有預存程序工具已註冊

## 可用的 MCP 工具

### Schema 相關
1. `list_schemas` - 列出所有 Schema
2. `list_tables` - 列出資料表
3. `describe_table` - 描述資料表結構

### 觸發器相關
4. `list_triggers` - 列出觸發器
5. `describe_trigger` - 描述觸發器

### 預存程序相關
6. `list_stored_procedures` - 列出預存程序
7. `describe_stored_procedure` - 描述預存程序
8. `execute_stored_procedure` - 執行預存程序
9. `search_stored_procedures` - 搜尋預存程序
10. `get_procedure_dependencies` - 取得相依關係

### 查詢相關
11. `execute_query` - 執行 SQL 查詢

## 故障排除

### 常見問題

#### 1. 資料庫連線失敗
```
MSSQL 連線失敗: ConnectionError: Failed to connect
```
**解決方案：**
- 檢查 `.mcp.json` 中的連線資訊
- 確認 SQL Server 正在運行
- 檢查網路連線和防火牆設定
- 驗證使用者名稱和密碼

#### 2. 工具未註冊
```
未知的工具: tool_name
```
**解決方案：**
- 重新建置專案：`npm run build`
- 檢查伺服器啟動記錄
- 確認所有服務類別已正確匯入

#### 3. 權限錯誤
```
The user does not have permission to perform this action
```
**解決方案：**
- 確認資料庫使用者有適當權限
- 檢查 Schema 存取權限
- 聯絡資料庫管理員

### 除錯模式

啟用除錯模式查看詳細資訊：
```json
"MSSQL_DEBUG": "true"
```

這會顯示：
- 詳細的連線配置
- SQL 查詢執行記錄
- 錯誤堆疊追蹤

## 手動測試

### 使用 Claude Desktop
1. 將 `.mcp.json` 複製到 Claude Desktop 配置目錄
2. 重新啟動 Claude Desktop
3. 在對話中使用可用的工具

### 範例對話
```
使用者: 列出資料庫中的所有 Schema
助手: [使用 list_schemas 工具]

使用者: 描述 ACCOUNT 資料表的結構
助手: [使用 describe_table 工具]

使用者: 搜尋包含 "user" 的預存程序
助手: [使用 search_stored_procedures 工具]
```

## 效能考量

- 連線池設定會影響併發查詢效能
- 大型資料表的描述查詢可能較慢
- 預存程序搜尋在大型資料庫中可能需要較長時間

## 安全注意事項

- 不要在生產環境中啟用除錯模式
- 避免在配置檔中明文儲存密碼
- 使用最小權限原則設定資料庫使用者
- 定期檢查和更新存取權限