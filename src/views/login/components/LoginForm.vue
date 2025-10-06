<!--
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-06-18 14:11:34
 * @LastEditTime: 2025-06-20 00:20:54
 * @LastEditors: 安知鱼
-->
<script setup lang="ts">
import { ref } from "vue";
import type { ElInput } from "element-plus";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import LockFill from "@iconify-icons/ri/lock-password-fill";
import ArrowLeftSLine from "@iconify-icons/ri/arrow-left-s-line";

defineProps({ loading: Boolean, email: String, password: String });
const emit = defineEmits([
  "submit",
  "goBack",
  "forgotPassword",
  "update:password"
]);

const passwordInputRef = ref<InstanceType<typeof ElInput>>();
const iconMap = {
  lock: useRenderIcon(LockFill),
  back: useRenderIcon(ArrowLeftSLine)
};

defineExpose({ focus: () => passwordInputRef.value?.focus() });
</script>

<template>
  <div>
    <h2 class="text-xl font-semibold text-center">请输入密码</h2>
    <p class="mt-2 text-sm text-center text-gray-500">
      请输入账号 {{ email }} 的密码
    </p>
    <div class="mt-6">
      <el-form-item prop="password">
        <el-input
          ref="passwordInputRef"
          :model-value="password"
          type="password"
          show-password
          placeholder="密码"
          :prefix-icon="iconMap.lock"
          autocomplete="current-password"
          @update:model-value="emit('update:password', $event)"
        />
      </el-form-item>
      <div class="text-sm text-right">
        <a
          href="#"
          class="text-blue-600 hover:text-blue-500"
          @click.prevent="emit('forgotPassword')"
          >忘记密码？
        </a>
      </div>
      <el-form-item class="mt-4">
        <el-button
          v-ripple
          class="w-full"
          type="primary"
          :loading="loading"
          @click="emit('submit')"
          >登录</el-button
        >
      </el-form-item>
      <div class="mt-4">
        <a
          href="#"
          class="flex items-center justify-center text-sm text-blue-600 hover:text-blue-500"
          @click.prevent="emit('goBack')"
        >
          <component :is="iconMap.back" class="mr-1" /> 上一步
        </a>
      </div>
    </div>
  </div>
</template>
