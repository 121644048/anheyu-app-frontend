/*
 * @Description: 用户管理类型定义
 * @Author: 安知鱼
 * @Date: 2025-10-03 00:00:00
 * @LastEditTime: 2025-10-04 02:36:58
 * @LastEditors: 安知鱼
 */

/**
 * @description 用户组信息
 */
export type UserGroup = {
  id: string;
  name: string;
  description: string;
};

// 用户组列表（用于下拉选择）
export type UserGroupOption = {
  id: string;
  name: string;
  description: string;
};

/**
 * @description 管理员用户列表项
 */
export type AdminUser = {
  id: string;
  created_at: string;
  updated_at: string;
  username: string;
  nickname: string;
  avatar: string;
  email: string;
  website: string;
  lastLoginAt?: string;
  userGroupID: string;
  userGroup: UserGroup;
  status: number;
};

/**
 * @description 用户查询参数
 */
export type UserQuery = {
  page: number;
  pageSize: number;
  keyword?: string;
  status?: number;
  groupID?: number;
  startTime?: string;
  endTime?: string;
};

/**
 * @description 用户列表响应
 */
export type UserListResult = {
  users: AdminUser[];
  total: number;
  page: number;
  size: number;
};

/**
 * @description 创建用户参数
 */
export type CreateUserData = {
  username: string;
  password: string;
  email: string;
  nickname?: string;
  avatar?: string;
  website?: string;
  userGroupID: string;
  status?: number;
};

/**
 * @description 更新用户参数
 */
export type UpdateUserData = {
  username?: string;
  email?: string;
  nickname?: string;
  avatar?: string;
  website?: string;
  userGroupID?: string;
  status?: number;
};

/**
 * @description 重置密码参数
 */
export type ResetPasswordData = {
  newPassword: string;
};

/**
 * @description 更新用户状态参数
 */
export type UpdateUserStatusData = {
  status: number;
};
