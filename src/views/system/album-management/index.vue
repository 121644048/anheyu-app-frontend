<script setup lang="ts">
import { ref, h } from "vue";
import { useAlbum } from "./utils/hook";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { addDialog } from "@/components/ReDialog";

import Delete from "@iconify-icons/ep/delete";
import EditPen from "@iconify-icons/ep/edit-pen";
import Refresh from "@iconify-icons/ep/refresh";
import AddFill from "@iconify-icons/ri/add-circle-line";
import Search from "@iconify-icons/ri/search-line";
import Upload from "@iconify-icons/ep/upload";
import Setting from "@iconify-icons/ep/setting";
import CategoryManage from "./category-manage.vue";

defineOptions({
  name: "AlbumManagement"
});

const formRef = ref();
const tableRef = ref();
const {
  form,
  categories,
  loading,
  columns,
  dataList,
  pagination,
  loadingConfig,
  onSizeChange,
  onCurrentChange,
  onSearch,
  resetForm,
  openDialog,
  handleDelete,
  openBatchImportDialog,
  loadCategories
} = useAlbum();

function onFullscreen() {
  // 重置表格高度
  tableRef.value.setAdaptive();
}

// 打开分类管理对话框
function openCategoryManage() {
  addDialog({
    title: "相册分类管理",
    width: "700px",
    draggable: true,
    fullscreenIcon: true,
    closeOnClickModal: false,
    hideFooter: true,
    contentRenderer: () =>
      h(CategoryManage, {
        onRefresh: () => {
          loadCategories();
        }
      })
  });
}
</script>

<template>
  <div class="main">
    <el-form
      ref="formRef"
      :inline="true"
      :model="form"
      class="search-form bg-bg_color w-full pl-3 pr-3 md:pl-8 md:pr-4 pt-3 pb-3 md:pt-[12px] md:pb-[12px] overflow-auto rounded-2xl"
    >
      <el-form-item label="分类：" prop="categoryId" class="search-form-item">
        <el-select
          v-model="form.categoryId"
          placeholder="请选择分类"
          clearable
          class="!w-full md:!w-[180px]"
        >
          <el-option
            v-for="category in categories"
            :key="category.id"
            :label="category.name"
            :value="category.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item
        label="上传时间："
        prop="created_at"
        class="search-form-item !hidden md:!block"
      >
        <el-date-picker
          v-model="form.created_at"
          type="datetimerange"
          range-separator="至"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          format="YYYY/MM/DD hh:mm:ss"
          value-format="YYYY/MM/DD hh:mm:ss"
          class="w-full md:w-auto"
        />
      </el-form-item>
      <el-form-item label="排序：" prop="sort" class="search-form-item">
        <el-select
          v-model="form.sort"
          placeholder="请选择"
          clearable
          class="!w-full md:!w-[180px]"
        >
          <el-option label="按排序号" value="display_order_asc" />
          <el-option label="最新创建" value="created_at_desc" />
          <el-option label="最早创建" value="created_at_asc" />
          <el-option label="热度排序" value="view_count_desc" />
        </el-select>
      </el-form-item>
      <el-form-item class="search-form-item search-buttons">
        <el-button
          v-ripple
          type="primary"
          :icon="useRenderIcon(Search)"
          :loading="loading"
          class="flex-1 md:flex-none"
          @click="onSearch"
        >
          搜索
        </el-button>
        <el-button
          v-ripple
          :icon="useRenderIcon(Refresh)"
          class="flex-1 md:flex-none"
          @click="resetForm(formRef)"
        >
          重置
        </el-button>
      </el-form-item>
    </el-form>

    <PureTableBar
      title="相册图片管理"
      :columns="columns"
      :tableRef="tableRef?.getTableRef()"
      class="table-bar rounded-2xl"
      @refresh="onSearch"
      @fullscreen="onFullscreen"
    >
      <template #buttons>
        <div class="button-group">
          <el-button
            v-ripple
            type="primary"
            :icon="useRenderIcon(AddFill)"
            @click="openDialog()"
          >
            <span class="hidden md:inline">新增图片</span>
            <span class="md:hidden">新增</span>
          </el-button>
          <el-button
            v-ripple
            type="success"
            :icon="useRenderIcon(Upload)"
            @click="openBatchImportDialog()"
          >
            <span class="hidden md:inline">批量导入</span>
            <span class="md:hidden">导入</span>
          </el-button>
          <el-button
            v-ripple
            :icon="useRenderIcon(Setting)"
            @click="openCategoryManage()"
          >
            <span class="hidden md:inline">分类管理</span>
            <span class="md:hidden">分类</span>
          </el-button>
        </div>
      </template>
      <template v-slot="{ size, dynamicColumns }">
        <pure-table
          ref="tableRef"
          adaptive
          :adaptiveConfig="{ offsetBottom: 130 }"
          align-whole="center"
          row-key="id"
          showOverflowTooltip
          table-layout="auto"
          :loading-config="loadingConfig"
          :loading="loading"
          :data="dataList"
          :columns="dynamicColumns"
          :pagination="pagination"
          :header-cell-style="{
            background: 'var(--el-fill-color-light)',
            color: 'var(--el-text-color-primary)'
          }"
          @page-size-change="onSizeChange"
          @page-current-change="onCurrentChange"
        >
          <template #operation="{ row }">
            <div class="flex flex-col gap-1 sm:flex-row sm:gap-2">
              <el-button
                v-ripple
                class="w-full reset-margin sm:w-auto"
                link
                type="primary"
                :size="size"
                :icon="useRenderIcon(EditPen)"
                @click="openDialog('修改', row)"
              >
                修改
              </el-button>
              <el-popconfirm
                :title="`是否确认删除相册图片这条数据`"
                @confirm="handleDelete(row)"
              >
                <template #reference>
                  <el-button
                    v-ripple
                    class="w-full reset-margin sm:w-auto"
                    link
                    type="primary"
                    :size="size"
                    :icon="useRenderIcon(Delete)"
                  >
                    删除
                  </el-button>
                </template>
              </el-popconfirm>
            </div>
          </template>
        </pure-table>
      </template>
    </PureTableBar>
  </div>
</template>

<style lang="scss" scoped>
:deep(.el-table__inner-wrapper::before) {
  height: 0;
}

.main-content {
  margin: 24px 24px 0 !important;
}

:deep(.table-bar) {
  border: var(--style-border);
}

.search-form {
  border: var(--style-border);

  :deep(.el-form-item) {
    margin-bottom: 12px;
  }

  // 移动端适配
  @media (width <= 768px) {
    .search-form-item {
      display: flex;
      align-items: center;
      margin-bottom: 0 !important;
      margin-right: 0 !important;

      :deep(.el-form-item__content) {
        flex: 1;
        display: flex;
        gap: 6px;
        margin-left: 0 !important;
      }

      :deep(.el-form-item__label) {
        font-size: 13px;
        width: 46px !important;
        min-width: 46px;
        padding-right: 6px;
        flex-shrink: 0;
      }
    }

    // 按钮组特殊处理
    .search-buttons {
      :deep(.el-form-item__label) {
        display: none;
      }

      :deep(.el-form-item__content) {
        flex: 1;
        width: 100%;
        margin-left: 0 !important;
      }
    }

    // 日期选择器移动端优化
    :deep(.el-date-editor) {
      .el-range-separator {
        padding: 0 2px;
      }

      .el-range-input {
        font-size: 12px;
      }
    }

    // 选择器优化
    :deep(.el-select) {
      .el-select__wrapper {
        font-size: 13px;
      }
    }

    // 按钮移动端优化
    :deep(.el-button) {
      padding: 7px 12px;
      font-size: 13px;
      min-height: 32px;
    }
  }
}

// 表格操作列移动端适配
:deep(.el-table) {
  @media (width <= 768px) {
    font-size: 13px;

    .el-button--small {
      padding: 4px 8px;
      font-size: 13px;
    }

    // 图片缩略图在移动端缩小
    img {
      max-width: 60px !important;
    }
  }
}

:deep(.table-bar) {
  @media (width <= 768px) {
    & > div > p {
      display: none;
    }
    & > div > div > svg,
    & > div > div > .el-divider,
    & > div > div > .el-dropdown {
      display: none;
    }
  }
}

// 表格标题栏移动端适配
:deep(.pure-table-bar) {
  @media (width <= 768px) {
    .pure-table-bar-left {
      font-size: 16px;
    }
  }
}

// 按钮组样式
.button-group {
  display: flex;
  gap: 12px;
  flex-wrap: nowrap;

  @media (width <= 768px) {
    gap: 6px;
    flex-wrap: wrap;

    :deep(.el-button) {
      flex: 1;
      min-width: 70px;
      max-width: 90px;
      margin: 0;
      padding: 6px 8px;
      font-size: 13px;

      span {
        white-space: nowrap;
      }
    }
  }

  @media (width > 768px) {
    :deep(.el-button) {
      min-width: 110px;
    }
  }
}
</style>
