<template>
  <Teleport to="body">
    <div
      v-if="localVisible"
      class="context-menu-overlay"
      @click="closeMenu"
      @contextmenu.prevent="handleOverlayRightClick"
    />

    <Transition
      name="context-menu-fade-scale"
      :css="false"
      @enter="onMenuEnter"
      @leave="onMenuLeave"
    >
      <div
        v-if="localVisible"
        ref="contextMenuRef"
        class="context-menu"
        :style="{ left: `${x}px`, top: `${y}px` }"
        @contextmenu.prevent
      >
        <ul>
          <li
            v-for="(item, index) in localItems"
            :key="index"
            class="menu-item"
            :class="{
              divider: item.divider,
              danger: item.danger
            }"
            @click.stop="onItemClick(item)"
          >
            <template v-if="!item.divider">
              <div class="flex items-center mr-2">
                <AnIconBox :color="item.color || ''">
                  <IconifyIconOffline
                    v-if="item.icon"
                    :icon="item.icon"
                    class="menu-icon"
                  />
                </AnIconBox>
              </div>
              <span>{{ item.label }}</span>
            </template>
          </li>
        </ul>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from "vue";
import gsap from "gsap";
import AnIconBox from "@/components/AnIconBox/index.vue";
import { type ContextMenuTrigger } from "../hooks/useContextMenuHandler";
import type { FileItem } from "@/api/sys-file/type";

import Upload from "@iconify-icons/ep/upload";
import FolderAdd from "@iconify-icons/ep/folder-add";
import Folder from "@iconify-icons/ep/folder";
import DocumentAdd from "@iconify-icons/ep/document-add";
import Refresh from "@iconify-icons/ep/refresh";
import EditPen from "@iconify-icons/ep/edit-pen";
import Delete from "@iconify-icons/ep/delete";
import Download from "@iconify-icons/ep/download";
import Share from "@iconify-icons/ep/share";
import CopyDocument from "@iconify-icons/ep/copy-document";
import Rank from "@iconify-icons/ep/rank";
import Info from "@iconify-icons/ep/info-filled";
import Link from "@iconify-icons/ep/link";
import Sync from "@iconify-icons/ep/refresh-right";

export interface MenuItem {
  label?: string;
  icon?: object;
  action?: string;
  danger?: boolean;
  divider?: boolean;
  color?: string;
}

const props = defineProps<{
  trigger: ContextMenuTrigger | null;
  selectedFileIds: Set<string>;
}>();

const emit = defineEmits<{
  (e: "select", action: string, context?: any): void;
  (e: "closed"): void;
  (e: "request-select-single", fileId: string): void;
}>();

const contextMenuRef = ref<HTMLElement | null>(null);
const localVisible = ref(false);
const x = ref(0);
const y = ref(0);
const localItems = ref<MenuItem[]>([]);
const menuContext = ref<any>(null);
const transformOrigin = ref("top left");

const blankMenu: MenuItem[] = [
  { label: "上传文件", action: "upload-file", icon: Upload, color: "#1677FF" },
  {
    label: "上传目录",
    action: "upload-dir",
    icon: FolderAdd,
    color: "#62C558"
  },
  { divider: true },
  {
    label: "创建文件夹",
    action: "create-folder",
    icon: Folder,
    color: "#A15FDE"
  },
  {
    label: "创建 Markdown (.md)",
    action: "create-md",
    icon: DocumentAdd,
    color: "#F6775C"
  },
  {
    label: "创建 文本 (.txt)",
    action: "create-txt",
    icon: DocumentAdd,
    color: "#5FDEB8"
  },
  { divider: true },
  { label: "刷新", action: "refresh", icon: Refresh, color: "#4F6BF6" }
];
const itemMenu: MenuItem[] = [
  { label: "重命名", action: "rename", icon: EditPen, color: "#4F6BF6" },
  { label: "移动到", action: "move", icon: Rank, color: "#62C558" },
  { label: "下载", action: "download", icon: Download, color: "#1677FF" },
  { label: "分享", action: "share", icon: Share, color: "#A15FDE" },
  { label: "获取直链", action: "get-link", icon: Link, color: "#76de5f" },
  { label: "复制", action: "copy", icon: CopyDocument, color: "#f6c75c" },
  { label: "详细信息", action: "info", icon: Info, color: "#b9b7b2" },
  { divider: true },
  {
    label: "删除",
    action: "delete",
    icon: Delete,
    danger: true,
    color: "#F6775C"
  }
];
const regenerateThumbnailMenu: MenuItem = {
  label: "重新生成缩略图",
  action: "regenerate-thumbnail",
  icon: Sync,
  color: "#f6985c"
};

const openMenu = async (trigger: ContextMenuTrigger) => {
  const { event, file } = trigger;
  event.preventDefault();

  if (localVisible.value) {
    localVisible.value = false;
    await nextTick();
  }

  const initialX = event.clientX;
  const initialY = event.clientY;

  if (file) {
    const itemId = file.id;
    let finalSelectedIds = new Set(props.selectedFileIds);
    if (itemId && !props.selectedFileIds.has(itemId)) {
      emit("request-select-single", itemId);
      finalSelectedIds = new Set([itemId]);
    }
    localItems.value = [...itemMenu];
    const isThumbnailFailed = file.metadata?.thumb_status === "failed";
    if (isThumbnailFailed) {
      localItems.value.unshift(regenerateThumbnailMenu, { divider: true });
    }
    menuContext.value = { selectedIds: [...finalSelectedIds] };
  } else {
    localItems.value = blankMenu;
    menuContext.value = null;
  }

  localVisible.value = true;
  await nextTick();

  const menuEl = contextMenuRef.value;
  if (!menuEl) return;
  const menuWidth = menuEl.offsetWidth;
  const menuHeight = menuEl.offsetHeight;
  const { innerWidth: winWidth, innerHeight: winHeight } = window;
  let finalX = initialX;
  let finalY = initialY;
  let originX = "left";
  let originY = "top";

  if (initialX + menuWidth > winWidth) {
    finalX = initialX - menuWidth;
    originX = "right";
  }
  if (initialY + menuHeight > winHeight) {
    finalY = initialY - menuHeight;
    originY = "bottom";
  }
  x.value = finalX < 5 ? 5 : finalX;
  y.value = finalY < 5 ? 5 : finalY;
  transformOrigin.value = `${originY} ${originX}`;
};

const closeMenu = () => {
  if (!localVisible.value) return;
  localVisible.value = false;
  emit("closed");
};

const handleOverlayRightClick = (event: MouseEvent) => {
  openMenu({ event });
};

const onItemClick = (item: MenuItem) => {
  if (item.action) {
    emit("select", item.action, menuContext.value);
  }
  closeMenu();
};

const onMenuEnter = (el: Element, done: () => void) => {
  gsap.fromTo(
    el,
    { opacity: 0, scale: 0.8, transformOrigin: transformOrigin.value },
    {
      opacity: 1,
      scale: 1,
      duration: 0.25,
      ease: "back.out(1.7)",
      onComplete: done
    }
  );
};

const onMenuLeave = (el: Element, done: () => void) => {
  gsap.to(el, {
    opacity: 0,
    scale: 0.8,
    duration: 0.2,
    ease: "power2.in",
    onComplete: done
  });
};

watch(
  () => props.trigger,
  newTrigger => {
    if (newTrigger) {
      openMenu(newTrigger);
    } else if (localVisible.value) {
      closeMenu();
    }
  }
);
</script>

<style scoped lang="scss">
.context-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 2999;
  width: 100vw;
  height: 100vh;
  cursor: default;
  user-select: none;
  background-color: transparent;
}

.context-menu {
  position: fixed;
  z-index: 3000;
  min-width: 180px;
  padding: 6px;
  background-color: var(--anzhiyu-card-bg);
  border: var(--style-border);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgb(0 0 0 / 10%);
  opacity: 0;
  transform: scale(0.8);
}

ul {
  padding: 0;
  margin: 0;
  list-style: none;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  font-size: 14px;
  cursor: pointer;
  border-radius: 6px;
  transition: background-color 0.2s ease;
}

.menu-item:not(.divider):hover {
  background-color: var(--anzhiyu-main);
}

.menu-icon {
  width: 1em;
  height: 1em;
}

.menu-item.danger {
  color: var(--el-color-error);
}

.menu-item.danger:hover {
  color: #fff;
  background-color: var(--el-color-error);
}

.menu-item.divider {
  height: 1px;
  padding: 0;
  margin: 6px 0;
  cursor: default;
  background-color: #e0e0e0;
}
</style>
