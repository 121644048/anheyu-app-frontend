/*
 * @Description: AWS S3存储策略配置
 * @Author: 安知鱼
 * @Date: 2025-09-28 12:00:00
 * @LastEditTime: 2025-09-28 15:30:00
 * @LastEditors: 安知鱼
 */

import type { FormRules } from "element-plus";

// AWS S3编辑表单验证规则
export const awsS3Rules: FormRules = {
  bucket_name: [
    { required: true, message: "存储桶名称不能为空", trigger: "blur" }
  ],
  server: [
    { required: true, message: "Endpoint URL不能为空", trigger: "blur" }
  ],
  access_key: [
    { required: true, message: "Access Key ID 不能为空", trigger: "blur" }
  ],
  secret_key: [
    { required: true, message: "Secret Access Key 不能为空", trigger: "blur" }
  ]
};
