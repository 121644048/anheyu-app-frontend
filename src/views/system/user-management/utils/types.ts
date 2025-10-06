/*
 * @Description: 用户管理类型定义
 * @Author: 安知鱼
 * @Date: 2025-10-03 00:00:00
 * @LastEditTime: 2025-10-03 00:00:00
 * @LastEditors: 安知鱼
 */

import type { AdminUser, UserGroupOption } from "@/api/user-management/type";

export interface FormItemProps extends Partial<AdminUser> {
  title?: string;
  password?: string;
}

export interface FormProps {
  formInline: FormItemProps;
  userGroups?: UserGroupOption[];
}
