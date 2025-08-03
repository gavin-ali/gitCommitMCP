#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import simpleGit from "simple-git";

const server = new McpServer({
  name: "git-commit-mcp",
  version: "0.1.0"
});

const git = simpleGit();

const commitTypeMap: { [key: string]: string } = {
  "feat": "ADD",
  "fix": "FIX",
  "docs": "DOC",
  "style": "STY",
  "refactor": "REF",
  "perf": "PER",
  "test": "TST",
  "build": "BLD",
  "ci": "CIC",
  "chore": "CHG",
  "revert": "REV"
};


server.tool(
  "analyze_git_changes",
  {
    projectPath: z.string().optional().describe("项目路径，默认为当前目录")
  },
  async (args: { projectPath?: string }) => {
    try {
      const { projectPath } = args;
      
      if (projectPath) {
        git.cwd(projectPath);
      }
      
      const status = await git.status();
      
      if (!status) {
        return {
          content: [
            {
              type: "text",
              text: "当前目录不是有效的Git仓库"
            }
          ],
          isError: true
        };
      }
      
      const hasChanges = status.staged.length > 0 || status.modified.length > 0 || 
                        status.created.length > 0 || status.deleted.length > 0 ||
                        status.renamed.length > 0;
      
      if (!hasChanges) {
        return {
          content: [
            {
              type: "text",
              text: "没有检测到需要提交的更改"
            }
          ],
          isError: true
        };
      }
      
      // 获取详细的 diff 信息
      let diffContent = await git.diff(["--cached"]);
      if (!diffContent) {
        diffContent = await git.diff();
      }
      
      // 获取文件状态信息
      const changedFiles = {
        staged: status.staged,
        modified: status.modified,
        created: status.created,
        deleted: status.deleted,
        renamed: status.renamed
      };
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              hasChanges: true,
              changedFiles: changedFiles,
              diffContent: diffContent,
              branch: status.current || 'main',
              summary: `检测到 ${status.staged.length + status.modified.length + status.created.length + status.deleted.length + status.renamed.length} 个文件有变更`
            })
          }
        ]
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `分析Git变更时出错: ${error instanceof Error ? error.message : String(error)}`
          }
        ],
        isError: true
      };
    }
  }
);

server.tool(
  "check_git_status",
  {
    projectPath: z.string().optional().describe("项目路径，默认为当前目录")
  },
  async (args: { projectPath?: string }) => {
    try {
      const { projectPath } = args;
      
      // 如果指定了项目路径，则切换到该项目路径
      if (projectPath) {
        git.cwd(projectPath);
      }
      
      const status = await git.status();
      
      // 切换回原始目录的逻辑应该在这里，但我们暂时不实现
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              isRepo: true,
              branch: status.current || 'main',
              staged: status.staged,
              modified: status.modified,
              created: status.created,
              deleted: status.deleted,
              renamed: status.renamed,
              conflicted: status.conflicted,
              hasChanges: status.staged.length > 0 || status.modified.length > 0 || 
                         status.created.length > 0 || status.deleted.length > 0 ||
                         status.renamed.length > 0
            })
          }
        ]
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `获取Git状态时出错: ${error instanceof Error ? error.message : String(error)}`
          }
        ],
        isError: true
      };
    }
  }
);

server.tool(
  "generate_commit_message",
  {
    projectPath: z.string().optional().describe("项目路径，默认为当前目录"),
    commitDescription: z.string().describe("基于代码变更分析生成的提交描述（5-10个字符）"),
    commitType: z.string().optional().describe("提交类型，如 feat, fix, docs 等，默认为 feat")
  },
  async (args: { projectPath?: string; commitDescription: string; commitType?: string }) => {
    try {
      const { projectPath, commitDescription, commitType = "feat" } = args;
      
      if (projectPath) {
        git.cwd(projectPath);
      }
      
      const now = new Date();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const dateStr = `${month}${day}`;

      // 确保描述在5-10个字符之间
      let finalDescription = commitDescription;
      if (finalDescription.length > 10) {
        finalDescription = finalDescription.substring(0, 10);
      }
      if (finalDescription.length < 5) {
        finalDescription = finalDescription.padEnd(5, '更新');
      }

      const commitMessage = `[${commitTypeMap[commitType] || 'UPD'}] ${finalDescription} - ${dateStr}`;
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              commitMessage: commitMessage,
              commitType: commitType,
              description: finalDescription,
              dateStr: dateStr
            })
          }
        ]
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `生成提交信息时出错: ${error instanceof Error ? error.message : String(error)}`
          }
        ],
        isError: true
      };
    }
  }
);

server.tool(
  "auto_commit_code",
  {
    projectPath: z.string().optional().describe("项目路径，默认为当前目录"),
    commitMessage: z.string().describe("完整的提交信息"),
    commitType: z.string().optional().describe("提交类型，如 feat, fix, docs 等"),
    customMessage: z.string().optional().describe("自定义提交信息")
  },
  async (args: { projectPath?: string; commitMessage: string; commitType?: string; customMessage?: string }) => {
    try {
      const { projectPath, commitMessage, commitType, customMessage } = args;
      
      if (projectPath) {
        git.cwd(projectPath);
      }
      
      const status = await git.status();
      
      if (!status) {
        return {
          content: [
            {
              type: "text",
              text: "当前目录不是有效的Git仓库"
            }
          ],
          isError: true
        };
      }
      
      const hasChanges = status.staged.length > 0 || status.modified.length > 0 || 
                        status.created.length > 0 || status.deleted.length > 0 ||
                        status.renamed.length > 0;
      
      if (!hasChanges) {
        return {
          content: [
            {
              type: "text",
              text: "没有检测到需要提交的更改"
            }
          ],
          isError: true
        };
      }
      
      // 如果有未暂存的更改，自动暂存所有更改
      if (status.modified.length > 0 || status.created.length > 0 || 
          status.deleted.length > 0 || status.renamed.length > 0) {
        await git.add('.');
      }
      
      // 使用传入的提交信息，如果有自定义信息则优先使用
      let finalCommitMessage = commitMessage;
      if (customMessage) {
        const now = new Date();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const dateStr = `${month}${day}`;
        const trimmedCustomMessage = customMessage.length > 10 ? customMessage.substring(0, 10) : customMessage;
        finalCommitMessage = `[${commitTypeMap[commitType || 'feat'] || 'UPD'}] ${trimmedCustomMessage} - ${dateStr}`;
      }
      
      const commitResult = await git.commit(finalCommitMessage);
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              commitMessage: finalCommitMessage,
              commitHash: commitResult.commit,
              summary: commitResult.summary,
              changedFiles: {
                staged: status.staged,
                modified: status.modified,
                created: status.created,
                deleted: status.deleted,
                renamed: status.renamed
              }
            })
          }
        ]
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `自动提交代码时出错: ${error instanceof Error ? error.message : String(error)}`
          }
        ],
        isError: true
      };
    }
  }
);

async function main() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
  } catch (error: any) {
    process.exit(1);
  }
}

main().catch(() => process.exit(1));