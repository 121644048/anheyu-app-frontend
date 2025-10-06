/*
 * @Description: 用户管理表单验证规则
 * @Author: 安知鱼
 * @Date: 2025-10-03 00:00:00
 * @LastEditTime: 2025-10-04 02:37:26
 * @LastEditors: 安知鱼
 */

import { reactive } from "vue";
import type { FormRules } from "element-plus";

/** 用户表单验证规则 */
export const formRules = reactive(<FormRules>{
  username: [
    { required: true, message: "用户名为必填项", trigger: "blur" },
    {
      min: 3,
      max: 20,
      message: "用户名长度应在 3 到 20 个字符",
      trigger: "blur"
    }
  ],
  email: [
    { required: true, message: "邮箱为必填项", trigger: "blur" },
    {
      type: "email",
      message: "请输入正确的邮箱地址",
      trigger: ["blur", "change"]
    }
  ],
  password: [
    { required: true, message: "密码为必填项", trigger: "blur" },
    { min: 6, max: 20, message: "密码长度应在 6 到 20 个字符", trigger: "blur" }
  ],
  nickname: [
    { max: 50, message: "昵称长度不能超过 50 个字符", trigger: "blur" }
  ],
  website: [{ type: "url", message: "请输入正确的网址格式", trigger: "blur" }],
  userGroupID: [{ required: true, message: "请选择用户组", trigger: "change" }]
});

/** 重置密码表单验证规则 */
export const resetPasswordRules = reactive(<FormRules>{
  password: [
    { required: true, message: "新密码为必填项", trigger: "blur" },
    { min: 6, max: 20, message: "密码长度应在 6 到 20 个字符", trigger: "blur" }
  ]
});
