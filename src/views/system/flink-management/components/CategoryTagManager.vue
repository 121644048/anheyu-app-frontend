<template>
  <el-drawer
    v-model="drawerVisible"
    title="分类与标签管理"
    direction="rtl"
    :size="drawerSize"
    @close="handleClose"
  >
    <div class="manager-container">
      <!-- 顶部切换标签 -->
      <el-tabs v-model="activeTab" class="manager-tabs">
        <el-tab-pane label="分类管理" name="categories">
          <div class="tab-content">
            <!-- 分类管理头部 -->
            <div class="content-header">
              <div class="header-info">
                <h3>友链分类</h3>
                <p class="subtitle">管理友链的分类，支持卡片和列表两种样式</p>
              </div>
              <el-button
                type="primary"
                :icon="Plus"
                @click="handleCreateCategory"
              >
                新建分类
              </el-button>
            </div>

            <!-- 分类列表 -->
            <div v-loading="categoryLoading" class="content-body">
              <div v-if="categories.length > 0" class="category-grid">
                <div
                  v-for="category in categories"
                  :key="category.id"
                  class="category-card"
                  :class="{ 'is-protected': isProtectedCategory(category.id) }"
                >
                  <div class="card-header">
                    <div class="category-info">
                      <div class="category-name">
                        {{ category.name }}
                        <el-tag
                          v-if="isProtectedCategory(category.id)"
                          type="warning"
                          size="small"
                          effect="plain"
                          class="protected-tag"
                        >
                          系统保护
                        </el-tag>
                      </div>
                      <div class="category-meta">
                        <el-tag
                          :type="
                            category.style === 'card' ? 'primary' : 'success'
                          "
                          size="small"
                        >
                          {{
                            category.style === "card" ? "卡片样式" : "列表样式"
                          }}
                        </el-tag>
                        <span class="usage-count">
                          {{ getCategoryUsage(category.id) }} 个友链
                        </span>
                      </div>
                    </div>
                    <div class="card-actions">
                      <el-button
                        link
                        type="primary"
                        :icon="Edit"
                        @click="handleEditCategory(category)"
                      />
                      <el-popconfirm
                        v-if="!isProtectedCategory(category.id)"
                        title="确定要删除这个分类吗？如果有友链正在使用此分类，删除操作将失败。"
                        @confirm="handleDeleteCategory(category.id)"
                      >
                        <template #reference>
                          <el-button link type="danger" :icon="Delete" />
                        </template>
                      </el-popconfirm>
                      <el-tooltip
                        v-else
                        content="系统保护的分类无法删除"
                        placement="top"
                        :show-arrow="false"
                      >
                        <el-button link type="info" :icon="Lock" disabled />
                      </el-tooltip>
                    </div>
                  </div>
                  <div v-if="category.description" class="category-description">
                    {{ category.description }}
                  </div>
                </div>
              </div>
              <el-empty v-else description="暂无分类，快去创建一个吧！" />
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="标签管理" name="tags">
          <div class="tab-content">
            <!-- 标签管理头部 -->
            <div class="content-header">
              <div class="header-info">
                <h3>友链标签</h3>
                <p class="subtitle">为友链添加标签，便于分类和筛选</p>
              </div>
              <el-button type="primary" :icon="Plus" @click="handleCreateTag">
                新建标签
              </el-button>
            </div>

            <!-- 标签列表 -->
            <div v-loading="tagLoading" class="content-body">
              <div v-if="tags.length > 0" class="tag-grid">
                <div v-for="tag in tags" :key="tag.id" class="tag-card">
                  <div class="tag-preview">
                    <el-tag
                      :color="tag.color"
                      :style="{ background: tag.color }"
                      size="large"
                      class="preview-tag"
                    >
                      {{ tag.name }}
                    </el-tag>
                  </div>
                  <div class="tag-info">
                    <div class="tag-name">{{ tag.name }}</div>
                    <div class="tag-meta">
                      <span class="color-code">{{ tag.color }}</span>
                      <span class="usage-count">
                        {{ getTagUsage(tag.id) }} 个友链
                      </span>
                    </div>
                  </div>
                  <div class="tag-actions">
                    <el-button
                      link
                      type="primary"
                      :icon="Edit"
                      @click="handleEditTag(tag)"
                    />
                    <el-popconfirm
                      title="确定要删除这个标签吗？如果有友链正在使用此标签，删除操作将失败。"
                      :show-arrow="false"
                      @confirm="handleDeleteTag(tag.id)"
                    >
                      <template #reference>
                        <el-button link type="danger" :icon="Delete" />
                      </template>
                    </el-popconfirm>
                  </div>
                </div>
              </div>
              <el-empty v-else description="暂无标签，快去创建一个吧！" />
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 分类编辑弹窗 -->
    <el-dialog
      v-model="categoryDialogVisible"
      :title="categoryEditMode ? '编辑分类' : '新建分类'"
      :width="dialogWidth"
      append-to-body
    >
      <el-form
        ref="categoryFormRef"
        :model="categoryForm"
        :rules="categoryRules"
        label-width="110px"
      >
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="categoryForm.name" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="样式" prop="style">
          <el-radio-group v-model="categoryForm.style">
            <el-radio-button label="card">
              <el-icon><CreditCard /></el-icon>
              卡片样式
            </el-radio-button>
            <el-radio-button label="list">
              <el-icon><List /></el-icon>
              列表样式
            </el-radio-button>
          </el-radio-group>
          <div class="form-tip">
            <small>卡片样式需要友链提供网站快照，列表样式更简洁</small>
          </div>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="categoryForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入分类描述（可选）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="categoryDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="categorySubmitLoading"
          @click="handleCategorySubmit"
        >
          确认
        </el-button>
      </template>
    </el-dialog>

    <!-- 标签编辑弹窗 -->
    <el-dialog
      v-model="tagDialogVisible"
      :title="tagEditMode ? '编辑标签' : '新建标签'"
      :width="dialogWidth"
      append-to-body
    >
      <el-form
        ref="tagFormRef"
        :model="tagForm"
        :rules="tagRules"
        label-width="110px"
      >
        <el-form-item label="标签名称" prop="name">
          <el-input v-model="tagForm.name" placeholder="请输入标签名称" />
        </el-form-item>
        <el-form-item label="标签颜色" prop="color">
          <div class="color-picker-wrapper">
            <el-color-picker
              v-model="tagForm.color"
              show-alpha
              :predefine="predefineColors"
            />
            <el-input
              v-model="tagForm.color"
              placeholder="#409EFF"
              class="color-input"
            />
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="tagDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="tagSubmitLoading"
          @click="handleTagSubmit"
        >
          确认
        </el-button>
      </template>
    </el-dialog>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, watch, reactive, onMounted, computed, onUnmounted } from "vue";
import {
  Plus,
  Edit,
  Delete,
  Lock,
  CreditCard,
  List
} from "@element-plus/icons-vue";
import type { FormInstance, FormRules } from "element-plus";
import { ElMessage, ElMessageBox } from "element-plus";
import type {
  LinkCategory,
  LinkTag,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  CreateTagRequest,
  UpdateTagRequest,
  LinkItem
} from "@/api/postLink/type";
import {
  getLinkCategories,
  getLinkTags,
  createLinkCategory,
  updateLinkCategory,
  createLinkTag,
  updateLinkTag,
  deleteLinkCategory,
  deleteLinkTag,
  getAdminLinkList
} from "@/api/postLink";

const props = defineProps<{
  modelValue: boolean;
}>();
const emit = defineEmits(["update:modelValue", "refresh"]);

// 移动端检测
const windowWidth = ref(window.innerWidth);
const isMobile = computed(() => windowWidth.value < 768);
const drawerSize = computed(() => {
  if (windowWidth.value < 576) {
    return "100%";
  } else if (windowWidth.value < 768) {
    return "95%";
  }
  return "800px";
});
const dialogWidth = computed(() => {
  if (windowWidth.value < 576) {
    return "95%";
  } else if (windowWidth.value < 768) {
    return "90%";
  }
  return "500px";
});

// 主抽屉状态
const drawerVisible = ref(props.modelValue);
const activeTab = ref<"categories" | "tags">("categories");

// 数据状态
const categories = ref<LinkCategory[]>([]);
const tags = ref<LinkTag[]>([]);
const allLinks = ref<LinkItem[]>([]);
const categoryLoading = ref(false);
const tagLoading = ref(false);

// 分类弹窗状态
const categoryDialogVisible = ref(false);
const categoryEditMode = ref(false);
const categorySubmitLoading = ref(false);
const categoryFormRef = ref<FormInstance>();
const currentCategoryId = ref<number | null>(null);

// 标签弹窗状态
const tagDialogVisible = ref(false);
const tagEditMode = ref(false);
const tagSubmitLoading = ref(false);
const tagFormRef = ref<FormInstance>();
const currentTagId = ref<number | null>(null);

// 表单数据
const initialCategoryForm: CreateCategoryRequest = {
  name: "",
  style: "card",
  description: ""
};

const initialTagForm: CreateTagRequest = {
  name: "",
  color: "#409EFF"
};

const categoryForm = ref<CreateCategoryRequest>({ ...initialCategoryForm });
const tagForm = ref<CreateTagRequest>({ ...initialTagForm });

// 表单验证规则
const categoryRules = reactive<FormRules>({
  name: [
    { required: true, message: "请输入分类名称", trigger: "blur" },
    {
      min: 1,
      max: 50,
      message: "分类名称长度在 1 到 50 个字符",
      trigger: "blur"
    }
  ],
  style: [{ required: true, message: "请选择样式", trigger: "change" }]
});

const tagRules = reactive<FormRules>({
  name: [
    { required: true, message: "请输入标签名称", trigger: "blur" },
    {
      min: 1,
      max: 20,
      message: "标签名称长度在 1 到 20 个字符",
      trigger: "blur"
    }
  ],
  color: [
    { required: true, message: "请选择标签颜色", trigger: "blur" },
    {
      pattern: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
      message: "请输入有效的颜色值",
      trigger: "blur"
    }
  ]
});

// 预定义颜色
const predefineColors = [
  "#ff4500",
  "#ff8c00",
  "#ffd700",
  "#90ee90",
  "#00ced1",
  "#1e90ff",
  "#c71585",
  "#409EFF",
  "#67C23A",
  "#E6A23C",
  "#F56C6C",
  "#909399"
];

// 系统保护的分类ID（硬编码，也可以从配置获取）
const protectedCategoryIds = [1, 2]; // "推荐" 和 "小伙伴"

// 计算属性
const isProtectedCategory = (categoryId: number) => {
  return protectedCategoryIds.includes(categoryId);
};

const getCategoryUsage = (categoryId: number) => {
  return allLinks.value.filter(link => link.category?.id === categoryId).length;
};

const getTagUsage = (tagId: number) => {
  return allLinks.value.filter(link => link.tag?.id === tagId).length;
};

// 监听 props 变化
watch(
  () => props.modelValue,
  val => {
    drawerVisible.value = val;
    if (val) {
      fetchData();
    }
  }
);

// 数据获取
const fetchCategories = async () => {
  categoryLoading.value = true;
  try {
    const res = await getLinkCategories();
    if (res.code === 200) {
      categories.value = res.data;
    }
  } catch (error) {
    console.error("获取分类列表失败", error);
    ElMessage.error("获取分类列表失败");
  } finally {
    categoryLoading.value = false;
  }
};

const fetchTags = async () => {
  tagLoading.value = true;
  try {
    const res = await getLinkTags();
    if (res.code === 200) {
      tags.value = res.data;
    }
  } catch (error) {
    console.error("获取标签列表失败", error);
    ElMessage.error("获取标签列表失败");
  } finally {
    tagLoading.value = false;
  }
};

const fetchAllLinks = async () => {
  try {
    let allLinksData: LinkItem[] = [];
    let currentPage = 1;
    const pageSize = 100; // 使用最大允许的页面大小

    // 分页获取所有数据
    while (true) {
      const res = await getAdminLinkList({
        page: currentPage,
        pageSize: pageSize
      });

      if (res.code === 200) {
        allLinksData = allLinksData.concat(res.data.list);

        // 如果返回的数据少于页面大小，说明已经是最后一页
        if (res.data.list.length < pageSize) {
          break;
        }

        currentPage++;
      } else {
        break;
      }
    }

    allLinks.value = allLinksData;
  } catch (error) {
    console.error("获取友链列表失败", error);
  }
};

const fetchData = async () => {
  await Promise.all([fetchCategories(), fetchTags(), fetchAllLinks()]);
};

// 事件处理
const handleClose = () => {
  emit("update:modelValue", false);
};

// 分类相关操作
const handleCreateCategory = () => {
  categoryEditMode.value = false;
  categoryForm.value = { ...initialCategoryForm };
  currentCategoryId.value = null;
  categoryDialogVisible.value = true;
};

const handleEditCategory = (category: LinkCategory) => {
  categoryEditMode.value = true;
  categoryForm.value = {
    name: category.name,
    style: category.style,
    description: category.description
  };
  currentCategoryId.value = category.id;
  categoryDialogVisible.value = true;
};

const handleCategorySubmit = async () => {
  if (!categoryFormRef.value) return;

  await categoryFormRef.value.validate(async valid => {
    if (valid) {
      categorySubmitLoading.value = true;
      try {
        if (categoryEditMode.value && currentCategoryId.value) {
          await updateLinkCategory(
            currentCategoryId.value,
            categoryForm.value as UpdateCategoryRequest
          );
          ElMessage.success("分类更新成功");
        } else {
          await createLinkCategory(categoryForm.value);
          ElMessage.success("分类创建成功");
        }

        categoryDialogVisible.value = false;
        await fetchCategories();
        emit("refresh");
      } catch (error: any) {
        console.error("操作失败", error);
        // 显示后端返回的具体错误信息
        const errorMessage =
          error?.response?.data?.message || error?.message || "操作失败";
        ElMessage.error(errorMessage);
      } finally {
        categorySubmitLoading.value = false;
      }
    }
  });
};

const handleDeleteCategory = async (categoryId: number) => {
  try {
    await deleteLinkCategory(categoryId);
    ElMessage.success("分类删除成功");
    await fetchCategories();
    emit("refresh");
  } catch (error: any) {
    console.error("删除失败", error);
    // 显示后端返回的具体错误信息
    const errorMessage =
      error?.response?.data?.message || error?.message || "删除失败";
    ElMessage.error(errorMessage);
  }
};

// 标签相关操作
const handleCreateTag = () => {
  tagEditMode.value = false;
  tagForm.value = { ...initialTagForm };
  currentTagId.value = null;
  tagDialogVisible.value = true;
};

const handleEditTag = (tag: LinkTag) => {
  tagEditMode.value = true;
  tagForm.value = {
    name: tag.name,
    color: tag.color
  };
  currentTagId.value = tag.id;
  tagDialogVisible.value = true;
};

const handleTagSubmit = async () => {
  if (!tagFormRef.value) return;

  await tagFormRef.value.validate(async valid => {
    if (valid) {
      tagSubmitLoading.value = true;
      try {
        if (tagEditMode.value && currentTagId.value) {
          await updateLinkTag(
            currentTagId.value,
            tagForm.value as UpdateTagRequest
          );
          ElMessage.success("标签更新成功");
        } else {
          await createLinkTag(tagForm.value);
          ElMessage.success("标签创建成功");
        }

        tagDialogVisible.value = false;
        await fetchTags();
        emit("refresh");
      } catch (error: any) {
        console.error("操作失败", error);
        // 显示后端返回的具体错误信息
        const errorMessage =
          error?.response?.data?.message || error?.message || "操作失败";
        ElMessage.error(errorMessage);
      } finally {
        tagSubmitLoading.value = false;
      }
    }
  });
};

const handleDeleteTag = async (tagId: number) => {
  try {
    await deleteLinkTag(tagId);
    ElMessage.success("标签删除成功");
    await fetchTags();
    emit("refresh");
  } catch (error: any) {
    console.error("删除失败", error);
    // 显示后端返回的具体错误信息
    const errorMessage =
      error?.response?.data?.message || error?.message || "删除失败";
    ElMessage.error(errorMessage);
  }
};

// 监听窗口大小变化
const handleResize = () => {
  windowWidth.value = window.innerWidth;
};

onMounted(() => {
  if (props.modelValue) {
    fetchData();
  }
  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
});
</script>

<style lang="scss" scoped>
.manager-container {
  height: 100%;

  .manager-tabs {
    height: 100%;

    :deep(.el-tabs__content) {
      height: calc(100% - 40px);
    }
  }
}

.tab-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--el-border-color-light);

  .header-info {
    h3 {
      margin: 0 0 4px 0;
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
}

.content-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

// 分类样式
.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.category-card {
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  padding: 16px;
  transition: all 0.3s ease;

  &:hover {
    border-color: var(--el-color-primary);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  &.is-protected {
    border-color: var(--el-color-warning-light-5);
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;

    .category-info {
      flex: 1;

      .category-name {
        display: flex;
        align-items: center;
        font-size: 16px;
        font-weight: 600;
        color: var(--el-text-color-primary);
        margin-bottom: 8px;

        .protected-tag {
          margin-left: 8px;
        }
      }

      .category-meta {
        display: flex;
        align-items: center;
        gap: 8px;

        .usage-count {
          font-size: 12px;
          color: var(--el-text-color-secondary);
        }
      }
    }

    .card-actions {
      display: flex;
      gap: 4px;
    }
  }

  .category-description {
    font-size: 14px;
    color: var(--el-text-color-regular);
    line-height: 1.5;
  }
}

// 标签样式
.tag-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.tag-card {
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  padding: 16px;
  transition: all 0.3s ease;

  &:hover {
    border-color: var(--el-color-primary);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .tag-preview {
    text-align: center;
    margin-bottom: 12px;

    .preview-tag {
      position: relative;
      font-size: 12px;
      padding: 4px 8px;
      color: white !important;
      border: none !important;
      border-radius: 12px 0;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      overflow: hidden;

      &::after {
        content: "";
        position: absolute;
        top: 0;
        left: -100px;
        width: 100px;
        height: 100%;
        background: linear-gradient(
          90deg,
          rgba(255, 255, 255, 0),
          rgba(255, 255, 255, 0.3),
          rgba(255, 255, 255, 0)
        );
        animation: tag-light 3s ease-in-out infinite;
      }
    }
  }

  .tag-info {
    text-align: center;
    margin-bottom: 12px;

    .tag-name {
      font-size: 16px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      margin-bottom: 4px;
    }

    .tag-meta {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: var(--el-text-color-secondary);

      .color-code {
        font-family: monospace;
        background: var(--el-bg-color-page);
        padding: 2px 4px;
        border-radius: 4px;
      }
    }
  }

  .tag-actions {
    display: flex;
    justify-content: center;
    gap: 4px;
  }
}

// 表单样式
.form-tip {
  margin-top: 8px;
  color: var(--el-text-color-regular);
  font-size: 12px;
  line-height: 1.4;
}

.color-picker-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;

  .color-input {
    flex: 1;
  }
}

// 标签光效动画
@keyframes tag-light {
  0% {
    left: -100px;
  }
  50% {
    left: 100%;
  }
  100% {
    left: 100%;
  }
}

// 响应式
@media screen and (width <= 768px) {
  :deep(.el-drawer__body) {
    padding: 16px;
  }

  :deep(.el-drawer__header) {
    padding: 16px;
    margin-bottom: 12px;
  }

  :deep(.el-tabs__header) {
    margin-bottom: 16px;
  }

  .category-grid,
  .tag-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .content-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    margin-bottom: 16px;
    padding-bottom: 12px;

    .header-info {
      h3 {
        font-size: 16px;
      }

      .subtitle {
        font-size: 13px;
      }
    }

    .el-button {
      width: 100%;
      height: 44px;
    }
  }

  .category-card,
  .tag-card {
    padding: 14px;

    .card-header,
    .tag-info {
      .category-name,
      .tag-name {
        font-size: 15px;
      }
    }

    .card-actions,
    .tag-actions {
      .el-button {
        padding: 8px;
      }
    }
  }

  // 对话框移动端优化
  :deep(.el-dialog) {
    margin: 5vh auto !important;
    max-height: 90vh;

    .el-dialog__body {
      padding: 20px 16px;
    }

    .el-dialog__footer {
      padding: 16px;
      border-top: 1px solid var(--el-border-color-lighter);

      .el-button {
        height: 44px;
        font-size: 15px;
        min-width: 80px;
      }
    }

    .el-form {
      .el-form-item {
        margin-bottom: 20px;

        .el-form-item__label {
          font-size: 14px;
          font-weight: 500;
        }

        .el-input__inner,
        .el-textarea__inner {
          font-size: 16px; // 防止 iOS Safari 自动缩放
        }

        .el-input {
          height: 44px;

          .el-input__inner {
            height: 44px;
            line-height: 44px;
          }
        }

        .el-textarea__inner {
          min-height: 88px;
          padding: 12px;
          line-height: 1.5;
        }
      }

      .el-radio-group {
        display: flex;
        width: 100%;

        .el-radio-button {
          flex: 1;

          :deep(.el-radio-button__inner) {
            width: 100%;
            height: 44px;
            line-height: 44px;
            font-size: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
          }
        }
      }
    }
  }
}

@media screen and (width <= 576px) {
  :deep(.el-drawer__header) {
    .el-drawer__title {
      font-size: 17px;
    }
  }

  .content-body {
    .category-card,
    .tag-card {
      padding: 12px;
    }
  }
}
</style>
