<!--
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-06-21 18:06:37
 * @LastEditTime: 2025-10-06 23:30:24
 * @LastEditors: 安知鱼
-->
<template>
  <h3>图标</h3>

  <el-form-item label="LOGO">
    <div class="logo-inputs">
      <div class="logo-input-item">
        <el-input v-model="formData.logoDay" placeholder="日间模式 LOGO 地址">
          <template #prepend>日间模式</template>
        </el-input>
      </div>
      <div class="logo-input-item">
        <el-input v-model="formData.logoNight" placeholder="黑暗模式 LOGO 地址">
          <template #prepend>黑暗模式</template>
        </el-input>
      </div>
    </div>
    <div class="w-full form-item-help">
      LOGO 图像的地址，用于在左上角展示；请分别提供黑暗模式和日间模式下不同的
      LOGO。
    </div>

    <div class="flex">
      <el-image
        v-if="formData.logoDay"
        :src="formData.logoDay"
        fit="contain"
        class="bg-[var(--anzhiyu-card-bg-grey)] max-w-44 max-h-12 rounded-lg p-2 mt-2"
      />
      <el-image
        v-if="formData.logoNight"
        :src="formData.logoNight"
        fit="contain"
        class="w-full p-2 mt-2 ml-4 bg-black rounded-lg max-w-44 max-h-12"
      />
    </div>
  </el-form-item>

  <el-form-item label="小图标 (Favicon)">
    <div class="w-full">
      <el-input v-model="formData.favicon" placeholder="请输入 .ico 图标地址" />
      <div class="form-item-help">扩展名为 ico 的小图标地址。</div>
    </div>

    <div class="flex">
      <el-image
        v-if="formData.favicon"
        :src="formData.favicon"
        fit="contain"
        class="bg-[var(--anzhiyu-card-bg-grey)] max-w-44 max-h-12 rounded-lg p-2 mt-2"
      />
    </div>
  </el-form-item>

  <el-form-item label="中图标 (PWA)">
    <div class="w-full">
      <el-input
        v-model="formData.iconMedium"
        placeholder="请输入 192x192 的 PNG 图标地址"
      />
      <div class="form-item-help">192x192 的中等图标地址，png 格式。</div>
    </div>

    <div class="flex">
      <el-image
        v-if="formData.iconMedium"
        :src="formData.iconMedium"
        fit="contain"
        class="bg-[var(--anzhiyu-card-bg-grey)] max-w-[192px] max-h-[192px] rounded-lg p-2 mt-2"
      />
    </div>
  </el-form-item>

  <el-form-item label="大图标 (PWA)">
    <div class="w-full">
      <el-input
        v-model="formData.iconLarge"
        placeholder="请输入 512x512 的 PNG 图标地址"
      />
      <div class="form-item-help">512x512 的大图标地址，png 格式。</div>
    </div>

    <div class="flex">
      <el-image
        v-if="formData.iconLarge"
        :src="formData.iconLarge"
        fit="contain"
        class="bg-[var(--anzhiyu-card-bg-grey)] max-w-[512px] max-h-[512px] rounded-lg p-2 mt-2"
      />
    </div>
  </el-form-item>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { SiteInfo } from "../type";

const props = defineProps<{
  modelValue: SiteInfo;
}>();

const emit = defineEmits(["update:modelValue"]);

// 使用 computed 来实现 props 和本地数据状态的双向绑定
const formData = computed({
  get: () => props.modelValue,
  set: value => emit("update:modelValue", value)
});
</script>

<style scoped lang="scss">
.el-form-item {
  margin-bottom: 24px;
}

.form-item-help {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.5;
  color: #909399;
}

.el-divider {
  margin: 40px 0 28px;

  h3 {
    margin: 0;
    color: #606266;
  }
}

.el-image {
  border: var(--style-border);
}

.logo-inputs {
  width: 100%;

  .logo-input-item {
    &:first-child {
      margin-bottom: 10px;
    }
  }
}
</style>
