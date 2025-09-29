<template>
  <div class="flink-management">
    <!-- 1. 顶部操作与筛选栏 -->
    <el-card shadow="never" class="header-card">
      <el-form :inline="true" :model="queryParams">
        <el-form-item label="关键词">
          <el-input
            v-model="queryParams.name"
            placeholder="搜索网站名称或描述"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="queryParams.status"
            placeholder="全部状态"
            clearable
            style="width: 120px"
            @change="handleQuery"
          >
            <el-option label="待审核" value="PENDING" />
            <el-option label="已通过" value="APPROVED" />
            <el-option label="已拒绝" value="REJECTED" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleQuery">
            搜索
          </el-button>
          <el-button :icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
        <el-form-item class="add-button">
          <el-button type="primary" :icon="Setting" @click="handleManage">
            管理分类标签
          </el-button>
          <el-button type="success" :icon="Plus" @click="handleCreate">
            新建友链
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 2. 友链卡片列表 -->
    <div v-loading="loading" class="link-list">
      <el-row v-if="linkList.length > 0" :gutter="20">
        <el-col
          v-for="link in linkList"
          :key="link.id"
          :xs="24"
          :sm="12"
          :md="8"
          :lg="6"
        >
          <el-card class="link-card" shadow="hover">
            <div class="card-header">
              <el-avatar :size="50" :src="link.logo" @error="() => true">
                <img
                  src="https://cube.elemecdn.com/e/fd/0fc7d20532fdaf769a25683617711png.png"
                />
              </el-avatar>
              <div class="site-info">
                <p class="site-name">{{ link.name }}</p>
                <el-link
                  :href="link.url"
                  target="_blank"
                  type="primary"
                  :underline="false"
                  class="site-url"
                >
                  {{ link.url }}
                </el-link>
              </div>
            </div>
            <p class="description">{{ link.description || "暂无描述" }}</p>

            <div v-if="link.category || link.tag" class="meta-info">
              <el-tag
                v-if="link.category && link.category.style"
                size="small"
                class="mr-2"
                :type="link.category.style === 'card' ? 'primary' : 'success'"
              >
                样式: {{ link.category.style === "card" ? "卡片" : "列表" }}
              </el-tag>
              <el-tag v-if="link.category" size="small" type="info">{{
                link.category.name
              }}</el-tag>
              <el-tag
                v-if="link.tag"
                size="small"
                :color="link.tag.color"
                class="tag-item"
                :style="{
                  color: 'white !important',
                  background: link.tag.color
                }"
                >{{ link.tag.name }}</el-tag
              >
            </div>

            <el-divider />

            <div class="card-footer">
              <el-tag :type="statusMap[link.status].type" effect="light">
                {{ statusMap[link.status].text }}
              </el-tag>
              <div class="actions">
                <!-- 待审核的特殊操作 -->
                <template v-if="link.status === 'PENDING'">
                  <el-button
                    type="success"
                    size="small"
                    plain
                    @click="handleReview(link.id, 'APPROVED')"
                  >
                    通过
                  </el-button>
                  <el-button
                    type="danger"
                    size="small"
                    plain
                    @click="handleReview(link.id, 'REJECTED')"
                  >
                    拒绝
                  </el-button>
                </template>
                <!-- 通用操作 -->
                <el-button
                  link
                  type="primary"
                  :icon="Edit"
                  @click="handleEdit(link)"
                />
                <el-popconfirm
                  title="确定要删除这个友链吗？"
                  @confirm="handleDelete(link.id)"
                >
                  <template #reference>
                    <el-button link type="danger" :icon="Delete" />
                  </template>
                </el-popconfirm>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
      <el-empty v-else description="暂无友链数据，快去新建一个吧！" />
    </div>

    <!-- 3. 分页 -->
    <el-pagination
      v-if="total > 0"
      v-model:current-page="pagination.page"
      v-model:page-size="pagination.pageSize"
      :page-sizes="[12, 24, 36, 48]"
      :total="total"
      background
      layout="total, sizes, prev, pager, next, jumper"
      @size-change="getLinkList"
      @current-change="getLinkList"
    />

    <!-- 4. 新建/编辑抽屉 -->
    <LinkDrawer
      v-model="drawer.visible"
      :is-edit-mode="drawer.isEdit"
      :data="drawer.data"
      @success="getLinkList"
    />

    <!-- 5. 分类和标签管理器 -->
    <CategoryTagManager v-model="manager.visible" @refresh="getLinkList" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from "vue";
import {
  Search,
  Refresh,
  Plus,
  Edit,
  Delete,
  Setting
} from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { getAdminLinkList, deleteLink, reviewLink } from "@/api/postLink";
import type {
  LinkItem,
  GetAdminLinksParams,
  LinkStatus
} from "@/api/postLink/type";
import LinkDrawer from "./components/LinkDrawer.vue";
import CategoryTagManager from "./components/CategoryTagManager.vue";

defineOptions({
  name: "FlinkManagement"
});

const loading = ref(true);
const linkList = ref<LinkItem[]>([]);
const total = ref(0);

const queryParams = ref<GetAdminLinksParams>({
  page: 1,
  pageSize: 12,
  name: "",
  status: undefined
});

const pagination = reactive({
  page: 1,
  pageSize: 12
});

const statusMap: Record<
  LinkStatus,
  { text: string; type: "success" | "warning" | "danger" | "info" }
> = {
  APPROVED: { text: "已通过", type: "success" },
  PENDING: { text: "待审核", type: "warning" },
  REJECTED: { text: "已拒绝", type: "danger" },
  INVALID: { text: "已失效", type: "info" }
};

const getLinkList = async () => {
  loading.value = true;
  try {
    const params = {
      ...queryParams.value,
      page: pagination.page,
      pageSize: pagination.pageSize
    };
    const res = await getAdminLinkList(params);
    if (res.code === 200) {
      linkList.value = res.data.list;
      total.value = res.data.total;
    }
  } catch (error) {
    console.error("获取友链列表失败", error);
    ElMessage.error("获取友链列表失败");
  } finally {
    loading.value = false;
  }
};

const handleQuery = () => {
  pagination.page = 1;
  getLinkList();
};

const resetQuery = () => {
  queryParams.value.name = "";
  queryParams.value.status = undefined;
  handleQuery();
};

const handleDelete = async (id: number) => {
  try {
    await deleteLink(id);
    ElMessage.success("删除成功");
    getLinkList();
  } catch (error) {
    console.error("删除失败", error);
  }
};

const handleReview = async (id: number, status: "APPROVED" | "REJECTED") => {
  try {
    // 如果是审核通过，可能需要输入网站快照
    let siteshot: string | undefined;
    if (status === "APPROVED") {
      // 使用 ElMessageBox 提示用户输入网站快照
      const { value } = await ElMessageBox.prompt(
        "请输入网站快照链接（可选）：",
        "审核通过",
        {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          inputPlaceholder: "https://example.com/siteshot.png",
          inputPattern: /^$|^https?:\/\/.+/, // 允许空值或有效的URL
          inputErrorMessage: "请输入有效的网站快照链接"
        }
      );
      siteshot = value || undefined;
    }

    await reviewLink(id, { status, siteshot });
    ElMessage.success("审核操作成功");
    getLinkList();
  } catch (error) {
    if (error !== "cancel") {
      console.error("审核失败", error);
      ElMessage.error("审核失败");
    }
  }
};

const drawer = reactive({
  visible: false,
  isEdit: false,
  data: null as LinkItem | null
});

const manager = reactive({
  visible: false
});

const handleCreate = () => {
  drawer.isEdit = false;
  drawer.data = null;
  drawer.visible = true;
};

const handleEdit = (row: LinkItem) => {
  drawer.isEdit = true;
  drawer.data = row;
  drawer.visible = true;
};

const handleManage = () => {
  manager.visible = true;
};

onMounted(() => {
  getLinkList();
});
</script>

<style lang="scss" scoped>
.flink-management {
  padding: 20px;
}

.header-card {
  margin-bottom: 20px;

  .el-form {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
  }

  .add-button {
    margin-left: auto;
  }
}

.link-list {
  min-height: 400px;
}

.link-card {
  margin-bottom: 20px;

  .card-header {
    display: flex;
    align-items: center;
    margin-bottom: 15px;
  }

  .site-info {
    margin-left: 15px;
    overflow: hidden;
  }

  .site-name {
    margin: 0;
    overflow: hidden;
    font-size: 16px;
    font-weight: bold;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .site-url {
    display: block;
    overflow: hidden;
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .description {
    display: -webkit-box;
    min-height: 40px;
    margin: 0 0 10px;
    overflow: hidden;
    font-size: 14px;
    color: #606266;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .meta-info {
    margin-bottom: 10px;

    .tag-item {
      margin-left: 5px;
      color: white !important;
      border: none !important;
      border-radius: 12px 0;
      box-shadow: 0 2px 4px rgb(0 0 0 / 10%);
    }
  }

  .el-divider {
    margin: 12px 0;
  }

  .card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .actions {
    display: flex;
    align-items: center;
  }
}

.el-pagination {
  justify-content: flex-end;
  margin-top: 20px;
}
</style>
