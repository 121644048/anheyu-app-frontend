/*
 * @Description: 用户管理 API
 * @Author: 安知鱼
 * @Date: 2025-10-03 00:00:00
 * @LastEditTime: 2025-10-03 00:00:00
 * @LastEditors: 安知鱼
 */

import { http } from "@/utils/http";
import { baseUrlApi } from "@/utils/http/config";
import type {
  UserQuery,
  UserListResult,
  AdminUser,
  CreateUserData,
  UpdateUserData,
  ResetPasswordData,
  UpdateUserStatusData,
  UserGroupOption
} from "./type";

/**
 * @description 获取用户列表
 */
export const getAdminUsers = (params: UserQuery) => {
  return http.request<{
    code: number;
    message: string;
    data: UserListResult;
  }>("get", baseUrlApi("admin/users"), { params });
};

/**
 * @description 获取单个用户详情
 */
export const getAdminUserById = (id: string) => {
  return http.request<{
    code: number;
    message: string;
    data: AdminUser;
  }>("get", baseUrlApi(`admin/users/${id}`));
};

/**
 * @description 创建用户
 */
export const createAdminUser = (data: CreateUserData) => {
  return http.request<{
    code: number;
    message: string;
    data: AdminUser;
  }>("post", baseUrlApi("admin/users"), { data });
};

/**
 * @description 更新用户
 */
export const updateAdminUser = (id: string, data: UpdateUserData) => {
  return http.request<{
    code: number;
    message: string;
    data: AdminUser;
  }>("put", baseUrlApi(`admin/users/${id}`), { data });
};

/**
 * @description 删除用户
 */
export const deleteAdminUser = (id: string) => {
  return http.request<{
    code: number;
    message: string;
  }>("delete", baseUrlApi(`admin/users/${id}`));
};

/**
 * @description 批量删除用户
 */
export const batchDeleteAdminUsers = (ids: string[]) => {
  return Promise.all(ids.map(id => deleteAdminUser(id)));
};

/**
 * @description 重置用户密码
 */
export const resetUserPassword = (id: string, data: ResetPasswordData) => {
  return http.request<{
    code: number;
    message: string;
  }>("post", baseUrlApi(`admin/users/${id}/reset-password`), { data });
};

/**
 * @description 更新用户状态
 */
export const updateUserStatus = (id: string, data: UpdateUserStatusData) => {
  return http.request<{
    code: number;
    message: string;
    data: AdminUser;
  }>("put", baseUrlApi(`admin/users/${id}/status`), { data });
};

/**
 * @description 获取用户组列表
 */
export const getUserGroups = () => {
  return http.request<{
    code: number;
    message: string;
    data: UserGroupOption[];
  }>("get", baseUrlApi("admin/user-groups"));
};
