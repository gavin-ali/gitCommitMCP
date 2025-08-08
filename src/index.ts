#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { simpleGit } from "simple-git";

const server = new McpServer({
  name: "git-commit-mcp",
  version: "0.1.8"
});

const git = simpleGit();

const commitTypeMap: { [key: string]: string } = {
  "feat": "FEAT", // 新功能：添加新特性或功能
  "fix": "FIX",   // 修复：解决bug或问题
  "docs": "DOCS", // 文档：更新文档或注释
  "style": "STYLE", // 样式：代码格式调整，不影响功能
  "refactor": "REFACTOR", // 重构：代码重构，不新增功能也不修复bug
  "perf": "PERF", // 性能：性能优化相关更改
  "test": "TEST", // 测试：添加或修改测试用例
  "build": "BUILD", // 构建：影响构建系统或外部依赖的更改
  "ci": "CI",    // 持续集成：CI配置文件和脚本的更改
  "chore": "CHORE", // 杂务：不修改源代码或测试的其他更改
  "revert": "REVERT", // 回滚：撤销之前的提交
  "update": "UPDATE" // 更新：更新现有功能或依赖
};

// 分析Git变更
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

      // 获取变更内容，只分析已被版本控制的文件，过滤掉未版本控制的文件
      let diffContent = "";
      if (hasChanges) {
        // 处理 renamed 文件，确保每个元素都是字符串类型
        const renamedFiles = status.renamed.map((renamed: any) => typeof renamed === 'string' ? renamed : renamed.to);

        // 只包含已被版本控制的文件（排除 not_added 即未版本控制的文件）
        const trackedChangedFiles = [
          ...status.staged,
          ...status.modified,
          ...status.created,
          ...status.deleted,
          ...renamedFiles
        ];

        // 只对已版本控制的文件进行 diff 分析
        if (trackedChangedFiles.length > 0) {
          try {
            // 获取已暂存和未暂存的变更
            const stagedDiff = status.staged.length > 0 ? await git.diff(['--cached']) : '';
            const unstagedDiff = trackedChangedFiles.filter(file => !status.staged.includes(file)).length > 0 
              ? await git.diff() : '';
            
            diffContent = [stagedDiff, unstagedDiff].filter(Boolean).join('\n---\n');
          } catch (error) {
            console.warn('获取diff内容时出错:', error);
            diffContent = `无法获取变更详情: ${error}`;
          }
        }
      }

      // 获取最近10次提交记录，分析风格
      let commitStyleAnalysis = {
        avgLength: 20,
        preferredTypes: ['feat'],
        commonPatterns: [],
        hasPrefix: false,
        prefixStyle: '',
        descriptionStyle: 'simple'
      };

      try {
        const commits = await git.log({ n: 10 });
        const commitMessages = commits.all.map((commit: any) => commit.message);
        
        if (commitMessages.length > 0) {
          // 分析平均长度
          commitStyleAnalysis.avgLength = Math.round(
            commitMessages.reduce((acc: number, msg: string) => acc + msg.length, 0) / commitMessages.length
          );

          // 分析提交类型偏好
          const typePattern = /^\[?(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert|update)\]?/i;
          const types = commitMessages
            .map(msg => {
              const match = msg.match(typePattern);
              return match ? match[1].toLowerCase() : null;
            })
            .filter(Boolean);
          
          if (types.length > 0) {
            const typeCount = types.reduce((acc: any, type) => {
              acc[type] = (acc[type] || 0) + 1;
              return acc;
            }, {});
            commitStyleAnalysis.preferredTypes = Object.keys(typeCount)
              .sort((a, b) => typeCount[b] - typeCount[a])
              .slice(0, 3);
          }

          // 分析是否使用前缀格式
          const hasPrefix = commitMessages.some(msg => /^\[.+\]/.test(msg));
          commitStyleAnalysis.hasPrefix = hasPrefix;
          
          if (hasPrefix) {
            const prefixMatch = commitMessages.find(msg => /^\[.+\]/.test(msg))?.match(/^\[(.+?)\]/);
            commitStyleAnalysis.prefixStyle = prefixMatch ? prefixMatch[1] : '';
          }

          // 分析描述风格（简洁 vs 详细）
          const avgWordsPerCommit = commitMessages.reduce((acc, msg) => {
            const cleanMsg = msg.replace(/^\[.+?\]\s*/, ''); // 移除前缀
            return acc + cleanMsg.split(/\s+/).length;
          }, 0) / commitMessages.length;
          
          commitStyleAnalysis.descriptionStyle = avgWordsPerCommit > 5 ? 'detailed' : 'simple';
        }
      } catch (error) {
        console.warn('分析提交风格时出错:', error);
      }

      const changedFiles = {
        staged: status.staged,
        modified: status.modified,
        created: status.created,
        deleted: status.deleted,
        renamed: status.renamed,
        not_added: status.not_added
      };

      // 基本状态信息
      const statusInfo = {
        isRepo: true,
        branch: status.current || 'main',
        staged: status.staged,
        modified: status.modified,
        created: status.created,
        deleted: status.deleted,
        renamed: status.renamed,
        not_added: status.not_added,
        conflicted: status.conflicted,
        hasChanges: hasChanges,
        changedFiles: changedFiles,
        diffContent: diffContent,
        summary: hasChanges ?
          `检测到 ${status.staged.length + status.modified.length + status.created.length + status.deleted.length + status.renamed.length + status.not_added.length} 个文件有变更` :
          "没有检测到需要提交的更改",
        commitStyleAnalysis: commitStyleAnalysis
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(statusInfo)
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

// 生成提交信息
server.tool(
  "generate_commit_message",
  {
    projectPath: z.string().optional().describe("项目路径，默认为当前目录"),
    commitDescription: z.string().describe("基于代码变更分析生成的提交描述"),
    commitType: z.string().optional().describe("提交类型，可选值包括：feat(新功能)、fix(修复)、docs(文档)、style(样式)、refactor(重构)、perf(性能)、test(测试)、build(构建)、ci(持续集成)、chore(杂务)、revert(回滚)、update(更新)，默认为 feat")
  },
  async (args: { projectPath?: string; commitDescription: string; commitType?: string }) => {
    try {
      const { projectPath, commitDescription, commitType = "feat" } = args;

      if (projectPath) {
        git.cwd(projectPath);
      }

      // 获取最近10次提交记录，基于提交风格调整生成的提交信息
      let commitStyleAnalysis = {
        avgLength: 20,
        preferredTypes: ['feat'],
        hasPrefix: false,
        prefixStyle: '',
        descriptionStyle: 'simple'
      };

      try {
        const commits = await git.log({ n: 10 });
        const commitMessages = commits.all.map((commit: any) => commit.message);
        
        if (commitMessages.length > 0) {
          // 分析平均长度
          commitStyleAnalysis.avgLength = Math.round(
            commitMessages.reduce((acc: number, msg: string) => acc + msg.length, 0) / commitMessages.length
          );

          // 分析提交类型偏好
          const typePattern = /^\[?(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert|update)\]?/i;
          const types = commitMessages
            .map(msg => {
              const match = msg.match(typePattern);
              return match ? match[1].toLowerCase() : null;
            })
            .filter(Boolean);
          
          if (types.length > 0) {
            const typeCount = types.reduce((acc: any, type) => {
              acc[type] = (acc[type] || 0) + 1;
              return acc;
            }, {});
            commitStyleAnalysis.preferredTypes = Object.keys(typeCount)
              .sort((a, b) => typeCount[b] - typeCount[a])
              .slice(0, 3);
          }

          // 分析是否使用前缀格式
          const hasPrefix = commitMessages.some(msg => /^\[.+\]/.test(msg));
          commitStyleAnalysis.hasPrefix = hasPrefix;
          
          if (hasPrefix) {
            const prefixMatch = commitMessages.find(msg => /^\[.+\]/.test(msg))?.match(/^\[(.+?)\]/);
            commitStyleAnalysis.prefixStyle = prefixMatch ? prefixMatch[1] : '';
          }

          // 分析描述风格（简洁 vs 详细）
          const avgWordsPerCommit = commitMessages.reduce((acc, msg) => {
            const cleanMsg = msg.replace(/^\[.+?\]\s*/, ''); // 移除前缀
            return acc + cleanMsg.split(/\s+/).length;
          }, 0) / commitMessages.length;
          
          commitStyleAnalysis.descriptionStyle = avgWordsPerCommit > 5 ? 'detailed' : 'simple';
        }
      } catch (error) {
        console.warn('分析提交风格时出错:', error);
      }

      // 动态调整提交描述，参考历史提交风格
      let finalDescription = commitDescription;
      if (!finalDescription || finalDescription.trim().length === 0) {
        finalDescription = '代码更新';
      }

      // 根据用户风格调整描述长度
      if (commitStyleAnalysis.descriptionStyle === 'simple' && finalDescription.length > commitStyleAnalysis.avgLength) {
        // 如果用户习惯简洁风格，截取描述
        finalDescription = finalDescription.substring(0, Math.max(10, commitStyleAnalysis.avgLength - 10)) + '...';
      } else if (commitStyleAnalysis.descriptionStyle === 'detailed' && finalDescription.length < commitStyleAnalysis.avgLength * 0.7) {
        // 如果用户习惯详细风格，可以保持或稍微扩展描述
        finalDescription = finalDescription + ' (基于代码变更分析)';
      }

      // 根据用户习惯生成提交信息
      let finalCommitMessage = '';
      if (commitStyleAnalysis.hasPrefix) {
        // 使用用户习惯的前缀格式
        const typeToUse = commitStyleAnalysis.preferredTypes.includes(commitType) ? commitType : commitStyleAnalysis.preferredTypes[0];
        finalCommitMessage = `[${commitTypeMap[typeToUse] || commitTypeMap[commitType] || 'UPD'}] ${finalDescription}`;
      } else {
        // 不使用前缀格式
        finalCommitMessage = `${commitType}: ${finalDescription}`;
      }

      // 确保长度符合用户习惯
      if (finalCommitMessage.length > commitStyleAnalysis.avgLength * 1.5) {
        const maxLength = Math.max(20, commitStyleAnalysis.avgLength);
        finalCommitMessage = finalCommitMessage.substring(0, maxLength - 3) + '...';
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              commitMessage: finalCommitMessage,
              commitType: commitType,
              description: finalDescription,
              commitStyleAnalysis: commitStyleAnalysis,
              styleApplied: {
                lengthAdjusted: finalDescription !== commitDescription,
                prefixUsed: commitStyleAnalysis.hasPrefix,
                typePreferred: commitStyleAnalysis.preferredTypes.includes(commitType)
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
            text: `生成提交信息时出错: ${error instanceof Error ? error.message : String(error)}`
          }
        ],
        isError: true
      };
    }
  }
);

server.tool(
  "stage_and_commit",
  {
    projectPath: z.string().optional().describe("项目路径，默认为当前目录"),
    files: z.array(z.string()).optional().describe("要暂存的特定文件列表，如果不指定则暂存所有修改的文件"),
    commitMessage: z.string().optional().describe("完整的提交信息"),
    commitType: z.string().optional().describe("提交类型，可选值包括：feat(新功能)、fix(修复)、docs(文档)、style(样式)、refactor(重构)、perf(性能)、test(测试)、build(构建)、ci(持续集成)、chore(杂务)、revert(回滚)、update(更新)"),
    customMessage: z.string().optional().describe("自定义提交信息（请控制在10-20字以内）"),
    autoCommit: z.boolean().optional().describe("是否在暂存后自动提交，默认为 false")
  },
  async (args: {
    projectPath?: string;
    files?: string[];
    commitMessage?: string;
    commitType?: string;
    customMessage?: string;
    autoCommit?: boolean;
  }) => {
    try {
      const { projectPath, files, commitMessage, commitType, customMessage, autoCommit = false } = args;

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

      const renamedFiles = status.renamed.map((r: any) => typeof r === 'string' ? r : r.to);
      const unstaged = [...status.modified, ...status.created, ...status.deleted, ...renamedFiles, ...status.not_added];

      if (unstaged.length === 0 && status.staged.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                message: "没有需要暂存或提交的文件",
                stagedFiles: [],
                alreadyStaged: []
              })
            }
          ]
        };
      }

      // 暂存文件
      let stagedFiles: string[] = [];

      if (unstaged.length > 0) {
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
      }

      const newStatus = await git.status();

      // 如果不需要提交，只返回暂存结果
      if (!autoCommit || (!commitMessage && !customMessage)) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                message: `成功暂存 ${stagedFiles.length} 个文件`,
                stagedFiles: stagedFiles,
                totalStaged: newStatus.staged.length,
                remainingUnstaged: [...newStatus.modified, ...newStatus.created, ...newStatus.deleted, ...newStatus.renamed.map((r: any) => typeof r === 'string' ? r : r.to), ...newStatus.not_added]
              })
            }
          ]
        };
      }

      // 如果需要提交
      if (newStatus.staged.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "没有暂存的文件可提交"
            }
          ],
          isError: true
        };
      }

      // 生成提交信息
      let finalCommitMessage = commitMessage || "";
      if (customMessage) {
        const now = new Date();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const dateStr = `${month}${day}`;
        finalCommitMessage = `[${commitTypeMap[commitType || 'feat'] || 'UPD'}] ${customMessage} - ${dateStr}`;
      }

      if (!finalCommitMessage) {
        return {
          content: [
            {
              type: "text",
              text: "提交时需要提供提交信息"
            }
          ],
          isError: true
        };
      }

      // 执行提交
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
              stagedFiles: stagedFiles,
              changedFiles: {
                staged: newStatus.staged,
                modified: newStatus.modified,
                created: newStatus.created,
                deleted: newStatus.deleted,
                renamed: newStatus.renamed,
                not_added: newStatus.not_added
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
            text: `Git操作出错: ${error instanceof Error ? error.message : String(error)}`
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