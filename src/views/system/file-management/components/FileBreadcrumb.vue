<template>
  <div class="file-breadcrumb-wrapper" @click="switchToEditMode">
    <div v-if="!isEditing" class="file-breadcrumb">
      <el-tooltip content="返回根目录" placement="bottom" :show-arrow="false">
        <el-icon class="home-icon" @click.stop="onNavigate('/')"
          ><HomeFilled
        /></el-icon>
      </el-tooltip>
      <el-breadcrumb :separator-icon="ArrowRight">
        <el-breadcrumb-item
          v-for="(segment, index) in pathSegments"
          :key="segment.path"
        >
          <!-- 最后一个 segment 且需要显示下拉菜单时 -->
          <el-dropdown
            v-if="isLastSegment(index) && showDropdown"
            trigger="click"
            placement="bottom-start"
            @command="handleCommand"
            @visible-change="isDropdownVisible = $event"
          >
            <span class="el-dropdown-link" @click.stop>
              {{ segment.name }}
              <IconifyIconOnline
                icon="raphael:arrowdown"
                class="el-icon--right"
              />
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item :command="{ action: 'enter' }">
                  <IconifyIconOffline :icon="Back" class="dropdown-icon" />进入
                </el-dropdown-item>
                <el-dropdown-item :command="{ action: 'download' }">
                  <IconifyIconOffline
                    :icon="Download"
                    class="dropdown-icon"
                  />下载
                </el-dropdown-item>
                <el-dropdown-item :command="{ action: 'share' }">
                  <IconifyIconOffline :icon="Share" class="dropdown-icon" />分享
                </el-dropdown-item>
                <el-dropdown-item :command="{ action: 'rename' }">
                  <IconifyIconOffline
                    :icon="EditPen"
                    class="dropdown-icon"
                  />重命名
                </el-dropdown-item>
                <el-dropdown-item :command="{ action: 'copy' }">
                  <IconifyIconOffline
                    :icon="CopyDocument"
                    class="dropdown-icon"
                  />复制
                </el-dropdown-item>
                <el-dropdown-item :command="{ action: 'link' }">
                  <IconifyIconOffline
                    :icon="Link"
                    class="dropdown-icon"
                  />获取直链
                </el-dropdown-item>
                <el-dropdown-item :command="{ action: 'tags' }" divided>
                  <IconifyIconOffline
                    :icon="PriceTag"
                    class="dropdown-icon"
                  />标签
                </el-dropdown-item>
                <el-dropdown-item :command="{ action: 'organize' }">
                  <IconifyIconOffline
                    :icon="FolderOpened"
                    class="dropdown-icon"
                  />整理
                </el-dropdown-item>
                <el-dropdown-item :command="{ action: 'more' }">
                  <IconifyIconOffline
                    :icon="Setting"
                    class="dropdown-icon"
                  />更多操作
                </el-dropdown-item>
                <el-dropdown-item :command="{ action: 'info' }" divided>
                  <IconifyIconOffline
                    :icon="InfoFilled"
                    class="dropdown-icon"
                  />详细信息
                </el-dropdown-item>
                <el-dropdown-item
                  :command="{ action: 'delete' }"
                  class="danger-item"
                >
                  <IconifyIconOffline
                    :icon="Delete"
                    class="dropdown-icon"
                  />删除
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>

          <!-- 其他情况，作为普通链接 -->
          <span v-else class="is-link" @click.stop="onNavigate(segment.path)">
            {{ segment.name }}
          </span>
        </el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <div v-else class="input-mode">
      <el-tooltip content="返回根目录" placement="bottom" :show-arrow="false">
        <el-icon class="home-icon" @click.stop="onNavigate('/')"
          ><HomeFilled
        /></el-icon>
      </el-tooltip>
      <el-input
        ref="pathInputRef"
        v-model="pathInput"
        placeholder="请输入绝对路径后按 Enter"
        @blur="handleSubmit"
        @keydown.enter.prevent="handleSubmit"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, nextTick, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { extractLogicalPathFromUri } from "@/utils/fileUtils";

import { HomeFilled, ArrowRight } from "@element-plus/icons-vue";
import Back from "@iconify-icons/ep/back";
import Download from "@iconify-icons/ep/download";
import Share from "@iconify-icons/ep/share";
import EditPen from "@iconify-icons/ep/edit-pen";
import CopyDocument from "@iconify-icons/ep/copy-document";
import Link from "@iconify-icons/ep/link";
import PriceTag from "@iconify-icons/ep/price-tag";
import FolderOpened from "@iconify-icons/ep/folder-opened";
import Setting from "@iconify-icons/ep/setting";
import InfoFilled from "@iconify-icons/ep/info-filled";
import Delete from "@iconify-icons/ep/delete";

const props = defineProps<{
  path: string;
  parentInfo?: { id: string; name: string } | null;
  showDropdown?: boolean;
}>();

const emit = defineEmits<{
  (e: "navigate", path: string): void;
  (e: "show-details", id: string): void;
  (e: "download-folder", id: string): void;
}>();

const isEditing = ref(false);
const pathInput = ref(props.path);
const pathInputRef = ref<HTMLInputElement | null>(null);
const isDropdownVisible = ref(false);

const pathSegments = computed(() => {
  const logicalPath = extractLogicalPathFromUri(props.path || "/");

  if (logicalPath === "/") {
    return [{ name: "我的文件", path: "/" }];
  }

  const segments = logicalPath.split("/").filter(Boolean);
  const result = [{ name: "我的文件", path: "/" }];
  let cumulativePath = "";
  for (const segment of segments) {
    cumulativePath += `/${segment}`;
    result.push({ name: segment, path: cumulativePath });
  }

  return result;
});

const isLastSegment = (index: number) => {
  return (
    index === pathSegments.value.length - 1 && pathSegments.value.length > 1
  );
};

const onNavigate = (newPath: string) => {
  const logicalPath = extractLogicalPathFromUri(newPath);
  if (logicalPath === props.path && logicalPath !== "/") return;
  emit("navigate", logicalPath);
};

const switchToEditMode = () => {
  if (isDropdownVisible.value) return;
  isEditing.value = true;
  nextTick(() => {
    pathInputRef.value?.focus();
  });
};

const handleSubmit = () => {
  let finalPath = pathInput.value.trim();
  // 使用工具函数确保是逻辑路径
  finalPath = extractLogicalPathFromUri(finalPath);
  // 规范化路径，移除末尾斜杠
  if (finalPath.length > 1 && finalPath.endsWith("/")) {
    finalPath = finalPath.slice(0, -1);
  }
  if (!finalPath.startsWith("/")) {
    finalPath = `/${finalPath}`;
  }

  isEditing.value = false;
  if (finalPath === props.path) return;
  onNavigate(finalPath);
};

interface CommandPayload {
  action: string;
}

const handleCommand = (command: CommandPayload) => {
  const { action } = command;
  if (!props.parentInfo?.id) {
    ElMessage.warning("无法获取当前目录信息");
    return;
  }

  switch (action) {
    case "enter":
      onNavigate(props.path);
      break;
    case "info":
      emit("show-details", props.parentInfo.id);
      break;
    case "download":
      emit("download-folder", props.parentInfo.id);
      break;
    case "delete":
      ElMessageBox.confirm(
        `确定要删除文件夹 "${props.parentInfo.name}" 吗？此操作不可恢复。`,
        "警告",
        {
          confirmButtonText: "确定删除",
          cancelButtonText: "取消",
          type: "warning"
        }
      )
        .then(() => {
          ElMessage.info("删除操作应由父组件处理");
        })
        .catch(() => ElMessage.info("已取消删除"));
      break;
    default:
      ElMessage.info(`功能 [${action}] 正在开发中...`);
      break;
  }
};

watch(
  () => props.path,
  newPath => {
    pathInput.value = extractLogicalPathFromUri(newPath);
  },
  { immediate: true }
);
</script>

<style scoped lang="scss">
.dropdown-icon {
  margin-right: 8px;
}

:root {
  --style-border: 1px solid #e0e0e0;
}

.file-breadcrumb-wrapper {
  display: flex;
  align-items: center;
  min-height: 52px;
  padding: 0 24px;
  overflow: hidden;
  cursor: text;
  background-color: var(--anzhiyu-card-bg);
  border: var(--style-border);
  border-radius: 12px;

  @media screen and (width <= 768px) {
    min-height: 48px;
    padding: 0 16px;
    border-radius: 10px;
  }
}

.file-breadcrumb {
  display: flex;
  align-items: center;
  width: 100%;
  overflow: hidden;

  @media screen and (width <= 768px) {
    :deep(.el-breadcrumb) {
      flex: 1;
      overflow: hidden;

      .el-breadcrumb__item {
        max-width: none;

        .el-breadcrumb__inner {
          max-width: 120px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }
    }
  }

  @media screen and (width <= 576px) {
    :deep(.el-breadcrumb) {
      .el-breadcrumb__item {
        .el-breadcrumb__inner {
          max-width: 80px;
        }
      }
    }
  }
}

.home-icon {
  margin-right: 12px;
  font-size: 16px;
  color: var(--anzhiyu-fontcolor);
  cursor: pointer;
  flex-shrink: 0;

  @media screen and (width <= 768px) {
    margin-right: 10px;
    font-size: 18px;
  }
}

.home-icon:hover {
  color: var(--el-color-primary);
}

.is-link {
  display: inline-block;
  padding: 8px;
  font-weight: normal;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s;

  @media screen and (width <= 768px) {
    padding: 10px 12px;
    font-size: 14px;
  }
}

.is-link:hover {
  color: var(--anzhiyu-white) !important;
  background-color: var(--anzhiyu-main);
}

.el-breadcrumb__item:not(:last-child) .is-link {
  font-weight: normal;
  color: var(--anzhiyu-fontcolor);
}

.el-breadcrumb__item:first-child .is-link {
  color: var(--anzhiyu-fontcolor);
}

.el-dropdown-link {
  display: flex;
  align-items: center;
  padding: 8px;
  font-weight: 600;
  color: var(--anzhiyu-fontcolor);
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s;

  @media screen and (width <= 768px) {
    padding: 10px 12px;
    font-size: 15px;
  }
}

.el-dropdown-link .el-icon--right {
  display: inline-flex;
  align-items: center;
  margin-left: 5px;
  font-size: 12px;

  @media screen and (width <= 768px) {
    font-size: 14px;
  }
}

.danger-item {
  color: var(--el-color-error);
}

.danger-item:hover {
  background-color: var(--anzhiyu-main) !important;
  color: var(--anzhiyu-white);
}

.danger-item .dropdown-icon {
  color: var(--anzhiyu-white);
}

.danger-item:hover .dropdown-icon {
  color: var(--anzhiyu-card-bg) !important;
}

.el-dropdown-link:hover {
  background-color: var(--anzhiyu-main) !important;
  color: var(--anzhiyu-white);
}

.input-mode {
  display: flex;
  align-items: center;
  width: 100%;

  :deep(.el-input__wrapper) {
    padding: 4px !important;
    box-shadow: none !important;

    &:hover {
      box-shadow: none !important;
    }
  }

  @media screen and (width <= 768px) {
    :deep(.el-input__inner) {
      font-size: 15px;
      height: 40px;
      line-height: 40px;
    }
  }
}

// 移动端下拉菜单优化
@media screen and (width <= 768px) {
  :deep(.el-dropdown-menu) {
    min-width: 200px;
    padding: 8px 0;

    .el-dropdown-menu__item {
      padding: 12px 16px;
      font-size: 14px;
      line-height: 1.5;
      min-height: 44px;
      display: flex;
      align-items: center;

      .dropdown-icon {
        width: 20px;
        height: 20px;
        font-size: 18px;
        margin-right: 10px;
      }

      &.el-dropdown-menu__item--divided {
        margin-top: 8px;
        border-top: 1px solid var(--el-border-color-lighter);
      }
    }
  }

  // 确保下拉菜单在移动端可点击
  :deep(.el-popper) {
    .el-dropdown-menu__item {
      user-select: none;
      -webkit-tap-highlight-color: transparent;
    }
  }
}

@media screen and (width <= 576px) {
  :deep(.el-dropdown-menu) {
    max-width: 90vw;

    .el-dropdown-menu__item {
      padding: 14px 16px;
      font-size: 15px;
      min-height: 48px;
    }
  }
}
</style>
