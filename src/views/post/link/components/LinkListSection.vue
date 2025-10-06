<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { useLinkStore } from "@/store/modules/link";
import SiteCardGroup from "./SiteCardGroup.vue";
import FlinkList from "./FlinkList.vue";

defineOptions({
  name: "LinkListSection"
});

const linkStore = useLinkStore();
const loadingMore = ref(false);

// 检查某个分类元素是否在视口附近
const isNearViewport = (element: Element, threshold = 300): boolean => {
  const rect = element.getBoundingClientRect();
  const windowHeight =
    window.innerHeight || document.documentElement.clientHeight;

  // 元素底部在视口上方threshold像素内，或者元素已经在视口中
  return rect.top <= windowHeight + threshold && rect.bottom >= -threshold;
};

const handleScroll = async () => {
  if (loadingMore.value) return;

  const scrollHeight = document.documentElement.scrollHeight;
  const scrollTop = document.documentElement.scrollTop;
  const clientHeight = document.documentElement.clientHeight;

  // 移动端触发距离更小，提前加载
  const isMobile = window.innerWidth <= 768;
  const triggerDistance = isMobile ? 200 : 400;

  // 检查每个分类组，看是否需要加载数据
  const linkGroups = document.querySelectorAll(".link-group");

  for (const group of Array.from(linkGroups)) {
    const categoryId = group.getAttribute("data-category-id");
    if (!categoryId) continue;

    const id = parseInt(categoryId, 10);
    const state = linkStore.linksByCategory[id];

    // 如果分类在视口附近且尚未开始加载，则开始加载
    if (state && state.list.length === 0 && !state.loading && !state.finished) {
      if (isNearViewport(group, triggerDistance)) {
        loadingMore.value = true;
        await linkStore.fetchLinksForCategory(id);
        loadingMore.value = false;
      }
    }
    // 如果分类已经有数据但未加载完，且接近底部，则加载下一页
    else if (
      state &&
      state.list.length > 0 &&
      !state.loading &&
      !state.finished
    ) {
      if (isNearViewport(group, triggerDistance / 2)) {
        loadingMore.value = true;
        await linkStore.fetchLinksForCategory(id);
        loadingMore.value = false;
      }
    }
  }

  // 兜底逻辑：当滚动到接近底部时，加载所有未完成的分类
  if (scrollTop + clientHeight >= scrollHeight - triggerDistance) {
    for (const category of linkStore.categories) {
      const state = linkStore.linksByCategory[category.id];
      if (state && !state.finished && !state.loading) {
        loadingMore.value = true;
        await linkStore.fetchLinksForCategory(category.id);
        loadingMore.value = false;
      }
    }
  }
};

// 节流函数
let scrollTimer: ReturnType<typeof setTimeout> | null = null;
const throttledScroll = () => {
  if (scrollTimer) return;
  scrollTimer = setTimeout(() => {
    handleScroll();
    scrollTimer = null;
  }, 100);
};

onMounted(async () => {
  await linkStore.fetchCategories();

  if (linkStore.categories.length > 0) {
    // 只加载前2个分类的初始数据
    const initialLoadCount = Math.min(2, linkStore.categories.length);
    for (let i = 0; i < initialLoadCount; i++) {
      await linkStore.fetchLinksForCategory(linkStore.categories[i].id);
    }

    // 延迟一点再触发滚动检测，确保 DOM 已渲染
    setTimeout(() => {
      handleScroll();
    }, 300);
  }

  window.addEventListener("scroll", throttledScroll);
});

onUnmounted(() => {
  window.removeEventListener("scroll", throttledScroll);
  if (scrollTimer) {
    clearTimeout(scrollTimer);
  }
});
</script>

<template>
  <div id="article-container" class="flink">
    <div
      v-for="category in linkStore.categories"
      :key="category.id"
      class="link-group"
      :data-category-id="category.id"
    >
      <div class="power_title_bar">
        <h2 :id="category.name">
          <a :href="`#${category.name}`" class="headerlink">{{
            category.name +
            " " +
            "(" +
            (linkStore.linksByCategory[category.id]?.total || 0) +
            ")"
          }}</a>
        </h2>
        <div class="flink-desc">
          {{ category?.description }}
        </div>
      </div>

      <SiteCardGroup
        v-if="category.style === 'card'"
        :links="linkStore.linksByCategory[category.id]?.list || []"
      />
      <FlinkList
        v-else
        :links="linkStore.linksByCategory[category.id]?.list || []"
      />
      <div
        v-if="linkStore.linksByCategory[category.id]?.loading"
        class="loading-tip"
      >
        正在加载...
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.link-group {
  margin-top: 30px;

  // 移动端间距优化
  @media (width <= 768px) {
    margin-top: 25px;
  }

  @media (width <= 576px) {
    margin-top: 20px;
  }
}

.power_title_bar {
  margin-bottom: 20px;

  // 移动端间距优化
  @media (width <= 768px) {
    margin-bottom: 15px;
  }

  @media (width <= 576px) {
    margin-bottom: 12px;
  }

  h2 {
    margin: 0;
    font-size: 1.5rem;

    // 移动端字体大小调整
    @media (width <= 768px) {
      font-size: 1.3rem;
    }

    @media (width <= 576px) {
      font-size: 1.2rem;
    }

    @media (width <= 480px) {
      font-size: 1.1rem;
    }

    .headerlink {
      color: var(--anzhiyu-fontcolor);
      text-decoration: none;
    }

    span {
      font-size: 1.2rem;
      color: var(--anzhiyu-second-fontcolor);

      @media (width <= 576px) {
        font-size: 1rem;
      }
    }
  }

  .flink-desc {
    margin: 0;
    line-height: 1.4;
    color: var(--anzhiyu-secondtext);

    // 移动端字体和行高调整
    @media (width <= 576px) {
      font-size: 0.9rem;
      line-height: 1.3;
    }

    @media (width <= 480px) {
      font-size: 0.85rem;
    }
  }
}

.loading-tip {
  padding: 20px 0;
  color: var(--anzhiyu-second-fontcolor);
  text-align: center;

  // 移动端优化
  @media (width <= 576px) {
    padding: 15px 0;
    font-size: 0.9rem;
  }

  @media (width <= 480px) {
    padding: 12px 0;
    font-size: 0.85rem;
  }
}
</style>
