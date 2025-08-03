#!/usr/bin/env node
// 根据文件内容生成提交信息

const fs = require('fs');

// 简化的提交描述生成函数，模拟Git Commit MCP的逻辑
function generateCommitDescription(content) {
  // 根据内容生成简单的描述
  if (content.includes("function") || content.includes("def ") || content.includes("class ")) {
    return "新增功能";
  } else if (content.includes("fix") || content.includes("bug") || content.includes("error")) {
    return "修复问题";
  } else if (content.includes("document") || content.includes("README") || content.includes("doc")) {
    return "更新文档";
  } else if (content.includes("test")) {
    return "添加测试";
  } else if (content.includes("delete") || content.includes("remove")) {
    return "删除代码";
  } else if (content.includes("refactor")) {
    return "重构代码";
  } else {
    return "代码更新";
  }
}

// 获取当前日期
function getCurrentDate() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${month}${day}`;
}

// 读取test_commit.txt文件内容
const content = fs.readFileSync('test_commit.txt', 'utf8');

// 生成提交描述
const description = generateCommitDescription(content);

// 确保描述在5-10个字符之间
let commitDescription = description;
if (commitDescription.length > 10) {
  commitDescription = commitDescription.substring(0, 10);
}

// 生成完整的提交信息
const commitMessage = `[ADD] ${commitDescription} - ${getCurrentDate()}`;

console.log(commitMessage);