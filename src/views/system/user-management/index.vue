<script setup lang="ts">
import { ref } from "vue";
import { useUserManagement } from "./utils/hook";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";

import Delete from "@iconify-icons/ep/delete";
import EditPen from "@iconify-icons/ep/edit-pen";
import Refresh from "@iconify-icons/ep/refresh";
import AddFill from "@iconify-icons/ri/add-circle-line";
import Search from "@iconify-icons/ri/search-line";
import Key from "@iconify-icons/ep/key";
import Lock from "@iconify-icons/ep/lock";
import Unlock from "@iconify-icons/ep/unlock";

defineOptions({
  name: "UserManagement"
});

const formRef = ref();
const tableRef = ref();
const {
  form,
  loading,
  columns,
  dataList,
  pagination,
  loadingConfig,
  selectedIds,
  onSizeChange,
  onCurrentChange,
  onSearch,
  resetForm,
  openDialog,
  handleDelete,
  handleBatchDelete,
  handleResetPassword,
  handleToggleStatus,
  handleSelectionChange
} = useUserManagement();

function onFullscreen() {
  // 重置表格高度
  tableRef.value.setAdaptive();
}
</script>

<template>
  <div class="main">
    <el-form
      ref="formRef"
      :inline="true"
      :model="form"
      class="search-form bg-bg_color w-full pl-8 pt-[12px] overflow-auto rounded-2xl"
    >
      <el-form-item label="关键词：" prop="keyword">
        <el-input
          v-model="form.keyword"
          placeholder="搜索用户名/邮箱/昵称"
          clearable
          class="!w-[200px]"
        />
      </el-form-item>
      <el-form-item label="状态：" prop="status">
        <el-select
          v-model="form.status"
          placeholder="请选择状态"
          clearable
          class="!w-[180px]"
        >
          <el-option label="正常" :value="1" />
          <el-option label="未激活" :value="2" />
          <el-option label="已封禁" :value="3" />
        </el-select>
      </el-form-item>
      <el-form-item label="用户组：" prop="groupID">
        <el-select
          v-model="form.groupID"
          placeholder="请选择用户组"
          clearable
          class="!w-[180px]"
        >
          <el-option label="管理员" :value="1" />
          <el-option label="普通用户" :value="2" />
          <el-option label="访客" :value="3" />
        </el-select>
      </el-form-item>
      <el-form-item label="创建时间：" prop="created_at">
        <el-date-picker
          v-model="form.created_at"
          type="datetimerange"
          range-separator="至"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          format="YYYY/MM/DD HH:mm:ss"
          value-format="YYYY/MM/DD HH:mm:ss"
        />
      </el-form-item>
      <el-form-item>
        <el-button
          v-ripple
          type="primary"
          :icon="useRenderIcon(Search)"
          :loading="loading"
          @click="onSearch"
        >
          搜索
        </el-button>
        <el-button
          v-ripple
          :icon="useRenderIcon(Refresh)"
          @click="resetForm(formRef)"
        >
          重置
        </el-button>
      </el-form-item>
    </el-form>

    <PureTableBar
      title="用户管理"
      :columns="columns"
      :tableRef="tableRef?.getTableRef()"
      class="table-bar rounded-2xl"
      @refresh="onSearch"
      @fullscreen="onFullscreen"
    >
      <template #buttons>
        <el-button
          v-ripple
          type="primary"
          :icon="useRenderIcon(AddFill)"
          @click="openDialog()"
        >
          新增用户
        </el-button>
        <el-button
          v-ripple
          type="danger"
          :icon="useRenderIcon(Delete)"
          :disabled="selectedIds.length === 0"
          @click="handleBatchDelete"
        >
          批量删除
        </el-button>
      </template>
      <template v-slot="{ size, dynamicColumns }">
        <pure-table
          ref="tableRef"
          adaptive
          :adaptiveConfig="{ offsetBottom: 180 }"
          align-whole="center"
          row-key="id"
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
          @selection-change="handleSelectionChange"
          @page-size-change="onSizeChange"
          @page-current-change="onCurrentChange"
        >
          <template #operation="{ row }">
            <el-button
              v-ripple
              class="reset-margin"
              link
              type="primary"
              :size="size"
              :icon="useRenderIcon(EditPen)"
              @click="openDialog('修改', row)"
            >
              修改
            </el-button>
            <el-button
              v-ripple
              class="reset-margin"
              link
              type="warning"
              :size="size"
              :icon="useRenderIcon(Key)"
              @click="handleResetPassword(row)"
            >
              重置密码
            </el-button>
            <el-button
              v-ripple
              class="reset-margin"
              link
              :type="row.status === 1 ? 'warning' : 'success'"
              :size="size"
              :icon="useRenderIcon(row.status === 1 ? Lock : Unlock)"
              @click="handleToggleStatus(row)"
            >
              {{ row.status === 1 ? "封禁" : "启用" }}
            </el-button>
            <el-popconfirm
              :title="`是否确认删除用户 ${row.username}？`"
              @confirm="handleDelete(row)"
            >
              <template #reference>
                <el-button
                  v-ripple
                  class="reset-margin"
                  link
                  type="danger"
                  :size="size"
                  :icon="useRenderIcon(Delete)"
                >
                  删除
                </el-button>
              </template>
            </el-popconfirm>
          </template>
        </pure-table>
      </template>
    </PureTableBar>
  </div>
</template>

<style scoped lang="scss">
.main {
  margin: 24px;
}

.search-form {
  margin-bottom: 16px;
}

.table-bar {
  background-color: var(--el-bg-color);
}
</style>
