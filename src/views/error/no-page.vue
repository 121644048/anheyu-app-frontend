<!--
 * @Description: 404页面
 * @Author: 安知鱼
 * @Date: 2025-08-05 14:15:50
 * @LastEditTime: 2025-08-31 22:11:46
 * @LastEditors: 安知鱼
-->
<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { House, ArrowLeft } from "@element-plus/icons-vue";

defineOptions({
  name: "NotFound"
});

const route = useRoute();
const router = useRouter();

// 获取用户访问的路径
const fromPath = computed(() => {
  return (route.query.from as string) || "未知页面";
});

// 返回首页
const goHome = () => {
  router.push("/");
};

// 返回上一页
const goBack = () => {
  if (window.history.length > 1) {
    router.back();
  } else {
    goHome();
  }
};
</script>

<template>
  <div class="not-found-container">
    <div class="not-found-content">
      <div class="error-code">404</div>
      <div class="error-title">页面不存在</div>
      <div class="error-description">抱歉，您访问的页面不存在或已被删除</div>
      <div v-if="fromPath && fromPath !== '未知页面'" class="error-path">
        访问路径：<code>{{ fromPath }}</code>
      </div>
      <div class="error-actions">
        <el-button type="primary" size="large" @click="goHome">
          <el-icon><House /></el-icon>
          返回首页
        </el-button>
        <el-button size="large" @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          返回上页
        </el-button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.not-found-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  background: var(--el-bg-color);
}

.not-found-content {
  max-width: 600px;
  text-align: center;
}

.error-code {
  margin-bottom: 1rem;
  font-size: 8rem;
  font-weight: bold;
  line-height: 1;
  color: var(--el-color-primary);
  text-shadow: 2px 2px 4px rgb(0 0 0 / 10%);
}

.error-title {
  margin-bottom: 1rem;
  font-size: 2rem;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.error-description {
  margin-bottom: 1.5rem;
  font-size: 1.1rem;
  line-height: 1.6;
  color: var(--el-text-color-regular);
}

.error-path {
  padding: 1rem;
  margin-bottom: 2rem;
  font-size: 0.9rem;
  color: var(--el-text-color-secondary);
  background: var(--el-bg-color-page);
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;

  code {
    padding: 0.2rem 0.4rem;
    font-family: Monaco, Menlo, "Ubuntu Mono", monospace;
    color: var(--el-color-danger);
    background: var(--el-bg-color-page);
    border-radius: 4px;
  }
}

.error-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: center;

  .el-button {
    min-width: 120px;
  }
}

@media (width <= 768px) {
  .error-code {
    font-size: 6rem;
  }

  .error-title {
    font-size: 1.5rem;
  }

  .error-actions {
    flex-direction: column;
    align-items: center;

    .el-button {
      width: 100%;
      max-width: 300px;
    }
  }
}
</style>
