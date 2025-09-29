<template>
  <div class="custom-page-container">
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="10" animated />
    </div>
    <div v-else-if="error" class="error-container">
      <el-result
        :icon="error === '页面不存在' ? 'warning' : 'error'"
        :title="error === '页面不存在' ? '404 - 页面不存在' : '页面加载失败'"
        :sub-title="
          error === '页面不存在' ? '抱歉，您访问的页面不存在或已被删除' : error
        "
      >
        <template #extra>
          <el-button
            v-if="error !== '页面不存在'"
            type="primary"
            @click="loadPage"
            >重试</el-button
          >
          <el-button
            v-if="error === '页面不存在'"
            type="primary"
            @click="$router.push('/')"
            >返回首页</el-button
          >
        </template>
      </el-result>
    </div>
    <div v-else class="page-content" v-html="pageContent" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { getCustomPage } from "@/api/custom-page";

const route = useRoute();
const router = useRouter();
const loading = ref(true);
const error = ref("");
const pageData = ref<any>(null);

// 计算当前页面路径
const currentPath = computed(() => {
  // 如果是动态路由，从params中获取路径
  if (route.params.pathMatch) {
    return "/" + route.params.pathMatch;
  }
  return route.path;
});

// 页面内容
const pageContent = computed(() => {
  if (!pageData.value) return "";
  return pageData.value.content || "";
});

// 加载页面数据
const loadPage = async () => {
  loading.value = true;
  error.value = "";

  try {
    const response: any = await getCustomPage(currentPath.value);
    if (response.code === 200 && response.data) {
      pageData.value = response.data;
      // 更新页面标题
      if (pageData.value.title) {
        document.title = pageData.value.title;
      }
    } else {
      error.value = response.message || "页面加载失败";
    }
  } catch (err: any) {
    console.error("加载页面失败:", err);

    // 检查是否是404错误
    if (err.response && err.response.status === 404) {
      error.value = "页面不存在";
      document.title = "404 - 页面不存在";
    } else if (
      err.response &&
      err.response.data &&
      err.response.data.code === 404
    ) {
      // 后端返回的业务层404
      error.value = "页面不存在";
      document.title = "404 - 页面不存在";
    } else {
      error.value = err.message || "页面加载失败";
      ElMessage.error("页面加载失败");
    }
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadPage();
});
</script>

<style scoped lang="scss">
.custom-page-container {
  max-width: 1400px;
  padding: 0 1.5rem;
  margin: 0 auto;
}

.loading-container {
  max-width: 800px;
  padding: 0 1rem;
  margin: 0 auto;
}

.error-container {
  max-width: 600px;
  padding: 2rem 1rem;
  margin: 0 auto;
}

.page-content {
  width: 100%;
  padding: 1rem;
  background: var(--anzhiyu-card-bg);
  border: var(--style-border);
  border-radius: 12px;

  // 样式化HTML内容
  :deep(h1) {
    margin-bottom: 1.5rem;
    font-size: 2.5rem;
    font-weight: bold;
    color: var(--el-text-color-primary);
  }

  :deep(h2) {
    margin: 2rem 0 1rem;
    font-size: 2rem;
    font-weight: bold;
    color: var(--el-text-color-primary);
  }

  :deep(h3) {
    margin: 1.5rem 0 0.75rem;
    font-size: 1.5rem;
    font-weight: bold;
    color: var(--el-text-color-primary);
  }

  :deep(p) {
    margin-bottom: 1rem;
    line-height: 1.6;
    color: var(--el-text-color-regular);
  }

  :deep(ul),
  :deep(ol) {
    padding-left: 2rem;
    margin: 1rem 0;

    li {
      margin-bottom: 0.5rem;
      line-height: 1.6;
      color: var(--el-text-color-regular);
    }
  }

  :deep(strong) {
    font-weight: bold;
    color: var(--el-text-color-primary);
  }

  :deep(a) {
    color: var(--el-color-primary);
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  :deep(blockquote) {
    padding: 1rem;
    margin: 1rem 0;
    color: var(--el-text-color-regular);
    background-color: var(--el-bg-color-page);
    border-left: 4px solid var(--el-color-primary);
  }

  :deep(code) {
    padding: 0.2rem 0.4rem;
    font-family: Monaco, Menlo, "Ubuntu Mono", monospace;
    font-size: 0.9em;
    background-color: var(--el-bg-color-page);
    border-radius: 4px;
  }

  :deep(pre) {
    padding: 1rem;
    margin: 1rem 0;
    overflow-x: auto;
    background-color: var(--el-bg-color-page);
    border-radius: 8px;

    code {
      padding: 0;
      background: none;
    }
  }
}
</style>
