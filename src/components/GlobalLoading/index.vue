<script setup lang="ts">
import { computed } from "vue";
import { useLoadingStore } from "@/store/modules/loadingStore";
import { useSiteConfigStore } from "@/store/modules/siteConfig";

const loadingStore = useLoadingStore();
const siteConfigStore = useSiteConfigStore();

const avatarUrl = computed(() => siteConfigStore.getSiteConfig?.USER_AVATAR);

// 点击头像，立即关闭全局加载动画
const forceClose = () => {
  loadingStore.stopLoading();
};
</script>

<template>
  <transition name="fade">
    <div v-if="loadingStore.isLoading" class="loading-box">
      <div class="loading-bg">
        <img
          v-if="avatarUrl"
          class="loading-img clickable"
          alt="加载头像"
          :src="avatarUrl"
          @click="forceClose"
        />
        <div class="loading-image-dot" />
      </div>
    </div>
  </transition>
</template>

<style lang="scss" scoped>
@keyframes loadingAction {
  0% {
    opacity: 1;
    transform: scale(1);
  }

  100% {
    opacity: 0.6;
    transform: scale(0.95);
  }
}

.loading-box {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 99999;
  width: 100%;
  height: 100%;
  overflow: hidden;
  user-select: none;

  .loading-bg {
    position: relative;
    display: flex;
    width: 100%;
    height: 100%;
    background: var(--anzhiyu-card-bg);
    transition: opacity 0.3s;
  }
}

.loading-img {
  width: 100px;
  height: 100px;
  margin: auto;
  border: 4px solid #f0f0f2;
  border-radius: 50%;
  animation-name: loadingAction;
  animation-duration: 0.8s;
  animation-iteration-count: infinite;
  animation-direction: alternate;

  &.clickable {
    cursor: pointer;
  }
}

.loading-image-dot {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 30px;
  height: 30px;
  background: #6bdf8f;
  border: 6px solid var(--anzhiyu-card-bg);
  border-radius: 50%;
  transform: translate(24px, 24px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
