/*
 * @Description: GitHub 配置
 * @Author: 安知鱼
 * @Date: 2025-09-26
 * @LastEditTime: 2025-09-26 13:54:31
 * @LastEditors: 安知鱼
 */

// GitHub 仓库配置
export const GITHUB_CONFIG = {
  // 请根据实际的 GitHub 仓库修改这里的配置
  owner: "anzhiyu-c",
  repo: "anheyu-app",

  // GitHub API 基础 URL
  apiBase: "https://api.github.com",

  // 是否启用 GitHub Token 认证（如果有的话）
  enableAuth: false,

  // GitHub Token（可选，用于提高 API 请求限制）
  // 注意：不要在前端代码中直接暴露真实的 token
  // 在实际使用中，应该通过后端代理来处理认证
  token: import.meta.env.VITE_GITHUB_TOKEN || ""
};

// 获取完整的仓库标识符
export const getRepoFullName = (): string => {
  return `${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}`;
};

// 获取 GitHub API 的基础 URL
export const getGitHubApiUrl = (path: string): string => {
  return `${GITHUB_CONFIG.apiBase}/repos/${getRepoFullName()}${path}`;
};

// 获取请求头
export const getGitHubHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "anheyu-app-frontend"
  };

  // 如果启用了认证且有 token，添加认证头
  if (GITHUB_CONFIG.enableAuth && GITHUB_CONFIG.token) {
    headers.Authorization = `token ${GITHUB_CONFIG.token}`;
  }

  return headers;
};
