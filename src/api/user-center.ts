/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-10-03 19:29:54
 * @LastEditTime: 2025-10-03 22:23:08
 * @LastEditors: 安知鱼
 */

import { http } from "@/utils/http";
import { baseUrlApi } from "@/utils/http/config";

/**
 * @description 更新用户信息的请求参数
 */
export type UpdateUserProfileRequest = {
  nickname?: string;
  website?: string;
};

/**
 * @description 修改密码的请求参数
 */
export type UpdatePasswordRequest = {
  oldPassword: string;
  newPassword: string;
};

/**
 * @description 通用响应类型
 */
export type CommonResponse = {
  code: number;
  message: string;
  data?: any;
};

/**
 * 更新用户信息（昵称、网站等）
 * */
export const updateUserProfile = (data: UpdateUserProfileRequest) => {
  return http.request<CommonResponse>("put", baseUrlApi("user/profile"), {
    data
  });
};

/**
 * 修改用户密码
 */
export const updateUserPassword = (data: UpdatePasswordRequest) => {
  return http.request<CommonResponse>(
    "post",
    baseUrlApi("user/update-password"),
    { data }
  );
};
