/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-08-31 21:22:08
 * @LastEditTime: 2025-08-31 21:42:05
 * @LastEditors: 安知鱼
 */
import { http } from "@/utils/http";
import { baseUrlApi } from "@/utils/http/config";

// 页面管理接口类型
export interface PageData {
  id: number;
  title: string;
  path: string;
  content: string;
  markdown_content: string;
  description: string;
  is_published: boolean;
  show_comment: boolean;
  sort: number;
  created_at: string;
  updated_at: string;
}

export interface CreatePageData {
  title: string;
  path: string;
  content: string;
  markdown_content?: string;
  description?: string;
  is_published?: boolean;
  show_comment?: boolean;
  sort?: number;
}

export interface UpdatePageData {
  title?: string;
  path?: string;
  content?: string;
  markdown_content?: string;
  description?: string;
  is_published?: boolean;
  show_comment?: boolean;
  sort?: number;
}

export interface PageListParams {
  page?: number;
  page_size?: number;
  search?: string;
  is_published?: boolean;
}

// 获取页面列表
export function getPageList(params: PageListParams) {
  return http.get(baseUrlApi("pages"), params);
}

// 获取页面详情
export function getPageDetail(id: string) {
  return http.get(baseUrlApi(`pages/${id}`));
}

// 创建页面
export function createPage(data: CreatePageData) {
  return http.post(baseUrlApi("pages"), data);
}

// 更新页面
export function updatePage(id: string, data: UpdatePageData) {
  return http.request("put", baseUrlApi(`pages/${id}`), { data });
}

// 删除页面
export function deletePage(id: string) {
  return http.request("delete", baseUrlApi(`pages/${id}`));
}

// 初始化默认页面
export function initializeDefaultPages() {
  return http.post(baseUrlApi("pages/initialize"));
}
