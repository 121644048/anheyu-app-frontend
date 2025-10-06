<script setup lang="ts">
import { ref } from "vue";
import ReCol from "@/components/ReCol";
import { formRules } from "./utils/rule";
import { FormProps } from "./utils/types";

const props = withDefaults(defineProps<FormProps>(), {
  formInline: () => ({
    id: "",
    title: "新增",
    username: "",
    email: "",
    password: "",
    nickname: "",
    avatar: "",
    website: "",
    userGroupID: "",
    status: 1
  }),
  userGroups: () => []
});

const ruleFormRef = ref();
const newFormInline = ref(props.formInline);

function getRef() {
  return ruleFormRef.value;
}

defineExpose({ getRef });
</script>

<template>
  <el-form
    ref="ruleFormRef"
    :model="newFormInline"
    :rules="formRules"
    label-width="100px"
  >
    <el-row :gutter="30">
      <re-col :value="12" :xs="24" :sm="24">
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="newFormInline.username"
            clearable
            placeholder="请输入用户名（3-20个字符）"
            :disabled="newFormInline.title === '修改'"
          />
        </el-form-item>
      </re-col>

      <re-col :value="12" :xs="24" :sm="24">
        <el-form-item label="邮箱" prop="email">
          <el-input
            v-model="newFormInline.email"
            clearable
            placeholder="请输入邮箱"
          />
        </el-form-item>
      </re-col>

      <re-col
        v-if="newFormInline.title === '新增'"
        :value="12"
        :xs="24"
        :sm="24"
      >
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="newFormInline.password"
            type="password"
            clearable
            show-password
            placeholder="请输入密码（6-20个字符）"
          />
        </el-form-item>
      </re-col>

      <re-col :value="12" :xs="24" :sm="24">
        <el-form-item label="昵称" prop="nickname">
          <el-input
            v-model="newFormInline.nickname"
            clearable
            placeholder="请输入昵称"
          />
        </el-form-item>
      </re-col>

      <re-col :value="12" :xs="24" :sm="24">
        <el-form-item label="头像URL" prop="avatar">
          <el-input
            v-model="newFormInline.avatar"
            clearable
            placeholder="请输入头像URL"
          />
        </el-form-item>
      </re-col>

      <re-col :value="12" :xs="24" :sm="24">
        <el-form-item label="个人网站" prop="website">
          <el-input
            v-model="newFormInline.website"
            clearable
            placeholder="请输入个人网站URL"
          />
        </el-form-item>
      </re-col>

      <re-col :value="12" :xs="24" :sm="24">
        <el-form-item label="状态" prop="status">
          <el-select
            v-model="newFormInline.status"
            placeholder="请选择状态"
            class="w-full"
          >
            <el-option label="正常" :value="1" />
            <el-option label="未激活" :value="2" />
            <el-option label="已封禁" :value="3" />
          </el-select>
        </el-form-item>
      </re-col>
    </el-row>
  </el-form>
</template>
