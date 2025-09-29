<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import { useLinkStore } from "@/store/modules/link";
import SiteCardGroup from "./SiteCardGroup.vue";
import FlinkList from "./FlinkList.vue";

defineOptions({
  name: "LinkListSection"
});

const linkStore = useLinkStore();

const handleScroll = () => {
  const scrollHeight = document.documentElement.scrollHeight;
  const scrollTop = document.documentElement.scrollTop;
  const clientHeight = document.documentElement.clientHeight;

  // 移动端触发距离更小，提前加载
  const isMobile = window.innerWidth <= 768;
  const triggerDistance = isMobile ? 100 : 200;

  if (scrollTop + clientHeight >= scrollHeight - triggerDistance) {
    for (const category of linkStore.categories) {
      const state = linkStore.linksByCategory[category.id];
      if (state && !state.finished && !state.loading) {
        linkStore.fetchLinksForCategory(category.id);
        break;
      }
    }
  }
};

onMounted(async () => {
  await linkStore.fetchCategories();
  if (linkStore.categories.length > 0) {
    // 获取所有分类的友链数据
    for (const category of linkStore.categories) {
      linkStore.fetchLinksForCategory(category.id);
    }
  }
  window.addEventListener("scroll", handleScroll);
});

onUnmounted(() => {
  window.removeEventListener("scroll", handleScroll);
});
</script>

<template>
  <div id="article-container" class="flink">
    <div
      v-for="category in linkStore.categories"
      :key="category.id"
      class="link-group"
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
