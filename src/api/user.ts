import { http } from "@/utils/http";
import { baseUrlApi } from "@/utils/http/config";

/**
 * @description 用户组的设置信息
 */
export type UserSettings = {
  source_batch: number;
  policy_ordering: number[];
  redirected_source: boolean;
};

/**
 * @description 用户的角色组信息
 */
export type UserGroup = {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  description: string;
  permissions: number[];
  max_storage: number;
  settings: UserSettings;
};

/**
 * @description 完整的用户信息
 */
export type UserInfo = {
  id: string;
  created_at: string;
  updated_at: string;
  userId?: string;
  username: string;
  nickname: string;
  avatar: string;
  email: string;
  website: string;
  lastLoginAt: string;
  userGroupID: number;
  userGroup: UserGroup;
  status: number;
};

/**
_@description 登录成功后，data字段的完整类型_
 */
export type LoginResultData = {
  /** 用于API认证的访问令牌 */
  accessToken: string;
  /** accessToken 的过期时间戳 (毫秒) */
  expires: number;
  /** 用于刷新 accessToken 的令牌 */
  refreshToken: string;
  /** 当前用户的角色（用户组id） */
  roles: string[];
  /** 包含所有详细信息的用户对象 */
  userInfo: UserInfo;
};

/**
 * @description 登录接口的完整响应类型
 */
export type UserResult = {
  code: number;
  message: string;
  data: LoginResultData;
};

/**
 * @description 刷新Token接口的data字段类型
 */
export type RefreshTokenData = {
  /** 新的 accessToken */
  accessToken: string;
  /** 新的过期时间戳 (毫秒) */
  expires: number;
};

/**
 * @description 刷新Token接口的完整响应类型
 */
export type RefreshTokenResult = {
  code: number;
  data: RefreshTokenData;
};

export type RegisterUserResult = {
  code: number;
  data: {
    activation_required: boolean;
  };
  message?: string;
};

export type CheckEmailExistsResult = {
  code: number;
  data: {
    exists: boolean;
  };
  message?: string;
};

/**
 * @description 用户注册时需要提交的数据类型
 */
export type RegisterData = {
  email: string;
  password: string;
  repeat_password: string;
};

/** 登录 */
export const getLogin = (data?: object) => {
  return http.request<UserResult>("post", baseUrlApi("auth/login"), { data });
};

/** 刷新`token` */
export const refreshTokenApi = (data?: object) => {
  return http.request<RefreshTokenResult>(
    "post",
    baseUrlApi("auth/refresh-token"),
    { data }
  );
};

/** 检查邮箱是否存在 */
export const checkEmailExistsApi = (email: string) => {
  return http.request<CheckEmailExistsResult>(
    "get",
    baseUrlApi("auth/check-email"),
    {
      params: { email }
    }
  );
};

/** 注册用户 */
export const registerUserApi = (data: RegisterData) => {
  return http.request<RegisterUserResult>("post", baseUrlApi("auth/register"), {
    data
  });
};

/**
 * @description 获取用户信息响应类型
 */
export type GetUserInfoResult = {
  code: number;
  message: string;
  data: UserInfo;
};

/** 获取当前登录用户信息 */
export const getUserInfo = () => {
  return http.request<GetUserInfoResult>("get", baseUrlApi("user/info"));
};
