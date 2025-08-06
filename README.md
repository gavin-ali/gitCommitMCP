# Git Commit MCP

这是一个基于MCP (Model Context Protocol)的Git提交消息标准化工具。该工具可以帮助您自动分析Git变更、生成标准化的提交信息，并执行Git提交操作。

**[English Documentation](https://github.com/pvwen/git-commit-mcp/blob/main/README.en.md)**

## 功能特点

- 分析Git仓库变更
- 检查Git状态
- 生成标准化的提交信息
- 自动暂存文件变更
- 执行Git提交

## 安装

### 本地安装

```bash
npm install git-commit-mcp
```

### 全局安装

```bash
npm install -g git-commit-mcp
```

## 使用方法

该工具作为MCP服务器运行，可以与支持MCP的AI助手集成使用。

### 本地安装后启动

```bash
npx git-commit-mcp
```

### 全局安装后启动

```bash
git-commit-mcp
```

### 可用工具

1. `analyze_git_changes` - 分析Git变更并检查状态
   - 参数：
     - `projectPath`：项目路径，默认为当前目录

2. `generate_commit_message` - 生成标准化的提交信息
   - 参数：
     - `projectPath`：项目路径，默认为当前目录
     - `commitDescription`：提交描述（尽量控制在5-10字）
     - `commitType`：提交类型（可选），如feat、fix等

3. `stage_and_commit` - 暂存文件变更并提交代码
   - 参数：
     - `projectPath`：项目路径，默认为当前目录
     - `files`：要暂存的特定文件列表（可选）
     - `commitMessage`：完整的提交信息（可选）
     - `commitType`：提交类型（可选）
     - `customMessage`：自定义提交信息（尽量控制在10-20字以内）
     - `autoCommit`：是否在暂存后自动提交（可选），默认为false

## 提交类型映射

工具支持以下提交类型，并将其映射为标准化的前缀：

- feat: FEAT (新功能：添加新特性或功能)
- fix: FIX (修复：解决bug或问题)
- docs: DOCS (文档：更新文档或注释)
- style: STYLE (样式：代码格式调整，不影响功能)
- refactor: REFACTOR (重构：代码重构，不新增功能也不修复bug)
- perf: PERF (性能：性能优化相关更改)
- test: TEST (测试：添加或修改测试用例)
- build: BUILD (构建：影响构建系统或外部依赖的更改)
- ci: CI (持续集成：CI配置文件和脚本的更改)
- chore: CHORE (杂务：不修改源代码或测试的其他更改)
- revert: REVERT (回滚：撤销之前的提交)
- update: UPDATE (更新：更新现有功能或依赖)

## 许可证

MIT
