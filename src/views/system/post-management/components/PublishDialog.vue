<script setup lang="ts">
import type { ArticleForm, PostCategory, PostTag } from "@/api/post/type";
import {
  Plus,
  Remove,
  Setting,
  InfoFilled,
  Edit,
  Delete
} from "@element-plus/icons-vue";
import { computed, ref, watch, nextTick } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import ImageUpload from "@/components/ImageUpload/index.vue";
import { updateCategory, deleteCategory, createCategory } from "@/api/post";
import AnDialog from "@/components/AnDialog/index.vue";

const props = defineProps<{
  modelValue: boolean;
  form: ArticleForm;
  categoryOptions: PostCategory[];
  tagOptions: PostTag[];
  isSubmitting: boolean;
  categorySelectKey: number;
  tagSelectKey: number;
}>();

const emit = defineEmits([
  "update:modelValue",
  "change-category",
  "change-tag",
  "confirm-publish",
  "refresh-categories"
]);

const activeTab = ref("common");
const internalForm = props.form;
const copyrightType = ref<"original" | "reprint">("original");
const isCategoryManagerVisible = ref(false);

// === 分类管理弹窗所需状态 ===
const newCategoryForm = ref({
  name: "",
  is_series: false
});
const isCreating = ref(false);
const editingCategoryId = ref<string | null>(null);
const editingCategoryName = ref("");
const loadingStates = ref<Record<string, boolean>>({}); // 用于跟踪每行的加载状态

const isVisible = computed({
  get: () => props.modelValue,
  set: val => emit("update:modelValue", val)
});

const hasSeriesCategory = computed(() => {
  if (
    !internalForm.post_category_ids ||
    internalForm.post_category_ids.length === 0
  ) {
    return false;
  }
  const selectedId = internalForm.post_category_ids[0];
  const category = props.categoryOptions.find(c => c.id === selectedId);
  return category?.is_series ?? false;
});

const hasMultipleRegularCategories = computed(() => {
  return (
    internalForm.post_category_ids &&
    internalForm.post_category_ids.length > 0 &&
    !hasSeriesCategory.value
  );
});

watch(
  () => props.modelValue,
  isVisible => {
    if (isVisible) {
      activeTab.value = "common";
      copyrightType.value = props.form.copyright_author
        ? "reprint"
        : "original";
    }
  }
);

watch(copyrightType, newType => {
  if (newType === "original") {
    internalForm.copyright_author = "";
    internalForm.copyright_author_href = "";
    internalForm.copyright_url = "";
  }
});

const statusOptions = [
  { value: "PUBLISHED", label: "发布" },
  { value: "DRAFT", label: "草稿" },
  { value: "ARCHIVED", label: "归档" }
];

const isCategoryNameExists = (name: string): boolean => {
  return props.categoryOptions.some(
    cat => cat.name.toLowerCase() === name.toLowerCase()
  );
};

// === 分类管理弹窗相关方法 ===

// 开始行内编辑
const handleEditCategory = (category: PostCategory) => {
  editingCategoryId.value = category.id;
  editingCategoryName.value = category.name;
  nextTick(() => {
    // 聚焦输入框
    const inputEl = document.querySelector(
      `#category-edit-input-${category.id} input`
    );
    if (inputEl) {
      (inputEl as HTMLElement).focus();
    }
  });
};

// 取消编辑
const cancelEdit = () => {
  editingCategoryId.value = null;
  editingCategoryName.value = "";
};

// 提交名称更新
const handleUpdateCategoryName = async (category: PostCategory) => {
  if (
    !editingCategoryName.value.trim() ||
    editingCategoryName.value.trim() === category.name
  ) {
    cancelEdit();
    return;
  }
  loadingStates.value[category.id] = true;
  try {
    await updateCategory(category.id, { name: editingCategoryName.value });
    ElMessage.success("分类名称更新成功");
    emit("refresh-categories");
    cancelEdit();
  } catch (error: any) {
    ElMessage.error(error.message || "更新失败");
  } finally {
    loadingStates.value[category.id] = false;
  }
};

// 切换分类类型
const toggleCategoryType = async (category: PostCategory) => {
  const newIsSeries = !category.is_series;
  const action = newIsSeries ? "设置为系列" : "设置为普通分类";
  try {
    await ElMessageBox.confirm(
      `确定要将分类 "${category.name}" ${action}吗？`,
      "确认操作",
      {
        type: "warning"
      }
    );
    loadingStates.value[category.id] = true;
    await updateCategory(category.id, { is_series: newIsSeries });
    ElMessage.success(`${action}成功`);
    emit("refresh-categories");
  } catch (error: any) {
    if (error !== "cancel") ElMessage.error(error.message || "操作失败");
  } finally {
    loadingStates.value[category.id] = false;
  }
};

// 删除分类
const handleDeleteCategory = async (category: PostCategory) => {
  const message =
    category.count > 0
      ? `此操作将删除分类 "${category.name}"，其下的 ${category.count} 篇文章将不再属于该分类。是否继续？`
      : `确定要删除分类 "${category.name}" 吗？此操作不可恢复。`;

  try {
    await ElMessageBox.confirm(message, "警告", {
      type: "warning",
      confirmButtonText: "确认删除"
    });
    loadingStates.value[category.id] = true;
    await deleteCategory(category.id);
    ElMessage.success("删除成功");
    emit("refresh-categories");
  } catch (error: any) {
    if (error !== "cancel") ElMessage.error(error.message || "删除失败");
  } finally {
    loadingStates.value[category.id] = false;
  }
};

// 创建新分类
const handleCreateCategory = async () => {
  const name = newCategoryForm.value.name.trim();
  if (!name) {
    ElMessage.warning("分类名称不能为空");
    return;
  }
  if (isCategoryNameExists(name)) {
    ElMessage.error(`分类 "${name}" 已存在`);
    return;
  }
  isCreating.value = true;
  try {
    await createCategory({ name, is_series: newCategoryForm.value.is_series });
    ElMessage.success("创建成功");
    newCategoryForm.value.name = "";
    newCategoryForm.value.is_series = false;
    emit("refresh-categories");
  } catch (error: any) {
    ElMessage.error(error.message || "创建失败");
  } finally {
    isCreating.value = false;
  }
};

const addSummaryInput = () => {
  if (!internalForm.summaries) internalForm.summaries = [];
  if (internalForm.summaries.length < 3) internalForm.summaries.push("");
};

const removeSummaryInput = (index: number) => {
  internalForm.summaries.splice(index, 1);
};

const handleConfirm = () => {
  internalForm.copyright = true;
  emit("confirm-publish");
};
</script>

<template>
  <div>
    <AnDialog
      v-model="isVisible"
      :title="form.status === 'PUBLISHED' ? '更新文章' : '发布文章'"
      width="860px"
      max-height="90vh"
      container-class="publish-dialog"
    >
      <el-tabs v-model="activeTab" class="publish-tabs">
        <el-tab-pane label="常用设置" name="common">
          <el-form :model="internalForm" label-position="top">
            <el-row :gutter="24">
              <el-col :span="12">
                <el-form-item label="分类" prop="post_category_ids">
                  <template #label>
                    <span>分类</span>
                    <el-tooltip placement="top" :show-arrow="false">
                      <template #content>
                        一篇文章可选择多个普通分类，或单个系列分类。<br />
                        如需增改，请点击右侧按钮进行管理。
                      </template>
                      <el-icon class="label-icon"><InfoFilled /></el-icon>
                    </el-tooltip>
                    <el-button
                      type="primary"
                      :icon="Setting"
                      text
                      size="small"
                      class="manage-btn"
                      @click="isCategoryManagerVisible = true"
                    >
                      管理分类
                    </el-button>
                  </template>
                  <el-select
                    :key="props.categorySelectKey"
                    v-model="internalForm.post_category_ids"
                    multiple
                    filterable
                    placeholder="请选择分类"
                    style="width: 100%"
                    no-data-text="暂无分类，请在'管理分类'中添加"
                    :multiple-limit="hasSeriesCategory ? 1 : 3"
                    @change="values => emit('change-category', values)"
                  >
                    <el-option
                      v-for="item in categoryOptions"
                      :key="item.id"
                      :label="item.name"
                      :value="item.id"
                      :disabled="
                        (hasSeriesCategory &&
                          item.id !== internalForm.post_category_ids[0]) ||
                        (hasMultipleRegularCategories && item.is_series)
                      "
                    >
                      <div class="category-option-item">
                        <span>{{ item.name }}</span>
                        <el-tag
                          v-if="item.is_series"
                          type="success"
                          size="small"
                          effect="light"
                          round
                          >系列</el-tag
                        >
                      </div>
                    </el-option>
                  </el-select>
                </el-form-item>
              </el-col>

              <el-col :span="12">
                <el-form-item label="标签" prop="post_tag_ids">
                  <el-select
                    :key="props.tagSelectKey"
                    v-model="internalForm.post_tag_ids"
                    multiple
                    filterable
                    allow-create
                    default-first-option
                    placeholder="选择或创建标签"
                    style="width: 100%"
                    no-data-text="输入名称后按回车键创建"
                    @change="values => emit('change-tag', values)"
                  >
                    <el-option
                      v-for="item in tagOptions"
                      :key="item.id"
                      :label="item.name"
                      :value="item.id"
                    />
                  </el-select>
                </el-form-item>
              </el-col>

              <el-col :span="12">
                <el-form-item label="封面图" prop="cover_url">
                  <ImageUpload v-model="internalForm.cover_url" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="顶部大图 (可选)" prop="top_img_url">
                  <ImageUpload v-model="internalForm.top_img_url" />
                  <div class="form-item-help">若不填, 将自动使用封面图URL</div>
                </el-form-item>
              </el-col>

              <el-col :span="12">
                <el-form-item label="状态" prop="status">
                  <el-radio-group
                    v-model="internalForm.status"
                    class="status-radio-group"
                  >
                    <el-radio-button
                      v-for="item in statusOptions"
                      :key="item.value"
                      :value="item.value"
                      >{{ item.label }}</el-radio-button
                    >
                  </el-radio-group>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="文章类型">
                  <el-radio-group v-model="copyrightType">
                    <el-radio-button value="original">原创</el-radio-button>
                    <el-radio-button value="reprint">转载</el-radio-button>
                  </el-radio-group>
                </el-form-item>
                <div v-if="copyrightType === 'reprint'">
                  <el-form-item label="版权作者 (可选)" prop="copyright_author">
                    <el-input
                      v-model="internalForm.copyright_author"
                      placeholder="请输入原文作者"
                    />
                  </el-form-item>
                </div>
              </el-col>
              <el-col :span="24">
                <el-form-item label="摘要" prop="summaries">
                  <div
                    v-for="(summary, index) in internalForm.summaries"
                    :key="index"
                    class="summary-item"
                  >
                    <el-input
                      v-model="internalForm.summaries[index]"
                      placeholder="请输入单行摘要..."
                    />
                    <el-button
                      :icon="Remove"
                      type="danger"
                      circle
                      plain
                      @click="removeSummaryInput(index)"
                    />
                  </div>
                  <el-button
                    v-if="
                      !internalForm.summaries ||
                      internalForm.summaries.length < 3
                    "
                    :icon="Plus"
                    type="primary"
                    plain
                    style="width: 100%"
                    @click="addSummaryInput"
                  >
                    新增摘要 ({{ internalForm.summaries?.length || 0 }}/3)
                  </el-button>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="高级设置" name="advanced">
          <el-form :model="internalForm" label-position="top">
            <el-row :gutter="24">
              <el-col :span="12">
                <el-form-item label="自定义永久链接 (可选)" prop="abbrlink">
                  <el-input
                    v-model="internalForm.abbrlink"
                    placeholder="例如: my-awesome-post"
                  />
                  <div class="form-item-help">唯一、友好，留空则自动生成。</div>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="IP 属地 (可选)" prop="ip_location">
                  <el-input
                    v-model="internalForm.ip_location"
                    placeholder="留空则自动获取"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="首页推荐排序">
                  <el-input-number
                    v-model="internalForm.home_sort"
                    :min="0"
                    controls-position="right"
                    style="width: 100%"
                    placeholder="0"
                  />
                  <div class="form-item-help">
                    0则不推荐, >0则推荐, 值越小越靠前
                  </div>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="文章置顶排序">
                  <el-input-number
                    v-model="internalForm.pin_sort"
                    :min="0"
                    controls-position="right"
                    style="width: 100%"
                    placeholder="0"
                  />
                  <div class="form-item-help">
                    0则不置顶, >0则置顶, 值越小越靠前
                  </div>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="手动指定主色调">
                  <el-switch v-model="internalForm.is_primary_color_manual" />
                </el-form-item>
                <el-form-item
                  v-if="internalForm.is_primary_color_manual"
                  label="主色调"
                  prop="primary_color"
                >
                  <el-color-picker v-model="internalForm.primary_color" />
                </el-form-item>
                <el-form-item
                  v-else-if="
                    !internalForm.is_primary_color_manual &&
                    internalForm.primary_color
                  "
                  label="主色调 (自动获取)"
                >
                  <el-color-picker
                    v-model="internalForm.primary_color"
                    disabled
                  />
                  <div class="form-item-help" style="margin-left: 10px">
                    由封面图自动提取
                  </div>
                </el-form-item>
              </el-col>
              <el-col v-if="copyrightType === 'reprint'" :span="12">
                <el-form-item
                  label="版权作者链接 (可选)"
                  prop="copyright_author_href"
                >
                  <el-input
                    v-model="internalForm.copyright_author_href"
                    placeholder="https://..."
                  />
                </el-form-item>
                <el-form-item label="版权来源链接 (可选)" prop="copyright_url">
                  <el-input
                    v-model="internalForm.copyright_url"
                    placeholder="转载文章的原始链接"
                  />
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-tab-pane>
      </el-tabs>

      <template #footer>
        <el-button @click="isVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="isSubmitting"
          @click="handleConfirm"
        >
          {{ form.status === "PUBLISHED" ? "确认更新" : "确认发布" }}
        </el-button>
      </template>
    </AnDialog>

    <AnDialog v-model="isCategoryManagerVisible" title="管理分类" width="720px">
      <div class="category-manager-body">
        <div class="create-category-form">
          <el-input
            v-model="newCategoryForm.name"
            placeholder="输入新分类名称"
          />
          <el-switch
            v-model="newCategoryForm.is_series"
            active-text="设为系列"
            style="margin: 0 20px; width: 250px"
          />
          <el-button
            type="primary"
            :loading="isCreating"
            @click="handleCreateCategory"
          >
            添加分类
          </el-button>
        </div>

        <el-table
          v-loading="!categoryOptions"
          :data="categoryOptions"
          style="width: 100%"
          height="350px"
        >
          <el-table-column prop="name" label="分类名称" min-width="150">
            <template #default="scope">
              <div v-if="editingCategoryId === scope.row.id" class="edit-cell">
                <el-input
                  :id="`category-edit-input-${scope.row.id}`"
                  v-model="editingCategoryName"
                  size="small"
                  @blur="handleUpdateCategoryName(scope.row)"
                  @keydown.enter="handleUpdateCategoryName(scope.row)"
                />
              </div>
              <span v-else>{{ scope.row.name }}</span>
            </template>
          </el-table-column>
          <el-table-column
            prop="count"
            label="文章数"
            width="90"
            align="center"
          />
          <el-table-column label="类型" width="100" align="center">
            <template #default="scope">
              <el-tag
                :type="scope.row.is_series ? 'success' : 'info'"
                size="small"
                effect="light"
              >
                {{ scope.row.is_series ? "系列" : "普通" }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="220" align="center">
            <template #default="scope">
              <div v-loading="loadingStates[scope.row.id]">
                <el-button-group>
                  <el-tooltip
                    :show-arrow="false"
                    content="编辑名称"
                    placement="top"
                  >
                    <el-button
                      :icon="Edit"
                      type="primary"
                      link
                      @click="handleEditCategory(scope.row)"
                    />
                  </el-tooltip>
                  <el-button
                    type="primary"
                    style="margin: 0 4px"
                    link
                    @click="toggleCategoryType(scope.row)"
                  >
                    {{ scope.row.is_series ? "转为普通" : "转为系列" }}
                  </el-button>
                  <el-tooltip
                    content="删除分类"
                    placement="top"
                    :show-arrow="false"
                  >
                    <el-button
                      :icon="Delete"
                      type="danger"
                      link
                      @click="handleDeleteCategory(scope.row)"
                    />
                  </el-tooltip>
                </el-button-group>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <template #footer>
        <el-button @click="isCategoryManagerVisible = false">关闭</el-button>
      </template>
    </AnDialog>
  </div>
</template>

<style lang="scss" scoped>
.form-item-help {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

.summary-item {
  display: flex;
  gap: 8px;
  align-items: center;
  width: 100%;
  margin-bottom: 8px;

  .el-input {
    flex-grow: 1;
  }
}

.status-radio-group {
  width: 100%;

  :deep(.el-radio-button) {
    width: calc(100% / 3);

    .el-radio-button__inner {
      width: 100%;
    }
  }
}

.publish-tabs {
  :deep(.el-tabs__header) {
    margin-bottom: 20px;
  }
}

:deep(.el-form-item__label) {
  .label-icon {
    margin-left: 4px;
    vertical-align: middle;
    color: var(--el-text-color-secondary);
  }
  .manage-btn {
    margin-left: auto;
    font-weight: normal;
  }
}

.category-option-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.category-manager-body {
  .create-category-form {
    display: flex;
    align-items: center;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    margin-bottom: 16px;
  }
  .edit-cell {
    display: flex;
    align-items: center;
    gap: 8px;
  }
}
</style>
