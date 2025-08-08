# Git Commit MCP

An intelligent Git commit tool based on Model Context Protocol (MCP) that automatically analyzes code changes and generates commit messages that match your project's style.

## Features

- 🔍 **Smart Code Change Analysis** - Automatically analyze Git repository changes and diff content
- 📝 **Intelligent Commit Message Generation** - Generate commit messages based on historical commit styles
- 🎯 **Personalized Style Adaptation** - Prioritize current user's commit history for personalized style matching
- 📏 **Smart Length Control** - Provide length guidance based on historical commits without forced truncation
- 🏷️ **Multiple Commit Format Support** - Auto-detect prefix format `[FEAT]` and standard format `feat:`
- ⚡ **One-Click Stage & Commit** - Support complete workflow from staging to committing

## Installation & Usage

### Run as MCP Server

```bash
npx git-commit-mcp
```

### Configure in Claude Desktop

Add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "git-commit-mcp": {
      "command": "npx",
      "args": ["git-commit-mcp"]
    }
  }
}
```

## Tools

### 1. analyze_git_changes

Analyze the current Git repository's change status, including:
- File change status (staged, modified, added, deleted, etc.)
- Code diff content
- Historical commit style analysis

**Parameters:**
- `projectPath` (optional): Project path, defaults to current directory

**Returns:**
- Repository status and changed file list
- Code diff details
- Commit style analysis results (average length, format preferences, etc.)

### 2. generate_commit_message

Generate intelligent commit messages based on code changes and historical styles.

**Parameters:**
- `projectPath` (optional): Project path, defaults to current directory
- `commitDescription` (required): Commit description based on code changes
- `commitType` (optional): Commit type, supports feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert, update

**Smart Features:**
- Auto-detect user's preferred commit format (prefix vs standard format)
- Provide length guidance based on historical average length
- Auto-add date identifier (if present in history)
- Provide length comparison analysis without forced truncation

### 3. stage_and_commit

Execute complete workflow from file staging to committing.

**Parameters:**
- `projectPath` (optional): Project path, defaults to current directory
- `files` (optional): Specific files to stage, stages all modified files if not specified
- `commitMessage` (optional): Complete commit message
- `commitType` (optional): Commit type
- `customMessage` (optional): Custom commit message
- `autoCommit` (optional): Whether to auto-commit after staging, defaults to false

**Smart Features:**
- Auto-select commit format based on historical style
- Provide length analysis for all commit messages
- Support flexible file staging strategies

## Supported Commit Types

| Type | Prefix Format | Description |
|------|---------------|-------------|
| feat | FEAT | New feature: Add new features or functionality |
| fix | FIX | Bug fix: Resolve bugs or issues |
| docs | DOCS | Documentation: Update documentation or comments |
| style | STYLE | Style: Code formatting changes, no functional impact |
| refactor | REFACTOR | Refactor: Code restructuring without new features or bug fixes |
| perf | PERF | Performance: Performance optimization related changes |
| test | TEST | Testing: Add or modify test cases |
| build | BUILD | Build: Changes affecting build system or external dependencies |
| ci | CI | CI: Changes to CI configuration files and scripts |
| chore | CHORE | Chore: Other changes that don't modify source code or tests |
| revert | REVERT | Revert: Undo previous commits |
| update | UPDATE | Update: Update existing features or dependencies |

## Smart Style Analysis

The tool automatically analyzes your commit history, including:

1. **User Preference Priority** - Prioritize current user's commit records
2. **Length Analysis** - Calculate average length of historical commits as reference
3. **Format Recognition** - Auto-detect whether prefix format (like `[FEAT]`) is used
4. **Type Preferences** - Analyze most commonly used commit types
5. **Description Style** - Identify concise vs detailed description styles

## Usage Examples

### Basic Workflow

1. **Analyze Changes**
```bash
# Call via MCP
analyze_git_changes()
```

2. **Generate Commit Message**
```bash
# Generate commit message based on analysis results
generate_commit_message({
  "commitDescription": "Add user login functionality",
  "commitType": "feat"
})
```

3. **Stage and Commit**
```bash
# Stage all files and commit
stage_and_commit({
  "customMessage": "Add user login functionality",
  "commitType": "feat",
  "autoCommit": true
})
```

## Technical Features

- 🚀 **Zero Configuration** - Works out of the box, auto-adapts to project style
- 🧠 **Smart Analysis** - ML-based commit style recognition
- 🔄 **Incremental Optimization** - Continuously improves suggestions with usage
- 📊 **Detailed Feedback** - Provides comprehensive analysis and suggestion information
- 🛡️ **Safe & Reliable** - Never forcefully modifies or truncates user content

## Version

Current Version: 0.1.15

## License

MIT License

## Contributing

Welcome to submit Issues and Pull Requests to improve this tool!