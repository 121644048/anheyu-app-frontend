<template>
  <div class="welcome-dashboard">
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner" />
      <p>正在加载统计数据...</p>
    </div>

    <div v-if="error" class="error-overlay">
      <div class="error-card">
        <div class="error-icon">😕</div>
        <h3>数据加载失败</h3>
        <p>{{ error }}</p>
        <button class="retry-btn" @click="retryLoad">重试</button>
      </div>
    </div>

    <div v-if="!loading && !error" class="dashboard-content">
      <header class="dashboard-header">
        <div class="header-text">
          <h1>欢迎回来, {{ username }} 👋</h1>
          <p>{{ currentTime }}</p>
        </div>
      </header>

      <main class="dashboard-grid">
        <div class="main-column">
          <section class="stats-overview">
            <div class="stats-grid">
              <div class="stat-item">
                <div class="stat-label">今日访问</div>
                <div class="stat-value">
                  {{ statistics.today_visitors || 0 }}
                </div>
                <div
                  class="stat-change"
                  :class="
                    getChangeClass(
                      statistics.today_visitors,
                      statistics.yesterday_visitors
                    )
                  "
                >
                  {{
                    getChangeText(
                      statistics.today_visitors,
                      statistics.yesterday_visitors
                    )
                  }}
                  vs 昨日
                </div>
              </div>

              <div class="stat-item">
                <div class="stat-label">今日浏览量</div>
                <div class="stat-value">{{ statistics.today_views || 0 }}</div>
                <div
                  class="stat-change"
                  :class="
                    getChangeClass(
                      statistics.today_views,
                      statistics.yesterday_views
                    )
                  "
                >
                  {{
                    getChangeText(
                      statistics.today_views,
                      statistics.yesterday_views
                    )
                  }}
                  vs 昨日
                </div>
              </div>

              <div class="stat-item">
                <div class="stat-label">文章总数</div>
                <div class="stat-value">{{ articleStats.total || 0 }}</div>
                <div class="stat-sub">
                  已发布 {{ articleStats.published || 0 }} 篇
                </div>
              </div>

              <div class="stat-item">
                <div class="stat-label">本月浏览量</div>
                <div class="stat-value">{{ statistics.month_views || 0 }}</div>
                <div class="stat-sub">
                  年度 {{ statistics.year_views || 0 }}
                </div>
              </div>
            </div>
          </section>
        </div>

        <div class="side-column">
          <section class="card top-pages-section">
            <h3 class="card-header">热门页面 TOP 10</h3>
            <div class="pages-list">
              <div class="list-header">
                <span>页面</span>
                <span>浏览量</span>
                <span>独立访客</span>
                <span>停留时间</span>
                <span>跳出率</span>
              </div>
              <ul>
                <li
                  v-for="page in statisticsSummary.top_pages"
                  :key="page.url_path"
                >
                  <CustomTooltip :content="page.url_path" placement="top">
                    <span class="page-path" :title="page.url_path">{{
                      page.url_path
                    }}</span>
                  </CustomTooltip>
                  <span class="page-views">{{ page.total_views }}</span>
                  <span class="page-unique">{{ page.unique_views }}</span>
                  <span class="page-duration">{{
                    formatDuration(page.avg_duration)
                  }}</span>
                  <span class="page-bounce">{{
                    formatPercentage(page.bounce_rate)
                  }}</span>
                </li>
              </ul>
            </div>
          </section>

          <section class="card analytics-section">
            <h3 class="card-header">访客分析 (最近7天)</h3>
            <div class="analytics-grid">
              <div class="analytics-item">
                <h4>城市</h4>
                <ul>
                  <li
                    v-for="c in getSortedAnalytics(
                      statisticsSummary.analytics.top_cities
                    )"
                    :key="c.city"
                  >
                    <span>{{ c.city || "未知" }}</span>
                    <span>{{ c.count }}</span>
                  </li>
                </ul>
              </div>
              <div class="analytics-item">
                <h4>浏览器</h4>
                <ul>
                  <li
                    v-for="b in getSortedAnalytics(
                      statisticsSummary.analytics.top_browsers
                    )"
                    :key="b.browser"
                  >
                    <span>{{ b.browser || "未知" }}</span>
                    <span>{{ b.count }}</span>
                  </li>
                </ul>
              </div>
              <div class="analytics-item">
                <h4>操作系统</h4>
                <ul>
                  <li
                    v-for="os in getSortedAnalytics(
                      statisticsSummary.analytics.top_os
                    )"
                    :key="os.os"
                  >
                    <span>{{ os.os || "未知" }}</span>
                    <span>{{ os.count }}</span>
                  </li>
                </ul>
              </div>
              <div class="analytics-item">
                <h4>设备</h4>
                <ul>
                  <li
                    v-for="d in getSortedAnalytics(
                      statisticsSummary.analytics.top_devices
                    )"
                    :key="d.device"
                  >
                    <span>{{ d.device || "未知" }}</span>
                    <span>{{ d.count }}</span>
                  </li>
                </ul>
              </div>
            </div>

            <div class="referer-section">
              <h4>访问来源</h4>
              <ul class="referer-list">
                <li
                  v-for="r in getSortedAnalytics(
                    statisticsSummary.analytics.top_referers
                  )"
                  :key="r.referer"
                >
                  <span>{{ r.referer || "直接访问" }}</span>
                  <span>{{ r.count }}</span>
                </li>
              </ul>
            </div>
          </section>
        </div>

        <section class="card visitor-logs-section">
          <h3 class="card-header">访客记录</h3>
          <div
            v-if="logsLoading"
            class="loading-overlay"
            style="position: relative; inset: auto"
          >
            <div class="loading-spinner" />
            <p>正在加载访客记录...</p>
          </div>
          <div v-else class="visitor-table-wrapper">
            <div class="list-header">
              <span>UA</span>
              <span>IP</span>
              <span>城市</span>
              <span>访问页面</span>
              <span>停留时间</span>
            </div>
            <div class="pages-list">
              <ul>
                <li
                  v-for="item in visitorLogs"
                  :key="item.created_at + item.ip_address + item.url_path"
                >
                  <CustomTooltip :content="item.user_agent" placement="top">
                    <span class="ua-text" :title="item.user_agent">
                      {{ item.user_agent || "-" }}
                    </span>
                  </CustomTooltip>
                  <span class="ip-text">{{ item.ip_address || "-" }}</span>
                  <span class="city-text">{{ item.city || "未知" }}</span>
                  <CustomTooltip :content="item.url_path" placement="top">
                    <span class="page-path" :title="item.url_path">
                      {{ item.url_path }}
                    </span>
                  </CustomTooltip>
                  <span class="page-duration">
                    {{ formatDuration(item.duration) }}
                  </span>
                </li>
              </ul>
            </div>
            <div v-if="logsTotal > logsPageSize" class="pagination">
              <button
                class="retry-btn"
                :disabled="logsPage <= 1"
                @click="() => loadVisitorLogs(logsPage - 1)"
              >
                上一页
              </button>
              <span class="pagination-info">
                第 {{ logsPage }} 页 / 共
                {{ Math.max(1, Math.ceil(logsTotal / logsPageSize)) }}
                页
              </span>
              <button
                class="retry-btn"
                :disabled="logsPage >= Math.ceil(logsTotal / logsPageSize)"
                @click="() => loadVisitorLogs(logsPage + 1)"
              >
                下一页
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, computed } from "vue";
import {
  getStatistics,
  getStatisticsSummary,
  getVisitorAnalytics,
  getTopPages,
  getVisitorTrend,
  getVisitorLogs
} from "@/api/statistics";
import { getArticleList } from "@/api/post";
import type { StatisticData } from "@/types/about";
import CustomTooltip from "@/components/CustomTooltip/index.vue";
import { useNav } from "@/layout/hooks/useNav";

defineOptions({
  name: "Welcome"
});

// 响应式数据
const loading = ref(true);
const error = ref<string | null>(null);

const statistics = ref<StatisticData>({
  today_visitors: 0,
  today_views: 0,
  yesterday_visitors: 0,
  yesterday_views: 0,
  month_views: 0,
  year_views: 0
});

const articleStats = ref({
  total: 0,
  published: 0
});

const statisticsSummary = ref({
  basic_stats: {
    today_visitors: 0,
    today_views: 0,
    yesterday_visitors: 0,
    yesterday_views: 0,
    month_views: 0,
    year_views: 0
  },
  top_pages: [],
  analytics: {
    top_countries: [],
    top_cities: [],
    top_browsers: [],
    top_os: [],
    top_devices: [],
    top_referers: []
  },
  trend_data: {
    daily: [],
    weekly: [],
    monthly: []
  }
});

// 仅保留前10条来源数据
function limitTopReferers<T extends { top_referers?: unknown[] }>(
  analytics: T
): T {
  if (analytics && Array.isArray((analytics as any).top_referers)) {
    (analytics as any).top_referers = (analytics as any).top_referers.slice(
      0,
      10
    );
  }
  return analytics;
}

// 访客记录与分页
type VisitorLogItem = {
  user_agent: string;
  ip_address: string;
  city: string;
  url_path: string;
  duration: number;
  created_at: string;
};

const visitorLogs = ref<VisitorLogItem[]>([]);
const logsLoading = ref(false);
const logsPage = ref(1);
const logsPageSize = ref(20);
const logsTotal = ref(0);

const loadVisitorLogs = async (page = logsPage.value) => {
  logsLoading.value = true;
  try {
    const { data } = await getVisitorLogs({
      page,
      page_size: logsPageSize.value
    });
    if (data) {
      visitorLogs.value = data.list || [];
      logsTotal.value = data.total || 0;
      logsPage.value = data.page || page;
      logsPageSize.value = data.page_size || logsPageSize.value;
    }
  } catch (e) {
    console.error("加载访客日志失败:", e);
  } finally {
    logsLoading.value = false;
  }
};

// 计算属性
const currentTime = computed(() => {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long"
  };
  return now.toLocaleDateString("zh-CN", options);
});

const { username } = useNav();

const loadStatisticsSummary = async () => {
  try {
    const response = await getStatisticsSummary();

    if (response.data) {
      if (response.data.basic_stats) {
        statisticsSummary.value.basic_stats = response.data.basic_stats;
        statistics.value = response.data.basic_stats;
      }
      if (response.data.top_pages) {
        statisticsSummary.value.top_pages = response.data.top_pages;
      }
      if (response.data.analytics) {
        statisticsSummary.value.analytics = limitTopReferers(
          response.data.analytics
        );
      } else {
        await loadVisitorAnalyticsDirectly();
      }
      if (response.data.trend_data) {
        statisticsSummary.value.trend_data = {
          daily: response.data.trend_data.daily || [],
          weekly: response.data.trend_data.weekly || [],
          monthly: response.data.trend_data.monthly || []
        };
      }
    } else {
      await loadAllStatisticsSeparately();
    }
  } catch (error) {
    console.error("加载统计概览失败:", error);
    await loadAllStatisticsSeparately();
  }
};

const loadArticleStats = async () => {
  try {
    const response = await getArticleList({ page: 1, pageSize: 1 });
    if (response.data) {
      articleStats.value.total = response.data.total;
      const publishedResponse = await getArticleList({
        page: 1,
        pageSize: 1,
        status: "PUBLISHED"
      });
      if (publishedResponse.data) {
        articleStats.value.published = publishedResponse.data.total;
      }
    }
  } catch (error) {
    console.error("加载文章统计失败:", error);
  }
};

const getChangeClass = (current: number, previous: number) => {
  if (previous === 0) {
    return current > 0 ? "positive" : "neutral";
  }
  if (current > previous) return "positive";
  if (current < previous) return "negative";
  return "neutral";
};

const getChangeText = (current: number, previous: number) => {
  if (previous === 0) {
    return current > 0 ? "新增" : "持平";
  }
  if (current === previous) return "持平";
  const change = current - previous;
  const percentage = Math.abs(Math.round((change / previous) * 100));
  if (isNaN(percentage)) return "持平";
  return change > 0 ? `↑ ${percentage}%` : `↓ ${percentage}%`;
};

const formatDuration = (seconds: number) => {
  if (!seconds) return "0秒";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes > 0) {
    return `${minutes}分${remainingSeconds.toFixed(2)}秒`;
  }
  return `${remainingSeconds.toFixed(2)}秒`;
};

const formatPercentage = (value: number) => {
  if (!value) return "0%";
  return `${(value * 100).toFixed(1)}%`;
};

const getSortedAnalytics = (data: any[]) => {
  if (!Array.isArray(data)) return [];
  return [...data].sort((a, b) => (b.count || 0) - (a.count || 0));
};

const loadVisitorAnalyticsDirectly = async () => {
  try {
    const response = await getVisitorAnalytics();
    if (response.data) {
      statisticsSummary.value.analytics = limitTopReferers(response.data);
    }
  } catch (error) {
    console.error("访客分析接口调用失败:", error);
  }
};

const loadAllStatisticsSeparately = async () => {
  try {
    const [basicStats, analytics, topPages, trendData] =
      await Promise.allSettled([
        getStatistics(),
        getVisitorAnalytics(),
        getTopPages(10),
        getVisitorTrend("daily", 30)
      ]);

    if (basicStats.status === "fulfilled" && basicStats.value.data) {
      statistics.value = basicStats.value.data;
      statisticsSummary.value.basic_stats = basicStats.value.data;
    }
    if (analytics.status === "fulfilled" && analytics.value.data) {
      statisticsSummary.value.analytics = limitTopReferers(
        analytics.value.data
      );
    }
    if (topPages.status === "fulfilled" && topPages.value.data) {
      statisticsSummary.value.top_pages = topPages.value.data;
    }
    if (trendData.status === "fulfilled" && trendData.value.data) {
      statisticsSummary.value.trend_data = trendData.value.data;
    }
  } catch (error) {
    console.error("单独调用统计接口失败:", error);
  }
};

const retryLoad = async () => {
  error.value = null;
  loading.value = true;
  try {
    await Promise.all([loadStatisticsSummary(), loadArticleStats()]);
  } catch (err) {
    error.value = "重试加载失败，请检查网络连接";
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  try {
    await Promise.all([loadStatisticsSummary(), loadArticleStats()]);
    // 独立加载访客日志
    await loadVisitorLogs(1);
  } catch (err) {
    error.value = "数据加载失败，请检查网络连接或联系管理员";
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped lang="scss">
.welcome-dashboard {
  min-height: 100vh;
  color: var(--anzhiyu-fontcolor);
}

.loading-overlay,
.error-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--anzhiyu-secondtext);
  background: var(--anzhiyu-maskbgdeep);
  backdrop-filter: blur(8px);
}

.loading-spinner {
  width: 48px;
  height: 48px;
  margin-bottom: 1rem;
  border: 3px solid var(--anzhiyu-theme-op);
  border-top-color: var(--anzhiyu-theme);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-card {
  padding: 2.5rem;
  margin: 1rem;
  text-align: center;
  background: var(--anzhiyu-card-bg);
  border: var(--style-border);
  border-radius: 12px;
  box-shadow: var(--anzhiyu-shadow-border);
  transition: var(--anzhiyu-transition-duration);
}

.error-icon {
  margin-bottom: 1rem;
  font-size: 3rem;
}

.error-card h3 {
  margin-bottom: 0.5rem;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--anzhiyu-fontcolor);
}

.error-card p {
  margin-bottom: 1.5rem;
  color: var(--anzhiyu-secondtext);
}

.retry-btn {
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  color: var(--anzhiyu-white);
  cursor: pointer;
  background: var(--anzhiyu-theme);
  border: none;
  border-radius: 8px;
  box-shadow: var(--anzhiyu-shadow-theme);
  transition: all var(--anzhiyu-transition-duration);
}

.retry-btn:hover {
  background: var(--anzhiyu-theme-op-deep);
  transform: translateY(-1px);
}

.retry-btn:disabled {
  cursor: not-allowed;
  background: var(--anzhiyu-gray);
  box-shadow: none;
  transform: none;
}

.dashboard-header {
  padding: 0 0.5rem;
  margin-bottom: 2rem;
}

.dashboard-header h1 {
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.2;
  color: var(--anzhiyu-fontcolor);
}

.dashboard-header p {
  margin-top: 0.5rem;
  font-size: 1rem;
  font-weight: 400;
  color: var(--anzhiyu-secondtext);
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  padding: 0 0.5rem;
}

.main-column {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.side-column {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  min-width: 0;
}

.card {
  padding: 1.5rem;
  background: var(--anzhiyu-card-bg);
  border: var(--style-border);
  border-radius: 12px;
  box-shadow: var(--anzhiyu-shadow-border);
  transition: all var(--anzhiyu-transition-duration);
}

.card-header {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  padding-bottom: 1rem;
  margin: 0 0 1.5rem;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--anzhiyu-fontcolor);
  border-bottom: 1px solid var(--anzhiyu-card-border);
}

.stats-overview {
  padding: 1.5rem;
  background: var(--anzhiyu-card-bg);
  border: var(--style-border);
  border-radius: 12px;
  box-shadow: var(--anzhiyu-shadow-border);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 2rem;
}

.stat-item {
  padding: 1rem 0;
  text-align: center;
}

.stat-label {
  margin-bottom: 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--anzhiyu-secondtext);
}

.stat-value {
  margin-bottom: 0.5rem;
  font-size: 2.5rem;
  font-weight: 700;
  line-height: 1;
  color: var(--anzhiyu-fontcolor);
}

.stat-change {
  font-size: 0.75rem;
  font-weight: 500;
}

.stat-change.positive {
  color: var(--anzhiyu-green);
}

.stat-change.negative {
  color: var(--anzhiyu-red);
}

.stat-change.neutral {
  color: var(--anzhiyu-secondtext);
}

.stat-sub {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--anzhiyu-secondtext);
}

.top-pages-section {
  overflow-x: auto;
}

.pages-list .list-header {
  display: grid;
  grid-template-columns: minmax(300px, 1fr) repeat(4, 110px);
  gap: 1rem;
  padding: 0 0.5rem 0.75rem;
  padding: 0.75rem 1rem;
  margin: -0.5rem -0.5rem 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--anzhiyu-secondtext);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: var(--anzhiyu-card-bg-grey);
  border-bottom: 1px solid var(--anzhiyu-card-border);
  border-radius: 8px 8px 0 0;
}

.pages-list .list-header > span:not(:first-child) {
  text-align: right;
}

.visitor-table-wrapper .list-header > span:not(:first-child) {
  text-align: left;
}

.visitor-table-wrapper .page-duration {
  text-align: left;
}

.pages-list ul {
  padding: 0;
  margin: 0;
  list-style: none;
}

.pages-list li {
  display: grid;
  grid-template-columns: minmax(300px, 1fr) repeat(4, 110px);
  gap: 1rem;
  align-items: center;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  border-bottom: 1px solid var(--anzhiyu-card-border);
  border-radius: 0;
  transition: background-color var(--anzhiyu-transition-duration);
}

.pages-list li:hover {
  background: var(--anzhiyu-card-bg-grey);
}

.pages-list li:last-child {
  border-bottom: none;
}

.page-path {
  display: block;
  width: 100%;
  min-width: 0;
  overflow: hidden;
  color: var(--anzhiyu-fontcolor);
  text-decoration: none;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
  transition: color var(--anzhiyu-transition-duration);
}

.page-path:hover {
  color: var(--anzhiyu-theme);
}

.page-views {
  font-weight: 600;
  color: var(--anzhiyu-fontcolor);
  text-align: right;
}

.page-unique,
.page-duration,
.page-bounce {
  color: var(--anzhiyu-secondtext);
  text-align: right;
}

.page-unique {
  font-weight: 500;
}

.visitor-table-wrapper {
  width: 100%;
  max-width: 100%;
}

.visitor-table-wrapper .list-header {
  display: grid;
  grid-template-columns:
    minmax(200px, 1.5fr) 140px 120px minmax(200px, 1.5fr)
    110px;
  gap: 1rem;
  min-width: 800px; /* 确保表格头有最小宽度 */
  padding: 0.75rem 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--anzhiyu-secondtext);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: var(--anzhiyu-card-bg-grey);
  border: var(--style-border);
  border-bottom: 1px solid var(--anzhiyu-card-border);
  border-radius: 8px 8px 0 0;
}

.visitor-table-wrapper .list-header > span:not(:first-child) {
  text-align: left;
}

.visitor-table-wrapper .pages-list {
  min-width: 800px; /* 确保表格有最小宽度，触发横向滚动 */
  max-height: 60vh; /* 调整高度，因为头部现在是独立的 */
  overflow: auto;
  background: var(--anzhiyu-card-bg);
  border: var(--style-border);
  border-top: none; /* 因为头部已经有边框了 */
  border-radius: 0 0 8px 8px;
}

.visitor-table-wrapper .pages-list::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.visitor-table-wrapper .pages-list::-webkit-scrollbar-track {
  background: var(--anzhiyu-card-bg-grey);
  border-radius: 3px;
}

.visitor-table-wrapper .pages-list::-webkit-scrollbar-thumb {
  background: var(--anzhiyu-theme-op);
  border-radius: 3px;
  transition: background var(--anzhiyu-transition-duration);
}

.visitor-table-wrapper .pages-list::-webkit-scrollbar-thumb:hover {
  background: var(--anzhiyu-theme);
}

.visitor-logs-section {
  grid-column: 1 / -1;
  width: 100%;
  max-width: 100%;
  margin-top: 1rem;
  overflow: hidden; /* 防止内容撑开卡片 */
}

.visitor-table-wrapper .pages-list li {
  grid-template-columns:
    minmax(200px, 1.5fr) 140px 120px minmax(200px, 1.5fr)
    110px;
}

.visitor-table-wrapper .ua-text,
.visitor-table-wrapper .ip-text,
.visitor-table-wrapper .city-text {
  min-width: 0;
  overflow: hidden;
  color: var(--anzhiyu-secondtext);
  text-overflow: ellipsis;
}

.visitor-table-wrapper .ua-text {
  display: -webkit-box;
  max-height: 2.8em;
  overflow: hidden;
  font-weight: 500;
  line-height: 1.4;
  color: var(--anzhiyu-fontcolor);
  -webkit-line-clamp: 2;
  line-clamp: 2;
  word-break: break-all;
  -webkit-box-orient: vertical;
}

.visitor-table-wrapper .ip-text,
.visitor-table-wrapper .city-text {
  white-space: nowrap;
}

.visitor-table-wrapper .ip-text {
  font-family: monospace;
  font-size: 0.8rem;
}

.visitor-logs-section .pagination {
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  margin-top: 1.5rem;
  background: var(--anzhiyu-card-bg-grey);
  border: var(--style-border);
  border-radius: 8px;
}

.visitor-logs-section .pagination-info {
  font-weight: 500;
  color: var(--anzhiyu-secondtext);
}

.analytics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.analytics-item {
  padding: 0;
}

.analytics-item h4 {
  margin: 0 0 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--anzhiyu-fontcolor);
}

.analytics-item ul {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0;
  margin: 0;
  font-size: 0.875rem;
  list-style: none;
}

.analytics-item li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0;
  color: var(--anzhiyu-secondtext);
}

.analytics-item li span:first-child {
  flex: 1;
  padding-right: 0.5rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.analytics-item li span:last-child {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--anzhiyu-fontcolor);
}

.referer-section {
  padding-top: 1.5rem;
  margin-top: 1.5rem;
  border-top: 1px solid var(--anzhiyu-card-border);
}

.referer-section h4 {
  margin: 0 0 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--anzhiyu-fontcolor);
}

.referer-list {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 0;
  margin: 0;
  list-style: none;
}

.referer-list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 0;
  color: var(--anzhiyu-secondtext);
  border-bottom: 1px solid var(--anzhiyu-card-border);
}

.referer-list li:last-child {
  border-bottom: none;
}

.referer-list li span:first-child {
  flex: 1;
  padding-right: 2rem;
  overflow: hidden;
  text-overflow: ellipsis;
}

.referer-list li span:last-child {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--anzhiyu-fontcolor);
}

@media (width <= 1200px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .dashboard-header h1 {
    font-size: 1.75rem;
  }

  .card {
    padding: 1.25rem;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
  }

  .analytics-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }
}

@media (width <= 768px) {
  .dashboard-header {
    margin-bottom: 1.5rem;
    text-align: center;
  }

  .dashboard-header h1 {
    font-size: 1.5rem;
  }

  .dashboard-grid {
    padding: 0 0.25rem;
  }

  .card {
    padding: 1rem;
    margin-bottom: 1rem;
  }

  .card-header {
    padding-bottom: 0.75rem;
    margin-bottom: 1rem;
    font-size: 1rem;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  .stat-item {
    padding: 0.75rem 0;
  }

  .stat-value {
    font-size: 2rem;
  }

  .analytics-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  .analytics-item {
    padding: 0;
  }

  /* 移动端表格优化 */
  .pages-list .list-header {
    display: none;
  }

  .pages-list li {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    align-items: stretch;
    padding: 1rem;
    margin-bottom: 0.75rem;
    background: var(--anzhiyu-card-bg);
    border: var(--style-border);
    border-radius: 8px;
    box-shadow: var(--anzhiyu-shadow-border);
  }

  .pages-list li:last-child {
    margin-bottom: 0;
  }

  .page-path {
    padding-bottom: 0.5rem;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: var(--anzhiyu-fontcolor) !important;
    border-bottom: 1px solid var(--anzhiyu-card-border);
  }

  .page-views,
  .page-unique,
  .page-duration,
  .page-bounce,
  .ua-text,
  .ip-text,
  .city-text {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 0.25rem 0;
  }

  .page-views::before,
  .page-unique::before,
  .page-duration::before,
  .page-bounce::before,
  .ua-text::before,
  .ip-text::before,
  .city-text::before {
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--anzhiyu-secondtext);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .page-views::before {
    content: "浏览量";
  }

  .page-unique::before {
    content: "独立访客";
  }

  .page-duration::before {
    content: "停留时间";
  }

  .page-bounce::before {
    content: "跳出率";
  }

  .ua-text::before {
    content: "UA";
  }

  .ua-text {
    word-break: break-all !important;
    white-space: normal !important;
  }

  .ip-text::before {
    content: "IP";
  }

  .city-text::before {
    content: "城市";
  }

  .visitor-logs-section .page-path::before {
    content: "访问页面";
  }

  .visitor-logs-section .page-duration::before {
    content: "停留时间";
  }

  .visitor-logs-section .pages-list {
    background: none;
    border: none;
  }

  .visitor-logs-section .pagination {
    flex-direction: column;
    gap: 0.75rem;
    padding: 0.75rem;
  }

  .welcome-dashboard {
    margin: 0;
  }
}

@media (width <= 1024px) {
  .card.visitor-logs-section {
    display: none;
  }

  .welcome-dashboard {
    margin: 1rem;
  }
}
</style>
