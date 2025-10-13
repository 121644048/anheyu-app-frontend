<!--
 * @Description: 更新日志页面
 * @Author: 安知鱼
 * @Date: 2025-09-26
 * @LastEditTime: 2025-10-02 17:49:51
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
          <!-- 全局版本检查区域 -->
          <div v-if="currentVersion" class="global-version-check">
            <div class="version-info">
              <div class="version-current">
                <span class="version-label">当前版本</span>
                <span class="version-tag">{{ currentVersion }}</span>
              </div>
              <div class="version-status">
                <span
                  :class="[
                    'status-badge',
                    getVersionStatus(currentVersion, changelogs[0])
                  ]"
                >
                  <i class="status-icon">{{
                    getVersionStatusIcon(currentVersion, changelogs[0])
                  }}</i>
                  <span>{{
                    getVersionStatusText(currentVersion, changelogs[0])
                  }}</span>
                </span>
              </div>
            </div>
          </div>

          <div
            v-for="changelog in changelogs"
            :key="changelog.id"
            class="changelog-item"
            :class="{ latest: changelog.isLatest }"
          >
            <div class="changelog-header">
              <div class="changelog-info">
                <h2 class="changelog-title">
                  <FontIcon
                    :icon="changelog.isLatest ? 'ri:star-line' : 'ri:tag-line'"
                    class="changelog-icon"
                  />
                  {{ changelog.tagName }}
                  <span v-if="changelog.isLatest" class="latest-badge"
                    >最新</span
                  >
                  <span v-if="changelog.prerelease" class="prerelease-badge"
                    >预览版</span
                  >
                </h2>
                <div class="changelog-meta">
                  <span class="changelog-date">
                    <FontIcon icon="ri:calendar-line" />
                    {{ formatDate(changelog.publishedAt) }}
                  </span>
                </div>
              </div>
            </div>

            <div class="changelog-body">
              <div
                v-if="changelog.body"
                class="changelog-content"
                v-html="renderParsedContent(changelog)"
              />
              <div v-else class="no-content">暂无详细说明</div>
            </div>
          </div>

          <!-- 加载更多指示器 -->
          <div v-if="loadingMore" class="loading-more">
            <div class="loading-spinner">
              <div class="spinner" />
            </div>
            <p>正在加载更多...</p>
          </div>

          <!-- 没有更多数据提示 -->
          <div v-else-if="!hasMore && changelogs.length > 0" class="no-more">
            <FontIcon icon="ri:check-line" />
            <span>已加载全部 {{ total }} 个版本</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from "vue";
import { ElButton, ElMessage } from "element-plus";
import {
  getChangelogList,
  type Changelog,
  type ChangelogListResponse,
  type ApiResponse
} from "@/api/update";
import { getVersionInfo } from "@/utils/versionManager";
import AnBannerCard from "@/components/AnBannerCard";

const loading = ref(true);
const loadingMore = ref(false);
const error = ref<string>("");
const changelogs = ref<Changelog[]>([]);
const currentPage = ref(1);
const hasMore = ref(true);
const total = ref(0);
const currentVersion = ref<string>(""); // 当前应用版本

// 滚动分页相关
const isNearBottom = ref(false);

const fetchUpdateLog = async () => {
  try {
    loading.value = true;
    error.value = "";

    const response: ApiResponse<ChangelogListResponse> = await getChangelogList(
      {
        page: 1,
        limit: 10,
        detail: true,
        prerelease: false, // 过滤掉预发布版本
        draft: false // 过滤掉草稿版本
      }
    );

    if (response.code === 200) {
      changelogs.value = response.data.list || [];
      total.value = response.data.total || 0;
      currentPage.value = 1;
      hasMore.value =
        response.data.list.length === 10 &&
        response.data.list.length < total.value;
    } else {
      throw new Error(response.message || "获取更新日志失败");
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : "获取更新日志失败";
    console.error("Failed to fetch changelogs:", err);
  } finally {
    loading.value = false;
  }
};

const loadMoreChangelogs = async () => {
  if (!hasMore.value || loadingMore.value) return;

  try {
    loadingMore.value = true;
    const nextPage = currentPage.value + 1;

    const response: ApiResponse<ChangelogListResponse> = await getChangelogList(
      {
        page: nextPage,
        limit: 10,
        detail: true
      }
    );

    if (response.code === 200 && response.data.list.length > 0) {
      changelogs.value.push(...response.data.list);
      currentPage.value = nextPage;
      hasMore.value = changelogs.value.length < total.value;
    } else {
      hasMore.value = false;
    }
  } catch (err) {
    ElMessage.error("加载更多失败");
    console.error("Failed to load more changelogs:", err);
  } finally {
    loadingMore.value = false;
  }
};

// 滚动监听函数
const handleScroll = () => {
  if (loadingMore.value || !hasMore.value) return;

  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const windowHeight = window.innerHeight;
  const documentHeight = document.documentElement.scrollHeight;

  const scrollRatio = (scrollTop + windowHeight) / documentHeight;

  // 当滚动到底部 85% 时触发加载更多
  if (scrollRatio >= 0.85 && !isNearBottom.value) {
    isNearBottom.value = true;
    loadMoreChangelogs();
  } else if (scrollRatio < 0.85) {
    isNearBottom.value = false;
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

// 渲染解析后的结构化内容
const renderParsedContent = (changelog: Changelog) => {
  const { parsedContent } = changelog;
  if (!parsedContent?.sections?.length) {
    return formatReleaseNotes(changelog.body);
  }

  let html = "";

  // 按分类展示更新
  parsedContent.sections
    .filter(section => {
      // 过滤掉相关链接章节
      const title = section.title.toLowerCase();
      return (
        !title.includes("相关链接") &&
        !title.includes("links") &&
        section.count > 0
      );
    })
    .sort((a, b) => a.order - b.order)
    .forEach(section => {
      html += `<div class="changelog-section">
        <div class="section-header">
          <h4 class="section-title">
            <span class="section-icon">${section.icon}</span>
            <span class="section-name">${section.title.replace(section.icon, "").trim()}</span>
          </h4>
        </div>
        <div class="section-content">`;

      section.items.forEach((item, index) => {
        const shortHash = item.commitHash
          ? item.commitHash.substring(0, 7)
          : "";
        html += `<div class="change-item ${item.breaking ? "breaking" : ""}" data-type="${item.type}">
          ${item.scope ? `<span class="change-scope">${item.scope}</span>` : ""}
          <span class="change-message">${item.message}</span>
          ${shortHash ? `<span class="change-hash">${shortHash}</span>` : ""}
          ${item.breaking ? '<span class="breaking-badge">BREAKING</span>' : ""}
        </div>`;
      });

      html += `</div></div>`;
    });

  return html;
};

// 比较版本号
const compareVersions = (v1: string, v2: string): number => {
  // 去掉 v 前缀，但保留 commit 和 dirty 等后缀
  // v1.2.3-1-g817a841-dirty -> 1.2.3-1-g817a841-dirty
  // v1.2.3 -> 1.2.3
  const cleanV1 = v1.replace(/^v/, "");
  const cleanV2 = v2.replace(/^v/, "");

  // 提取主版本号进行比较（x.y.z 部分）
  const extractMainVersion = (version: string): string => {
    const match = version.match(/^(\d+\.\d+\.\d+)/);
    return match ? match[1] : version;
  };

  const mainV1 = extractMainVersion(cleanV1);
  const mainV2 = extractMainVersion(cleanV2);

  const parts1 = mainV1.split(".").map(Number);
  const parts2 = mainV2.split(".").map(Number);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const num1 = parts1[i] || 0;
    const num2 = parts2[i] || 0;

    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }

  return 0;
};

// 获取类型图标
const getTypeIcon = (type: string) => {
  const icons = {
    feat: "🚀",
    fix: "🐛",
    docs: "📚",
    perf: "⚡",
    chore: "🔧",
    refactor: "🔧",
    style: "🔧",
    other: "📝"
  };
  return icons[type] || "📝";
};

// 获取版本状态类名
const getVersionStatus = (current: string, latest?: Changelog): string => {
  if (!latest) return "unknown";

  if (current === latest.tagName) {
    return "current";
  }

  const comparison = compareVersions(current, latest.tagName);
  if (comparison < 0) {
    return "outdated"; // 当前版本低于最新版本
  } else if (comparison > 0) {
    return "newer"; // 当前版本高于最新版本（可能是开发版本）
  }

  return "current";
};

// 获取版本状态图标
const getVersionStatusIcon = (current: string, latest?: Changelog): string => {
  const status = getVersionStatus(current, latest);
  const icons = {
    current: "✅",
    outdated: "⚠️",
    newer: "🚀",
    unknown: "❓"
  };
  return icons[status] || "📱";
};

// 获取版本状态文本
const getVersionStatusText = (current: string, latest?: Changelog): string => {
  const status = getVersionStatus(current, latest);
  const texts = {
    current: "已是最新版本",
    outdated: "有新版本可用",
    newer: "使用开发版本",
    unknown: "版本状态未知"
  };
  return texts[status] || "当前版本";
};

onMounted(async () => {
  // 获取当前应用版本（使用缓存）
  const versionInfo = await getVersionInfo();
  currentVersion.value = versionInfo.version || "";
  console.log("📦 当前应用版本:", currentVersion.value);

  // 获取更新日志列表
  await fetchUpdateLog();

  // 添加滚动监听
  await nextTick();
  window.addEventListener("scroll", handleScroll, { passive: true });
});

// 清理滚动监听
onBeforeUnmount(() => {
  window.removeEventListener("scroll", handleScroll);
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
    padding: 2rem;
    border-radius: 16px;
    background: var(--anzhiyu-card-bg);
    border: var(--style-border);
    width: 100%;
    align-self: flex-start;
    animation: slide-in 0.6s 0.1s backwards;
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    transition: all 0.3s ease 0s;
  }

  // 加载状态
  .loading-state,
  .error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    text-align: center;

    .loading-spinner,
    .error-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
      color: var(--anzhiyu-main);
    }

    .spinner {
      width: 3rem;
      height: 3rem;
      border: 3px solid rgba(99, 102, 241, 0.1);
      border-top: 3px solid var(--anzhiyu-main);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    h3 {
      margin: 0 0 0.5rem;
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--anzhiyu-fontcolor);
    }

    p {
      margin: 0 0 1.5rem;
      color: var(--anzhiyu-secondtext);
      font-size: 1rem;
    }
  }

  // 更新日志列表
  .update-list {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  // 全局版本检查区域
  .global-version-check {
    background: linear-gradient(
      135deg,
      rgba(99, 102, 241, 0.08) 0%,
      rgba(99, 102, 241, 0.03) 100%
    );
    border: 1px solid rgba(99, 102, 241, 0.15);
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 2rem;

    .version-info {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;

      @media (max-width: 768px) {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }
    }

    .version-current {
      display: flex;
      align-items: center;
      gap: 0.75rem;

      .version-label {
        font-size: 0.9rem;
        color: var(--anzhiyu-secondtext);
        font-weight: 500;
      }

      .version-tag {
        background: var(--anzhiyu-main);
        color: white;
        padding: 0.4rem 1rem;
        border-radius: 20px;
        font-size: 0.9rem;
        font-weight: 600;
        font-family: "Monaco", "Menlo", monospace;
      }
    }

    .version-status {
      .status-badge {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        border-radius: 20px;
        font-size: 0.85rem;
        font-weight: 500;

        &.current {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.2);
        }

        &.outdated {
          background: rgba(245, 158, 11, 0.1);
          color: #f59e0b;
          border: 1px solid rgba(245, 158, 11, 0.2);
        }

        &.newer {
          background: rgba(99, 102, 241, 0.1);
          color: var(--anzhiyu-main);
          border: 1px solid rgba(99, 102, 241, 0.2);
        }

        &.unknown {
          background: rgba(107, 114, 128, 0.1);
          color: #6b7280;
          border: 1px solid rgba(107, 114, 128, 0.2);
        }

        .status-icon {
          font-size: 1rem;
          font-style: normal;
        }
      }
    }
  }

  // 更新日志项目
  .changelog-item {
    background: var(--anzhiyu-card-bg);
    border: 1px solid var(--anzhiyu-card-border);
    border-radius: 12px;
    margin-bottom: 2rem;
    padding: 1.5rem;
    transition: all 0.3s ease;

    &.latest {
      border-color: var(--anzhiyu-main);
      background: linear-gradient(
        135deg,
        rgba(99, 102, 241, 0.03) 0%,
        rgba(99, 102, 241, 0.01) 100%
      );

      &::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: linear-gradient(
          90deg,
          var(--anzhiyu-main),
          var(--anzhiyu-main-light)
        );
        border-radius: 12px 12px 0 0;
      }
    }
  }

  // 更新日志头部
  .changelog-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1.5rem;
    gap: 1rem;

    @media (max-width: 768px) {
      flex-direction: column;
      gap: 1rem;
    }
  }

  .changelog-info {
    flex: 1;
    min-width: 0;
  }

  .changelog-title {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin: 0 0 0.75rem;
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--anzhiyu-fontcolor);
    line-height: 1.4;

    .changelog-icon {
      font-size: 1.25rem;
      color: var(--anzhiyu-main);
      flex-shrink: 0;
    }

    .latest-badge {
      background: linear-gradient(
        135deg,
        var(--anzhiyu-main),
        var(--anzhiyu-main-light)
      );
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 500;
      margin-left: auto;
    }

    .prerelease-badge {
      background: #f59e0b;
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 500;
    }
  }

  .changelog-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 1.5rem;
    color: var(--anzhiyu-secondtext);
    font-size: 0.9rem;

    span {
      display: flex;
      align-items: center;
      gap: 0.5rem;

      i {
        font-size: 1rem;
      }
    }
  }

  // 更新日志内容
  .changelog-body {
    position: relative;
    margin-top: 1rem;
    padding: 0;

    .no-content {
      text-align: center;
      padding: 3rem 2rem;
      color: var(--anzhiyu-secondtext);
      font-style: italic;
      font-size: 1rem;
      background: rgba(0, 0, 0, 0.02);
      border-radius: 8px;
      border: 2px dashed var(--anzhiyu-card-border);
    }
  }

  .changelog-content {
    color: var(--anzhiyu-fontcolor);
    line-height: 1.7;

    // 更新章节样式
    :deep(.changelog-section) {
      .section-header {
        margin-bottom: 1.25rem;
      }

      .section-title {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin: 0;
        font-size: 1.15rem;
        font-weight: 600;
        color: var(--anzhiyu-fontcolor);
        padding: 1rem 0 0.75rem;
        border-bottom: 2px solid var(--anzhiyu-card-border);

        .section-icon {
          font-size: 1.25rem;
        }

        .section-name {
          flex: 1;
        }

        .section-count {
          background: var(--anzhiyu-main);
          color: var(--anzhiyu-white);
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 500;
          min-width: 2rem;
          text-align: center;
        }
      }

      .section-content {
        margin-top: 0.5rem;
      }

      .change-item {
        display: flex;
        align-items: center;
        padding: 0.25rem 0;
        gap: 0.5rem;
        transition: all 0.2s ease;

        &.breaking {
          background: rgba(239, 68, 68, 0.03);
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
        }

        .change-scope {
          background: var(--anzhiyu-main);
          color: var(--anzhiyu-white);
          padding: 0.15rem 0.4rem;
          border-radius: 8px;
          font-size: 0.7rem;
          font-weight: 500;
          text-transform: uppercase;
          width: 5rem;
          text-align: center;
          flex-shrink: 0;
        }

        .change-message {
          flex: 1;
          font-size: 0.9rem;
          line-height: 1.4;
          color: var(--anzhiyu-fontcolor);
          margin: 0;
        }

        .change-hash {
          background: rgba(0, 0, 0, 0.05);
          color: #6b7280;
          padding: 0.15rem 0.4rem;
          border-radius: 4px;
          font-family: "Monaco", "Menlo", monospace;
          font-size: 0.7rem;
          flex-shrink: 0;
        }

        .breaking-badge {
          background: #ef4444;
          color: white;
          padding: 0.15rem 0.4rem;
          border-radius: 8px;
          font-size: 0.65rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          flex-shrink: 0;
        }
      }
    }

    // 通用 Markdown 样式
    :deep(h1),
    :deep(h2),
    :deep(h3),
    :deep(h4),
    :deep(h5),
    :deep(h6) {
      margin: 1.5rem 0 0.75rem;
      font-weight: 600;
      line-height: 1.3;
      color: var(--anzhiyu-fontcolor);

      &:first-child {
        margin-top: 0;
      }
    }

    :deep(p) {
      margin: 1rem 0;
      line-height: 1.7;
    }

    :deep(strong) {
      font-weight: 600;
      color: var(--anzhiyu-fontcolor);
    }

    :deep(em) {
      font-style: italic;
      color: var(--anzhiyu-secondtext);
    }
  }

  // 加载更多和完成状态
  .loading-more,
  .no-more {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    padding: 2rem;
    color: var(--anzhiyu-secondtext);
    font-size: 0.9rem;

    .loading-spinner .spinner {
      width: 1.5rem;
      height: 1.5rem;
      border-width: 2px;
    }
  }

  .no-more {
    background: rgba(16, 185, 129, 0.06);
    border-radius: 8px;
    color: #10b981;

    i {
      color: #10b981;
      font-size: 1.25rem;
    }
  }
}

// 动画定义
@keyframes slide-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// 响应式设计
@media (max-width: 768px) {
  .update-page {
    padding: 1rem;

    .update-content {
      padding: 1.5rem;
      margin-top: 1rem;
      border-radius: 12px;
    }

    .changelog-item {
      padding: 1.25rem;
      margin-bottom: 1.5rem;
    }

    .changelog-title {
      font-size: 1.25rem;
      flex-wrap: wrap;

      .latest-badge,
      .prerelease-badge {
        margin-left: 0;
        margin-top: 0.5rem;
      }
    }

    .changelog-meta {
      gap: 1rem;
    }

    .global-version-check {
      .version-info {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }
    }

    .change-item {
      .change-meta {
        gap: 0.5rem;
      }
    }
  }
}
</style>
