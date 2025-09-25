<!--
 * @Description: 专辑封面组件
 * @Author: 安知鱼
 * @Date: 2025-09-20 15:15:00
-->
<template>
  <div
    class="album-cover"
    :style="{
      backgroundImage: displayImageUrl
    }"
    :class="{ playing: isPlaying, loading: isLoading }"
  />
</template>

<script setup lang="ts">
import { computed, ref, watch, onBeforeUnmount } from "vue";

interface Props {
  imageUrl?: string;
  isPlaying?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  imageUrl: "",
  isPlaying: false
});

const isLoading = ref(false);
const loadedImageUrl = ref<string>("");
const preloadedImageBlob = ref<string>(""); // 存储预加载的图片 blob URL

// 计算显示的图片URL - 优先使用预加载的 blob URL，避免重复网络请求
const displayImageUrl = computed(() => {
  if (!props.imageUrl) return "none";
  if (loadedImageUrl.value === props.imageUrl) {
    // 如果有预加载的 blob URL，优先使用（避免重复网络请求）
    if (preloadedImageBlob.value) {
      return `url('${preloadedImageBlob.value}')`;
    }
    return `url('${props.imageUrl}')`;
  }
  return "none";
});

// 监听图片URL变化，预加载图片
watch(
  () => props.imageUrl,
  newUrl => {
    if (!newUrl) {
      loadedImageUrl.value = "";
      // 清理之前的 blob URL
      if (preloadedImageBlob.value) {
        URL.revokeObjectURL(preloadedImageBlob.value);
        preloadedImageBlob.value = "";
      }
      return;
    }

    // 如果已经加载过这个URL，直接使用
    if (loadedImageUrl.value === newUrl) {
      return;
    }

    // 切换新图片时，清理之前的 blob URL
    if (preloadedImageBlob.value) {
      URL.revokeObjectURL(preloadedImageBlob.value);
      preloadedImageBlob.value = "";
    }

    isLoading.value = true;

    // 监听颜色提取完成的自定义事件
    const handleColorExtracted = (event: CustomEvent) => {
      if (event.detail.imageUrl === newUrl) {
        // 如果颜色提取提供了 blob URL，直接使用（真正的零额外请求）
        if (event.detail.blobUrl && !event.detail.fromCache) {
          // 清理之前的 blob URL
          if (preloadedImageBlob.value) {
            URL.revokeObjectURL(preloadedImageBlob.value);
          }

          // 直接使用颜色提取阶段的 blob URL
          preloadedImageBlob.value = event.detail.blobUrl;

          loadedImageUrl.value = newUrl;
          isLoading.value = false;
        } else if (event.detail.imageElement && !event.detail.fromCache) {
          const img = event.detail.imageElement as HTMLImageElement;

          // 将图片转换为 blob URL 以避免跨域问题
          try {
            const canvas = document.createElement("canvas");
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.drawImage(img, 0, 0);
              canvas.toBlob(
                blob => {
                  if (blob) {
                    // 清理之前的 blob URL
                    if (preloadedImageBlob.value) {
                      URL.revokeObjectURL(preloadedImageBlob.value);
                    }
                    preloadedImageBlob.value = URL.createObjectURL(blob);
                  }
                  loadedImageUrl.value = newUrl;
                  isLoading.value = false;
                },
                "image/jpeg",
                0.95
              );
            } else {
              // Canvas 不支持时回退到原始 URL
              loadedImageUrl.value = newUrl;
              isLoading.value = false;
            }
          } catch (error) {
            loadedImageUrl.value = newUrl;
            isLoading.value = false;
          }
        } else {
          // 缓存命中或没有图片对象时，使用原始 URL
          loadedImageUrl.value = newUrl;
          isLoading.value = false;
        }

        window.removeEventListener("colorExtracted", handleColorExtracted);
      }
    };

    // 添加事件监听器
    window.addEventListener(
      "colorExtracted",
      handleColorExtracted as EventListener
    );

    // 缩短超时时间到2秒，避免过长等待
    setTimeout(() => {
      if (isLoading.value && loadedImageUrl.value !== newUrl) {
        loadedImageUrl.value = newUrl;
        isLoading.value = false;
        window.removeEventListener("colorExtracted", handleColorExtracted);
      }
    }, 2000);
  },
  { immediate: true }
);

// 组件卸载时清理 blob URL，避免内存泄漏
onBeforeUnmount(() => {
  if (preloadedImageBlob.value) {
    URL.revokeObjectURL(preloadedImageBlob.value);
  }
});
</script>

<style scoped lang="scss">
.album-cover {
  position: absolute;
  left: 5px;
  top: 5px;
  width: 30px;
  height: 30px;
  border-radius: 15px;
  background-size: cover;
  background-position: center;
  background-color: rgba(255, 255, 255, 0.1);
  border: var(--style-border-always);
  border-color: transparent;
  flex-shrink: 0;
  transition: all 0.4s ease;
  z-index: 2;
  cursor: pointer;
  animation: coverRotate 8s linear infinite paused;

  // 播放状态的封面动画
  &.playing {
    box-shadow: rgba(255, 255, 255, 0.46) 0px 0px 5.67781px 0px;
    animation-play-state: running;
  }
}

// 封面旋转动画
@keyframes coverRotate {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
