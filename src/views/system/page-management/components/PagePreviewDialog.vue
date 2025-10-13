<template>
  <el-dialog
    v-model="dialogVisible"
    :title="`预览 - ${pageData?.title || '页面'}`"
    width="80%"
    :close-on-click-modal="false"
    append-to-body
    @close="handleClose"
  >
    <div v-if="pageData" class="preview-container">
      <div class="preview-header">
        <div class="page-info">
          <h3>{{ pageData.title }}</h3>
          <p class="path">{{ pageData.path }}</p>
          <p class="description">{{ pageData.description || "暂无描述" }}</p>
        </div>
        <div class="page-meta">
          <el-tag :type="pageData.is_published ? 'success' : 'info'">
            {{ pageData.is_published ? "已发布" : "未发布" }}
          </el-tag>
          <span class="sort">排序: {{ pageData.sort }}</span>
        </div>
      </div>

      <div class="preview-content" v-html="pageData.content" />
    </div>

    <div v-else class="no-data">
      <el-empty description="暂无页面数据" />
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
        <el-button type="primary" @click="handleOpenInNewTab">
          在新标签页中打开
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { PageData } from "@/api/page-management";

// Props
interface Props {
  visible: boolean;
  pageData?: PageData | null;
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  pageData: null
});

// Emits
const emit = defineEmits<{
  "update:visible": [value: boolean];
}>();

// 计算属性
const dialogVisible = computed({
  get: () => props.visible,
  set: value => emit("update:visible", value)
});

// 关闭对话框
const handleClose = () => {
  dialogVisible.value = false;
};

// 在新标签页中打开
const handleOpenInNewTab = () => {
  if (props.pageData) {
    const url = window.location.origin + props.pageData.path;
    window.open(url, "_blank");
  }
};
</script>

<style scoped lang="scss">
.preview-container {
  .preview-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 20px;
    padding: 16px;
    background-color: var(--el-bg-color-page);
    border-radius: 8px;
    border: 1px solid var(--el-border-color-light);

    .page-info {
      flex: 1;

      h3 {
        margin: 0 0 8px 0;
        font-size: 18px;
        font-weight: 600;
        color: var(--el-text-color-primary);
      }

      .path {
        margin: 0 0 4px 0;
        font-size: 14px;
        color: var(--el-text-color-regular);
        font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
      }

      .description {
        margin: 0;
        font-size: 14px;
        color: var(--el-text-color-secondary);
      }
    }

    .page-meta {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 8px;

      .sort {
        font-size: 12px;
        color: var(--el-text-color-secondary);
      }
    }
  }

  .preview-content {
    max-width: 100%;
    overflow-x: auto;

    // 样式化HTML内容
    :deep(h1) {
      font-size: 2.5rem;
      font-weight: bold;
      margin-bottom: 1.5rem;
      color: var(--el-text-color-primary);
    }

    :deep(h2) {
      font-size: 2rem;
      font-weight: bold;
      margin: 2rem 0 1rem 0;
      color: var(--el-text-color-primary);
    }

    :deep(h3) {
      font-size: 1.5rem;
      font-weight: bold;
      margin: 1.5rem 0 0.75rem 0;
      color: var(--el-text-color-primary);
    }

    :deep(p) {
      margin-bottom: 1rem;
      line-height: 1.6;
      color: var(--el-text-color-regular);
    }

    :deep(ul),
    :deep(ol) {
      margin: 1rem 0;
      padding-left: 2rem;

      li {
        margin-bottom: 0.5rem;
        line-height: 1.6;
        color: var(--el-text-color-regular);
      }
    }

    :deep(strong) {
      font-weight: bold;
      color: var(--el-text-color-primary);
    }

    :deep(a) {
      color: var(--el-color-primary);
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }

    :deep(blockquote) {
      margin: 1rem 0;
      padding: 1rem;
      background-color: var(--el-bg-color-page);
      color: var(--el-text-color-regular);
    }

    :deep(code) {
      background-color: var(--el-bg-color-page);
      padding: 0.2rem 0.4rem;
      border-radius: 4px;
      font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
      font-size: 0.9em;
    }

    :deep(pre) {
      background-color: var(--el-bg-color-page);
      padding: 1rem;
      border-radius: 8px;
      overflow-x: auto;
      margin: 1rem 0;

      code {
        background: none;
        padding: 0;
      }
    }

    :deep(table) {
      width: 100%;
      border-collapse: collapse;
      margin: 1rem 0;

      th,
      td {
        padding: 8px 12px;
        border: 1px solid var(--el-border-color);
        text-align: left;
      }

      th {
        background-color: var(--el-bg-color-page);
        font-weight: bold;
      }
    }

    :deep(img) {
      max-width: 100%;
      height: auto;
      border-radius: 4px;
    }
  }
}

.no-data {
  padding: 40px 0;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
