<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from "vue";
import { useSiteConfigStore } from "@/store/modules/siteConfig";
import { useLazyLoading } from "@/composables/useLazyLoading";
import "katex/dist/katex.min.css";

// Fancybox 懒加载，避免影响首屏性能
let Fancybox: any = null;

const props = defineProps({
  content: {
    type: String,
    default: "PostContent"
  }
});

const siteConfigStore = useSiteConfigStore();

// 初始化懒加载
const { initLazyLoading, reinitialize, cleanup } = useLazyLoading({
  rootMargin: "100px",
  threshold: 0.1,
  showLoading: true
});

const codeMaxLines = computed(
  () => siteConfigStore.getSiteConfig?.code_block?.code_max_lines || 10
);

const postContentRef = ref<HTMLElement | null>(null);

const collapsedHeight = computed(() => {
  const lines = codeMaxLines.value > 0 ? codeMaxLines.value : 10;
  const height = lines * 25 + 50;
  return `${height}px`;
});

// 文章内容点击事件处理 - 现在大部分逻辑已内置到 HTML 中
// 这里保留是为了未来可能需要的额外处理
const handleContentClick = (event: Event) => {
  // 所有交互逻辑已经通过 onclick 内联事件处理器实现
  // 如果未来需要添加额外的全局处理逻辑，可以在这里扩展
};

onMounted(async () => {
  if (postContentRef.value) {
    postContentRef.value.addEventListener("click", handleContentClick);

    // 初始化懒加载
    initLazyLoading(postContentRef.value);

    // 懒加载 Fancybox
    if (!Fancybox) {
      const fancyboxModule = await import("@fancyapps/ui");
      await import("@fancyapps/ui/dist/fancybox/fancybox.css");
      Fancybox = fancyboxModule.Fancybox;
    }

    Fancybox.bind(postContentRef.value, "img:not(a img)", {
      groupAll: true
    });
  }
});

onUnmounted(() => {
  if (postContentRef.value) {
    postContentRef.value.removeEventListener("click", handleContentClick);
    if (Fancybox) {
      Fancybox.unbind(postContentRef.value);
      Fancybox.close(true);
    }
  }
  // 清理懒加载资源
  cleanup();
});

// 监听内容变化，重新初始化懒加载
watch(
  () => props.content,
  () => {
    if (postContentRef.value) {
      // 等待 DOM 更新完成后重新初始化懒加载
      setTimeout(() => {
        if (postContentRef.value) {
          reinitialize(postContentRef.value);
          // 重新绑定 Fancybox
          if (Fancybox) {
            Fancybox.unbind(postContentRef.value);
            Fancybox.bind(postContentRef.value, "img:not(a img)", {
              groupAll: true
            });
          }
        }
      }, 100);
    }
  }
);
</script>

<template>
  <article
    id="article-container"
    ref="postContentRef"
    class="post-content"
    v-html="content"
  />
</template>

<style lang="scss">
// 使用公共的文章内容样式（包含懒加载等前台特有样式）
@use "@/style/post-content.scss";
@use "./editor-code.scss";

// PostContent 组件特有的样式覆盖
// 大部分样式已经通过 @use 导入
// 这里只保留组件级别的特殊处理（如果需要的话）
</style>
