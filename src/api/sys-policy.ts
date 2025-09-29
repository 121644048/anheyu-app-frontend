/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-06-24 19:24:57
 * @LastEditTime: 2025-07-15 19:14:38
 * @LastEditors: 安知鱼
 */
import { http } from "@/utils/http";
import { baseUrlApi } from "@/utils/http/config";

/** 通用的后端响应结果类型 */
export interface Result<T> {
  code: number;
  message: string;
  data: T;
}

/** 存储策略的数据结构 */
export interface StoragePolicy {
  id: number;
  created_at: string;
  updated_at: string;
  name: string;
  type: "local" | "onedrive" | "tencent_cos" | "aliyun_oss" | "aws_s3";
  server?: string;
  bucket_name?: string;
  is_private: boolean;
  access_key?: string;
  secret_key?: string;
  max_size: number;
  base_path?: string;
  virtual_path?: string;
  flag?: string;

  settings?: {
    chunk_size?: number;
    drive_type?: "default" | "sharepoint";
    drive_id?: string;
    // 云存储相关配置
    upload_method?: "client";
    cdn_domain?: string;
    source_auth?: boolean;
    custom_proxy?: boolean;
    // AWS S3 相关配置
    force_path_style?: boolean;
    endpoint_url?: string;
  };
}

/** 列表请求的响应数据结构 */
export interface PolicyListResponse {
  list: StoragePolicy[];
  total: number;
}

/** 列表请求的参数结构 */
export interface PolicyListParams {
  page: number;
  pageSize: number;
}

/** 列表请求的参数结构 */
export interface PolicyListParams {
  page: number;
  pageSize: number;
}
// 获取存储策略列表
export const getPolicyList = (params: PolicyListParams) => {
  return http.request<Result<PolicyListResponse>>(
    "get",
    baseUrlApi("policies"),
    {
      params
    }
  );
};

// 创建存储策略
export const createPolicy = (data: Partial<StoragePolicy>) => {
  return http.request<Result<StoragePolicy>>("post", baseUrlApi("policies"), {
    data
  });
};

// 更新存储策略
export const updatePolicy = (data: Partial<StoragePolicy>) => {
  return http.request<Result<StoragePolicy>>(
    "put",
    baseUrlApi(`policies/${data.id}`),
    {
      data
    }
  );
};

// 删除存储策略
export const deletePolicy = (id: number) => {
  return http.request<Result<null>>("delete", baseUrlApi(`policies/${id}`));
};

// 根据 ID 获取单个存储策略
export const getPolicyById = (id: string) => {
  return http.request<Result<StoragePolicy>>(
    "get",
    baseUrlApi(`policies/${id}`)
  );
};

/**
 * @description 为策略获取微软授权链接
 * @param id 策略ID
 */
export const getOneDriveAuthUrl = (id: number | string) => {
  return http.request<Result<{ url: string }>>(
    "get",
    baseUrlApi(`policies/connect/onedrive/${id}`)
  );
};

/**
 * @description 完成 OneDrive 授权流程
 * @param data 包含 code 和 state 的对象
 */
export const completeOneDriveAuth = (data: { code: string; state: string }) => {
  return http.request<Result<null>>(
    "post",
    baseUrlApi("policies/authorize/onedrive"),
    {
      data
    }
  );
};
