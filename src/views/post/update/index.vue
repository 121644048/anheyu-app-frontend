<!--
 * @Description: 更新日志页面
 * @Author: 安知鱼
 * @Date: 2025-09-26
 * @LastEditTime: 2025-09-26
 * @LastEditors: 安知鱼
-->
<template>
  <div class="update-page">
    <AnBannerCard
      tips="更新日志"
      title="更新日志"
      description="每一次更新，都是一次成长"
      background-image="https://upload-bbs.miyoushe.com/upload/2025/09/26/125766904/00961b9c22d3e633de8294555f3a3375_2015751252958610528.png?x-oss-process=image/format,avif"
      :height="300"
    />
    <!-- 更新内容 -->
    <div class="update-content">
      <div class="container">
        <!-- 加载状态 -->
        <div v-if="loading" class="loading-state">
          <div class="loading-spinner">
            <div class="spinner" />
          </div>
          <p>正在获取更新日志...</p>
        </div>

        <!-- 错误状态 -->
        <div v-else-if="error" class="error-state">
          <FontIcon icon="ri:error-warning-line" class="error-icon" />
          <h3>获取更新日志失败</h3>
          <p>{{ error }}</p>
          <el-button type="primary" @click="fetchUpdateLog">重试</el-button>
        </div>

        <!-- 更新日志列表 -->
        <div v-else class="update-list">
          <div
            v-for="(release, index) in releases"
            :key="release.id"
            class="release-item"
            :class="{ latest: index === 0 }"
          >
            <div class="release-header">
              <div class="release-info">
                <h2 class="release-title">
                  <FontIcon
                    :icon="index === 0 ? 'ri:star-line' : 'ri:tag-line'"
                    class="release-icon"
                  />
                  {{ release.tag_name }}
                  <span v-if="index === 0" class="latest-badge">最新</span>
                </h2>
                <div class="release-meta">
                  <span class="release-date">
                    <FontIcon icon="ri:calendar-line" />
                    {{ formatDate(release.published_at) }}
                  </span>
                  <span class="release-author">
                    <FontIcon icon="ri:user-line" />
                    {{ release.author?.login || "安知鱼" }}
                  </span>
                </div>
              </div>
              <div class="release-actions">
                <el-button
                  type="primary"
                  size="small"
                  :icon="'ri:download-line'"
                  @click="downloadRelease(release.zipball_url)"
                >
                  下载
                </el-button>
                <el-button
                  size="small"
                  :icon="'ri:external-link-line'"
                  @click="viewOnGitHub(release.html_url)"
                >
                  在GitHub上查看
                </el-button>
              </div>
            </div>

            <div class="release-body">
              <div
                v-if="release.body"
                class="release-notes"
                v-html="formatReleaseNotes(release.body)"
              />
              <div v-else class="no-notes">暂无详细说明</div>
            </div>
          </div>

          <!-- 加载更多 -->
          <div v-if="hasMore" class="load-more">
            <el-button
              :loading="loadingMore"
              type="text"
              @click="loadMoreReleases"
            >
              加载更多
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { ElButton, ElMessage } from "element-plus";
import { getGitHubReleases, type GitHubRelease } from "@/api/update";
import AnBannerCard from "@/components/AnBannerCard";

const loading = ref(true);
const loadingMore = ref(false);
const error = ref<string>("");
const releases = ref<GitHubRelease[]>([]);
const currentPage = ref(1);
const hasMore = ref(true);

const fetchUpdateLog = async () => {
  try {
    loading.value = true;
    error.value = "";

    const response = await getGitHubReleases(1, 10);
    releases.value = response.data || [];
    currentPage.value = 1;
    hasMore.value = response.data?.length === 10;
  } catch (err) {
    error.value = err instanceof Error ? err.message : "获取更新日志失败";
    console.error("Failed to fetch releases:", err);
  } finally {
    loading.value = false;
  }
};

const loadMoreReleases = async () => {
  try {
    loadingMore.value = true;
    const nextPage = currentPage.value + 1;

    const response = await getGitHubReleases(nextPage, 10);
    if (response.data && response.data.length > 0) {
      releases.value.push(...response.data);
      currentPage.value = nextPage;
      hasMore.value = response.data.length === 10;
    } else {
      hasMore.value = false;
    }
  } catch (err) {
    ElMessage.error("加载更多失败");
    console.error("Failed to load more releases:", err);
  } finally {
    loadingMore.value = false;
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

const formatReleaseNotes = (body: string) => {
  if (!body) return "";

  // 简单的 Markdown 转 HTML
  return body
    .replace(/### (.*$)/gim, "<h3>$1</h3>")
    .replace(/## (.*$)/gim, "<h2>$1</h2>")
    .replace(/# (.*$)/gim, "<h1>$1</h1>")
    .replace(/\*\*(.*?)\*\*/gim, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/gim, "<em>$1</em>")
    .replace(/\n/gim, "<br>");
};

const downloadRelease = (url: string) => {
  window.open(url, "_blank");
};

const viewOnGitHub = (url: string) => {
  window.open(url, "_blank");
};

onMounted(() => {
  fetchUpdateLog();
});
</script>

<style scoped lang="scss">
.update-page {
  max-width: 1400px;
  padding: 1.5rem;
  margin: 0 auto;
  .update-content {
    margin-top: 1.5rem;
    box-shadow: var(--anzhiyu-shadow-border);
    padding: 1.25rem 2.5rem;
    border-radius: 12px;
    background: var(--anzhiyu-card-bg);
    border: var(--style-border);
    width: 100%;
    align-self: flex-start;
    animation: slide-in 0.6s 0.1s backwards;
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 0.625rem;
    transition: all 0.3s ease 0s;
  }
}
</style>
