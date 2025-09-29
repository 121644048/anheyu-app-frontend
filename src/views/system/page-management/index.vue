<template>
  <div class="page-management-container">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <h3 class="title">页面管理</h3>
            <p class="subtitle">管理自定义页面，支持HTML内容编辑</p>
          </div>
          <div class="header-right">
            <el-button type="primary" @click="handleCreate">
              <el-icon><Plus /></el-icon>
              新建页面
            </el-button>
            <el-button @click="handleInitialize">
              <el-icon><Refresh /></el-icon>
              初始化默认页面
            </el-button>
          </div>
        </div>
      </template>

      <!-- 搜索栏 -->
      <div class="search-bar">
        <el-input
          v-model="searchForm.search"
          placeholder="搜索页面标题、路径或描述"
          clearable
          @keyup.enter="handleSearch"
          @clear="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select
          v-model="searchForm.is_published"
          placeholder="发布状态"
          clearable
          @change="handleSearch"
        >
          <el-option label="已发布" :value="true" />
          <el-option label="未发布" :value="false" />
        </el-select>
        <el-button type="primary" @click="handleSearch">
          <el-icon><Search /></el-icon>
          搜索
        </el-button>
      </div>

      <!-- 页面列表 -->
      <el-table v-loading="loading" :data="pageList" stripe class="page-table">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="title" label="标题" min-width="150" />
        <el-table-column prop="path" label="路径" min-width="120" />
        <el-table-column
          prop="description"
          label="描述"
          min-width="200"
          show-overflow-tooltip
        />
        <el-table-column prop="sort" label="排序" width="80" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.is_published ? 'success' : 'info'">
              {{ row.is_published ? "已发布" : "未发布" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column prop="updated_at" label="更新时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.updated_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button size="small" @click="handlePreview(row)">预览</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.page_size"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 页面编辑对话框 -->
    <PageEditDialog
      v-model:visible="editDialogVisible"
      :page-data="currentPage"
      @success="handleEditSuccess"
    />

    <!-- 页面预览对话框 -->
    <PagePreviewDialog
      v-model:visible="previewDialogVisible"
      :page-data="currentPage"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Plus, Search, Refresh } from "@element-plus/icons-vue";
import {
  getPageList,
  deletePage,
  initializeDefaultPages
} from "@/api/page-management";
import type { PageData, PageListParams } from "@/api/page-management";
import PageEditDialog from "./components/PageEditDialog.vue";
import PagePreviewDialog from "./components/PagePreviewDialog.vue";

// API响应类型
interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

// 分页响应类型
interface PageListResponse {
  pages: PageData[];
  total: number;
  page: number;
  size: number;
}

// 搜索表单类型
interface SearchForm {
  search: string;
  is_published: boolean | undefined;
}

// 分页信息类型
interface Pagination {
  page: number;
  page_size: number;
  total: number;
}

// 响应式数据
const loading = ref<boolean>(false);
const pageList = ref<PageData[]>([]);
const currentPage = ref<PageData | null>(null);
const editDialogVisible = ref<boolean>(false);
const previewDialogVisible = ref<boolean>(false);

// 搜索表单
const searchForm = reactive<SearchForm>({
  search: "",
  is_published: undefined
});

// 分页信息
const pagination = reactive<Pagination>({
  page: 1,
  page_size: 10,
  total: 0
});

// 获取页面列表
const fetchPageList = async (): Promise<void> => {
  loading.value = true;
  try {
    const params: PageListParams = {
      page: pagination.page,
      page_size: pagination.page_size,
      search: searchForm.search || undefined,
      is_published: searchForm.is_published
    };

    const response = (await getPageList(
      params
    )) as ApiResponse<PageListResponse>;
    if (response.code === 200) {
      pageList.value = response.data.pages;
      pagination.total = response.data.total;
    } else {
      ElMessage.error(response.message || "获取页面列表失败");
    }
  } catch (error: any) {
    console.error("获取页面列表失败:", error);
    ElMessage.error("获取页面列表失败");
  } finally {
    loading.value = false;
  }
};

// 搜索
const handleSearch = (): void => {
  pagination.page = 1;
  fetchPageList();
};

// 分页处理
const handleSizeChange = (size: number): void => {
  pagination.page_size = size;
  pagination.page = 1;
  fetchPageList();
};

const handleCurrentChange = (page: number): void => {
  pagination.page = page;
  fetchPageList();
};

// 新建页面
const handleCreate = (): void => {
  currentPage.value = null;
  editDialogVisible.value = true;
};

// 编辑页面
const handleEdit = (row: PageData): void => {
  currentPage.value = row;
  editDialogVisible.value = true;
};

// 预览页面
const handlePreview = (row: PageData): void => {
  currentPage.value = row;
  previewDialogVisible.value = true;
};

// 删除页面
const handleDelete = async (row: PageData): Promise<void> => {
  try {
    await ElMessageBox.confirm(
      `确定要删除页面 "${row.title}" 吗？删除后无法恢复。`,
      "确认删除",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }
    );

    const response = (await deletePage(row.id.toString())) as ApiResponse;
    if (response.code === 200) {
      ElMessage.success("删除成功");
      fetchPageList();
    } else {
      ElMessage.error(response.message || "删除失败");
    }
  } catch (error: any) {
    if (error !== "cancel") {
      console.error("删除页面失败:", error);
      ElMessage.error("删除页面失败");
    }
  }
};

// 初始化默认页面
const handleInitialize = async (): Promise<void> => {
  try {
    await ElMessageBox.confirm(
      "确定要初始化默认页面吗？这将创建隐私政策、Cookie政策和版权声明页面。",
      "确认初始化",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "info"
      }
    );

    const response = (await initializeDefaultPages()) as ApiResponse;
    if (response.code === 200) {
      ElMessage.success("初始化默认页面成功");
      fetchPageList();
    } else {
      ElMessage.error(response.message || "初始化失败");
    }
  } catch (error: any) {
    if (error !== "cancel") {
      console.error("初始化默认页面失败:", error);
      ElMessage.error("初始化默认页面失败");
    }
  }
};

// 编辑成功回调
const handleEditSuccess = (): void => {
  editDialogVisible.value = false;
  fetchPageList();
};

// 格式化日期
const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleString("zh-CN");
};

// 初始化
onMounted((): void => {
  fetchPageList();
});
</script>

<style scoped lang="scss">
.page-management-container {
  padding: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;

  .header-left {
    .title {
      margin: 0 0 8px;
      font-size: 18px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }

    .subtitle {
      margin: 0;
      font-size: 14px;
      color: var(--el-text-color-regular);
    }
  }

  .header-right {
    display: flex;
    gap: 12px;
  }
}

.search-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;

  .el-input {
    flex: 1;
    max-width: 300px;
  }

  .el-select {
    width: 150px;
  }
}

.page-table {
  margin-bottom: 20px;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
</style>
