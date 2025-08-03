import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);
/**
 * 加载 MCP 服务器配置
 * @param configPath 配置文件路径
 * @returns MCP 服务器配置对象
 */
export function loadMcpConfig(configPath = '../config/mcp_servers.json') {
    try {
        const configFilePath = path.resolve(__dirname, configPath);
        const configContent = fs.readFileSync(configFilePath, 'utf-8');
        return JSON.parse(configContent);
    }
    catch (error) {
        console.error(`加载 MCP 配置失败: ${error instanceof Error ? error.message : String(error)}`);
        return { mcpServers: {} };
    }
}
/**
 * 检查 MCP 服务器是否可用
 * @param serverName 服务器名称
 * @param config 服务器配置
 * @returns 是否可用
 */
export async function checkMcpServerAvailability(serverName, config) {
    if (config.disabled) {
        console.log(`MCP 服务器 "${serverName}" 已禁用`);
        return false;
    }
    try {
        // 检查命令是否可用
        await execAsync(`which ${config.command}`);
        console.log(`MCP 服务器 "${serverName}" 命令可用`);
        return true;
    }
    catch (error) {
        console.error(`MCP 服务器 "${serverName}" 命令不可用: ${error instanceof Error ? error.message : String(error)}`);
        return false;
    }
}
/**
 * 列出所有可用的 MCP 服务器
 * @returns 可用的 MCP 服务器列表
 */
export async function listAvailableMcpServers() {
    const config = loadMcpConfig();
    const availableServers = [];
    for (const [serverName, serverConfig] of Object.entries(config.mcpServers)) {
        const isAvailable = await checkMcpServerAvailability(serverName, serverConfig);
        if (isAvailable) {
            availableServers.push(serverName);
        }
    }
    return availableServers;
}
/**
 * 获取 MCP 服务器配置
 * @param serverName 服务器名称
 * @returns 服务器配置
 */
export function getMcpServerConfig(serverName) {
    const config = loadMcpConfig();
    return config.mcpServers[serverName] || null;
}
