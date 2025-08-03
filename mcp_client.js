#!/usr/bin/env node
import { spawn } from 'child_process';
import { createInterface } from 'readline';

/**
 * MCP客户端，用于调用Git Commit MCP工具
 */
class McpClient {
  constructor() {
    this.serverProcess = null;
    this.rl = null;
  }

  /**
   * 启动MCP服务器
   */
  async startServer() {
    console.log('启动Git Commit MCP服务器...');
    
    // 启动MCP服务器进程
    this.serverProcess = spawn('node', ['build/index.js'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // 创建 readline 接口来处理服务器通信
    this.rl = createInterface({
      input: this.serverProcess.stdout,
      output: this.serverProcess.stdin
    });

    // 设置超时
    return new Promise((resolve, reject) => {
      let timeoutId = setTimeout(() => {
        reject(new Error('MCP服务器启动超时'));
      }, 5000);

      this.serverProcess.stdout.on('data', (data) => {
        console.log(`服务器输出: ${data}`);
        clearTimeout(timeoutId);
        resolve();
      });

      this.serverProcess.stderr.on('data', (data) => {
        console.error(`服务器错误: ${data}`);
      });

      this.serverProcess.on('close', (code) => {
        console.log(`服务器关闭，退出码: ${code}`);
      });
    });
  }

  /**
   * 发送请求到MCP服务器
   * @param {Object} request - 请求对象
   */
  async sendRequest(request) {
    return new Promise((resolve, reject) => {
      if (!this.serverProcess) {
        reject(new Error('MCP服务器未启动'));
        return;
      }

      // 监听响应
      const onResponse = (data) => {
        try {
          const response = JSON.parse(data.toString());
          if (response.id === request.id) {
            // 移除监听器
            this.serverProcess.stdout.removeListener('data', onResponse);
            resolve(response);
          }
        } catch (error) {
          // 不是JSON格式的数据，继续监听
        }
      };

      // 添加监听器
      this.serverProcess.stdout.on('data', onResponse);

      // 发送请求
      this.serverProcess.stdin.write(JSON.stringify(request) + '\n');

      // 设置超时
      setTimeout(() => {
        this.serverProcess.stdout.removeListener('data', onResponse);
        reject(new Error('请求超时'));
      }, 10000);
    });
  }

  /**
   * 调用工具
   * @param {string} toolName - 工具名称
   * @param {Object} arguments - 工具参数
   */
  async callTool(toolName, argumentsObj = {}) {
    const request = {
      jsonrpc: "2.0",
      id: Date.now(),
      method: "tools/call",
      params: {
        name: toolName,
        arguments: argumentsObj
      }
    };

    try {
      const response = await this.sendRequest(request);
      return response.result;
    } catch (error) {
      console.error(`调用工具 ${toolName} 时出错:`, error);
      throw error;
    }
  }

  /**
   * 关闭MCP服务器
   */
  async stopServer() {
    if (this.serverProcess) {
      this.serverProcess.kill();
      this.serverProcess = null;
    }
    if (this.rl) {
      this.rl.close();
      this.rl = null;
    }
  }
}

/**
 * 主函数
 */
async function main() {
  const client = new McpClient();
  
  try {
    // 启动MCP服务器
    await client.startServer();
    console.log('MCP服务器启动成功');
    
    // 等待服务器完全启动
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 调用check_git_status工具
    console.log('\n1. 调用 check_git_status 工具...');
    const statusResult = await client.callTool('check_git_status', {});
    console.log('Git状态:', JSON.stringify(statusResult, null, 2));
    
    // 调用auto_commit_code工具
    console.log('\n2. 调用 auto_commit_code 工具...');
    const commitResult = await client.callTool('auto_commit_code', {
      commitType: 'feat'
    });
    console.log('提交结果:', JSON.stringify(commitResult, null, 2));
    
    // 再次检查Git状态
    console.log('\n3. 再次调用 check_git_status 工具...');
    const finalStatus = await client.callTool('check_git_status', {});
    console.log('最终Git状态:', JSON.stringify(finalStatus, null, 2));
    
    console.log('\n所有操作完成！');
  } catch (error) {
    console.error('执行过程中出错:', error);
  } finally {
    // 关闭MCP服务器
    await client.stopServer();
  }
}

// 执行主函数
main().catch(error => {
  console.error('执行主函数时出错:', error);
  process.exit(1);
});