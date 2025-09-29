/*
 * @Description: 更新日志相关 API
 * @Author: 安知鱼
 * @Date: 2025-09-26
 * @LastEditTime: 2025-09-28 10:08:08
 * @LastEditors: 安知鱼
 */

// 更新日志资产
export interface ChangelogAsset {
  id: number;
  name: string;
  contentType: string;
  size: number;
  downloadCount: number;
  browserDownloadUrl: string;
  createdAt: string;
  updatedAt: string;
}

// 更新项
export interface ChangelogItem {
  type: string;
  scope?: string;
  message: string;
  description: string;
  commitHash?: string;
  breaking: boolean;
}

// 更新章节
export interface ChangelogSection {
  title: string;
  icon: string;
  type: string;
  order: number;
  items: ChangelogItem[];
  count: number;
}

// 构建信息
export interface BuildInfo {
  version?: string;
  commit?: string;
  commitUrl?: string;
  buildTime?: string;
  goVersion?: string;
}

// 汇总信息
export interface ChangelogSummary {
  totalChanges: number;
  byType: Record<string, number>;
}

// 解析后的更新日志
export interface ParsedChangelog {
  sections: ChangelogSection[];
  buildInfo: BuildInfo;
  summary: ChangelogSummary;
  rawContent: string;
  hasBreaking: boolean;
}

// 更新日志主体
export interface Changelog {
  id: number;
  githubReleaseId: number;
  tagName: string;
  name: string;
  body: string;
  targetCommitish: string;
  draft: boolean;
  prerelease: boolean;
  publishedAt: string;
  htmlUrl: string;
  tarballUrl: string;
  zipballUrl: string;
  assets: ChangelogAsset[];
  authorLogin: string;
  authorAvatarUrl: string;
  downloadCount: number;
  isLatest: boolean;
  syncStatus: string;
  parsedContent?: ParsedChangelog;
  createdAt: string;
  updatedAt: string;
}

// API响应格式
export interface ChangelogListResponse {
  list: Changelog[];
  total: number;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

// 查询参数
export interface ChangelogQuery {
  page?: number;
  limit?: number;
  search?: string;
  draft?: boolean;
  prerelease?: boolean;
  latest?: boolean;
  detail?: boolean;
}

// 兼容旧的接口类型（用于渐进式迁移）
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

// 新的更新日志 API 基础URL
const CHANGELOG_API_BASE = "https://anheyuofficialwebsiteapi.anheyu.com/api/v1";
// const CHANGELOG_API_BASE = "http://127.0.0.1:8888/api/v1";

/**
 * 获取更新日志列表
 * @param query 查询参数
 * @returns Promise<ApiResponse<ChangelogListResponse>>
 */
export const getChangelogList = async (
  query: ChangelogQuery = {}
): Promise<ApiResponse<ChangelogListResponse>> => {
  const defaultQuery: ChangelogQuery = {
    page: 1,
    limit: 10,
    detail: true,
    prerelease: false,
    draft: false,
    ...query
  };

  try {
    const params = new URLSearchParams();
    Object.entries(defaultQuery).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });

    const url = `${CHANGELOG_API_BASE}/changelog?${params.toString()}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to fetch changelog list:", error);
    throw error;
  }
};

/**
 * 获取更新日志详情
 * @param id 更新日志ID
 * @returns Promise<ApiResponse<Changelog>>
 */
export const getChangelogDetail = async (
  id: number
): Promise<ApiResponse<Changelog>> => {
  try {
    const url = `${CHANGELOG_API_BASE}/changelog/${id}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to fetch changelog detail:", error);
    throw error;
  }
};

// 兼容旧的接口名称，用于渐进式迁移
/**
 * 获取 GitHub Releases（兼容旧接口）
 * @param page 页码
 * @param per_page 每页数量
 * @returns Promise<GitHubReleasesResponse>
 */
export const getGitHubReleases = async (
  page: number = 1,
  per_page: number = 10
): Promise<GitHubReleasesResponse> => {
  try {
    const response = await getChangelogList({
      page,
      limit: per_page,
      detail: true
    });

    if (response.code !== 200) {
      throw new Error(response.message || "获取更新日志失败");
    }

    // 转换新API响应为旧格式
    const convertedData: GitHubRelease[] = response.data.list.map(
      changelog => ({
        id: changelog.id,
        tag_name: changelog.tagName,
        target_commitish: changelog.targetCommitish,
        name: changelog.name,
        body: changelog.body,
        draft: changelog.draft,
        prerelease: changelog.prerelease,
        created_at: changelog.createdAt,
        published_at: changelog.publishedAt,
        html_url: changelog.htmlUrl,
        zipball_url: changelog.zipballUrl,
        tarball_url: changelog.tarballUrl,
        author: {
          login: changelog.authorLogin,
          id: changelog.githubReleaseId,
          avatar_url: changelog.authorAvatarUrl,
          html_url: changelog.htmlUrl
        }
      })
    );

    return {
      data: convertedData,
      total: response.data.total,
      has_more: response.data.list.length === per_page
    };
  } catch (error) {
    console.error("Failed to fetch GitHub releases:", error);
    throw error;
  }
};

/**
 * 获取最新版本信息（兼容旧接口）
 */
export const getLatestRelease = async (): Promise<GitHubRelease> => {
  try {
    const response = await getChangelogList({
      page: 1,
      limit: 1,
      latest: true,
      detail: true
    });

    if (response.code !== 200 || !response.data.list.length) {
      throw new Error("获取最新版本失败");
    }

    const latest = response.data.list[0];
    return {
      id: latest.id,
      tag_name: latest.tagName,
      target_commitish: latest.targetCommitish,
      name: latest.name,
      body: latest.body,
      draft: latest.draft,
      prerelease: latest.prerelease,
      created_at: latest.createdAt,
      published_at: latest.publishedAt,
      html_url: latest.htmlUrl,
      zipball_url: latest.zipballUrl,
      tarball_url: latest.tarballUrl,
      author: {
        login: latest.authorLogin,
        id: latest.githubReleaseId,
        avatar_url: latest.authorAvatarUrl,
        html_url: latest.htmlUrl
      }
    };
  } catch (error) {
    console.error("Failed to fetch latest release:", error);
    throw error;
  }
};

/**
 * 获取指定版本的发布信息（兼容旧接口）
 * @param tag_name 版本标签
 */
export const getGitHubReleaseByTag = async (
  tag_name: string
): Promise<GitHubRelease> => {
  try {
    const response = await getChangelogList({
      search: tag_name,
      limit: 1,
      detail: true
    });

    if (response.code !== 200 || !response.data.list.length) {
      throw new Error(`版本 ${tag_name} 不存在`);
    }

    const changelog = response.data.list[0];
    return {
      id: changelog.id,
      tag_name: changelog.tagName,
      target_commitish: changelog.targetCommitish,
      name: changelog.name,
      body: changelog.body,
      draft: changelog.draft,
      prerelease: changelog.prerelease,
      created_at: changelog.createdAt,
      published_at: changelog.publishedAt,
      html_url: changelog.htmlUrl,
      zipball_url: changelog.zipballUrl,
      tarball_url: changelog.tarballUrl,
      author: {
        login: changelog.authorLogin,
        id: changelog.githubReleaseId,
        avatar_url: changelog.authorAvatarUrl,
        html_url: changelog.htmlUrl
      }
    };
  } catch (error) {
    console.error("Failed to fetch release by tag:", error);
    throw error;
  }
};

/**
 * 获取版本更新统计（兼容旧接口）
 */
export const getUpdateStats = async () => {
  try {
    const response = await getChangelogList({
      page: 1,
      limit: 1,
      latest: true,
      detail: false
    });

    if (response.code !== 200) {
      throw new Error("获取统计信息失败");
    }

    const latest = response.data.list[0];
    return {
      total_releases: response.data.total,
      latest_version: latest?.tagName || "未知",
      last_updated: latest?.updatedAt || new Date().toISOString()
    };
  } catch (error) {
    console.error("Failed to fetch update stats:", error);
    throw error;
  }
};
