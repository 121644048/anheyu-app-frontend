/*
 * @Description: 友链功能所有API
 * @Author: 安知鱼
 * @Date: 2025-08-18 16:06:49
 * @LastEditTime: 2025-09-29 17:21:26
 * @LastEditors: 安知鱼
 */
import { http } from "@/utils/http";
import { baseUrlApi } from "@/utils/http/config";
import type {
  ApplyLinkRequest,
  BaseResponse,
  GetAdminLinksParams,
  GetPublicLinksParams,
  LinkCategory,
  LinkItem,
  PublicLinkListResponse,
  CreateLinkRequest,
  UpdateLinkRequest,
  ReviewLinkRequest,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  LinkTag,
  CreateTagRequest,
  UpdateTagRequest,
  GetRandomLinksParams,
  ImportLinksRequest,
  ImportLinksResponse,
  LinkHealthCheckResponse,
  BatchUpdateLinkSortRequest
} from "./type";

// ------------------ 前台公开接口 ------------------

/** @description 随机获取指定数量的友链 */
export const getRandomLinks = (
  params?: GetRandomLinksParams
): Promise<BaseResponse<LinkItem[]>> => {
  return http.request<BaseResponse<LinkItem[]>>(
    "get",
    baseUrlApi("public/links/random"),
    { params }
  );
};

/** @description 获取所有公开的友链分类 */
export const getPublicLinkCategories = (): Promise<
  BaseResponse<LinkCategory[]>
> => {
  return http.request<BaseResponse<LinkCategory[]>>(
    "get",
    baseUrlApi("public/link-categories")
  );
};

/** @description 获取公开友链列表（支持分页和按分类筛选） */
export const getPublicLinkList = (
  params?: GetPublicLinksParams
): Promise<BaseResponse<PublicLinkListResponse>> => {
  return http.request<BaseResponse<PublicLinkListResponse>>(
    "get",
    baseUrlApi("public/links"),
    { params }
  );
};

/** @description 申请友链 */
export const applyLink = (
  data: ApplyLinkRequest
): Promise<BaseResponse<null>> => {
  return http.request<BaseResponse<null>>("post", baseUrlApi("public/links"), {
    data
  });
};

// ------------------ 后台管理接口 ------------------

// --- 友链管理 ---
/** @description [后台] 管理员创建友链 */
export const createLink = (
  data: CreateLinkRequest
): Promise<BaseResponse<LinkItem>> => {
  return http.request<BaseResponse<LinkItem>>("post", baseUrlApi("links"), {
    data
  });
};

/** @description [后台] 管理员获取友链列表（支持筛选和分页） */
export const getAdminLinkList = (
  params?: GetAdminLinksParams
): Promise<BaseResponse<PublicLinkListResponse>> => {
  return http.request<BaseResponse<PublicLinkListResponse>>(
    "get",
    baseUrlApi("links"),
    { params }
  );
};

/** @description [后台] 管理员更新友链 */
export const updateLink = (
  id: number,
  data: UpdateLinkRequest
): Promise<BaseResponse<LinkItem>> => {
  return http.request<BaseResponse<LinkItem>>(
    "put",
    baseUrlApi(`links/${id}`),
    { data }
  );
};

/** @description [后台] 管理员删除友链 */
export const deleteLink = (id: number): Promise<BaseResponse<null>> => {
  return http.request<BaseResponse<null>>("delete", baseUrlApi(`links/${id}`));
};

/** @description [后台] 管理员审核友链 */
export const reviewLink = (
  id: number,
  data: ReviewLinkRequest
): Promise<BaseResponse<null>> => {
  return http.request<BaseResponse<null>>(
    "put",
    baseUrlApi(`links/${id}/review`),
    { data }
  );
};

// --- 分类管理 ---
/** @description [后台] 获取所有友链分类 */
export const getLinkCategories = (): Promise<BaseResponse<LinkCategory[]>> => {
  return http.request<BaseResponse<LinkCategory[]>>(
    "get",
    baseUrlApi("links/categories")
  );
};

/** @description [后台] 管理员创建友链分类 */
export const createLinkCategory = (
  data: CreateCategoryRequest
): Promise<BaseResponse<LinkCategory>> => {
  return http.request<BaseResponse<LinkCategory>>(
    "post",
    baseUrlApi("links/categories"),
    { data }
  );
};

/** @description [后台] 管理员更新友链分类  */
export const updateLinkCategory = (
  id: number,
  data: UpdateCategoryRequest
): Promise<BaseResponse<LinkCategory>> => {
  return http.request<BaseResponse<LinkCategory>>(
    "put",
    baseUrlApi(`links/categories/${id}`),
    { data }
  );
};

// --- 标签管理 ---
/** @description [后台] 获取所有友链标签 */
export const getLinkTags = (): Promise<BaseResponse<LinkTag[]>> => {
  return http.request<BaseResponse<LinkTag[]>>("get", baseUrlApi("links/tags"));
};

/** @description [后台] 管理员创建友链标签 */
export const createLinkTag = (
  data: CreateTagRequest
): Promise<BaseResponse<LinkTag>> => {
  return http.request<BaseResponse<LinkTag>>("post", baseUrlApi("links/tags"), {
    data
  });
};

/** @description [后台] 管理员更新友链标签 */
export const updateLinkTag = (
  id: number,
  data: UpdateTagRequest
): Promise<BaseResponse<LinkTag>> => {
  return http.request<BaseResponse<LinkTag>>(
    "put",
    baseUrlApi(`links/tags/${id}`),
    { data }
  );
};

/** @description [后台] 管理员删除友链分类 */
export const deleteLinkCategory = (id: number): Promise<BaseResponse<null>> => {
  return http.request<BaseResponse<null>>(
    "delete",
    baseUrlApi(`links/categories/${id}`)
  );
};

/** @description [后台] 管理员删除友链标签 */
export const deleteLinkTag = (id: number): Promise<BaseResponse<null>> => {
  return http.request<BaseResponse<null>>(
    "delete",
    baseUrlApi(`links/tags/${id}`)
  );
};

/** @description [后台] 批量导入友链 */
export const importLinks = (
  data: ImportLinksRequest
): Promise<BaseResponse<ImportLinksResponse>> => {
  return http.request<BaseResponse<ImportLinksResponse>>(
    "post",
    baseUrlApi("links/import"),
    { data }
  );
};

/** @description [后台] 手动触发友链健康检查 */
export const checkLinksHealth = (): Promise<
  BaseResponse<LinkHealthCheckResponse>
> => {
  return http.request<BaseResponse<LinkHealthCheckResponse>>(
    "post",
    baseUrlApi("links/health-check")
  );
};

/** @description [后台] 获取友链健康检查状态 */
export const getHealthCheckStatus = (): Promise<
  BaseResponse<LinkHealthCheckResponse>
> => {
  return http.request<BaseResponse<LinkHealthCheckResponse>>(
    "get",
    baseUrlApi("links/health-check/status")
  );
};

/** @description [后台] 批量更新友链排序 */
export const batchUpdateLinkSort = (
  data: BatchUpdateLinkSortRequest
): Promise<BaseResponse<null>> => {
  return http.request<BaseResponse<null>>("put", baseUrlApi("links/sort"), {
    data
  });
};
