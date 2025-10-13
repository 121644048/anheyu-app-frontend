/*
 * @Description: 相册分类 API
 * @Author: 安知鱼
 * @Date: 2025-10-12
 */
import { http } from "@/utils/http";
import { baseUrlApi } from "@/utils/http/config";

export type AlbumCategoryDTO = {
  id: number;
  name: string;
  description?: string;
  displayOrder: number;
};

export type CreateAlbumCategoryRequest = {
  name: string;
  description?: string;
  displayOrder?: number;
};

export type UpdateAlbumCategoryRequest = {
  name: string;
  description?: string;
  displayOrder?: number;
};

type Result<T> = {
  success: boolean;
  data: T;
  code: number;
  message?: string;
};

// 获取相册分类列表
export const getAlbumCategoryList = () => {
  return http.request<Result<AlbumCategoryDTO[]>>(
    "get",
    baseUrlApi("album-categories")
  );
};

// 创建相册分类
export const createAlbumCategory = (data: CreateAlbumCategoryRequest) => {
  return http.request<Result<AlbumCategoryDTO>>(
    "post",
    baseUrlApi("album-categories"),
    { data }
  );
};

// 更新相册分类
export const updateAlbumCategory = (
  id: number,
  data: UpdateAlbumCategoryRequest
) => {
  return http.request<Result<AlbumCategoryDTO>>(
    "put",
    baseUrlApi(`album-categories/${id}`),
    { data }
  );
};

// 删除相册分类
export const deleteAlbumCategory = (id: number) => {
  return http.request<Result<null>>(
    "delete",
    baseUrlApi(`album-categories/${id}`)
  );
};

// 获取单个相册分类详情
export const getAlbumCategory = (id: number) => {
  return http.request<Result<AlbumCategoryDTO>>(
    "get",
    baseUrlApi(`album-categories/${id}`)
  );
};
