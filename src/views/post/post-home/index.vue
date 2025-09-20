<script setup lang="ts">
import { ref, reactive, watch, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import HomeTop from "./components/HomeTop/index.vue";
import CategoryBar from "./components/CategoryBar/index.vue";
import TagBar from "./components/TagBar/index.vue";
import ArticleCard from "./components/ArticleCard/index.vue";
import Archives from "./components/Archives/index.vue";
import Pagination from "./components/Pagination/index.vue";
import Sidebar from "../components/Sidebar/index.vue";
import { getPublicArticles } from "@/api/post";
import type { Article, GetArticleListParams } from "@/api/post/type";
import { useSiteConfigStore } from "@/store/modules/siteConfig";
import { resetThemeToDefault } from "@/utils/themeManager";

defineOptions({
  name: "PostHome"
});

const route = useRoute();
const siteConfigStore = useSiteConfigStore();

const pageType = computed(() => {
  if (route.path.startsWith("/tags/")) return "tag";
  if (route.path.startsWith("/categories/")) return "category";
  if (route.path.startsWith("/archives")) return "archive";
  return "home";
});

const showHomeTop = computed(() => {
  return pageType.value === "home" && pagination.page === 1;
});

const isDoubleColumn = computed(() => {
  const doubleColumnSetting =
    siteConfigStore.getSiteConfig?.post?.default.double_column;
  console.log("doubleColumnSetting:", doubleColumnSetting);

  // 如果配置项存在（不管是true还是false），使用配置值；否则默认为true
  return doubleColumnSetting !== undefined ? doubleColumnSetting : true;
});

const articles = ref<Article[]>([]);
const loading = ref(true);
const pagination = reactive({
  page: 1,
  pageSize: siteConfigStore.getSiteConfig?.post?.default.page_size || 12,
  total: 0
});

const currentCategoryName = ref<string | null>(null);
const currentTagName = ref<string | null>(null);
const currentYear = ref<number | null>(null);
const currentMonth = ref<number | null>(null);

const fetchData = async () => {
  loading.value = true;
  try {
    const params: GetArticleListParams = {
      page: pagination.page,
      pageSize: pagination.pageSize
    };
    if (pageType.value === "category" && currentCategoryName.value) {
      params.category = currentCategoryName.value;
    } else if (pageType.value === "tag" && currentTagName.value) {
      params.tag = currentTagName.value;
    } else if (pageType.value === "archive") {
      if (currentYear.value) params.year = currentYear.value;
      if (currentMonth.value) params.month = currentMonth.value;
    }

    const { data } = await getPublicArticles(params);
    articles.value = data.list;
    pagination.total = data.total;
  } catch (error) {
    console.error("获取文章列表失败:", error);
  } finally {
    loading.value = false;
  }
};

const handlePageChange = (newPage: number) => {
  pagination.page = newPage;
  window.scrollTo({ top: 0, behavior: "smooth" });
};

watch(
  () => route.params,
  newParams => {
    if (pageType.value === "category") {
      currentCategoryName.value = (newParams.name as string) || null;
      currentTagName.value = null;
      currentYear.value = null;
      currentMonth.value = null;
    } else if (pageType.value === "tag") {
      currentTagName.value = (newParams.name as string) || null;
      currentCategoryName.value = null;
      currentYear.value = null;
      currentMonth.value = null;
    } else if (pageType.value === "archive") {
      currentYear.value = newParams.year ? Number(newParams.year) : null;
      currentMonth.value = newParams.month ? Number(newParams.month) : null;
      currentCategoryName.value = null;
      currentTagName.value = null;
    } else {
      currentCategoryName.value = null;
      currentTagName.value = null;
      currentYear.value = null;
      currentMonth.value = null;
    }
    pagination.page = newParams.id ? Number(newParams.id) : 1;
  },
  { immediate: true, deep: true }
);

watch(
  [
    () => pagination.page,
    currentCategoryName,
    currentTagName,
    currentYear,
    currentMonth
  ],
  fetchData,
  {
    immediate: true
  }
);

// 在首页挂载时重置主题色到默认值
onMounted(() => {
  resetThemeToDefault();
});
</script>

<template>
  <div class="post-home-container">
    <div v-if="showHomeTop" class="post-home-top-container">
      <HomeTop />
    </div>

    <div id="content-inner" class="layout">
      <main class="main-content">
        <CategoryBar v-if="pageType === 'home' || pageType === 'category'" />
        <TagBar v-else-if="pageType === 'tag'" />

        <div
          id="recent-posts"
          v-loading="loading"
          class="recent-posts"
          :class="{
            'double-column-container': isDoubleColumn,
            '!justify-center': articles.length === 0
          }"
        >
          <template v-if="!loading && articles.length > 0">
            <Archives
              v-if="pageType === 'archive'"
              :articles="articles"
              :total="pagination.total"
            />
            <template v-else>
              <ArticleCard
                v-for="article in articles"
                :key="article.id"
                :article="article"
                :is-double-column="isDoubleColumn"
              />
            </template>
          </template>
          <el-empty
            v-if="!loading && articles.length === 0"
            description="暂无文章"
          />
        </div>

        <Pagination
          v-if="!loading && pagination.total > pagination.pageSize"
          :page="pagination.page"
          :page-size="pagination.pageSize"
          :total="pagination.total"
          @current-change="handlePageChange"
        />
      </main>

      <Sidebar />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.post-home-top-container {
  width: 100%;
  max-width: 1400px;
  padding: 0 1.5rem;
  margin: 0 auto;
  overflow: hidden;
  user-select: none;
  animation: slide-in 0.6s 0.1s backwards;
}

.layout {
  display: flex;
  gap: 0.625rem;
  max-width: 1400px;
  padding: 0.5rem 1.5rem 1rem;
  margin: 0 auto;
}

.main-content {
  flex: 1;
  min-width: 0;
}

.recent-posts {
  width: 100%;

  &.double-column-container {
    min-height: 400px;
    display: flex;
    flex-wrap: wrap;
    gap: 0.625rem;
    justify-content: space-between;
  }
}

@media screen and (width > 760px) and (width <= 992px) {
  .recent-post-item {
    flex-direction: row !important;
    width: 100% !important;
  }
  .recent-posts.double-column-container {
    min-height: auto;
  }
}

@media (width <= 768px) {
  .post-home-top-container {
    padding: 0 1rem;
  }
}
</style>
