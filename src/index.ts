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
                        status.renamed.length > 0 || status.not_added.length > 0;
      
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
      
      let diffContent = await git.diff(["--cached"]);
      if (!diffContent) {
        diffContent = await git.diff();
      }
      
      const changedFiles = {
        staged: status.staged,
        modified: status.modified,
        created: status.created,
        deleted: status.deleted,
        renamed: status.renamed,
        not_added: status.not_added
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
              summary: `检测到 ${status.staged.length + status.modified.length + status.created.length + status.deleted.length + status.renamed.length + status.not_added.length} 个文件有变更`
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
      
      if (projectPath) {
        git.cwd(projectPath);
      }
      
      const status = await git.status();
      
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
              not_added: status.not_added,
              conflicted: status.conflicted,
              hasChanges: status.staged.length > 0 || status.modified.length > 0 || 
                         status.created.length > 0 || status.deleted.length > 0 ||
                         status.renamed.length > 0 || status.not_added.length > 0
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

      // 智能总结描述，而不是简单截取
      let finalDescription = commitDescription;
      if (finalDescription.length > 10) {
        // 尝试智能总结关键词
        const keywords = finalDescription.match(/[\u4e00-\u9fa5]+/g) || [];
        if (keywords.length > 0) {
          // 提取关键词并组合
          const keyTerms = keywords.slice(0, 2).join('');
          if (keyTerms.length >= 5 && keyTerms.length <= 10) {
            finalDescription = keyTerms;
          } else if (keyTerms.length > 10) {
            finalDescription = keyTerms.substring(0, 10);
          } else {
            // 如果关键词太短，保留原始逻辑但尽量保持完整词汇
            const words = finalDescription.split(/[，。、\s]+/);
            let summary = '';
            for (const word of words) {
              if ((summary + word).length <= 10) {
                summary += word;
              } else {
                break;
              }
            }
            finalDescription = summary || finalDescription.substring(0, 10);
          }
        } else {
          finalDescription = finalDescription.substring(0, 10);
        }
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
  "stage_git_changes",
  {
    projectPath: z.string().optional().describe("项目路径，默认为当前目录"),
    files: z.array(z.string()).optional().describe("要暂存的特定文件列表，如果不指定则暂存所有修改的文件")
  },
  async (args: { projectPath?: string; files?: string[] }) => {
    try {
      const { projectPath, files } = args;
      
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
      
      const renamedFiles = status.renamed.map(r => typeof r === 'string' ? r : r.to);
      const unstaged = [...status.modified, ...status.created, ...status.deleted, ...renamedFiles, ...status.not_added];
      
      if (unstaged.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                message: "没有需要暂存的文件",
                stagedFiles: [],
                alreadyStaged: status.staged
              })
            }
          ]
        };
      }
      
      let stagedFiles: string[] = [];
      
      if (files && files.length > 0) {
        for (const file of files) {
          if (unstaged.includes(file)) {
            await git.add(file);
            stagedFiles.push(file);
          }
        }
      } else {
        await git.add('.');
        stagedFiles = unstaged;
      }
      
      const newStatus = await git.status();
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              message: `成功暂存 ${stagedFiles.length} 个文件`,
              stagedFiles: stagedFiles,
              totalStaged: newStatus.staged.length,
              remainingUnstaged: [...newStatus.modified, ...newStatus.created, ...newStatus.deleted, ...newStatus.renamed.map(r => typeof r === 'string' ? r : r.to), ...newStatus.not_added]
            })
          }
        ]
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `暂存文件时出错: ${error instanceof Error ? error.message : String(error)}`
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
                        status.renamed.length > 0 || status.not_added.length > 0;
      
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
          status.deleted.length > 0 || status.renamed.length > 0 || status.not_added.length > 0) {
        await git.add('.');
      }
      
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
                renamed: status.renamed,
                not_added: status.not_added
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