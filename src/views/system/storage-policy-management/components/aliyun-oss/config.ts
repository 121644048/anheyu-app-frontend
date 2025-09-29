/*
 * @Description: 阿里云OSS存储策略配置
 * @Author: 安知鱼
 * @Date: 2025-09-28 12:00:00
 * @LastEditTime: 2025-09-28 15:30:00
 * @LastEditors: 安知鱼
 */

import type { FormRules } from "element-plus";

// 阿里云OSS编辑表单验证规则
export const aliyunOssRules: FormRules = {
  bucket_name: [
    { required: true, message: "存储桶名称不能为空", trigger: "blur" }
  ],
  server: [{ required: true, message: "访问域名不能为空", trigger: "blur" }],
  access_key: [
    { required: true, message: "AccessKey ID 不能为空", trigger: "blur" }
  ],
  secret_key: [
    { required: true, message: "AccessKey Secret 不能为空", trigger: "blur" }
  ]
};
