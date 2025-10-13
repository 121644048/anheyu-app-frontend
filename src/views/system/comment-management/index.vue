<script setup lang="ts">
import { ref, reactive, onMounted, computed } from "vue";
import { useSiteConfigStore } from "@/store/modules/siteConfig";
import {
  getAdminComments,
  pinAdminComment,
  updateAdminCommentStatus,
  deleteAdminComments,
  createPublicComment,
  updateAdminComment
} from "@/api/comment";
import type {
  AdminComment,
  CommentQuery,
  CreateCommentPayload
} from "@/api/comment/type";
import CommentFilter from "./components/CommentFilter.vue";
import CommentList from "./components/CommentList.vue";
import {
  ElCard,
  ElPagination,
  ElMessageBox,
  ElMessage,
  ElButton
} from "element-plus";
import { IconifyIconOffline } from "@/components/ReIcon";
import DeleteIcon from "@iconify-icons/ri/delete-bin-line";

// 站点配置
const siteConfigStore = useSiteConfigStore();
const siteOwner = computed(
  () => siteConfigStore.getSiteConfig.frontDesk?.siteOwner || {}
);
const siteUrl = computed(() => siteConfigStore.getSiteConfig.SITE_URL || "");

const queryParams = reactive<CommentQuery>({
  page: 1,
  pageSize: 10
});
const commentList = ref<AdminComment[]>([]);
const total = ref(0);
const loading = ref(true);
const selectedIds = ref<string[]>([]);

const getList = async () => {
  loading.value = true;
  try {
    const res = await getAdminComments(queryParams);
    commentList.value = res.data.list;
    total.value = res.data.total;
  } catch (error) {
    console.error("获取评论列表失败:", error);
  } finally {
    loading.value = false;
  }
};

onMounted(getList);

const onQueryUpdate = (newQuery: CommentQuery) => {
  Object.assign(queryParams, newQuery);
};

const handleSearch = () => {
  queryParams.page = 1;
  getList();
};

const handleSelectionChange = (ids: string[]) => {
  selectedIds.value = ids;
};

const handlePinUpdate = async (comment: AdminComment, pinned: boolean) => {
  try {
    await pinAdminComment(comment.id, pinned);
    ElMessage.success(`操作成功`);
    getList();
  } catch (error) {
    ElMessage.error(`操作失败`);
  }
};

const handleStatusUpdate = async (comment: AdminComment, status: number) => {
  try {
    const res = await updateAdminCommentStatus(comment.id, status);
    const index = commentList.value.findIndex(c => c.id === comment.id);
    if (index !== -1) {
      commentList.value[index] = res.data;
    }
    ElMessage.success(`状态更新成功`);
  } catch (error) {
    ElMessage.error(`状态更新失败`);
  }
};

const handleDelete = (id: string) => {
  ElMessageBox.confirm("确定要删除这条评论吗？此操作不可逆。", "警告", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(async () => {
    try {
      await deleteAdminComments([id]);
      ElMessage.success("删除成功");

      const index = selectedIds.value.indexOf(id);
      if (index > -1) {
        selectedIds.value.splice(index, 1);
      }

      getList();
    } catch (error) {
      ElMessage.error("删除失败");
    }
  });
};

const handleDeleteBatch = () => {
  ElMessageBox.confirm(
    `确定要删除选中的 ${selectedIds.value.length} 条评论吗？`,
    "警告",
    {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    }
  ).then(async () => {
    try {
      await deleteAdminComments(selectedIds.value);
      ElMessage.success(`成功删除 ${selectedIds.value.length} 条评论`);
      getList();
    } catch (error) {
      ElMessage.error("删除失败");
    }
  });
};

const handleEdit = (comment: AdminComment) => {
  ElMessageBox.prompt(`编辑评论（支持 Markdown 语法）:`, "编辑评论", {
    inputType: "textarea",
    inputValue: comment.content,
    confirmButtonText: "保存",
    cancelButtonText: "取消",
    inputValidator: (val: string) => {
      if (!val || val.trim() === "") {
        return "评论内容不能为空";
      }
      if (val.length > 1000) {
        return "评论内容不能超过 1000 字符";
      }
      return true;
    }
  })
    .then(async ({ value }) => {
      try {
        const res = await updateAdminComment(comment.id, value);
        const index = commentList.value.findIndex(c => c.id === comment.id);
        if (index !== -1) {
          commentList.value[index] = res.data;
        }
        ElMessage.success("编辑成功");
      } catch (error) {
        console.error("编辑失败:", error);
        ElMessage.error("编辑失败，请稍后重试");
      }
    })
    .catch(() => {
      ElMessage.info("已取消编辑");
    });
};

const handleReply = (comment: AdminComment) => {
  ElMessageBox.prompt(`回复 @${comment.nickname}:`, "回复评论", {
    inputType: "textarea",
    confirmButtonText: "提交",
    cancelButtonText: "取消",
    inputValidator: (val: string) => {
      if (!val || val.trim() === "") {
        return "回复内容不能为空";
      }
      return true;
    }
  })
    .then(async ({ value }) => {
      if (!siteOwner.value.name || !siteOwner.value.email) {
        ElMessage.error("未找到站点所有者配置，无法回复。请检查配置！");
        return;
      }

      const payload: CreateCommentPayload = {
        target_path: comment.target_path,
        parent_id: comment.id,
        nickname: siteOwner.value.name,
        email: siteOwner.value.email,
        website: siteUrl.value,
        content: value
      };

      try {
        await createPublicComment(payload);
        ElMessage.success("回复成功");
        getList();
      } catch (error) {
        console.error("回复失败:", error);
        ElMessage.error("回复失败，请稍后重试");
      }
    })
    .catch(() => {
      ElMessage.info("已取消回复");
    });
};
</script>

<template>
  <div class="app-container">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>评论管理</span>
        </div>
      </template>

      <CommentFilter
        :model-value="queryParams"
        @update:model-value="onQueryUpdate"
        @search="handleSearch"
      />

      <div class="toolbar">
        <el-button
          type="danger"
          :disabled="selectedIds.length === 0"
          @click="handleDeleteBatch"
        >
          <IconifyIconOffline :icon="DeleteIcon" class="mr-1" />
          删除选中 ({{ selectedIds.length }})
        </el-button>
      </div>

      <CommentList
        :comments="commentList"
        :loading="loading"
        @selection-change="handleSelectionChange"
        @update:pin="handlePinUpdate"
        @update:status="handleStatusUpdate"
        @delete="handleDelete"
        @edit="handleEdit"
        @reply="handleReply"
      />

      <el-pagination
        v-if="total > 0"
        v-model:current-page="queryParams.page"
        v-model:page-size="queryParams.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        class="pagination"
        @size-change="getList"
        @current-change="getList"
      />
    </el-card>
  </div>
</template>

<style lang="scss" scoped>
.card-header {
  font-size: 18px;
  font-weight: 500;
}

.toolbar {
  margin-top: 16px;
  margin-bottom: 16px;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>
