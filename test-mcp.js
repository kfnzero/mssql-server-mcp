#!/usr/bin/env node

/**
 * 測試 MSSQL MCP 伺服器的基本功能
 * 這個腳本會模擬 MCP 客戶端與伺服器的互動
 */

const { spawn } = require('child_process');
const readline = require('readline');

async function testMCPServer() {
  console.log('🚀 啟動 MSSQL MCP 伺服器測試...\n');

  // 設定測試環境變數（請修改為實際的連線資訊）
  const env = {
    ...process.env,
    MSSQL_SERVER: 'localhost',
    MSSQL_PORT: '1433',
    MSSQL_DATABASE: 'testdb', 
    MSSQL_USER: 'testuser',
    MSSQL_PASSWORD: 'TestPassword123!',
    MSSQL_ENCRYPT: 'false',
    MSSQL_TRUST_SERVER_CERTIFICATE: 'true',
    MSSQL_DEBUG: 'true',
    MSSQL_APP_NAME: 'mcp-test'
  };

  // 啟動 MCP 伺服器
  const serverProcess = spawn('node', ['dist/index.js'], {
    cwd: __dirname,
    env: env,
    stdio: ['pipe', 'pipe', 'pipe']
  });

  let messageId = 1;

  // 發送 JSON-RPC 訊息的函數
  function sendMessage(method, params = {}) {
    const message = {
      jsonrpc: '2.0',
      id: messageId++,
      method: method,
      params: params
    };
    
    console.log(`📤 發送: ${method}`);
    console.log(`   ${JSON.stringify(message, null, 2)}`);
    
    serverProcess.stdin.write(JSON.stringify(message) + '\n');
  }

  // 處理伺服器回應
  let responseBuffer = '';
  serverProcess.stdout.on('data', (data) => {
    responseBuffer += data.toString();
    
    // 處理完整的 JSON 訊息
    const lines = responseBuffer.split('\n');
    responseBuffer = lines.pop(); // 保留不完整的行
    
    lines.forEach(line => {
      if (line.trim()) {
        try {
          const response = JSON.parse(line);
          console.log(`📥 收到回應:`);
          console.log(`   ${JSON.stringify(response, null, 2)}\n`);
        } catch (e) {
          console.log(`📝 伺服器訊息: ${line}`);
        }
      }
    });
  });

  // 處理伺服器錯誤
  serverProcess.stderr.on('data', (data) => {
    console.log(`🔧 伺服器記錄: ${data.toString()}`);
  });

  // 等待伺服器啟動
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log('\n🔗 開始測試 MCP 協定...\n');

  // 測試 1: 初始化
  console.log('📋 測試 1: 初始化伺服器');
  sendMessage('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {
      tools: {}
    },
    clientInfo: {
      name: 'mcp-test-client',
      version: '1.0.0'
    }
  });

  await new Promise(resolve => setTimeout(resolve, 1000));

  // 測試 2: 列出工具
  console.log('📋 測試 2: 列出可用工具');
  sendMessage('tools/list');

  await new Promise(resolve => setTimeout(resolve, 1000));

  // 測試 3: 測試工具呼叫（如果有資料庫連線）
  console.log('📋 測試 3: 呼叫 list_schemas 工具');
  sendMessage('tools/call', {
    name: 'list_schemas',
    arguments: {}
  });

  await new Promise(resolve => setTimeout(resolve, 2000));

  // 測試 4: 測試另一個工具
  console.log('📋 測試 4: 呼叫 list_tables 工具');
  sendMessage('tools/call', {
    name: 'list_tables',
    arguments: {
      schema: 'dbo'
    }
  });

  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log('\n✅ 測試完成！');
  console.log('💡 如果看到資料庫連線錯誤，請確保 SQL Server 正在運行並且連線設定正確。');
  console.log('💡 如果看到工具列表，表示 MCP 伺服器基本功能正常。');
  
  // 關閉伺服器
  serverProcess.kill();
}

// 執行測試
testMCPServer().catch(console.error);