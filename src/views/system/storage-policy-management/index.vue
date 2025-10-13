<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { usePolicy } from "./utils/hook";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { IconifyIconOffline } from "@/components/ReIcon";
import { createPolicy, type StoragePolicy } from "@/api/sys-policy";
import { message } from "@/utils/message";
import AnDialog from "@/components/AnDialog";

import Delete from "@iconify-icons/ep/delete";
import EditPen from "@iconify-icons/ep/edit-pen";
import Refresh from "@iconify-icons/ep/refresh";
import AddFill from "@iconify-icons/ri/add-circle-line";
import ServerIcon from "@iconify-icons/ri/server-line";
import CloudIcon from "@iconify-icons/ri/cloud-line";
import DatabaseIcon from "@iconify-icons/ri/database-2-line";
import CircleCheck from "@iconify-icons/ep/circle-check-filled";
// 导入创建表单组件
import LocalCreateForm from "./components/local/CreateForm.vue";
import OneDriveCreateForm from "./components/onedrive/CreateForm.vue";
import TencentCosCreateForm from "./components/tencent-cos/CreateForm.vue";
import AliyunOssCreateForm from "./components/aliyun-oss/CreateForm.vue";
import AwsS3CreateForm from "./components/aws-s3/CreateForm.vue";

defineOptions({
  name: "StoragePolicyManagement"
});

const router = useRouter();
const {
  loading,
  dataList,
  pagination,
  onSearch,
  handleEdit,
  handleDelete,
  onSizeChange,
  onCurrentChange
} = usePolicy(router);

// 创建流程控制
const chooseTypeDialogVisible = ref(false);
const createDialogVisible = ref(false);
const corsSuccessDialogVisible = ref(false);
const formRef = ref();
const isCreating = ref(false);
const createdPolicyName = ref("");
const createdPolicyType = ref("");

// 当前选中的存储类型
const currentStorageType = ref<
  "local" | "onedrive" | "tencent_cos" | "aliyun_oss" | "aws_s3" | null
>(null);

const storageTypes = [
  {
    type: "local",
    name: "本机存储",
    icon: ServerIcon,
    component: LocalCreateForm,
    dialogTitle: "添加本地存储策略"
  },
  {
    type: "onedrive",
    name: "OneDrive",
    icon: CloudIcon,
    component: OneDriveCreateForm,
    dialogTitle: "添加 OneDrive 存储策略"
  },
  {
    type: "tencent_cos",
    name: "腾讯云COS",
    icon: DatabaseIcon,
    component: TencentCosCreateForm,
    dialogTitle: "添加腾讯云COS存储策略"
  },
  {
    type: "aliyun_oss",
    name: "阿里云OSS",
    icon: DatabaseIcon,
    component: AliyunOssCreateForm,
    dialogTitle: "添加阿里云OSS存储策略"
  },
  {
    type: "aws_s3",
    name: "AWS S3",
    icon: DatabaseIcon,
    component: AwsS3CreateForm,
    dialogTitle: "添加AWS S3存储策略"
  }
];

// 获取当前存储类型的配置
const currentStorageConfig = computed(() => {
  return storageTypes.find(st => st.type === currentStorageType.value);
});

// 根据类型分发创建流程
function triggerCreateFlow(
  type: "local" | "onedrive" | "tencent_cos" | "aliyun_oss" | "aws_s3"
) {
  chooseTypeDialogVisible.value = false;
  currentStorageType.value = type;
  createDialogVisible.value = true;
}

// 处理表单提交（统一处理所有类型）
async function handleCreateSubmit(payload: Partial<StoragePolicy>) {
  try {
    isCreating.value = true;
    const { data: newPolicy } = await createPolicy(payload);
    createDialogVisible.value = false;

    const storageTypeName = currentStorageConfig.value?.name || "存储策略";

    // OneDrive 需要跳转到编辑页面进行授权
    if (currentStorageType.value === "onedrive") {
      message(`策略 ${payload.name} 创建成功，请继续配置。`, {
        type: "success"
      });
      router.push({ name: "StoragePolicyEdit", params: { id: newPolicy.id } });
    }
    // 云存储显示 CORS 成功弹窗
    else if (
      ["tencent_cos", "aliyun_oss", "aws_s3"].includes(
        currentStorageType.value || ""
      )
    ) {
      createdPolicyName.value = payload.name || storageTypeName;
      createdPolicyType.value = storageTypeName;
      corsSuccessDialogVisible.value = true;
      onSearch();
    }
    // 本地存储直接刷新列表
    else {
      message(`策略 ${payload.name} 创建成功！`, { type: "success" });
      onSearch();
    }
  } catch (e: any) {
    console.error(e);
    const errorMessage =
      e?.response?.data?.message || e?.message || "创建策略失败，请稍后重试";
    message(errorMessage, { type: "error" });
  } finally {
    isCreating.value = false;
  }
}

// 点击弹窗的"创建"按钮
function confirmCreate() {
  formRef.value?.submitForm();
}

const typeIconMap = {
  local: ServerIcon,
  onedrive: CloudIcon,
  tencent_cos: DatabaseIcon,
  aliyun_oss: DatabaseIcon,
  aws_s3: DatabaseIcon
};

// 用于将 flag 转换为可读的文本
const flagDisplayMap = {
  article_image: "文章图片默认",
  comment_image: "评论图片默认"
};

function getFlagDisplayName(flag: string): string {
  return flagDisplayMap[flag] || "未知标志";
}
</script>

<template>
  <div class="card-list-main">
    <div>
      <div class="card-list-header">
        <div class="left-actions">
          <el-button v-ripple :icon="useRenderIcon(Refresh)" @click="onSearch">
            刷新
          </el-button>
        </div>
      </div>

      <div
        v-loading="loading"
        class="card-grid"
        element-loading-text="正在加载..."
      >
        <div
          v-ripple
          class="card-item add-card"
          @click="chooseTypeDialogVisible = true"
        >
          <el-icon :size="48" color="var(--el-color-primary)">
            <IconifyIconOffline :icon="AddFill" />
          </el-icon>
          <p>添加存储策略</p>
        </div>

        <div
          v-for="item in dataList"
          :key="item.id"
          class="card-item data-card policy-card"
        >
          <div class="policy-content">
            <el-icon :size="40" class="policy-icon">
              <IconifyIconOffline :icon="typeIconMap[item.type] || CloudIcon" />
            </el-icon>
            <div class="policy-details">
              <h4 class="policy-name">
                {{ item.name }}
                <el-tag
                  v-if="item.flag"
                  type="warning"
                  size="small"
                  effect="dark"
                  style="margin-left: 8px"
                >
                  {{ getFlagDisplayName(item.flag) }}
                </el-tag>
              </h4>
              <div class="policy-tags">
                <el-tag
                  v-if="item.type === 'onedrive'"
                  :type="item.access_key ? 'success' : 'warning'"
                  size="small"
                >
                  {{ item.access_key ? "已授权" : "未授权" }}
                </el-tag>
                <el-tag
                  v-if="
                    ['tencent_cos', 'aliyun_oss', 'aws_s3'].includes(
                      item.type as string
                    )
                  "
                  :type="
                    item.access_key && item.secret_key ? 'success' : 'warning'
                  "
                  size="small"
                >
                  {{ item.access_key && item.secret_key ? "已配置" : "未配置" }}
                </el-tag>
                <el-tag type="info" size="small">{{ item.type }}</el-tag>
              </div>
            </div>
          </div>

          <div class="card-overlay">
            <div class="card-actions">
              <el-tooltip content="修改" :show-arrow="false">
                <el-button
                  :icon="useRenderIcon(EditPen)"
                  circle
                  @click="handleEdit(item)"
                />
              </el-tooltip>

              <el-popconfirm
                v-if="
                  !item.flag &&
                  !(item.type === 'local' && item.virtual_path === '/')
                "
                :title="`确认删除存储策略 ${item.name} 吗?`"
                @confirm="handleDelete(item)"
              >
                <template #reference>
                  <el-button
                    :icon="useRenderIcon(Delete)"
                    circle
                    type="danger"
                  />
                </template>
              </el-popconfirm>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="pagination.total > 0" class="pagination-container">
      <el-pagination
        v-model:current-page="pagination.currentPage"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        :background="true"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="onSizeChange"
        @current-change="onCurrentChange"
      />
    </div>

    <AnDialog
      v-model="chooseTypeDialogVisible"
      title="选择存储方式"
      width="600px"
      hide-footer
    >
      <div class="storage-type-grid">
        <div
          v-for="st in storageTypes"
          :key="st.type"
          v-ripple
          class="type-item"
          @click="
            triggerCreateFlow(
              st.type as
                | 'local'
                | 'onedrive'
                | 'tencent_cos'
                | 'aliyun_oss'
                | 'aws_s3'
            )
          "
        >
          <el-icon :size="24">
            <IconifyIconOffline :icon="st.icon" />
          </el-icon>
          <span>{{ st.name }}</span>
        </div>
      </div>
    </AnDialog>

    <!-- 统一的创建存储策略弹窗，使用动态组件 -->
    <AnDialog
      v-model="createDialogVisible"
      :title="currentStorageConfig?.dialogTitle || '添加存储策略'"
      width="650px"
      :close-on-click-modal="false"
      show-footer
      confirm-text="创建"
      :confirm-loading="isCreating"
      :content-class="
        ['tencent_cos', 'aliyun_oss', 'aws_s3'].includes(
          currentStorageType || ''
        )
          ? ''
          : 'scrollable-dialog-content'
      "
      :container-class="
        currentStorageType === 'tencent_cos'
          ? 'tencent-cos-dialog'
          : currentStorageType === 'aliyun_oss'
            ? 'aliyun-oss-dialog'
            : currentStorageType === 'aws_s3'
              ? 'aws-s3-dialog'
              : ''
      "
      @confirm="confirmCreate"
    >
      <component
        :is="currentStorageConfig?.component"
        v-if="currentStorageConfig"
        ref="formRef"
        @submit="handleCreateSubmit"
      />
    </AnDialog>

    <!-- CORS策略创建成功弹窗 -->
    <AnDialog
      v-model="corsSuccessDialogVisible"
      :title="`🎉 ${createdPolicyType}存储策略创建成功`"
      width="550px"
      :close-on-click-modal="false"
      hide-header
      container-class="cors-success-dialog"
    >
      <div class="success-content">
        <div class="success-header">
          <el-icon class="success-icon" color="#67C23A" size="24">
            <CircleCheck />
          </el-icon>
          <h3>{{ createdPolicyName }} 已成功创建</h3>
        </div>

        <div class="cors-info">
          <h4>✅ 跨域策略已自动配置</h4>
          <p>
            系统已为您的{{
              createdPolicyType
            }}存储桶自动配置了以下跨域（CORS）策略：
          </p>

          <div class="cors-rules">
            <div class="rule-item">
              <span class="rule-label">来源 (Origin):</span>
              <span class="rule-value">*</span>
              <span class="rule-desc">允许所有来源访问</span>
            </div>

            <div class="rule-item">
              <span class="rule-label">允许方法 (Methods):</span>
              <span class="rule-value">GET, POST, PUT, DELETE, HEAD</span>
              <span class="rule-desc">支持所有常用HTTP方法</span>
            </div>

            <div class="rule-item">
              <span class="rule-label">允许头部 (Headers):</span>
              <span class="rule-value">*</span>
              <span class="rule-desc">允许所有请求头</span>
            </div>

            <div class="rule-item">
              <span class="rule-label">暴露头部 (Expose Headers):</span>
              <span class="rule-value">ETag</span>
              <span class="rule-desc">允许客户端访问ETag响应头</span>
            </div>

            <div class="rule-item">
              <span class="rule-label">缓存时间 (Max-Age):</span>
              <span class="rule-value">3600秒</span>
              <span class="rule-desc">预检请求缓存1小时</span>
            </div>
          </div>

          <div class="success-note">
            <p>
              <strong>提示：</strong
              >您现在可以正常使用此存储策略，文件可以被跨域访问。
            </p>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button type="primary" @click="corsSuccessDialogVisible = false">
          我知道了
        </el-button>
      </template>
    </AnDialog>
  </div>
</template>

<style lang="scss" scoped>
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  min-height: 150px;
  padding: 4px;
}

.card-list-main {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: calc(100% - 48px);
  padding: 16px;
  overflow: hidden;
  background-color: var(--el-bg-color);
  border-radius: 12px;
}

.card-list-header {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.card-item {
  position: relative;
  height: 130px;
  overflow: hidden;
  cursor: pointer;
  background-color: var(--el-bg-color-page);
  border-radius: 12px;
  box-shadow: 0 4px 6px rgb(0 0 0 / 5%);
  transition: all 0.3s ease;
}

.pagination-container {
  margin-top: 20px;
}

.add-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-secondary);
  border: 2px dashed var(--el-border-color);

  p {
    margin-top: 8px;
    font-size: 1rem;
  }

  &:hover {
    color: var(--el-color-primary);
    border-color: var(--el-color-primary);
  }
}

.policy-card {
  display: flex;
  align-items: center;
  padding: 20px;

  .policy-content {
    display: flex;
    gap: 16px;
    align-items: center;
  }

  .policy-icon {
    color: var(--el-text-color-primary);
  }

  .policy-details {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .policy-name {
    display: flex;
    align-items: center;
    margin: 0;
    font-size: 1.1rem;
    font-weight: 600;
  }

  .policy-tags {
    display: flex;
    gap: 8px;
  }

  .card-overlay {
    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    background: rgba(var(--el-bg-color-rgb), 0.7);
    backdrop-filter: blur(2px);
    opacity: 0;
    transition: opacity 0.4s ease;
  }

  .card-actions {
    display: flex;
    gap: 10px;
    transition: transform 0.4s ease;
    transform: translateY(20px);

    :deep(.el-button span) {
      margin-left: 0 !important;
    }
  }

  &:hover {
    .card-overlay {
      opacity: 1;
    }

    .card-actions {
      transform: translateY(0);
    }
  }
}

.storage-type-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
}

.type-item {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 16px;
  cursor: pointer;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  transition: all 0.2s ease-in-out;

  &:hover {
    color: var(--anzhiyu-white);
    background-color: var(--anzhiyu-theme);
    border-color: var(--el-color-primary);
  }
}

/* 弹窗内滚动条样式 */
:deep(.scrollable-dialog-content) {
  max-height: 60vh;
  overflow-y: auto;

  /* 自定义滚动条样式 */
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: var(--el-fill-color-light);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--el-color-info-light-5);
    border-radius: 3px;

    &:hover {
      background: var(--el-color-info-light-3);
    }
  }
}

/* CORS成功弹窗样式 */
:deep(.cors-success-dialog) {
  .success-content {
    padding: 0;
  }

  .success-header {
    display: flex;
    gap: 12px;
    align-items: center;
    padding: 16px 20px;
    margin-bottom: 20px;
    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
    border-left: 4px solid #67c23a;
    border-radius: 8px;

    h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }
  }

  .cors-info {
    h4 {
      display: flex;
      gap: 8px;
      align-items: center;
      margin: 0 0 12px;
      font-size: 16px;
      font-weight: 600;
      color: #67c23a;
    }

    > p {
      margin: 0 0 16px;
      line-height: 1.6;
      color: var(--el-text-color-regular);
    }
  }

  .cors-rules {
    padding: 16px;
    margin-bottom: 16px;
    background: var(--el-fill-color-extra-light);
    border-radius: 8px;

    .rule-item {
      display: flex;
      flex-direction: column;
      padding-bottom: 12px;
      margin-bottom: 12px;
      border-bottom: 1px solid var(--el-border-color-lighter);

      &:last-child {
        padding-bottom: 0;
        margin-bottom: 0;
        border-bottom: none;
      }

      .rule-label {
        margin-bottom: 4px;
        font-size: 14px;
        font-weight: 600;
        color: var(--el-text-color-primary);
      }

      .rule-value {
        display: inline-block;
        padding: 4px 8px;
        margin-bottom: 4px;
        font-family: Monaco, Menlo, "Ubuntu Mono", monospace;
        font-size: 13px;
        color: #409eff;
        background: rgb(64 158 255 / 10%);
        border-radius: 4px;
      }

      .rule-desc {
        font-size: 12px;
        line-height: 1.5;
        color: var(--el-text-color-secondary);
      }
    }
  }

  .success-note {
    padding: 12px 16px;
    background: #f0f9ff;
    border: 1px solid #bfdbfe;
    border-radius: 6px;

    p {
      margin: 0;
      font-size: 14px;
      line-height: 1.5;
      color: var(--el-text-color-regular);

      strong {
        color: var(--el-text-color-primary);
      }
    }
  }
}

/* 腾讯云COS、阿里云OSS、AWS S3弹窗特定样式 */
:deep(.tencent-cos-dialog),
:deep(.aliyun-oss-dialog),
:deep(.aws-s3-dialog) {
  .dialog-content {
    padding: 0 !important;
    overflow: hidden;
  }
}

@media screen and (width <= 768px) {
  .card-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  }
}
</style>
