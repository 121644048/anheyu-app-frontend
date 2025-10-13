<script setup lang="ts">
import { ref, computed } from "vue";
import ReCol from "@/components/ReCol";
import { useWindowSize } from "@vueuse/core";

interface BatchImportFormProps {
  formInline?: {
    categoryId?: number | null;
    urls: string;
    thumbParam: string;
    bigParam: string;
    tags: string[];
    displayOrder: number;
  };
  categories?: Array<{ id: number; name: string }>;
}

const props = withDefaults(defineProps<BatchImportFormProps>(), {
  formInline: () => ({
    categoryId: null,
    urls: "",
    thumbParam: "",
    bigParam: "",
    tags: [],
    displayOrder: 0
  }),
  categories: () => []
});

const ruleFormRef = ref();
const newFormInline = ref(props.formInline);

// 响应式窗口大小
const { width } = useWindowSize();

// 计算表单标签宽度
const labelWidth = computed(() => {
  return width.value <= 768 ? "100px" : "140px";
});

// 计算URL行数
const urlLines = computed(() => {
  return newFormInline.value.urls.split("\n").filter(line => line.trim())
    .length;
});

// 表单验证规则
const formRules = {
  urls: [
    {
      required: true,
      message: "请输入图片链接，每行一个URL",
      trigger: "blur"
    },
    {
      validator: (rule: any, value: string, callback: any) => {
        const urls = value
          .split("\n")
          .map(line => line.trim())
          .filter(Boolean);
        if (urls.length === 0) {
          callback(new Error("至少需要输入一个图片链接"));
        } else if (urls.length > 100) {
          callback(new Error("单次最多导入100张图片"));
        } else {
          callback();
        }
      },
      trigger: "blur"
    }
  ]
};

function getRef() {
  return ruleFormRef.value;
}

defineExpose({ getRef });
</script>

<template>
  <div class="batch-import-container">
    <el-form
      ref="ruleFormRef"
      :model="newFormInline"
      :rules="formRules"
      :label-width="labelWidth"
    >
      <el-alert
        title="批量导入说明"
        type="info"
        :closable="false"
        style="margin-bottom: 20px"
      >
        <template #default>
          <div style="line-height: 1.8">
            <p>• 每行输入一个图片链接URL</p>
            <p>• 系统会自动获取图片的宽高、大小等元数据</p>
            <p>• 单次最多导入100张图片</p>
            <p>• 缩略图参数和大图参数将应用于所有图片</p>
            <p>• 标签将应用于所有图片</p>
          </div>
        </template>
      </el-alert>

      <el-row :gutter="30">
        <re-col :value="12" :xs="24" :sm="24">
          <el-form-item label="分类" prop="categoryId">
            <el-select
              v-model="newFormInline.categoryId"
              placeholder="请选择分类（可选）"
              clearable
              class="w-full!"
            >
              <el-option
                v-for="category in categories"
                :key="category.id"
                :label="category.name"
                :value="category.id"
              />
            </el-select>
          </el-form-item>
        </re-col>

        <re-col :value="24" :xs="24" :sm="24">
          <el-form-item label="图片链接" prop="urls">
            <el-input
              v-model="newFormInline.urls"
              type="textarea"
              :rows="10"
              placeholder="请输入图片链接，每行一个URL&#10;例如：&#10;https://example.com/image1.jpg&#10;https://example.com/image2.jpg&#10;https://example.com/image3.jpg"
              clearable
              class="url-textarea"
            />
            <div style="margin-top: 8px; color: var(--el-color-info)">
              已输入 {{ urlLines }} 个URL
            </div>
          </el-form-item>
        </re-col>

        <re-col :value="12" :xs="24" :sm="24">
          <el-form-item label="缩略图参数" prop="thumbParam">
            <el-input
              v-model="newFormInline.thumbParam"
              clearable
              placeholder="应用于所有图片的缩略图参数"
            />
          </el-form-item>
        </re-col>

        <re-col :value="12" :xs="24" :sm="24">
          <el-form-item label="大图参数" prop="bigParam">
            <el-input
              v-model="newFormInline.bigParam"
              clearable
              placeholder="应用于所有图片的大图参数"
            />
          </el-form-item>
        </re-col>

        <re-col :value="12" :xs="24" :sm="24">
          <el-form-item label="标签">
            <el-input-tag
              v-model="newFormInline.tags"
              tag-type="primary"
              tag-effect="light"
              placeholder="应用于所有图片的标签"
            >
              <template #tag="{ value }">
                <div class="flex items-center">
                  <span>{{ value }}</span>
                </div>
              </template>
            </el-input-tag>
          </el-form-item>
        </re-col>

        <re-col :value="12" :xs="24" :sm="24">
          <el-form-item label="起始排序号">
            <el-input-number
              v-model="newFormInline.displayOrder"
              class="w-full!"
              :min="0"
              controls-position="right"
              placeholder="第一张图片的排序号，后续自动递增"
            />
          </el-form-item>
        </re-col>
      </el-row>
    </el-form>
  </div>
</template>

<style scoped lang="scss">
.batch-import-container {
  max-height: 67vh;
  overflow: auto;
  padding-right: 1rem;

  /* 美化垂直滚动条 */
  &::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  &::-webkit-scrollbar-track {
    background: var(--el-fill-color-lighter);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--el-color-info-light-5);
    border-radius: 3px;

    &:hover {
      background: var(--el-color-info-light-3);
    }
  }

  // 移动端适配
  @media (width <= 768px) {
    max-height: 70vh;
  }
}

:deep(.el-form) {
  // 移动端调整标签宽度
  @media (width <= 768px) {
    label {
      font-size: 14px;
    }
  }
}

:deep(.el-alert) {
  // 移动端调整说明文字
  @media (width <= 768px) {
    .el-alert__title {
      font-size: 14px;
    }

    .el-alert__description {
      font-size: 12px;

      p {
        margin: 4px 0;
      }
    }
  }
}

:deep(.el-alert__description) {
  margin-top: 8px;
}

:deep(.url-textarea) {
  .el-textarea__inner {
    max-height: 300px;
    min-height: 200px;

    // 移动端调整文本域高度
    @media (width <= 768px) {
      max-height: 200px;
      min-height: 150px;
      font-size: 13px;
    }
  }
}

// 移动端输入框适配
:deep(.el-input) {
  @media (width <= 768px) {
    .el-input__inner {
      font-size: 14px;
    }
  }
}

:deep(.el-input-number) {
  @media (width <= 768px) {
    .el-input__inner {
      font-size: 14px;
    }
  }
}
</style>
