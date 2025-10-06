<script setup lang="ts">
import {
  ref,
  onMounted,
  onUnmounted,
  nextTick,
  watchEffect,
  computed
} from "vue";
import { useRouter, useRoute } from "vue-router";
import { storeToRefs } from "pinia";
import { useArticleStore } from "@/store/modules/articleStore";
import type { PostCategory } from "@/api/post/type";

const router = useRouter();
const route = useRoute();

const articleStore = useArticleStore();
const { categories } = storeToRefs(articleStore);
const { fetchCategories } = articleStore;

const selectedId = ref<string | null>(null);
const catalogBarRef = ref<HTMLElement | null>(null);
const isScrolledToEnd = ref(false);
const showScrollButton = ref(false);

const handleSelect = (category: PostCategory | null) => {
  if (category) {
    router.push(`/categories/${category.name}/`);
  } else {
    router.push("/");
  }
};

watchEffect(async () => {
  if (categories.value.length > 0) {
    const currentCategoryName = route.params.name as string;
    if (currentCategoryName) {
      const selectedCategory = categories.value.find(
        c => c.name === currentCategoryName
      );
      selectedId.value = selectedCategory ? selectedCategory.id : null;
    } else {
      selectedId.value = null;
    }
  }

  await nextTick();
  updateScrollVisibility();
});

const checkScrollPosition = () => {
  const el = catalogBarRef.value;
  if (!el) return;
  isScrolledToEnd.value = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;
};

const updateScrollVisibility = () => {
  const el = catalogBarRef.value;
  if (!el) return;
  showScrollButton.value = el.scrollWidth > el.clientWidth;
  checkScrollPosition();
};

const handleScrollNext = () => {
  const el = catalogBarRef.value;
  if (!el) return;
  if (isScrolledToEnd.value) {
    el.scrollTo({ left: 0, behavior: "smooth" });
  } else {
    el.scrollBy({ left: el.clientWidth, behavior: "smooth" });
  }
};

onMounted(() => {
  fetchCategories();
  window.addEventListener("resize", updateScrollVisibility);
});

onUnmounted(() => {
  window.removeEventListener("resize", updateScrollVisibility);
});
</script>

<template>
  <div class="category-bar-container">
    <div class="category-bar">
      <div
        ref="catalogBarRef"
        class="catalog-bar"
        @scroll.passive="checkScrollPosition"
      >
        <div class="catalog-list">
          <div
            class="catalog-list-item"
            :class="{ select: selectedId === null }"
            @click="handleSelect(null)"
          >
            <a>首页</a>
          </div>
          <div
            v-for="category in categories"
            :key="category.id"
            class="catalog-list-item"
            :class="{ select: selectedId === category.id }"
            @click="handleSelect(category)"
          >
            <a>{{ category.name }}</a>
          </div>
        </div>
      </div>
      <div
        v-if="showScrollButton"
        class="category-bar-next"
        @click="handleScrollNext"
      >
        <i
          class="anzhiyufont anzhiyu-icon-angle-double-right"
          :class="{ 'is-rotated': isScrolledToEnd }"
        />
      </div>
      <a class="catalog-more" href="/categories">更多</a>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.category-bar-container {
  display: flex;
  width: 100%;
  margin-bottom: 0.5rem;
}

.category-bar {
  display: flex;
  align-items: center;
  width: 100%;
  height: 50px;
  padding: 0.5rem 10px;
  overflow: hidden;
  white-space: nowrap;
  background: var(--anzhiyu-card-bg);
  border: var(--style-border);
  border-radius: 12px;
  transition: all 0.3s ease 0s;
  animation: slide-in 0.6s 0.3s backwards;
}

.catalog-bar {
  display: flex;
  flex-grow: 1;
  align-items: center;
  overflow-x: auto;
  scrollbar-width: none;
  transform: translateX(-1px);

  &::-webkit-scrollbar {
    display: none;
  }
}

.catalog-list {
  display: flex;
  gap: 5px;
}

.catalog-list-item {
  font-weight: 600;
  cursor: pointer;

  a {
    display: block;
    padding: 2px 12px;
    border-radius: 8px;
    transition: all 0.3s;
  }

  &:hover a {
    background: var(--anzhiyu-secondbg);
  }

  &.select a {
    color: var(--anzhiyu-white);
    background: var(--anzhiyu-main);
  }
}

.category-bar-next {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  padding: 4px;
  margin-left: 10px;
  cursor: pointer;
  background: var(--anzhiyu-card-bg);
  border-radius: 8px;
  transition: all 0.3s ease-in-out;

  i {
    transition: transform 0.3s ease-in-out;
  }

  i.is-rotated {
    transform: rotate(180deg);
  }

  &:hover {
    color: var(--anzhiyu-white);
    background: var(--anzhiyu-main);
  }
}

.catalog-more {
  margin-left: 1rem;
  font-weight: bold;
  color: var(--anzhiyu-fontcolor);
  text-decoration: none;
  white-space: nowrap;
  padding: 2px 12px;
  border-radius: 8px;
  transition: all 0.3s;

  &:hover {
    color: var(--anzhiyu-main);
    background: var(--anzhiyu-secondbg);
  }
}

@media (width <= 768px) {
  .catalog-more {
    display: none;
  }

  .category-bar {
    padding: 0 2px;
    background: transparent;
    border: none;

    .catalog-bar {
      height: 100%;

      .catalog-list {
        height: 100%;
      }

      .catalog-list-item {
        display: flex;
        align-items: center;
        justify-content: center;

        &.select a {
          background: var(--anzhiyu-main);
        }

        a {
          display: flex;
          align-items: center;
          height: 80%;
          padding: 0 19px;
          font-size: 14px;
          background: var(--anzhiyu-card-bg);
          border: var(--style-border-always);
          border-radius: 30px;

          &:hover {
            background: var(--anzhiyu-main);
          }
        }
      }
    }
  }
}
</style>
