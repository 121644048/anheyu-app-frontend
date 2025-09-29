<template>
  <el-divider content-position="left">
    <h3>最近评论配置</h3>
  </el-divider>

  <!-- 横幅配置区域 -->
  <div class="banner-config-section">
    <h4 class="section-title">
      <el-icon><Picture /></el-icon>
      横幅配置
    </h4>
    <div class="banner-config-grid">
      <el-form-item label="背景图片">
        <el-input
          :model-value="modelValue.banner.background"
          placeholder="请输入横幅背景图片链接地址"
          clearable
          @update:model-value="updateBannerConfig('background', $event)"
        >
          <template #prepend>
            <el-icon><Link /></el-icon>
          </template>
        </el-input>
        <div class="form-item-help">最近评论页面的横幅背景图片。</div>
      </el-form-item>

      <el-form-item label="标题">
        <el-input
          :model-value="modelValue.banner.title"
          placeholder="请输入横幅标题"
          clearable
          @update:model-value="updateBannerConfig('title', $event)"
        />
        <div class="form-item-help">最近评论页面的横幅标题文字。</div>
      </el-form-item>

      <el-form-item label="描述">
        <el-input
          :model-value="modelValue.banner.description"
          placeholder="请输入横幅描述"
          clearable
          @update:model-value="updateBannerConfig('description', $event)"
        />
        <div class="form-item-help">最近评论页面的横幅描述文字。</div>
      </el-form-item>

      <el-form-item label="提示">
        <el-input
          :model-value="modelValue.banner.tip"
          placeholder="请输入横幅提示文字"
          clearable
          @update:model-value="updateBannerConfig('tip', $event)"
        />
        <div class="form-item-help">最近评论页面的横幅提示文字。</div>
      </el-form-item>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Picture, Link } from "@element-plus/icons-vue";
import type { RecentCommentsSettingsInfo } from "../../../type";

const props = defineProps<{
  modelValue: RecentCommentsSettingsInfo;
}>();

const emit = defineEmits(["update:modelValue"]);

/**
 * @description 更新横幅配置
 * @param key 要更新的字段名
 * @param value 新的值
 */
const updateBannerConfig = (
  key: keyof RecentCommentsSettingsInfo["banner"],
  value: string
) => {
  const newBanner = {
    ...props.modelValue.banner,
    [key]: value
  };

  emit("update:modelValue", {
    ...props.modelValue,
    banner: newBanner
  });
};
</script>

<style scoped lang="scss">
.el-divider {
  margin: 40px 0 28px;

  h3 {
    margin: 0;
    color: #606266;
  }
}

.banner-config-section {
  margin-bottom: 32px;

  .section-title {
    display: flex;
    gap: 8px;
    align-items: center;
    margin: 0 0 20px;
    font-size: 16px;
    font-weight: 600;
    color: #303133;

    .el-icon {
      color: #409eff;
    }
  }

  .banner-config-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 20px;
    max-width: 600px;

    .el-form-item {
      margin-bottom: 0;

      .form-item-help {
        margin-top: 4px;
        font-size: 12px;
        line-height: 1.4;
        color: #909399;
      }
    }
  }
}

@media (width >= 768px) {
  .banner-config-grid {
    grid-template-columns: repeat(2, 1fr) !important;
  }
}
</style>
