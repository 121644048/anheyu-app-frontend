<template>
  <el-dialog
    v-model="dialogVisible"
    title="批量导入友链"
    width="800px"
    align-center
    class="import-dialog"
    append-to-body
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div v-if="!showResult" class="import-content">
      <!-- 导入说明 -->
      <el-alert :closable="false" type="info" show-icon class="mb-4">
        <template #title>
          <div class="alert-title">导入说明</div>
        </template>
        <template #default>
          <div class="alert-content">
            支持批量导入友链，请在下方粘贴 JSON 格式的友链数据。
            <el-link @click="showExample = !showExample"
              >{{ showExample ? "收起" : "查看" }}示例格式</el-link
            >
          </div>
        </template>
      </el-alert>

      <!-- JSON 示例 -->
      <el-collapse-transition>
        <el-card v-show="showExample" class="mb-4 example-card" shadow="never">
          <template #header>
            <div class="example-header">
              <span>JSON 格式示例</span>
              <el-button size="small" type="primary" link @click="copyExample">
                复制示例
              </el-button>
            </div>
          </template>
          <pre class="example-code">{{ exampleJson }}</pre>
        </el-card>
      </el-collapse-transition>

      <!-- JSON 输入区域 -->
      <el-form :model="formData" label-position="top">
        <el-form-item label="JSON 数据">
          <el-input
            v-model="formData.jsonContent"
            type="textarea"
            :rows="12"
            placeholder="请粘贴 JSON 格式的友链数据..."
            class="json-input"
            @input="validateJson"
          />
          <div v-if="jsonError" class="json-error">
            <el-text type="danger" size="small">{{ jsonError }}</el-text>
          </div>
          <div v-if="parsedData.length > 0" class="json-success">
            <el-text type="success" size="small">
              ✓ JSON 格式正确，检测到 {{ parsedData.length }} 个友链
            </el-text>
          </div>
        </el-form-item>
      </el-form>

      <!-- 导入选项 -->
      <el-card class="options-card" shadow="never">
        <template #header>
          <span class="options-title">导入选项</span>
        </template>
        <div class="options-content">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-checkbox
                v-model="formData.skipDuplicates"
                label="跳过重复友链"
                size="large"
              />
              <div class="option-desc">基于 URL 检测重复友链并跳过</div>
            </el-col>
            <el-col :span="12">
              <el-checkbox
                v-model="formData.createCategories"
                label="自动创建分类"
                size="large"
              />
              <div class="option-desc">不存在的分类将自动创建</div>
            </el-col>
          </el-row>
          <el-row :gutter="20" class="mt-3">
            <el-col :span="12">
              <el-checkbox
                v-model="formData.createTags"
                label="自动创建标签"
                size="large"
              />
              <div class="option-desc">不存在的标签将自动创建</div>
            </el-col>
            <el-col :span="12">
              <div class="default-category">
                <label class="category-label">默认分类</label>
                <el-select
                  v-model="formData.defaultCategoryId"
                  placeholder="选择默认分类"
                  style="width: 100%"
                  size="default"
                >
                  <el-option
                    v-for="category in categories"
                    :key="category.id"
                    :label="category.name"
                    :value="category.id"
                  />
                </el-select>
                <div class="option-desc">分类不存在时使用此分类</div>
              </div>
            </el-col>
          </el-row>
        </div>
      </el-card>
    </div>

    <!-- 导入结果 -->
    <div v-else class="result-content">
      <div class="result-summary">
        <el-result
          :icon="importResult!.success > 0 ? 'success' : 'warning'"
          :title="`导入完成`"
          :sub-title="`共处理 ${importResult!.total} 个友链，成功 ${importResult!.success} 个`"
        >
          <template #extra>
            <div class="result-stats">
              <el-tag type="success" size="large"
                >成功: {{ importResult!.success }}</el-tag
              >
              <el-tag type="warning" size="large"
                >跳过: {{ importResult!.skipped }}</el-tag
              >
              <el-tag type="danger" size="large"
                >失败: {{ importResult!.failed }}</el-tag
              >
            </div>
          </template>
        </el-result>
      </div>

      <!-- 详细结果 -->
      <el-tabs v-model="activeTab" class="result-tabs">
        <!-- 成功列表 -->
        <el-tab-pane
          v-if="importResult!.success > 0"
          :label="`成功 (${importResult!.success})`"
          name="success"
        >
          <div class="result-list">
            <el-card
              v-for="link in importResult!.success_list"
              :key="link.id"
              class="link-result-card"
              shadow="hover"
            >
              <div class="link-info">
                <el-avatar :size="30" :src="link.logo" />
                <div class="link-details">
                  <div class="link-name">{{ link.name }}</div>
                  <el-link :href="link.url" type="primary" target="_blank">
                    {{ link.url }}
                  </el-link>
                </div>
                <el-tag
                  :type="link.status === 'APPROVED' ? 'success' : 'warning'"
                  size="small"
                >
                  {{ link.status === "APPROVED" ? "已通过" : "待审核" }}
                </el-tag>
              </div>
            </el-card>
          </div>
        </el-tab-pane>

        <!-- 跳过列表 -->
        <el-tab-pane
          v-if="importResult!.skipped > 0"
          :label="`跳过 (${importResult!.skipped})`"
          name="skipped"
        >
          <div class="result-list">
            <el-card
              v-for="(item, index) in importResult!.skipped_list"
              :key="index"
              class="link-result-card"
              shadow="hover"
            >
              <div class="link-info">
                <el-avatar :size="30" :src="item.link.logo" />
                <div class="link-details">
                  <div class="link-name">{{ item.link.name }}</div>
                  <div class="link-reason">{{ item.reason }}</div>
                </div>
              </div>
            </el-card>
          </div>
        </el-tab-pane>

        <!-- 失败列表 -->
        <el-tab-pane
          v-if="importResult!.failed > 0"
          :label="`失败 (${importResult!.failed})`"
          name="failed"
        >
          <div class="result-list">
            <el-card
              v-for="(item, index) in importResult!.failed_list"
              :key="index"
              class="link-result-card"
              shadow="hover"
            >
              <div class="link-info">
                <el-avatar :size="30" :src="item.link.logo" />
                <div class="link-details">
                  <div class="link-name">{{ item.link.name }}</div>
                  <div class="link-reason error">{{ item.reason }}</div>
                </div>
              </div>
            </el-card>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">
          {{ showResult ? "关闭" : "取消" }}
        </el-button>
        <el-button
          v-if="!showResult"
          type="primary"
          :loading="importing"
          :disabled="parsedData.length === 0"
          @click="handleImport"
        >
          {{ importing ? "导入中..." : "开始导入" }}
        </el-button>
        <el-button v-if="showResult" type="primary" @click="resetForm">
          继续导入
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { ElMessage } from "element-plus";
import { importLinks, getLinkCategories } from "@/api/postLink";
import type {
  ImportLinksRequest,
  ImportLinksResponse,
  ImportLinkItem,
  LinkCategory
} from "@/api/postLink/type";

defineOptions({
  name: "ImportDialog"
});

// Props
interface Props {
  modelValue: boolean;
}
const props = defineProps<Props>();

// Emits
interface Emits {
  (e: "update:modelValue", value: boolean): void;
  (e: "success"): void;
}
const emit = defineEmits<Emits>();

// 响应式数据
const dialogVisible = computed({
  get: () => props.modelValue,
  set: value => emit("update:modelValue", value)
});

const showExample = ref(false);
const showResult = ref(false);
const importing = ref(false);
const jsonError = ref("");
const parsedData = ref<ImportLinkItem[]>([]);
const importResult = ref<ImportLinksResponse | null>(null);
const activeTab = ref("success");
const categories = ref<LinkCategory[]>([]);

// 表单数据
const formData = ref({
  jsonContent: "",
  skipDuplicates: true,
  createCategories: true,
  createTags: true,
  defaultCategoryId: 2
});

// 示例 JSON
const exampleJson = `{
  "links": [
    {
      "name": "安知鱼",
      "url": "https://blog.anheyu.com",
      "logo": "https://npm.elemecdn.com/anzhiyu-blog-static@1.0.4/img/avatar.jpg",
      "description": "生活明朗，万物可爱",
      "siteshot": "https://blog.anheyu.com/screenshot.png",
      "category_name": "好友",
      "tag_name": "博客",
      "status": "APPROVED"
    },
    {
      "name": "GitHub",
      "url": "https://github.com",
      "logo": "https://github.com/favicon.ico",
      "description": "代码托管平台",
      "category_name": "工具",
      "tag_name": "开发工具"
    }
  ],
  "skip_duplicates": true,
  "create_categories": true,
  "create_tags": true
}`;

// 验证 JSON
const validateJson = () => {
  jsonError.value = "";
  parsedData.value = [];

  if (!formData.value.jsonContent.trim()) {
    return;
  }

  try {
    const parsed = JSON.parse(formData.value.jsonContent);

    // 检查数据结构
    if (!parsed.links || !Array.isArray(parsed.links)) {
      jsonError.value = "JSON 格式错误：缺少 'links' 数组";
      return;
    }

    if (parsed.links.length === 0) {
      jsonError.value = "友链数据为空";
      return;
    }

    // 检查每个友链的必要字段
    for (let i = 0; i < parsed.links.length; i++) {
      const link = parsed.links[i];
      if (!link.name || !link.url) {
        jsonError.value = `第 ${i + 1} 个友链缺少必要字段 'name' 或 'url'`;
        return;
      }
    }

    parsedData.value = parsed.links;

    // 更新选项
    if (parsed.skip_duplicates !== undefined) {
      formData.value.skipDuplicates = parsed.skip_duplicates;
    }
    if (parsed.create_categories !== undefined) {
      formData.value.createCategories = parsed.create_categories;
    }
    if (parsed.create_tags !== undefined) {
      formData.value.createTags = parsed.create_tags;
    }
    if (parsed.default_category_id !== undefined) {
      formData.value.defaultCategoryId = parsed.default_category_id;
    }
  } catch (error) {
    jsonError.value = "JSON 格式错误：" + (error as Error).message;
  }
};

// 复制示例
const copyExample = async () => {
  try {
    await navigator.clipboard.writeText(exampleJson);
    ElMessage.success("示例已复制到剪贴板");
  } catch (error) {
    console.error("复制失败", error);
    ElMessage.error("复制失败，请手动复制");
  }
};

// 执行导入
const handleImport = async () => {
  if (parsedData.value.length === 0) {
    ElMessage.error("请输入有效的 JSON 数据");
    return;
  }

  importing.value = true;

  try {
    const requestData: ImportLinksRequest = {
      links: parsedData.value,
      skip_duplicates: formData.value.skipDuplicates,
      create_categories: formData.value.createCategories,
      create_tags: formData.value.createTags,
      default_category_id: formData.value.defaultCategoryId
    };

    const response = await importLinks(requestData);

    if (response.code === 201) {
      importResult.value = response.data;
      showResult.value = true;

      // 设置默认显示的标签页
      if (response.data.success > 0) {
        activeTab.value = "success";
      } else if (response.data.failed > 0) {
        activeTab.value = "failed";
      } else if (response.data.skipped > 0) {
        activeTab.value = "skipped";
      }

      ElMessage.success("导入完成");
      emit("success");
    } else {
      ElMessage.error(response.message || "导入失败");
    }
  } catch (error) {
    console.error("导入失败", error);
    ElMessage.error("导入失败");
  } finally {
    importing.value = false;
  }
};

// 重置表单
const resetForm = () => {
  showResult.value = false;
  importResult.value = null;
  formData.value.jsonContent = "";
  parsedData.value = [];
  jsonError.value = "";
  activeTab.value = "success";
};

// 关闭对话框
const handleClose = () => {
  if (!importing.value) {
    dialogVisible.value = false;
    // 延迟重置，等待动画完成
    setTimeout(resetForm, 200);
  }
};

// 获取分类列表
const loadCategories = async () => {
  try {
    const response = await getLinkCategories();
    if (response.code === 200) {
      categories.value = response.data;
      // 设置默认分类为第一个
      if (categories.value.length > 0 && !formData.value.defaultCategoryId) {
        formData.value.defaultCategoryId = categories.value[0].id;
      }
    }
  } catch (error) {
    console.error("获取分类列表失败", error);
  }
};

// 监听对话框打开
watch(
  () => props.modelValue,
  newValue => {
    if (newValue) {
      loadCategories();
    }
  }
);

onMounted(() => {
  if (props.modelValue) {
    loadCategories();
  }
});
</script>

<style lang="scss" scoped>
.import-content {
  .mb-4 {
    margin-bottom: 16px;
  }

  .alert-title {
    font-weight: 600;
  }

  .alert-content {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--el-text-color-regular);
    font-size: 14px;
  }
}

.example-card {
  border: 1px solid var(--el-border-color-lighter);

  .example-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 600;
  }

  .example-code {
    margin: 0;
    padding: 16px;
    background: var(--el-fill-color-lighter);
    border-radius: 6px;
    font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
    font-size: 12px;
    line-height: 1.5;
    overflow-x: auto;
    white-space: pre;
  }
}

.json-input {
  font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;

  :deep(.el-textarea__inner) {
    font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
    line-height: 1.4;
  }
}

.json-error {
  margin-top: 8px;
}

.json-success {
  margin-top: 8px;
}

.options-card {
  margin-top: 16px;
  border: 1px solid var(--el-border-color-lighter);

  .options-title {
    font-weight: 600;
  }

  .options-content {
    .option-desc {
      margin-top: 4px;
      color: var(--el-text-color-secondary);
      font-size: 12px;
    }

    .mt-3 {
      margin-top: 16px;
    }

    .default-category {
      .category-label {
        display: block;
        margin-bottom: 8px;
        color: var(--el-text-color-regular);
        font-size: 14px;
        font-weight: 500;
      }
    }
  }
}

.result-content {
  .result-summary {
    text-align: center;
    margin-bottom: 24px;

    .result-stats {
      display: flex;
      justify-content: center;
      gap: 12px;
      margin-top: 16px;
    }
  }

  .result-tabs {
    .result-list {
      max-height: 400px;
      overflow-y: auto;

      .link-result-card {
        margin-bottom: 12px;

        &:last-child {
          margin-bottom: 0;
        }

        .link-info {
          display: flex;
          align-items: center;
          gap: 12px;

          .link-details {
            flex: 1;
            min-width: 0;

            .link-name {
              font-weight: 500;
              color: var(--el-text-color-primary);
              margin-bottom: 4px;
            }

            .link-reason {
              font-size: 12px;
              color: var(--el-text-color-secondary);

              &.error {
                color: var(--el-color-danger);
              }
            }
          }
        }
      }
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

// 弹窗样式优化
.import-dialog {
  :deep(.el-dialog) {
    max-height: 85vh;
  }

  :deep(.el-dialog__body) {
    overflow: hidden;
  }
}

// 内容区域滚动样式
.import-content {
  max-height: 60vh;
  overflow-y: auto;
  padding-right: 8px;

  // 自定义滚动条样式
  scrollbar-width: thin;
  scrollbar-color: var(--el-border-color-light) transparent;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background-color: var(--el-border-color-light);
    border-radius: 3px;
    transition: background-color 0.3s;

    &:hover {
      background-color: var(--el-border-color);
    }
  }
}

// 结果内容区域样式优化
.result-content {
  .result-list {
    max-height: 300px;
    overflow-y: auto;
    padding-right: 8px;

    // 结果列表滚动条样式
    scrollbar-width: thin;
    scrollbar-color: var(--el-border-color-lighter) transparent;

    &::-webkit-scrollbar {
      width: 4px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background-color: var(--el-border-color-lighter);
      border-radius: 2px;

      &:hover {
        background-color: var(--el-border-color-light);
      }
    }
  }
}

// 响应式设计
@media screen and (width <= 768px) {
  .import-dialog {
    :deep(.el-dialog) {
      width: 95vw !important;
      height: auto !important;
      max-height: 90vh !important;
      margin: 5vh auto !important;
    }

    :deep(.el-dialog__body) {
      padding: 20px 16px;
      max-height: 70vh;
      overflow-y: auto;
    }

    :deep(.el-dialog__footer) {
      padding: 16px;
      border-top: 1px solid var(--el-border-color-lighter);
    }

    :deep(.el-dialog__header) {
      padding: 16px;
    }
  }

  .import-content {
    max-height: none;
    padding-right: 0;

    .mb-4 {
      margin-bottom: 14px;
    }

    .alert-content {
      font-size: 13px;
      flex-wrap: wrap;
    }

    .example-card {
      .example-code {
        font-size: 11px;
        padding: 12px;
      }
    }

    .json-input {
      :deep(.el-textarea__inner) {
        font-size: 13px;
        min-height: 200px !important;
      }
    }
  }

  .options-content {
    .el-row {
      .el-col {
        width: 100% !important;
        max-width: 100% !important;
        flex: 0 0 100% !important;
        margin-bottom: 16px;

        &:last-child {
          margin-bottom: 0;
        }
      }
    }

    .el-checkbox {
      :deep(.el-checkbox__label) {
        font-size: 15px;
      }
    }

    .option-desc {
      font-size: 12px;
      margin-top: 6px;
    }

    .default-category {
      .category-label {
        font-size: 15px;
        margin-bottom: 10px;
      }

      .el-select {
        :deep(.el-input__inner) {
          height: 44px;
          line-height: 44px;
          font-size: 15px;
        }
      }
    }
  }

  .result-content {
    .result-summary {
      margin-bottom: 20px;

      :deep(.el-result__title) {
        font-size: 16px;
      }

      :deep(.el-result__subtitle) {
        font-size: 13px;
      }

      .result-stats {
        flex-wrap: wrap;
        gap: 8px;

        .el-tag {
          font-size: 13px;
          padding: 0 10px;
          height: 28px;
          line-height: 26px;
        }
      }
    }

    .result-list {
      max-height: 300px;
      padding-right: 0;

      .link-result-card {
        margin-bottom: 10px;

        :deep(.el-card__body) {
          padding: 12px;
        }

        .link-info {
          gap: 10px;

          .el-avatar {
            width: 36px !important;
            height: 36px !important;
          }

          .link-details {
            .link-name {
              font-size: 14px;
              margin-bottom: 4px;
            }

            .el-link {
              font-size: 12px;
            }

            .link-reason {
              font-size: 12px;
            }
          }

          .el-tag {
            font-size: 11px;
            height: 22px;
            line-height: 20px;
            padding: 0 6px;
          }
        }
      }
    }
  }

  .dialog-footer {
    flex-direction: column;
    gap: 10px;

    .el-button {
      width: 100%;
      height: 44px;
      font-size: 15px;
      margin: 0 !important;
    }
  }
}

@media screen and (width <= 576px) {
  .import-dialog {
    :deep(.el-dialog) {
      width: 100vw !important;
      max-height: 100vh !important;
      margin: 0 !important;
      border-radius: 0;
    }

    :deep(.el-dialog__header) {
      .el-dialog__title {
        font-size: 17px;
      }
    }
  }

  .import-content {
    .json-input {
      :deep(.el-textarea__inner) {
        min-height: 180px !important;
      }
    }
  }
}
</style>
