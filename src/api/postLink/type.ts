/*
 * @Description: 友链相关类型定义
 * @Author: 安知鱼
 * @Date: 2025-08-18 16:10:00
 * @LastEditTime: 2025-09-04 13:53:02
 * @LastEditors: 安知鱼
 */

/** 通用响应结构 */
export interface BaseResponse<T> {
  code: number;
  message: string;
  data: T;
}

// --- 核心数据模型 ---

/** 友链标签 */
export interface LinkTag {
  id: number;
  name: string;
  color: string;
}

/** 友链分类 */
export interface LinkCategory {
  id: number;
  name: string;
  style: "card" | "list";
  description: string;
}

/** 友链状态 */
export type LinkStatus = "PENDING" | "APPROVED" | "REJECTED" | "INVALID"; // 根据文档，增加 INVALID 状态

/** 友链信息对象 (DTO) */
export interface LinkItem {
  id: number;
  name: string;
  url: string;
  logo: string;
  description: string;
  status: LinkStatus;
  siteshot: string;
  sort_order: number;
  skip_health_check: boolean;
  category: LinkCategory | null;
  tag: LinkTag | null;
}

// --- API 请求体类型 (Request Body) ---

/** 申请友链 */
export interface ApplyLinkRequest {
  name: string;
  url: string;
  logo?: string;
  description?: string;
  siteshot?: string;
}

/** [后台] 创建友链 */
export interface CreateLinkRequest {
  name: string;
  url: string;
  logo: string;
  description: string;
  siteshot: string;
  category_id: number;
  tag_id: number | null; // 改为单个标签，可选
  status: LinkStatus;
  sort_order: number;
  skip_health_check: boolean;
}

/** [后台] 更新友链 */
export type UpdateLinkRequest = CreateLinkRequest;

/** [后台] 审核友链 */
export interface ReviewLinkRequest {
  status: "APPROVED" | "REJECTED";
  siteshot?: string;
}

/** [后台] 创建友链分类 */
export interface CreateCategoryRequest {
  name: string;
  style: "card" | "list";
  description?: string;
}

/** [后台] 更新友链分类 */
export type UpdateCategoryRequest = CreateCategoryRequest;

/** [后台] 创建友链标签 */
export interface CreateTagRequest {
  name: string;
  color?: string;
}

/** [后台] 更新友链标签 */
export type UpdateTagRequest = CreateTagRequest;

// --- API 请求参数类型 (Query Params) ---

/** 获取公开友链列表的查询参数 */
export interface GetPublicLinksParams {
  page?: number;
  pageSize?: number;
  category_id?: number;
}

/** [后台] 获取友链列表的查询参数 */
export interface GetAdminLinksParams {
  page?: number;
  pageSize?: number;
  name?: string;
  url?: string;
  description?: string;
  status?: LinkStatus;
  category_id?: number;
  tag_id?: number;
}

/** 获取随机友链的查询参数 */
export interface GetRandomLinksParams {
  num?: number;
}

// --- API 响应数据类型 ---

/** 分页友链列表响应 */
export interface PublicLinkListResponse {
  list: LinkItem[];
  total: number;
  page: number;
  pageSize: number;
}

// --- 导入功能相关类型 ---

/** 导入友链的单个数据项 */
export interface ImportLinkItem {
  name: string;
  url: string;
  logo?: string;
  description?: string;
  siteshot?: string;
  category_name?: string; // 分类名称
  tag_name?: string; // 标签名称
  status?: LinkStatus; // 状态，默认为 PENDING
}

/** [后台] 批量导入友链的请求 */
export interface ImportLinksRequest {
  links: ImportLinkItem[];
  skip_duplicates?: boolean; // 是否跳过重复的友链（基于URL判断）
  create_categories?: boolean; // 是否自动创建不存在的分类
  create_tags?: boolean; // 是否自动创建不存在的标签
  default_category_id?: number; // 如果分类不存在且不允许创建时使用的默认分类ID
}

/** 导入失败的友链信息 */
export interface ImportLinkFailure {
  link: ImportLinkItem;
  reason: string;
}

/** 跳过的友链信息 */
export interface ImportLinkSkipped {
  link: ImportLinkItem;
  reason: string;
}

/** 批量导入友链的响应 */
export interface ImportLinksResponse {
  total: number; // 总共尝试导入的数量
  success: number; // 成功导入的数量
  failed: number; // 失败的数量
  skipped: number; // 跳过的数量（重复）
  success_list: LinkItem[]; // 成功导入的友链列表
  failed_list: ImportLinkFailure[]; // 失败的友链及原因
  skipped_list: ImportLinkSkipped[]; // 跳过的友链及原因
}

// --- 友链健康检查相关类型 ---

/** 友链健康检查结果 */
export interface LinkHealthCheckResult {
  total: number; // 总共检查的友链数量
  healthy: number; // 健康的友链数量
  unhealthy: number; // 失联的友链数量
  unhealthy_ids: number[]; // 失联的友链ID列表
}

/** 友链健康检查状态响应 */
export interface LinkHealthCheckResponse {
  is_running: boolean; // 是否正在运行
  start_time?: string; // 开始时间
  end_time?: string; // 结束时间
  result?: LinkHealthCheckResult; // 检查结果
  error?: string; // 错误信息
}

// --- 友链排序相关类型 ---

/** 单个友链排序项 */
export interface LinkSortItem {
  id: number;
  sort_order: number;
}

/** 批量更新友链排序请求 */
export interface BatchUpdateLinkSortRequest {
  items: LinkSortItem[];
}
