<script setup lang="ts">
import { reactive, onMounted, toRefs } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox, ElDivider } from "element-plus";
import { getArticleList, deleteArticle } from "@/api/post";
import type { Article, GetArticleListParams } from "@/api/post/type";
import {
  Search,
  Refresh,
  Plus,
  EditPen,
  Delete
} from "@element-plus/icons-vue";
import { useArticleStore } from "@/store/modules/articleStore";

const articleStore = useArticleStore();

defineOptions({
  name: "PostManagement"
});

const router = useRouter();

const state = reactive({
  loading: false,
  tableData: [] as Article[],
  pagination: {
    currentPage: 1,
    pageSize: 12,
    total: 0
  },
  searchParams: {
    query: "",
    status: ""
  } as GetArticleListParams
});

const { loading, tableData, pagination, searchParams } = toRefs(state);

const statusOptions = [
  { value: "", label: "全部状态" },
  { value: "PUBLISHED", label: "已发布", type: "success", color: "#67C23A" },
  { value: "DRAFT", label: "草稿", type: "warning", color: "#E6A23C" },
  { value: "ARCHIVED", label: "已归档", type: "info", color: "#909399" }
];

/**
 * 格式化 ISO 日期字符串为 'YYYY-MM-DD HH:mm'
 * @param isoString ISO 格式的日期字符串
 */
const formatDate = (isoString: string) => {
  if (!isoString) return "N/A";
  const date = new Date(isoString);
  const pad = (num: number) => num.toString().padStart(2, "0");
  const yyyy = date.getFullYear();
  const MM = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  return `${yyyy}-${MM}-${dd} ${hh}:${mm}`;
};

const fetchData = async () => {
  state.loading = true;
  try {
    const params: GetArticleListParams = {
      page: state.pagination.currentPage,
      pageSize: state.pagination.pageSize,
      query: state.searchParams.query,
      status: state.searchParams.status
    };
    const { data } = await getArticleList(params);
    state.tableData = data.list;
    state.pagination.total = data.total;
  } catch (error) {
    ElMessage.error("获取文章列表失败");
  } finally {
    state.loading = false;
  }
};

const handleSearch = () => {
  state.pagination.currentPage = 1;
  fetchData();
};

const handleReset = () => {
  state.searchParams.query = "";
  state.searchParams.status = "";
  handleSearch();
};

const handleNew = () => {
  router.push({ name: "PostEdit", params: { id: "new" } });
};

const handleEdit = (row: Article) => {
  router.push({ name: "PostEdit", params: { id: row.id } });
};

const handleDelete = (row: Article) => {
  ElMessageBox.confirm(`确定要删除文章《${row.title}》吗？`, "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(async () => {
      await deleteArticle(row.id);
      ElMessage.success("删除成功");
      if (state.tableData.length === 1 && state.pagination.currentPage > 1) {
        state.pagination.currentPage--;
      }
      fetchData();
    })
    .catch(() => {});
};

const handleSizeChange = (val: number) => {
  state.pagination.pageSize = val;
  fetchData();
};

const handleCurrentChange = (val: number) => {
  state.pagination.currentPage = val;
  fetchData();
};

const getStatusInfo = (status: string) => {
  return statusOptions.find(s => s.value === status);
};

onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="post-management-container">
    <!-- 顶部搜索和操作栏 -->
    <div class="control-panel">
      <div class="search-area">
        <div class="search-input-wrapper">
          <IconifyIconOnline
            icon="ep:search"
            class="search-icon"
            width="20"
            height="20"
          />
          <el-input
            v-model="searchParams.query"
            placeholder="搜索文章标题、内容..."
            class="search-input"
            clearable
            @keyup.enter="handleSearch"
          />
        </div>
        <el-select
          v-model="searchParams.status"
          placeholder="文章状态"
          class="status-select"
          clearable
        >
          <el-option
            v-for="item in statusOptions.filter(s => s.value)"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          >
            <span class="status-option">
              <span
                class="status-dot"
                :style="{ backgroundColor: item.color }"
              />
              <span>{{ item.label }}</span>
            </span>
          </el-option>
        </el-select>
        <el-button
          type="primary"
          class="search-btn"
          :icon="Search"
          @click="handleSearch"
        >
          搜索
        </el-button>
        <el-button class="reset-btn" :icon="Refresh" @click="handleReset">
          重置
        </el-button>
      </div>
      <div class="action-area">
        <el-button
          v-ripple
          type="primary"
          class="new-post-btn"
          :icon="Plus"
          @click="handleNew"
        >
          新增文章
        </el-button>
      </div>
    </div>

    <div class="content-area">
      <div v-if="loading" v-loading="loading" class="loading-placeholder" />

      <div v-if="!loading && tableData.length > 0" class="article-list">
        <div
          v-for="article in tableData"
          :key="article.id"
          class="article-item"
        >
          <!-- 封面缩略图 -->
          <a :href="`/posts/${article.id}`" target="_blank" class="item-cover">
            <el-image
              v-if="article.cover_url"
              :src="article.cover_url"
              fit="cover"
              class="cover-image"
              lazy
            >
              <template #error>
                <div class="image-slot">
                  <IconifyIconOnline icon="ep:picture-filled" width="32" />
                </div>
              </template>
            </el-image>
            <el-image
              v-else
              :src="articleStore.defaultCover"
              fit="cover"
              class="cover-image"
              lazy
            >
              <template #error>
                <div class="image-slot">
                  <IconifyIconOnline icon="ep:picture-filled" width="32" />
                </div>
              </template>
            </el-image>
            <!-- 状态标签 -->
            <div
              class="status-badge"
              :class="`status-${article.status.toLowerCase()}`"
            >
              {{ getStatusInfo(article.status)?.label }}
            </div>
          </a>

          <!-- 主要内容区 -->
          <div class="item-content">
            <div class="content-header">
              <a
                :href="`/posts/${article.id}`"
                target="_blank"
                class="item-title"
              >
                {{ article.title }}
              </a>
            </div>

            <div class="content-meta">
              <!-- 分类和标签 -->
              <div class="meta-tags">
                <template v-if="article.post_categories?.length">
                  <el-tag
                    v-for="cat in article.post_categories.slice(0, 2)"
                    :key="cat.id"
                    type="info"
                    size="small"
                    effect="plain"
                  >
                    <div class="category-tag">
                      <IconifyIconOnline
                        icon="ep:folder"
                        width="12"
                        height="12"
                      />
                      {{ cat.name }}
                    </div>
                  </el-tag>
                </template>
                <template v-if="article.post_tags?.length">
                  <el-tag
                    v-for="tag in article.post_tags.slice(0, 3)"
                    :key="tag.id"
                    size="small"
                    effect="plain"
                  >
                    <div class="tag-item">
                      <IconifyIconOnline
                        icon="ep:price-tag"
                        width="12"
                        height="12"
                      />
                      {{ tag.name }}
                    </div>
                  </el-tag>
                </template>
              </div>
            </div>

            <div class="content-info">
              <!-- 统计信息 -->
              <div class="info-stats">
                <span class="stat-item">
                  <IconifyIconOnline icon="ep:view" width="14" />
                  {{ article.view_count }}
                </span>
                <span class="stat-item">
                  <IconifyIconOnline icon="icon-park-outline:text" width="14" />
                  {{ article.word_count }}字
                </span>
                <span class="stat-item">
                  <IconifyIconOnline
                    icon="ant-design:field-time-outlined"
                    width="14"
                  />
                  {{ article.reading_time }}分钟
                </span>
              </div>

              <!-- 时间信息 -->
              <div class="info-time">
                <span class="time-item">
                  <IconifyIconOnline icon="ep:calendar" width="12" />
                  {{ formatDate(article.created_at) }}
                </span>
                <span class="time-item">
                  <IconifyIconOnline icon="ep:edit-pen" width="12" />
                  {{ formatDate(article.updated_at) }}
                </span>
              </div>
            </div>
          </div>

          <!-- 操作按钮区 -->
          <div class="item-actions">
            <el-button
              type="primary"
              text
              bg
              class="action-btn"
              :icon="EditPen"
              @click="handleEdit(article)"
            >
              编辑
            </el-button>
            <el-button
              type="danger"
              text
              bg
              class="action-btn"
              :icon="Delete"
              @click="handleDelete(article)"
            >
              删除
            </el-button>
          </div>
        </div>
      </div>

      <el-empty
        v-if="!loading && tableData.length === 0"
        description="暂无文章"
      >
        <el-button type="primary" :icon="Plus" @click="handleNew"
          >立即新增</el-button
        >
      </el-empty>

      <el-pagination
        v-if="!loading && pagination.total > 0"
        v-model:current-page="pagination.currentPage"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[12, 24, 48, 96]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        class="pagination-container"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.main-content {
  margin: 0;
}
.post-management-container {
  padding: 1rem;
  min-height: calc(100vh - 140px);
}

// 控制面板
.control-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  margin-bottom: 24px;
  background: var(--anzhiyu-card-bg);
  border: var(--style-border);
  border-radius: 16px;
  box-shadow: var(--anzhiyu-shadow-border);

  @media (min-width: 768px) {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

// 搜索区域
.search-area {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  flex: 1;

  .search-input-wrapper {
    position: relative;
    flex: 1;
    min-width: 200px;
    max-width: 400px;

    .search-icon {
      position: absolute;
      left: 14px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--anzhiyu-secondtext);
      z-index: 1;
      pointer-events: none;
    }

    :deep(.search-input) {
      .el-input__wrapper {
        padding-left: 42px;
        border-radius: 12px;
        background: var(--anzhiyu-secondbg);
        border: var(--style-border);
        box-shadow: none;
        transition: all 0.3s ease;

        &:hover {
          border-color: var(--anzhiyu-main);
        }

        &.is-focus {
          border-color: var(--anzhiyu-main);
          background: var(--anzhiyu-card-bg);
          box-shadow: 0 0 0 3px var(--anzhiyu-main-op-light);
        }
      }
    }
  }

  .status-select {
    width: 140px;

    :deep(.el-input__wrapper) {
      border-radius: 12px;
      border: var(--style-border);
      transition: all 0.3s ease;

      &:hover {
        border-color: var(--anzhiyu-main);
      }

      &.is-focus {
        border-color: var(--anzhiyu-main);
        box-shadow: 0 0 0 3px var(--anzhiyu-main-op-light);
      }
    }
  }

  .search-btn,
  .reset-btn {
    border-radius: 10px;
    padding: 10px 20px;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: var(--anzhiyu-shadow-main);
    }
  }

  .reset-btn {
    background: var(--anzhiyu-secondbg);
    border-color: var(--anzhiyu-card-border);
  }
}

// 操作区域
.action-area {
  .new-post-btn {
    border-radius: 10px;
    padding: 10px 24px;
    font-weight: 500;
    box-shadow: var(--anzhiyu-shadow-blue);
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: var(--anzhiyu-shadow-main);
    }
  }
}

// 状态选项样式
.status-option {
  display: flex;
  align-items: center;
  gap: 8px;

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }
}

// 内容区域
.content-area {
  position: relative;
  min-height: 400px;
}

.loading-placeholder {
  width: 100%;
  height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}

// 文章列表
.article-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

// 文章列表项
.article-item {
  display: flex;
  align-items: stretch;
  gap: 16px;
  padding: 16px;
  background: var(--anzhiyu-card-bg);
  border: var(--style-border);
  border-radius: 12px;
  box-shadow: var(--anzhiyu-shadow-border);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    box-shadow: var(--anzhiyu-shadow-blackdeep);
    border-color: var(--anzhiyu-main-op);

    .item-cover .cover-image {
      transform: scale(1.05);
    }

    .item-title {
      color: var(--anzhiyu-main);
    }
  }

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 12px;
    padding: 12px;
  }
}

// 封面缩略图
.item-cover {
  position: relative;
  flex-shrink: 0;
  width: 140px;
  height: 105px;
  overflow: hidden;
  background: var(--anzhiyu-secondbg);
  border-radius: 8px;
  text-decoration: none;

  .cover-image {
    width: 100%;
    height: 100%;
    transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);

    :deep(img) {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .image-slot {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    color: var(--anzhiyu-secondtext);
    background: var(--anzhiyu-secondbg);
  }

  // 状态标签
  .status-badge {
    position: absolute;
    top: 8px;
    right: 8px;
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 600;
    color: white;
    backdrop-filter: blur(8px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    z-index: 1;

    &.status-published {
      background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
    }

    &.status-draft {
      background: linear-gradient(135deg, #e6a23c 0%, #f0c78a 100%);
    }

    &.status-archived {
      background: linear-gradient(135deg, #909399 0%, #b1b3b8 100%);
    }
  }

  @media (max-width: 768px) {
    width: 100%;
    height: 160px;

    .status-badge {
      top: 10px;
      right: 10px;
    }
  }
}

// 主要内容区
.item-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

// 内容头部
.content-header {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.item-title {
  flex: 1;
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.5;
  color: var(--anzhiyu-fontcolor);
  text-decoration: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color 0.3s ease;

  &:hover {
    color: var(--anzhiyu-main);
  }
}

// 元数据
.content-meta {
  .meta-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;

    .category-tag,
    .tag-item {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      border-radius: 6px;
      font-size: 12px;
      height: 24px;
      line-height: 1;
      transition: all 0.2s ease;

      :deep(.iconify) {
        flex-shrink: 0;
      }
    }

    .category-tag {
      border-color: var(--anzhiyu-main-op);
    }
  }
}

// 信息栏
.content-info {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: auto;
  font-size: 12px;
  color: var(--anzhiyu-secondtext);

  .stat-item,
  .time-item {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    white-space: nowrap;
  }

  .time-item {
    font-size: 11px;
  }
}

.info-stats,
.info-time {
  display: contents;
}

// 操作按钮区
.item-actions {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  justify-content: center;

  .action-btn {
    min-width: 80px;
    border-radius: 6px;
    font-size: 13px;
    padding: 8px 16px;
    transition: all 0.3s ease;
    margin-left: 0;
  }

  @media (max-width: 768px) {
    flex-direction: row;

    .action-btn {
      flex: 1;
    }
  }
}

// 分页
.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 32px;
  padding: 20px;
  background: var(--anzhiyu-card-bg);
  border: var(--style-border);
  border-radius: 12px;
  box-shadow: var(--anzhiyu-shadow-border);

  :deep(.el-pagination) {
    .btn-prev,
    .btn-next,
    .el-pager li {
      border-radius: 8px;
      transition: all 0.3s ease;

      &:hover {
        background: var(--anzhiyu-main-op-light);
        color: var(--anzhiyu-main);
      }

      &.is-active {
        background: var(--anzhiyu-main);
        color: white;
      }
    }
  }
}

// 空状态
.el-empty {
  margin: 80px auto;
  padding: 40px;
  background: var(--anzhiyu-card-bg);
  border: var(--style-border);
  border-radius: 16px;
  box-shadow: var(--anzhiyu-shadow-border);
}

// 响应式调整
@media (max-width: 768px) {
  .post-management-container {
    padding: 12px;
  }

  .control-panel {
    padding: 16px;
  }

  .search-area {
    .search-input-wrapper {
      max-width: 100%;
    }
  }

  .article-list {
    gap: 12px;
  }

  .article-item {
    padding: 12px;
  }
}
</style>
