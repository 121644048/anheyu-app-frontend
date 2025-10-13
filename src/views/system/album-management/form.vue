<script setup lang="ts">
import { ref } from "vue";
import ReCol from "@/components/ReCol";
import { formRules } from "./utils/rule";
import { FormProps } from "./utils/types";

const props = withDefaults(defineProps<FormProps>(), {
  formInline: () => ({
    id: null,
    title: "新增",
    categoryId: null,
    imageUrl: "",
    bigImageUrl: "",
    downloadUrl: "",
    thumbParam: "",
    bigParam: "",
    tags: [],
    viewCount: 0,
    downloadCount: 1,
    aspectRatio: "",
    widthAndHeight: "",
    fileSize: 0,
    displayOrder: 0
  }),
  categories: () => []
});

const ruleFormRef = ref();
const newFormInline = ref(props.formInline);

console.log("newFormInline", newFormInline.value);

function getRef() {
  return ruleFormRef.value;
}

defineExpose({ getRef });
</script>

<template>
  <div class="form-container">
    <el-form
      ref="ruleFormRef"
      :model="newFormInline"
      :rules="formRules"
      label-width="140px"
    >
      <el-row>
        <re-col :value="12" :xs="24" :sm="24">
          <el-form-item label="分类" prop="categoryId">
            <el-select
              v-model="newFormInline.categoryId"
              placeholder="请选择分类"
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
          <el-form-item label="图片链接" prop="imageUrl">
            <el-input
              v-model="newFormInline.imageUrl"
              clearable
              placeholder="请输入图片图链接"
              type="textarea"
              :rows="8"
            />
          </el-form-item>
        </re-col>
        <re-col :value="24" :xs="24" :sm="24">
          <el-form-item label="大图链接">
            <el-input
              v-model="newFormInline.bigImageUrl"
              clearable
              placeholder="请输入大图链接"
              type="textarea"
              :rows="8"
            />
          </el-form-item>
        </re-col>

        <re-col :value="12" :xs="24" :sm="24">
          <el-form-item label="下载地址" prop="downloadUrl">
            <el-input
              v-model="newFormInline.downloadUrl"
              clearable
              placeholder="请输入下载地址"
            />
          </el-form-item>
        </re-col>

        <re-col :value="12" :xs="24" :sm="24">
          <el-form-item label="缩略图参数" prop="thumbParam">
            <el-input
              v-model="newFormInline.thumbParam"
              clearable
              placeholder="请输入缩略图参数"
            />
          </el-form-item>
        </re-col>

        <re-col :value="12" :xs="24" :sm="24">
          <el-form-item label="大图参数" prop="bigParam">
            <el-input
              v-model="newFormInline.bigParam"
              clearable
              placeholder="请输入大图参数"
            />
          </el-form-item>
        </re-col>

        <re-col :value="12" :xs="24" :sm="24">
          <el-form-item label="查看次数">
            <el-input-number
              v-model="newFormInline.viewCount"
              class="w-full!"
              :min="0"
              :max="9999"
              controls-position="right"
            />
          </el-form-item>
        </re-col>

        <re-col :value="12" :xs="24" :sm="24">
          <el-form-item label="下载次数">
            <el-input-number
              v-model="newFormInline.downloadCount"
              class="w-full!"
              :min="0"
              :max="9999"
              controls-position="right"
            />
          </el-form-item>
        </re-col>

        <re-col :value="12" :xs="24" :sm="24">
          <el-form-item label="标签">
            <el-input-tag
              v-model="newFormInline.tags"
              tag-type="primary"
              tag-effect="light"
              placeholder="请输入标签名称"
            >
              <template #tag="{ value }">
                <div class="flex items-center">
                  <span>{{ value }}</span>
                </div>
              </template>
            </el-input-tag>
          </el-form-item>
        </re-col>

        <re-col
          v-if="newFormInline.title !== '新增'"
          :value="12"
          :xs="24"
          :sm="24"
        >
          <el-form-item label="长宽比">
            {{ newFormInline.aspectRatio }}
          </el-form-item>
        </re-col>

        <re-col
          v-if="newFormInline.title !== '新增'"
          :value="12"
          :xs="24"
          :sm="24"
        >
          <el-form-item label="下载次数">
            {{ newFormInline.downloadCount }}
          </el-form-item>
        </re-col>
        <re-col
          v-if="newFormInline.title !== '新增'"
          :value="12"
          :xs="24"
          :sm="24"
        >
          <el-form-item label="查看次数">
            {{ newFormInline.viewCount }}
          </el-form-item>
        </re-col>
        <re-col
          v-if="newFormInline.title !== '新增'"
          :value="12"
          :xs="24"
          :sm="24"
        >
          <el-form-item label="宽*高">
            {{ newFormInline.widthAndHeight }}
          </el-form-item>
        </re-col>
        <re-col
          v-if="newFormInline.title !== '新增'"
          :value="12"
          :xs="24"
          :sm="24"
        >
          <el-form-item label="图片大小">
            {{
              (() => {
                if (newFormInline.fileSize >= 1024 * 1024) {
                  return (
                    (newFormInline.fileSize / 1024 / 1024).toFixed(2) + " MB"
                  );
                } else if (newFormInline.fileSize >= 1024) {
                  return (newFormInline.fileSize / 1024).toFixed(2) + " KB";
                } else {
                  return newFormInline.fileSize + " B";
                }
              })()
            }}
          </el-form-item>
        </re-col>

        <re-col :value="12" :xs="24" :sm="24">
          <el-form-item label="排序号">
            <el-input-number
              v-model="newFormInline.displayOrder"
              class="w-full!"
              :min="0"
              controls-position="right"
              placeholder="数字越小，排序越靠前"
            />
          </el-form-item>
        </re-col>
      </el-row>
    </el-form>
  </div>
</template>

<style lang="scss" scoped>
.form-container {
  max-height: 70vh;
  overflow-y: auto;

  /* 美化垂直滚动条 */
  &::-webkit-scrollbar {
    width: 6px;
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
    max-height: 65vh;
    padding-right: 4px;
  }
}
</style>
