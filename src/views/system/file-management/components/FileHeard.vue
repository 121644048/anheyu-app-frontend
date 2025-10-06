<template>
  <div class="flex items-center justify-between w-full file-heard-actions">
    <el-button
      v-ripple
      :icon="useRenderIcon(UploadIcon)"
      type="primary"
      class="new-btn"
      @click="handleNewButtonClick"
    >
      <span class="btn-text">新建</span>
    </el-button>

    <Transition
      name="toolbar-swap"
      mode="out-in"
      :css="false"
      @enter="onToolbarEnter"
      @leave="onToolbarLeave"
    >
      <!-- 使用从 props 传入的 hasSelection -->
      <div
        v-if="hasSelection"
        key="selection-toolbar"
        class="selection-toolbar"
      >
        <el-button-group class="action-group">
          <!-- 通过 emit 发出清空选择的意图 -->
          <el-button
            :icon="Close"
            title="取消选择"
            @click="emit('clear-selection')"
          />
          <!-- 使用从 props 传入的 selectionCountLabel -->
          <el-button class="selection-count" disabled>{{
            selectionCountLabel
          }}</el-button>
        </el-button-group>

        <el-button-group class="ml-2 action-group">
          <!-- 所有的操作都通过 emit 发出 -->
          <el-tooltip content="下载" placement="bottom" :show-arrow="false">
            <el-button :icon="Download" @click="emit('download')" />
          </el-tooltip>
          <el-tooltip content="复制" placement="bottom" :show-arrow="false">
            <el-button :icon="CopyDocument" @click="emit('copy')" />
          </el-tooltip>
          <el-tooltip content="移动" placement="bottom" :show-arrow="false">
            <el-button :icon="Folder" @click="emit('move')" />
          </el-tooltip>

          <!-- 使用从 props 传入的 isSingleSelection -->
          <template v-if="isSingleSelection">
            <el-tooltip content="重命名" placement="bottom" :show-arrow="false">
              <el-button :icon="EditPen" @click="emit('rename')" />
            </el-tooltip>
            <el-tooltip content="分享" placement="bottom" :show-arrow="false">
              <el-button :icon="Share" @click="emit('share')" />
            </el-tooltip>
          </template>

          <el-tooltip content="删除" placement="bottom" :show-arrow="false">
            <el-button type="danger" :icon="Delete" @click="emit('delete')" />
          </el-tooltip>
        </el-button-group>
      </div>
    </Transition>
  </div>
</template>

<script lang="ts" setup>
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import gsap from "gsap";

// 引入所有需要的图标
import UploadIcon from "@iconify-icons/ep/upload";
import {
  Close,
  Download,
  CopyDocument,
  Folder,
  Share,
  Delete,
  EditPen
} from "@element-plus/icons-vue";

// 1. 定义 Props 和 Emits
const props = defineProps<{
  hasSelection: boolean;
  isSingleSelection: boolean;
  selectionCountLabel: string;
}>();

const emit = defineEmits<{
  // 已有的 emits
  (e: "open-new-menu", event: MouseEvent): void;
  (e: "clear-selection"): void;
  (e: "download"): void;
  (e: "copy"): void;
  (e: "move"): void;
  (e: "rename"): void;
  (e: "share"): void;
  (e: "delete"): void;
}>();

const handleNewButtonClick = (event: MouseEvent) => {
  emit("open-new-menu", event);
};

// GSAP 动画钩子
const onToolbarEnter = (el: HTMLElement, done: () => void) => {
  gsap.fromTo(
    el,
    { opacity: 0, y: -15 },
    { opacity: 1, y: 0, duration: 0.3, ease: "power2.out", onComplete: done }
  );
};
const onToolbarLeave = (el: HTMLElement, done: () => void) => {
  gsap.to(el, {
    opacity: 0,
    y: 15,
    duration: 0.2,
    ease: "power2.in",
    onComplete: done
  });
};
</script>

<style scoped lang="scss">
.file-heard-actions {
  display: flex;
  align-items: center;
  height: 40px;
  gap: 8px;

  .new-btn {
    height: 40px;
    border: var(--style-border);
    flex-shrink: 0;

    @media (max-width: 640px) {
      min-width: 40px;
      padding: 0 12px;
    }
  }
}

.selection-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  overflow-x: auto;
  overflow-y: hidden;

  // 隐藏滚动条但保留滚动功能
  &::-webkit-scrollbar {
    display: none;
  }
  -ms-overflow-style: none;
  scrollbar-width: none;

  .action-group {
    display: flex;
    align-items: center;
    overflow: hidden;
    border: 1px solid var(--el-border-color);
    border-radius: var(--el-border-radius-base);
    flex-shrink: 0;

    .el-button {
      border-top: none;
      border-right: none;
      border-bottom: none;
      border-left: 1px solid var(--el-border-color-lighter);
      border-radius: 0;

      &:first-child {
        border-left: none;
      }

      // 移动端优化按钮大小
      @media (max-width: 640px) {
        padding: 8px 10px;
        font-size: 14px;

        :deep(.el-icon) {
          font-size: 16px;
        }
      }
    }
  }

  // 移动端优化
  @media (max-width: 640px) {
    gap: 4px;

    .ml-2 {
      margin-left: 4px !important;
    }
  }
}

.selection-count {
  color: var(--el-text-color-primary) !important;
  cursor: default !important;
  background-color: transparent !important;
  border-left: 1px solid var(--el-border-color-lighter) !important;

  @media (max-width: 640px) {
    font-size: 12px;
    padding: 8px 8px !important;
  }
}
</style>
