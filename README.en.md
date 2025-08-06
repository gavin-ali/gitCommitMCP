# Git Commit MCP

A Git commit message standardization tool based on MCP (Model Context Protocol). This tool helps you automatically analyze Git changes, generate standardized commit messages, and execute Git commit operations.

**[中文文档](https://github.com/pvwen/git-commit-mcp/blob/main/README.md)**

## Features

- Analyze Git repository changes
- Check Git status
- Generate standardized commit messages
- Automatically stage file changes
- Execute Git commits

## Installation

### Local Installation

```bash
npm install git-commit-mcp
```

### Global Installation

```bash
npm install -g git-commit-mcp
```

## Usage

This tool runs as an MCP server and can be integrated with AI assistants that support MCP.

### Start after local installation

```bash
npx git-commit-mcp
```

### Start after global installation

```bash
git-commit-mcp
```

### Available Tools

1. `analyze_git_changes` - Analyze Git changes and check status
   - Parameters:
     - `projectPath`: Project path, defaults to current directory

2. `generate_commit_message` - Generate standardized commit messages
   - Parameters:
     - `projectPath`: Project path, defaults to current directory
     - `commitDescription`: Commit description (5-10 characters recommended)
     - `commitType`: Commit type (optional), such as feat, fix, etc.

3. `stage_and_commit` - Stage file changes and commit code
   - Parameters:
     - `projectPath`: Project path, defaults to current directory
     - `files`: List of specific files to stage (optional)
     - `commitMessage`: Complete commit message (optional)
     - `commitType`: Commit type (optional)
     - `customMessage`: Custom commit message (10-20 characters recommended)
     - `autoCommit`: Whether to automatically commit after staging (optional), defaults to false

## Commit Type Mapping

The tool supports the following commit types and maps them to standardized prefixes:

- feat: FEAT (New feature)
- fix: FIX (Bug fix)
- docs: DOCS (Documentation)
- style: STYLE (Code style adjustments)
- refactor: REFACTOR (Code refactoring)
- perf: PERF (Performance optimization)
- test: TEST (Testing)
- build: BUILD (Build system)
- ci: CI (CI configuration)
- chore: CHORE (Other changes)
- revert: REVERT (Revert changes)
- update: UPDATE (Update dependencies or features)

## License

MIT