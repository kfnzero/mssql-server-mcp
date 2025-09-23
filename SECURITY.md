# 資訊安全指引

## 🔒 重要安全提醒

**⚠️ 絕對不要將真實的資料庫連線資訊提交到版本控制系統！**

## 敏感資訊管理

### ❌ 不應該提交的檔案
以下檔案包含敏感資訊，已被加入 `.gitignore`：

```
.mcp.json          # 本地 MCP 配置
.mcp.local.json    # 本地 MCP 配置變體
.env               # 環境變數檔案
.env.local         # 本地環境變數
.env.production    # 生產環境變數
.env.test          # 測試環境變數（如包含真實資料）
```

### ✅ 可以提交的檔案
以下檔案只包含範例資料，可以安全提交：

```
.env.example       # 環境變數範例
.mcp.example.json  # MCP 配置範例
test-*.js          # 測試腳本（已使用範例資料）
```

## 配置檔案使用方式

### 1. 環境變數配置
```bash
# 複製範例檔案
cp .env.example .env

# 編輯 .env 填入真實連線資訊
vim .env
```

### 2. MCP 配置
```bash
# 複製範例檔案
cp .mcp.example.json .mcp.json

# 編輯 .mcp.json 填入真實連線資訊
vim .mcp.json
```

## 安全最佳實務

### 🔐 密碼管理
- 使用強密碼，包含大小寫字母、數字和特殊字符
- 定期更換密碼
- 不要在多個系統間重複使用相同密碼
- 考慮使用密碼管理工具

### 🛡️ 權限控制
- 遵循最小權限原則
- 為 MCP 伺服器創建專用的資料庫使用者
- 僅授予必要的資料庫權限：
  ```sql
  -- 範例：創建受限權限的使用者
  CREATE LOGIN mcp_user WITH PASSWORD = 'StrongPassword123!';
  CREATE USER mcp_user FOR LOGIN mcp_user;
  
  -- 僅授予必要權限
  GRANT SELECT ON SCHEMA::dbo TO mcp_user;
  GRANT EXECUTE ON SCHEMA::dbo TO mcp_user;
  ```

### 🌐 網路安全
- 在生產環境中啟用 SSL/TLS 加密：
  ```bash
  MSSQL_ENCRYPT=true
  MSSQL_TRUST_SERVER_CERTIFICATE=false
  ```
- 限制資料庫伺服器的網路存取
- 使用防火牆規則限制連線來源

### 📊 監控和記錄
- 在生產環境中關閉除錯模式：
  ```bash
  MSSQL_DEBUG=false
  ```
- 定期檢查連線記錄
- 監控異常查詢活動

## 開發環境 vs 生產環境

### 開發環境設定
```bash
# 開發環境可以使用較寬鬆的設定
MSSQL_ENCRYPT=false
MSSQL_TRUST_SERVER_CERTIFICATE=true
MSSQL_DEBUG=true
MSSQL_LOG_LEVEL=debug
```

### 生產環境設定
```bash
# 生產環境必須使用嚴格的安全設定
MSSQL_ENCRYPT=true
MSSQL_TRUST_SERVER_CERTIFICATE=false
MSSQL_DEBUG=false
MSSQL_LOG_LEVEL=error
```

## 發生資料洩露時的應對措施

如果意外提交了敏感資訊：

1. **立即更改密碼**
   ```sql
   ALTER LOGIN [username] WITH PASSWORD = 'NewStrongPassword123!';
   ```

2. **從 Git 歷史中移除敏感資訊**
   ```bash
   # 使用 git filter-branch 或 BFG Repo-Cleaner
   git filter-branch --force --index-filter \
   'git rm --cached --ignore-unmatch .mcp.json' \
   --prune-empty --tag-name-filter cat -- --all
   ```

3. **檢查存取記錄**
   - 檢查資料庫連線記錄
   - 確認是否有未授權存取

4. **通知相關人員**
   - 通知資料庫管理員
   - 通知資訊安全團隊

## 合規性考量

### 個人資料保護
- 確保遵循 GDPR、CCPA 等資料保護法規
- 避免在測試環境中使用真實個人資料
- 實施資料遮罩和匿名化

### 稽核要求
- 保留詳細的存取記錄
- 定期進行安全評估
- 實施變更管理流程

## 安全檢查清單

- [ ] 已將 `.mcp.json` 加入 `.gitignore`
- [ ] 已將 `.env` 檔案加入 `.gitignore`
- [ ] 測試檔案中不包含真實連線資訊
- [ ] 生產環境已啟用 SSL/TLS 加密
- [ ] 資料庫使用者權限已限制為最小必要權限
- [ ] 已關閉生產環境的除錯模式
- [ ] 已設定強密碼政策
- [ ] 已實施網路存取控制
- [ ] 已建立監控和告警機制

## 聯絡資訊

如有安全疑慮或發現潛在的資訊安全問題，請立即聯絡：

- 專案維護者：[建立 GitHub Issue](https://github.com/your-repo/issues)
- 資訊安全團隊：security@your-company.com