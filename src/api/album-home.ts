/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-06-15 14:44:11
 * @LastEditTime: 2025-07-25 18:38:03
 * @LastEditors: 安知鱼
 */
// src/api/wallpaper.ts
import { http } from "@/utils/http";
import { baseUrlApi } from "@/utils/http/config";

// 导入 Pinia store
import { useSiteConfigStore } from "@/store/modules/siteConfig";

type Result = {
  success: boolean;
  data: {
    list: Array<any>;
    total: number;
    pageSize: number;
    pageNum: number;
  };
  code: number;
};

type addResult = {
  success: boolean;
  message: string;
  code: number;
};

/**
 * @description 获取动态 API 基础 URL。
 * 优先使用后端配置的 API_URL，如果不存在则回退到默认的 baseUrlApi。
 * @param endpointPath API 路径
 * @returns 完整的请求 URL。
 */
const getDynamicApiUrl = (endpointPath: string): string => {
  const siteConfigStore = useSiteConfigStore();
  const backendConfiguredApiUrl =
    siteConfigStore.getWallpaperBackendApiUrl + "api/";

  if (backendConfiguredApiUrl) {
    return `${backendConfiguredApiUrl}${endpointPath}`;
  } else {
    console.warn(
      `未能获取到后端配置的 API 地址 (API_URL)，回退到使用默认 baseUrlApi(${endpointPath})。`
    );
    return baseUrlApi(endpointPath);
  }
};

// 获取相册图片列表
export const getWallpapertList = (params: any) => {
  return http.request<Result>("get", baseUrlApi("albums/get"), {
    params
  });
};

// 删除相册图片
export const deleteWallpaper = (data: { id: string }) => {
  return http.request<addResult>(
    "delete",
    baseUrlApi(`albums/delete/${data.id}`)
  );
};

// 更新相册图片信息
export const updateWallpaper = (data: any) => {
  return http.request<addResult>(
    "put",
    baseUrlApi(`albums/update/${data.id}`),
    {
      data
    }
  );
};

// 添加相册图片
export const addWallpapert = (data: any) => {
  return http.request<addResult>("post", baseUrlApi("albums/add"), { data });
};

// 批量导入相册图片
export const batchImportAlbums = (data: {
  categoryId?: number | null;
  urls: string[];
  thumbParam?: string;
  bigParam?: string;
  tags?: string[];
  displayOrder?: number;
}) => {
  return http.request<{
    success: boolean;
    message: string;
    code: number;
    data: {
      successCount: number;
      failCount: number;
      skipCount: number;
      total: number;
      errors?: Array<{ url: string; reason: string }>;
      duplicates?: string[];
    };
  }>("post", baseUrlApi("albums/batch-import"), { data });
};

// 获取公共相册图片列表
export const publicWallpapert = (params: any) => {
  const requestUrl = getDynamicApiUrl("public/albums");

  console.log(`请求公共相册图片列表: ${requestUrl}`, params);
  // 执行请求
  return http.request<Result>("get", requestUrl, {
    params
  });
};

// 更新相册图片统计信息 (浏览量、下载量等)
export const updateWallpaperStat = (params: { id: string; type: string }) => {
  const requestUrl = getDynamicApiUrl(`public/stat/${params.id}`);

  return http.request<Result>("put", requestUrl, {
    params: {
      type: params.type
    }
  });
};

// 获取公开的相册分类列表
export const getPublicAlbumCategories = () => {
  const requestUrl = getDynamicApiUrl("public/album-categories");

  console.log(`请求公开相册分类列表: ${requestUrl}`);
  return http.request<{
    success: boolean;
    data: Array<{
      id: number;
      name: string;
      description?: string;
      coverImage?: string;
      displayOrder?: number;
    }>;
    code: number;
  }>("get", requestUrl);
};
