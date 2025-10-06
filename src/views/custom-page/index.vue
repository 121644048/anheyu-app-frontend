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
    <div v-else>
      <div class="page-content" v-html="pageContent" />
      <!-- 评论组件 -->
      <PostComment
        v-if="showComment"
        ref="commentRef"
        :target-path="currentPath"
        class="page-comment"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { getCustomPage } from "@/api/custom-page";
import PostComment from "@/views/post/components/PostComment/index.vue";

const route = useRoute();
const router = useRouter();
const loading = ref(true);
const error = ref("");
const pageData = ref<any>(null);
const commentRef = ref<InstanceType<typeof PostComment> | null>(null);
const pageContentRef = ref<HTMLElement | null>(null);

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

// 是否显示评论
const showComment = computed(() => {
  return pageData.value?.show_comment === true;
});

// 执行页面中的 script 标签
const executeScripts = () => {
  nextTick(() => {
    const pageContentElement = document.querySelector(
      ".page-content"
    ) as HTMLElement;
    if (!pageContentElement) return;

    // 查找所有 script 标签
    const scripts = pageContentElement.querySelectorAll("script");
    scripts.forEach(oldScript => {
      // 创建新的 script 标签
      const newScript = document.createElement("script");

      // 复制属性
      Array.from(oldScript.attributes).forEach(attr => {
        newScript.setAttribute(attr.name, attr.value);
      });

      // 复制内容
      newScript.textContent = oldScript.textContent;

      // 替换旧的 script 标签以触发执行
      if (oldScript.parentNode) {
        oldScript.parentNode.replaceChild(newScript, oldScript);
      }
    });
  });
};

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

// 监听页面内容变化，执行其中的 script
watch(pageContent, () => {
  executeScripts();
});

onMounted(() => {
  loadPage();
});
</script>

<style lang="scss">
// 引入文章内容基础样式
@use "@/style/article-content-base.scss" as *;

// 应用文章内容样式到自定义页面
.custom-page-container {
  .page-content {
    // 应用所有文章内容基础样式
    @include article-content-base;
  }
}
</style>

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
  padding: 1.5rem;
  margin-bottom: 1rem;
  background: var(--anzhiyu-card-bg);
  border: var(--style-border);
  border-radius: 12px;
  line-height: 1.8;
  color: var(--el-text-color-regular);
}

.page-comment {
  width: 100%;
  padding: 1rem;
  background: var(--anzhiyu-card-bg);
  border: var(--style-border);
  border-radius: 12px;
}
</style>
