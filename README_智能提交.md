# 智能 Git Commit MCP 服务器

## 概述
这是一个智能的 Git 提交 MCP 服务器，它不会写死提交描述，而是通过工具让模型自行分析代码变更并生成智能的提交信息。

## 工作流程

### 1. 分析代码变更
```javascript
// 调用 analyze_git_changes 工具
{
  "projectPath": "项目路径（可选）"
}
```
返回：
- 变更文件列表
- 详细的 diff 内容
- Git 状态信息

### 2. 生成提交信息
```javascript
// 调用 generate_commit_message 工具
{
  "projectPath": "项目路径（可选）",
  "commitDescription": "基于分析生成的描述（5-10字符）",
  "commitType": "提交类型（feat/fix/docs等）"
}
```
返回标准化的提交信息格式：`[类型] 描述 - 日期`

### 3. 执行提交
```javascript
// 调用 auto_commit_code 工具
{
  "projectPath": "项目路径（可选）",
  "commitMessage": "完整的提交信息",
  "commitType": "提交类型（可选）",
  "customMessage": "自定义信息（可选）"
}
```

## 提交类型映射
- feat → ADD (新功能)
- fix → FIX (修复)
- docs → DOC (文档)
- style → STY (样式)
- refactor → REF (重构)
- perf → PER (性能)
- test → TST (测试)
- build → BLD (构建)
- ci → CIC (CI)
- chore → CHG (杂项)
- revert → REV (回滚)

## 使用方式
1. 在 Agent 模式下，系统会自动调用这些工具
2. 模型会分析代码变更并生成智能的提交描述
3. 经用户确认后自动执行提交

## 配置
MCP 服务器已添加到 CodeBuddy 配置中：
```json
"git-commit-mcp": {
  "disabled": false,
  "timeout": 60,
  "type": "stdio",
  "command": "node",
  "args": ["c:/Users/admin/Documents/gitCommitMCP/build/index.js"],
  "env": {}
}