const { spawn } = require('child_process');
const fs = require('fs');

console.log('=== Git Commit MCP 调试测试 ===');

// 检查文件是否存在
const buildPath = './build/index.js';
if (!fs.existsSync(buildPath)) {
  console.error('错误: build/index.js 文件不存在');
  process.exit(1);
}

console.log('✓ build/index.js 文件存在');

// 检查文件权限
try {
  fs.accessSync(buildPath, fs.constants.R_OK);
  console.log('✓ build/index.js 文件可读');
} catch (error) {
  console.error('错误: build/index.js 文件不可读:', error.message);
  process.exit(1);
}

// 启动 MCP 服务器
console.log('启动 MCP 服务器...');
const mcpProcess = spawn('node', ['build/index.js'], {
  cwd: process.cwd(),
  stdio: ['pipe', 'pipe', 'pipe']
});

let hasOutput = false;
let initResponseReceived = false;

// 监听标准输出
mcpProcess.stdout.on('data', (data) => {
  hasOutput = true;
  const output = data.toString();
  console.log('MCP 标准输出:', output);
  
  // 尝试解析 JSON 响应
  try {
    const lines = output.split('\n').filter(line => line.trim());
    for (const line of lines) {
      if (line.startsWith('{')) {
        const response = JSON.parse(line);
        console.log('解析的 JSON 响应:', JSON.stringify(response, null, 2));
        if (response.id === 1) {
          initResponseReceived = true;
          console.log('✓ 收到初始化响应');
        }
      }
    }
  } catch (e) {
    // 不是 JSON，忽略
  }
});

// 监听标准错误
mcpProcess.stderr.on('data', (data) => {
  hasOutput = true;
  console.log('MCP 标准错误:', data.toString());
});

// 监听进程事件
mcpProcess.on('close', (code) => {
  console.log(`MCP 服务器进程关闭，退出码: ${code}`);
});

mcpProcess.on('error', (error) => {
  console.error('启动 MCP 服务器时出错:', error);
});

// 等待服务器启动
setTimeout(() => {
  if (!hasOutput) {
    console.log('警告: 5秒内没有收到任何输出');
  }
  
  console.log('发送初始化消息...');
  
  // 发送初始化消息
  const initMessage = {
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: {
        tools: {}
      },
      clientInfo: {
        name: "debug-client",
        version: "1.0.0"
      }
    }
  };

  try {
    mcpProcess.stdin.write(JSON.stringify(initMessage) + '\n');
    console.log('✓ 初始化消息已发送');
  } catch (error) {
    console.error('发送初始化消息时出错:', error);
  }
}, 2000);

// 等待响应
setTimeout(() => {
  if (!initResponseReceived) {
    console.log('警告: 没有收到初始化响应');
    
    // 发送 tools/list 请求
    const toolsListMessage = {
      jsonrpc: "2.0",
      id: 2,
      method: "tools/list"
    };
    
    try {
      mcpProcess.stdin.write(JSON.stringify(toolsListMessage) + '\n');
      console.log('发送工具列表请求...');
    } catch (error) {
      console.error('发送工具列表请求时出错:', error);
    }
  }
}, 5000);

// 10秒后结束测试
setTimeout(() => {
  console.log('=== 测试结束 ===');
  mcpProcess.kill();
  
  if (initResponseReceived) {
    console.log('✓ MCP 服务器连接测试成功');
  } else {
    console.log('✗ MCP 服务器连接测试失败');
    console.log('建议检查:');
    console.log('1. Node.js 版本是否兼容');
    console.log('2. 依赖包是否正确安装');
    console.log('3. TypeScript 编译是否有错误');
  }
}, 10000);