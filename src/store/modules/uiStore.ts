/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-09-02 13:30:17
 * @LastEditTime: 2025-10-02 02:55:46
 * @LastEditors: 安知鱼
 */
import { ref, watch } from "vue";
import { defineStore } from "pinia";
import Storage from "responsive-storage";
import { responsiveStorageNameSpace } from "@/config/base";

export const useUiStore = defineStore("ui", () => {
  const nameSpace = responsiveStorageNameSpace();

  // 控制热评弹幕是否可见的状态，从存储中读取或默认为 true (可见)
  const isCommentBarrageVisible = ref(
    Storage.getData("isCommentBarrageVisible", nameSpace) ?? true
  );

  // 切换状态的 action
  function toggleCommentBarrage(value?: boolean) {
    if (typeof value === "boolean") {
      isCommentBarrageVisible.value = value;
    } else {
      isCommentBarrageVisible.value = !isCommentBarrageVisible.value;
    }
  }

  // 监听状态变化，自动保存到存储
  watch(
    isCommentBarrageVisible,
    newValue => {
      localStorage.setItem(
        `${nameSpace}isCommentBarrageVisible`,
        JSON.stringify(newValue)
      );
    },
    { immediate: false }
  );

  // 控制快捷键功能是否启用的状态，默认为 true (启用)
  const isShortcutsEnabled = ref(
    Storage.getData("isShortcutsEnabled", nameSpace) ?? true
  );

  // 切换快捷键启用状态的 action
  function toggleShortcuts(value?: boolean) {
    if (typeof value === "boolean") {
      isShortcutsEnabled.value = value;
    } else {
      isShortcutsEnabled.value = !isShortcutsEnabled.value;
    }
  }

  // 监听状态变化，自动保存到存储
  watch(
    isShortcutsEnabled,
    newValue => {
      localStorage.setItem(
        `${nameSpace}isShortcutsEnabled`,
        JSON.stringify(newValue)
      );
    },
    { immediate: false }
  );

  // 控制右键菜单模式的状态，默认为 true (使用本站菜单)
  const useCustomContextMenu = ref(
    Storage.getData("useCustomContextMenu", nameSpace) ?? true
  );

  // 切换右键菜单模式的 action
  function toggleContextMenuMode(value?: boolean) {
    if (typeof value === "boolean") {
      useCustomContextMenu.value = value;
    } else {
      useCustomContextMenu.value = !useCustomContextMenu.value;
    }
  }

  // 监听状态变化，自动保存到存储
  watch(
    useCustomContextMenu,
    newValue => {
      localStorage.setItem(
        `${nameSpace}useCustomContextMenu`,
        JSON.stringify(newValue)
      );
    },
    { immediate: false }
  );

  // 控制音乐播放器是否可见的状态，默认为 true (可见)
  const isMusicPlayerVisible = ref(
    Storage.getData("isMusicPlayerVisible", nameSpace) ?? true
  );

  // 切换音乐播放器可见状态的 action
  function toggleMusicPlayer(value?: boolean) {
    if (typeof value === "boolean") {
      isMusicPlayerVisible.value = value;
    } else {
      isMusicPlayerVisible.value = !isMusicPlayerVisible.value;
    }
  }

  // 监听状态变化，自动保存到存储
  watch(
    isMusicPlayerVisible,
    newValue => {
      localStorage.setItem(
        `${nameSpace}isMusicPlayerVisible`,
        JSON.stringify(newValue)
      );
    },
    { immediate: false }
  );

  // 控制侧边栏是否可见的状态，默认为 true (可见)
  const isSidebarVisible = ref(
    Storage.getData("isSidebarVisible", nameSpace) ?? true
  );

  // 切换侧边栏可见状态的 action
  function toggleSidebar(value?: boolean) {
    if (typeof value === "boolean") {
      isSidebarVisible.value = value;
    } else {
      isSidebarVisible.value = !isSidebarVisible.value;
    }
  }

  // 监听状态变化，自动保存到存储
  watch(
    isSidebarVisible,
    newValue => {
      localStorage.setItem(
        `${nameSpace}isSidebarVisible`,
        JSON.stringify(newValue)
      );
    },
    { immediate: false }
  );

  return {
    isCommentBarrageVisible,
    toggleCommentBarrage,
    isShortcutsEnabled,
    toggleShortcuts,
    useCustomContextMenu,
    toggleContextMenuMode,
    isMusicPlayerVisible,
    toggleMusicPlayer,
    isSidebarVisible,
    toggleSidebar
  };
});
