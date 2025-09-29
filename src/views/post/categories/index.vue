<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { getCategoryList } from "@/api/post";
import type { PostCategory } from "@/api/post/type";

defineOptions({
  name: "PostCategories"
});

const categories = ref<PostCategory[]>([]);
const loading = ref(true);
const router = useRouter();

/**
 * 获取分类列表
 */
const fetchCategories = async () => {
  loading.value = true;
  try {
    const { data } = await getCategoryList();
    categories.value = data || [];
  } catch (error) {
    console.error("获取分类列表失败:", error);
  } finally {
    loading.value = false;
  }
};

/**
 * 跳转到指定分类的文章列表页
 * @param categoryName - 分类名称
 */
const goToCategory = (categoryName: string) => {
  router.push({ path: `/categories/${categoryName}/` });
};

onMounted(() => {
  fetchCategories();
});
</script>

<template>
  <div v-loading="loading" class="category-cloud-amount">
    <h1 class="page-title">分类</h1>
    <div class="category-cloud-list">
      <a
        v-for="category in categories"
        :key="category.id"
        class="category-item"
        @click="goToCategory(category.name)"
      >
        <i class="anzhiyufont anzhiyu-icon-folder category-punctuation" />
        {{ category.name }}
      </a>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.category-cloud-amount {
  max-width: 1400px;
  min-height: 400px;
  margin: 0 auto;
  margin-top: 0.5rem;
  color: var(--anzhiyu-fontcolor);
}

.page-title {
  margin: 0.4rem 0 1rem 1rem;
  font-size: 2em;
  font-weight: 700;
  text-align: center;
}

.category-cloud-list {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  text-align: center;
  animation: slide-in 0.6s 0.2s backwards;
}

.category-item {
  display: flex;
  align-items: center;
  width: fit-content;
  padding: 0.6rem 0.9rem;
  margin: 0.7rem;
  font-size: 1.4rem;
  color: var(--anzhiyu-fontcolor);
  cursor: pointer;
  background: var(--anzhiyu-card-bg);
  border: var(--style-border-always);
  border-radius: 12px;
  box-shadow: var(--anzhiyu-shadow-border);
  backface-visibility: hidden;
  transform-style: preserve-3d;

  &:hover {
    color: var(--anzhiyu-white);
    background: var(--anzhiyu-main);
    border: var(--style-border-hover);
    box-shadow: var(--anzhiyu-shadow-blue);
  }
}

.category-punctuation {
  margin-right: 0.25rem;
  font-size: 1.2rem;
  opacity: 0.4;
}
</style>
