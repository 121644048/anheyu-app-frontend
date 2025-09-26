/*
 * @Description: 更新日志相关 API
 * @Author: 安知鱼
 * @Date: 2025-09-26
 * @LastEditTime: 2025-09-26 14:05:13
 * @LastEditors: 安知鱼
 */

import { http } from "@/utils/http";
import { getGitHubApiUrl, getGitHubHeaders } from "@/config/github";

export interface GitHubAuthor {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
}

export interface GitHubRelease {
  id: number;
  tag_name: string;
  target_commitish: string;
  name: string;
  body: string;
  draft: boolean;
  prerelease: boolean;
  created_at: string;
  published_at: string;
  html_url: string;
  zipball_url: string;
  tarball_url: string;
  author: GitHubAuthor;
}

export interface GitHubReleasesResponse {
  data: GitHubRelease[];
  total: number;
  has_more: boolean;
}

/**
 * 获取 GitHub Releases
 * @param page 页码
 * @param per_page 每页数量
 * @returns Promise<GitHubReleasesResponse>
 */
export const getGitHubReleases = (
  page: number = 1,
  per_page: number = 10
): Promise<GitHubReleasesResponse> => {
  return new Promise((resolve, reject) => {
    // 首先尝试从后端 API 获取
    http
      .request<GitHubRelease[]>("get", "/api/github/releases", {
        params: { page, per_page }
      })
      .then(response => {
        resolve({
          data: response || [],
          total: response?.length || 0,
          has_more: (response?.length || 0) === per_page
        });
      })
      .catch(() => {
        // 如果后端失败，直接调用 GitHub API (需要考虑跨域问题)
        fetchFromGitHubDirectly(page, per_page).then(resolve).catch(reject);
      });
  });
};

/**
 * 直接从 GitHub API 获取 releases（备用方案）
 * 注意：在生产环境中可能会遇到跨域问题，建议通过后端代理
 */
const fetchFromGitHubDirectly = async (
  page: number = 1,
  per_page: number = 10
): Promise<GitHubReleasesResponse> => {
  try {
    const url = getGitHubApiUrl(`/releases?page=${page}&per_page=${per_page}`);
    const headers = getGitHubHeaders();

    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(
        `GitHub API 请求失败: ${response.status} ${response.statusText}`
      );
    }

    const releases: GitHubRelease[] = await response.json();

    return {
      data: releases,
      total: releases.length,
      has_more: releases.length === per_page
    };
  } catch (error) {
    console.error("Failed to fetch from GitHub API directly:", error);
    throw error;
  }
};

/**
 * 获取指定版本的发布信息
 * @param tag_name 版本标签
 */
export const getGitHubReleaseByTag = (
  tag_name: string
): Promise<GitHubRelease> => {
  return new Promise((resolve, reject) => {
    http
      .request<GitHubRelease>("get", `/api/github/releases/${tag_name}`)
      .then(response => {
        resolve(response);
      })
      .catch(() => {
        fetchReleaseByTagDirectly(tag_name).then(resolve).catch(reject);
      });
  });
};

const fetchReleaseByTagDirectly = async (
  tag_name: string
): Promise<GitHubRelease> => {
  try {
    const url = getGitHubApiUrl(`/releases/tags/${tag_name}`);
    const headers = getGitHubHeaders();

    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(
        `GitHub API 请求失败: ${response.status} ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to fetch release by tag from GitHub API:", error);
    throw error;
  }
};

/**
 * 获取最新版本信息
 */
export const getLatestRelease = (): Promise<GitHubRelease> => {
  return new Promise((resolve, reject) => {
    http
      .request<GitHubRelease>("get", "/api/github/releases/latest")
      .then(response => {
        resolve(response);
      })
      .catch(() => {
        fetchLatestReleaseDirectly().then(resolve).catch(reject);
      });
  });
};

const fetchLatestReleaseDirectly = async (): Promise<GitHubRelease> => {
  try {
    const url = getGitHubApiUrl("/releases/latest");
    const headers = getGitHubHeaders();

    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(
        `GitHub API 请求失败: ${response.status} ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to fetch latest release from GitHub API:", error);
    throw error;
  }
};

/**
 * 获取版本更新统计
 */
export const getUpdateStats = () => {
  return http.request<{
    total_releases: number;
    latest_version: string;
    last_updated: string;
  }>("get", "/api/github/stats");
};
