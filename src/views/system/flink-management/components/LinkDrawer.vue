<template>
  <el-drawer
    v-model="drawerVisible"
    :title="isEditMode ? '编辑友链' : '新建友链'"
    direction="rtl"
    :size="drawerSize"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-position="top"
    >
      <el-form-item label="网站名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入网站名称" />
      </el-form-item>
      <el-form-item label="网站地址" prop="url">
        <el-input v-model="formData.url" placeholder="请输入 https://..." />
      </el-form-item>
      <el-form-item label="网站LOGO" prop="logo">
        <el-input v-model="formData.logo" placeholder="请输入 LOGO 链接" />
      </el-form-item>
      <el-form-item label="网站描述" prop="description">
        <el-input
          v-model="formData.description"
          type="textarea"
          placeholder="请输入网站描述"
        />
      </el-form-item>

      <el-form-item label="网站快照" prop="siteshot">
        <el-input
          v-model="formData.siteshot"
          placeholder="请输入网站快照链接 (可选)"
        />
        <div class="form-tip">
          <small
            >网站快照是网站的截图，用于在友链页面展示。如果友链使用卡片样式，建议提供网站快照。</small
          >
        </div>
      </el-form-item>

      <el-form-item label="排序权重" prop="sort_order">
        <div class="sort-order-wrapper">
          <el-input-number
            v-model="formData.sort_order"
            :min="0"
            :step="1"
            placeholder="数字越大越靠前"
            style="width: 100%"
          />
        </div>
        <div class="form-tip">
          <small>排序权重决定友链的显示顺序，数字越大越靠前</small>
        </div>
      </el-form-item>

      <el-form-item label="跳过健康检查" prop="skip_health_check">
        <el-switch
          v-model="formData.skip_health_check"
          active-text="是"
          inactive-text="否"
        />
        <div class="form-tip">
          <small
            >某些网站可能因为防护机制无法通过健康检查，启用此选项将不再对该友链进行健康检查</small
          >
        </div>
      </el-form-item>

      <!-- 现代化的分类选择器 -->
      <el-form-item label="分类" prop="category_id">
        <div class="modern-selector">
          <el-select
            v-model="formData.category_id"
            placeholder="请选择分类"
            class="selector-main"
            :loading="categoryLoading"
          >
            <el-option
              v-for="item in allCategories"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            >
              <div class="category-option">
                <span class="category-name">{{ item.name }}</span>
                <el-tag
                  size="small"
                  :type="item.style === 'card' ? 'primary' : 'success'"
                >
                  {{ item.style === "card" ? "卡片" : "列表" }}
                </el-tag>
              </div>
            </el-option>
          </el-select>
          <el-button
            :icon="Plus"
            circle
            title="快速新建分类"
            @click="isCategoryCreatorVisible = true"
          />
          <el-button
            :icon="Setting"
            circle
            title="管理分类和标签"
            @click="isManagerVisible = true"
          />
        </div>
      </el-form-item>

      <!-- 现代化的标签选择器（单选） -->
      <el-form-item label="标签" prop="tag_id">
        <div class="modern-selector">
          <el-select
            v-model="formData.tag_id"
            clearable
            placeholder="请选择标签（可选）"
            class="selector-main"
            :loading="tagLoading"
          >
            <el-option
              v-for="item in allTags"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            >
              <div class="tag-option">
                <span class="option-tag" :style="{ background: item.color }">
                  {{ item.name }}
                </span>
              </div>
            </el-option>
          </el-select>
          <el-button
            :icon="Plus"
            circle
            title="快速新建标签"
            @click="isTagCreatorVisible = true"
          />
          <el-button
            :icon="Setting"
            circle
            title="管理分类和标签"
            @click="isManagerVisible = true"
          />
        </div>
      </el-form-item>

      <el-form-item label="状态" prop="status">
        <el-select
          v-model="formData.status"
          placeholder="请选择状态"
          style="width: 100%"
        >
          <el-option label="审核通过" value="APPROVED" />
          <el-option label="待审核" value="PENDING" />
          <el-option label="已拒绝" value="REJECTED" />
        </el-select>
      </el-form-item>
    </el-form>

    <template #footer>
      <div style="flex: auto">
        <el-button @click="drawerVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="submitLoading"
          @click="handleSubmit"
        >
          确认
        </el-button>
      </div>
    </template>

    <!-- "即时新增"弹窗组件实例 -->
    <QuickCreateForm
      v-model="isCategoryCreatorVisible"
      entity-type="category"
      @success="handleCategoryCreated"
    />
    <QuickCreateForm
      v-model="isTagCreatorVisible"
      entity-type="tag"
      @success="handleTagCreated"
    />

    <!-- 分类和标签管理器 -->
    <CategoryTagManager
      v-model="isManagerVisible"
      @refresh="handleManagerRefresh"
    />
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, watch, reactive, onMounted, computed, onUnmounted } from "vue";
import { Plus, Setting } from "@element-plus/icons-vue";
import type { FormInstance, FormRules } from "element-plus";
import { ElMessage } from "element-plus";
import type {
  LinkItem,
  LinkCategory,
  LinkTag,
  CreateLinkRequest
} from "@/api/postLink/type";
import {
  getLinkCategories,
  getLinkTags,
  createLink,
  updateLink
} from "@/api/postLink";
import QuickCreateForm from "./QuickCreateForm.vue";
import CategoryTagManager from "./CategoryTagManager.vue";

const props = defineProps<{
  modelValue: boolean;
  isEditMode: boolean;
  data: LinkItem | null;
}>();
const emit = defineEmits(["update:modelValue", "success"]);

const drawerVisible = ref(props.modelValue);
const submitLoading = ref(false);
const formRef = ref<FormInstance>();

// 移动端检测
const windowWidth = ref(window.innerWidth);
const isMobile = computed(() => windowWidth.value < 768);
const drawerSize = computed(() => {
  if (windowWidth.value < 576) {
    return "100%";
  } else if (windowWidth.value < 768) {
    return "90%";
  }
  return "500px";
});

// 数据源
const allCategories = ref<LinkCategory[]>([]);
const allTags = ref<LinkTag[]>([]);
const categoryLoading = ref(false);
const tagLoading = ref(false);

// "即时新增"弹窗的显示状态
const isCategoryCreatorVisible = ref(false);
const isTagCreatorVisible = ref(false);

// 分类和标签管理器的显示状态
const isManagerVisible = ref(false);

// 表单数据
const initialFormData: CreateLinkRequest = {
  name: "",
  url: "",
  logo: "",
  description: "",
  siteshot: "",
  category_id: null,
  tag_id: null,
  status: "PENDING",
  sort_order: 0,
  skip_health_check: false
};
const formData = ref<CreateLinkRequest>({ ...initialFormData });

const formRules = reactive<FormRules>({
  name: [{ required: true, message: "请输入网站名称", trigger: "blur" }],
  url: [{ required: true, message: "请输入网站地址", trigger: "blur" }],
  logo: [{ required: true, message: "请输入网站LOGO", trigger: "blur" }],
  siteshot: [
    {
      type: "url",
      message: "请输入有效的网站快照链接",
      trigger: ["blur", "change"]
    }
  ],
  category_id: [
    { required: true, message: "请选择或新建一个分类", trigger: "change" }
  ],
  status: [{ required: true, message: "请选择状态", trigger: "change" }]
});

// --- 数据获取 ---
const fetchCategories = async () => {
  categoryLoading.value = true;
  try {
    const res = await getLinkCategories();
    if (res.code === 200) allCategories.value = res.data;
  } catch (e) {
    console.error("获取分类列表失败", e);
  } finally {
    categoryLoading.value = false;
  }
};
const fetchTags = async () => {
  tagLoading.value = true;
  try {
    const res = await getLinkTags();
    if (res.code === 200) allTags.value = res.data;
  } catch (e) {
    console.error("获取标签列表失败", e);
  } finally {
    tagLoading.value = false;
  }
};

// --- “即时新增”成功后的回调处理 ---
const handleCategoryCreated = async (newCategory: LinkCategory) => {
  await fetchCategories();
  formData.value.category_id = newCategory.id;
};

const handleTagCreated = async (newTag: LinkTag) => {
  await fetchTags();
  formData.value.tag_id = newTag.id;
};

// --- 管理器相关方法 ---
const handleManagerRefresh = async () => {
  await fetchCategories();
  await fetchTags();
};

// --- 抽屉与表单控制 ---
watch(
  () => props.modelValue,
  val => {
    drawerVisible.value = val;
    if (val) {
      if (props.isEditMode && props.data) {
        formData.value = {
          name: props.data.name,
          url: props.data.url,
          logo: props.data.logo,
          description: props.data.description,
          siteshot: props.data.siteshot,
          category_id: props.data.category?.id || null,
          tag_id: props.data.tag?.id || null,
          status: props.data.status,
          sort_order: props.data.sort_order || 0,
          skip_health_check: props.data.skip_health_check || false
        };
      } else {
        formData.value = { ...initialFormData };
      }
    }
  }
);

const handleClose = () => {
  formRef.value?.resetFields();
  emit("update:modelValue", false);
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async valid => {
    if (valid) {
      submitLoading.value = true;
      try {
        if (props.isEditMode) {
          await updateLink(props.data.id, formData.value);
          ElMessage.success("更新成功");
        } else {
          await createLink(formData.value);
          ElMessage.success("创建成功");
        }
        emit("success");
        drawerVisible.value = false;
      } catch (error) {
        console.error("操作失败", error);
      } finally {
        submitLoading.value = false;
      }
    }
  });
};

// 监听窗口大小变化
const handleResize = () => {
  windowWidth.value = window.innerWidth;
};

onMounted(() => {
  fetchCategories();
  fetchTags();
  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
});
</script>

<style lang="scss" scoped>
.modern-selector {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 8px;

  .selector-main {
    flex: 1;
  }

  @media screen and (width <= 768px) {
    gap: 10px;

    .el-button {
      flex-shrink: 0;
      width: 40px;
      height: 40px;
      padding: 8px;

      :deep(.el-icon) {
        font-size: 18px;
      }
    }
  }
}

.category-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;

  .category-name {
    flex: 1;
  }
}

.tag-option {
  display: flex;
  align-items: center;
  height: 100%;
  min-height: 30px;

  .option-tag {
    position: relative;
    display: inline-block;
    font-size: 11px;
    padding: 2px 6px;
    color: white !important;
    border: none;
    border-radius: 8px 0;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    white-space: nowrap;
    cursor: pointer;
    transition: all 0.3s ease;
    line-height: 1.2;

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

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    }
  }
}

.sort-order-wrapper {
  width: 100%;

  :deep(.el-input-number) {
    width: 100%;
  }
}

.form-tip {
  margin-top: 8px;
  color: var(--el-text-color-regular);
  font-size: 12px;
  line-height: 1.4;
}

// 选择器下拉选项样式优化
:deep(.el-select-dropdown__item) {
  padding: 8px 20px;
}

:deep(.el-select__tags) {
  max-width: calc(100% - 30px);
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

// 移动端适配
@media screen and (width <= 768px) {
  :deep(.el-drawer__body) {
    padding: 20px 16px;
  }

  :deep(.el-drawer__header) {
    padding: 16px;
    margin-bottom: 16px;
  }

  :deep(.el-form) {
    .el-form-item {
      margin-bottom: 20px;

      .el-form-item__label {
        font-size: 15px;
        font-weight: 500;
        margin-bottom: 8px;
      }

      .el-input__inner,
      .el-textarea__inner,
      .el-select .el-input__inner {
        font-size: 16px; // 防止 iOS Safari 自动缩放
        height: 44px;
        line-height: 44px;
      }

      .el-textarea__inner {
        min-height: 88px !important;
        line-height: 1.5;
        padding: 12px;
      }

      .el-select {
        width: 100%;
      }
    }
  }

  :deep(.el-drawer__footer) {
    padding: 16px;
    border-top: 1px solid var(--el-border-color-lighter);

    .el-button {
      height: 44px;
      font-size: 15px;
      flex: 1;

      &:first-child {
        margin-right: 12px;
      }
    }
  }

  .form-tip {
    font-size: 13px;
    line-height: 1.6;
  }
}

@media screen and (width <= 576px) {
  :deep(.el-drawer__header) {
    .el-drawer__title {
      font-size: 18px;
    }
  }
}
</style>
