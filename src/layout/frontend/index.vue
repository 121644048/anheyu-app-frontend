<!--
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-08-21 17:48:59
 * @LastEditTime: 2025-09-20 15:30:27
 * @LastEditors: 安知鱼
-->
<template>
  <div :class="{ frontendLayout: true, [mainContentClass]: true }">
    <Header />

    <main class="frontend-main">
      <router-view />
    </main>

    <Footer />

    <SearchModal />

    <RightMenu />

    <KeyboardTips :visible="showShortcutsPanel" :shortcuts="shortcuts" />

    <MusicPlayer v-if="isMusicPlayerEnabled" />

    <MobileMenu
      :is-open="isMobileMenuOpen"
      :nav-config="navConfig"
      :menu-config="menuConfig"
    />

    <div
      v-if="isMobileMenuOpen"
      class="mobile-menu-overlay"
      @click="closeMobileMenu"
    />
  </div>
</template>

<script setup lang="ts">
import { onBeforeMount, onMounted, onUnmounted, computed, ref } from "vue";
import { useRoute } from "vue-router";
import { useGlobal } from "@pureadmin/utils";
import { useDataThemeChange } from "@/layout/hooks/useDataThemeChange";
import { useKeyboardShortcuts } from "@/composables/useKeyboardShortcuts";
import { useSiteConfigStore } from "@/store/modules/siteConfig";

import Header from "./components/hearder/index.vue";
import Footer from "./components/footer/index.vue";
import SearchModal from "./components/SearchModal/index.vue";
import RightMenu from "./components/RightMenu/index.vue";
import KeyboardTips from "./components/KeyboardTips/index.vue";
import MobileMenu from "./components/MobileMenu/index.vue";
import MusicPlayer from "./components/MusicPlayer/index.vue";

const { $storage } = useGlobal<GlobalPropertiesApi>();
const route = useRoute();
const siteConfigStore = useSiteConfigStore();

const { showShortcutsPanel, shortcuts } = useKeyboardShortcuts();

const mainContentClass = computed(() => {
  return route.name === "PostDetail" ? "is-post-detail" : "";
});

// 音乐播放器是否启用
const isMusicPlayerEnabled = computed(() => {
  const musicConfig = siteConfigStore.getSiteConfig?.music?.player?.enable;
  return Boolean(musicConfig);
});

const navConfig = computed(() => siteConfigStore.getSiteConfig?.header?.nav);
const menuConfig = computed(() => {
  const menu = siteConfigStore.getSiteConfig?.header?.menu;
  return Array.isArray(menu) ? menu : [];
});

// 移动端菜单状态管理
const isMobileMenuOpen = ref(false);

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
  // 防止背景滚动
  if (isMobileMenuOpen.value) {
    document.body.style.overflow = "hidden";
  } else {
    document.body.style.overflow = "";
  }
};

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false;
  document.body.style.overflow = "";
};

onBeforeMount(() => {
  useDataThemeChange().dataThemeChange($storage.layout?.overallStyle);
});

onMounted(() => {
  // 监听移动端菜单切换事件
  window.addEventListener("toggle-mobile-menu", toggleMobileMenu);
});

onUnmounted(() => {
  // 清理事件监听器
  window.removeEventListener("toggle-mobile-menu", toggleMobileMenu);
  // 确保移除body样式
  document.body.style.overflow = "";
});
</script>

<style scoped lang="scss">
.frontend-layout {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 100vh;
}

/* 移动端菜单遮罩层 */
.mobile-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1008;
  backdrop-filter: blur(2px);
  transition: all 0.3s ease;
}
</style>
