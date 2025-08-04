# Git Commit MCP

这是一个基于MCP (Model Context Protocol)的Git提交消息标准化工具。该工具可以帮助您自动分析Git变更、生成标准化的提交信息，并执行Git提交操作。

## 功能特点

- 分析Git仓库变更
- 检查Git状态
- 生成标准化的提交信息
- 自动暂存文件变更
- 执行Git提交

## 安装

```bash
npm install git-commit-mcp
```

## 使用方法

该工具作为MCP服务器运行，可以与支持MCP的AI助手集成使用。

### 作为MCP服务器启动

```bash
npx git-commit-mcp
```

### 可用工具

1. `analyze_git_changes` - 分析Git变更
2. `check_git_status` - 检查Git状态
3. `generate_commit_message` - 生成提交信息
4. `stage_git_changes` - 暂存文件变更
5. `auto_commit_code` - 自动提交代码

## 提交类型映射

工具支持以下提交类型，并将其映射为标准化的前缀：

- feat: ADD (新功能)
- fix: FIX (修复)
- docs: DOC (文档)
- style: STY (样式)
- refactor: REF (重构)
- perf: PER (性能优化)
- test: TST (测试)
- build: BLD (构建)
- ci: CIC (CI配置)
- chore: CHG (其他变更)
- revert: REV (回退)

## 许可证

MIT