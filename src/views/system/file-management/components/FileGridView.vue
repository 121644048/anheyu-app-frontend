<template>
  <!-- 1. 监听 @scroll 事件 -->
  <div
    v-loading="loading && !files.length"
    class="file-grid-view"
    data-is-file-container="true"
    @scroll="handleLocalScroll"
  >
    <div
      v-for="file in files"
      :key="file.id"
      class="grid-item"
      :data-id="file.id"
      :data-type="file.type === FileType.Dir ? 'Dir' : 'File'"
      :class="{
        selected: selectedFileIds.has(file.id),
        'is-uploading': file.metadata?.['sys:upload_session_id'],
        'is-disabled': disabledFileIds?.has(file.id)
      }"
      @click="handleItemClick(file, $event)"
      @dblclick="handleItemDblClick(file)"
      @mousedown="handleMouseDown"
      @mouseup="handleMouseUp"
      @mouseleave="handleMouseLeave"
      @contextmenu.prevent.stop="emit('contextmenu', $event, file)"
    >
      <div class="item-icon">
        <FileThumbnail :file="file" />

        <div
          v-if="file.metadata?.['sys:upload_session_id']"
          class="uploading-overlay"
        >
          <el-tooltip
            content="文件上传中..."
            placement="top"
            :show-arrow="false"
          >
            <el-icon class="uploading-indicator">
              <Loading />
            </el-icon>
          </el-tooltip>
        </div>
      </div>
      <div class="item-name">{{ file.name }}</div>
    </div>

    <!-- 加载更多和无更多数据的指示器 -->
    <div v-if="isMoreLoading" class="grid-item-full-width">
      <div class="load-more-indicator">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span>加载中...</span>
      </div>
    </div>

    <div
      v-if="!isMoreLoading && !hasMore && files.length > 0"
      class="grid-item-full-width"
    >
      <div class="no-more-indicator">
        <span>— 没有更多了 —</span>
      </div>
    </div>

    <!-- 空状态 -->
    <el-empty
      v-if="files.length === 0 && !loading && !isMoreLoading"
      description="这里什么都没有"
      class="grid-empty"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, type PropType } from "vue";
import gsap from "gsap";
import { FileItem, FileType } from "@/api/sys-file/type";
import { Loading } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import { extractLogicalPathFromUri } from "@/utils/fileUtils";
import FileThumbnail from "./FileThumbnail.vue";

const props = defineProps({
  files: {
    type: Array as PropType<FileItem[]>,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  },
  selectedFileIds: {
    type: Set as PropType<Set<string>>,
    required: true
  },
  disabledFileIds: {
    type: Set as PropType<Set<string>>,
    default: () => new Set()
  },
  isMoreLoading: {
    type: Boolean,
    default: false
  },
  hasMore: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits<{
  (e: "select-single", fileId: string): void;
  (e: "select-range", fileId: string): void;
  (e: "toggle-selection", fileId: string): void;
  (e: "select-all"): void;
  (e: "navigate-to", path: string): void;
  (e: "scroll-to-load"): void;
  (e: "preview-file", item: FileItem): void;
  (e: "contextmenu", event: MouseEvent, file: FileItem): void;
}>();

// 处理滚动加载
const handleLocalScroll = (event: Event) => {
  const el = event.target as HTMLElement;
  const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 200;
  if (isAtBottom && props.hasMore && !props.isMoreLoading) {
    emit("scroll-to-load");
  }
};

// GSAP 动画效果
const handleMouseDown = (event: MouseEvent) => {
  gsap.to(event.currentTarget as HTMLElement, {
    scale: 0.95,
    duration: 0.15,
    ease: "power2.out"
  });
};

const handleMouseUp = (event: MouseEvent) => {
  gsap.to(event.currentTarget as HTMLElement, {
    scale: 1,
    duration: 0.4,
    ease: "elastic.out(1, 0.5)"
  });
};

const handleMouseLeave = (event: MouseEvent) => {
  gsap.to(event.currentTarget as HTMLElement, {
    scale: 1,
    duration: 0.4,
    ease: "elastic.out(1, 0.5)"
  });
};

// 文件/文件夹点击事件
const handleItemClick = (file: FileItem, event: MouseEvent) => {
  if (props.disabledFileIds?.has(file.id)) return;
  if (file.metadata?.["sys:upload_session_id"]) return;

  if (event.shiftKey) {
    emit("select-range", file.id);
  } else if (event.metaKey || event.ctrlKey) {
    emit("toggle-selection", file.id);
  } else {
    emit("select-single", file.id);
  }
};

// 文件/文件夹双击事件
const handleItemDblClick = (file: FileItem) => {
  if (props.disabledFileIds?.has(file.id)) {
    ElMessage.warning("不能进入正在移动的文件夹。");
    return;
  }
  if (file.metadata?.["sys:upload_session_id"]) return;

  if (file.type === FileType.Dir) {
    const logicalPath = extractLogicalPathFromUri(file.path);
    emit("navigate-to", logicalPath);
  } else if (file.type === FileType.File) {
    emit("preview-file", file);
  }
};

// 键盘事件监听 (Ctrl+A 全选)
const handleKeyDown = (event: KeyboardEvent) => {
  const target = event.target as HTMLElement;
  if (["INPUT", "TEXTAREA"].includes(target.tagName)) return;

  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "a") {
    event.preventDefault();
    emit("select-all");
  }
};

onMounted(() => {
  window.addEventListener("keydown", handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeyDown);
});
</script>

<style scoped>
.file-grid-view {
  position: relative;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 20px;
  place-content: flex-start flex-start;

  /* 关键：让这个容器自身可以滚动 */
  height: 100%;
  padding: 24px;
  overflow-y: auto;
}

.grid-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 16px 8px;
  text-align: center;
  cursor: pointer;
  user-select: none;
  border: 1px solid transparent;
  border-radius: 8px;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    opacity 0.3s ease;
}

.grid-item:hover {
  background-color: #f5f7fa;
}

.grid-item.selected {
  background-color: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary);
}

.grid-item.is-uploading {
  pointer-events: none;
  cursor: not-allowed;
  opacity: 0.5;
}

.grid-item.is-disabled {
  color: #a8abb2;
  cursor: not-allowed;
  opacity: 0.6;
}

.grid-item.is-disabled:hover {
  background-color: transparent;
}

.grid-item.is-disabled .file-icon {
  color: #c0c4cc;
}

.item-icon {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  margin-bottom: 12px;
}

.uploading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background-color: rgb(255 255 255 / 70%);
  backdrop-filter: blur(2px);
  border-radius: 8px;
}

.uploading-indicator {
  font-size: 24px;
  color: var(--el-color-primary);
  animation: spin 1.5s linear infinite;
}

.item-name {
  display: -webkit-box;
  width: 100%;
  min-width: 0;
  height: calc(1.4 * 2 * 1em);
  overflow: hidden;
  font-size: 14px;
  line-height: 1.4;
  text-overflow: ellipsis;
  line-clamp: 2;
  word-break: break-all;
  -webkit-box-orient: vertical;
}

.grid-empty {
  grid-column: 1 / -1;
  place-self: center center;
}

.grid-item-full-width {
  grid-column: 1 / -1;
}

.load-more-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 15px 0;
  font-size: 14px;
  color: #909399;
}

.load-more-indicator .el-icon {
  margin-right: 8px;
}

.is-loading {
  animation: spin 1.5s linear infinite;
}

.no-more-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 0 20px;
  font-size: 13px;
  color: #c0c4cc;
}

.grid-item:hover :deep(.thumbnail-image) {
  transform: scale(1.1);
}
</style>
