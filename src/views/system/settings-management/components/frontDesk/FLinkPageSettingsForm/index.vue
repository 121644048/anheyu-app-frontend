<template>
  <div>
    <el-form-item label="友链默认分类">
      <el-select
        v-model="model.friendLinkDefaultCategory"
        placeholder="请选择默认分类"
        style="width: 100%"
        :loading="categoryLoading"
      >
        <el-option
          v-for="item in categories"
          :key="item.id"
          :label="item.name"
          :value="item.id"
        />
      </el-select>
    </el-form-item>

    <JsonEditorTable
      v-model="applyConditionsJsonString"
      title="申请友链条件"
      :columns="conditionColumns"
      :new-item-template="{ text: '' }"
    />

    <el-form-item label="申请友链自定义内容">
      <div class="flink-editor-container">
        <div class="markdown-editor-wrapper">
          <MarkdownEditor
            ref="editorRef"
            v-model="model.friendLinkApplyCustomCode"
            :on-upload-img="handleImageUpload"
            @onSave="handleSave"
          />
        </div>
        <div class="editor-tip">
          支持 Markdown 语法和富文本编辑，内容将显示在申请条件的上方
        </div>
      </div>
    </el-form-item>

    <!-- 友链申请通知设置 -->
    <FLinkNotifySettings
      :model-value="model"
      @update:model-value="handleNotifyUpdate"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, defineAsyncComponent } from "vue";
import { ElMessage } from "element-plus";
import type { FLinkSettingsInfo, JsonEditorTableColumn } from "../../../type";
import JsonEditorTable from "../components/JsonEditorTable.vue";
import { getLinkCategories } from "@/api/postLink";
import type { LinkCategory } from "@/api/postLink/type";
import { uploadArticleImage } from "@/api/post";
import FLinkNotifySettings from "./FLinkNotifySettings.vue";

// 懒加载 Markdown 编辑器
const MarkdownEditor = defineAsyncComponent(
  () => import("@/components/MarkdownEditor/index.vue")
);

const model = defineModel<FLinkSettingsInfo>({ required: true });
const editorRef = ref<any>();

const categories = ref<LinkCategory[]>([]);
const categoryLoading = ref(false);

// 处理通知设置更新
const handleNotifyUpdate = (updatedValue: FLinkSettingsInfo) => {
  // 直接赋值以触发 defineModel 的响应式更新
  model.value = updatedValue;
};

const conditionColumns: JsonEditorTableColumn[] = [
  { prop: "text", label: "条件内容（支持HTML）" }
];

/**
 * --- 核心修正 ---
 *
 * 这个计算属性是连接 `model` (数据为 string[]) 和 `JsonEditorTable` (prop 为 string) 的桥梁。
 */
const applyConditionsJsonString = computed({
  /**
   * get: 将 model 中的 string[] 数组转换为 JsonEditorTable 需要的 JSON 字符串。
   * 1. model.value.friendLinkApplyCondition (string[]) -> object[] e.g., [{ text: "..." }]
   * 2. object[] -> JSON.stringify -> string
   */
  get() {
    if (!Array.isArray(model.value.friendLinkApplyCondition)) {
      return "[]"; // 返回一个空数组的字符串形式作为默认值
    }
    const objectArray = model.value.friendLinkApplyCondition.map(text => ({
      text
    }));
    return JSON.stringify(objectArray, null, 2);
  },
  /**
   * set: 接收 JsonEditorTable 发出的 JSON 字符串，并更新 model。
   * 1. jsonString (string) -> JSON.parse -> object[] e.g., [{ text: "..." }]
   * 2. object[] -> string[]
   * 3. 更新 model.value.friendLinkApplyCondition
   */
  set(jsonString: string) {
    try {
      const objectArray = JSON.parse(jsonString || "[]");
      model.value.friendLinkApplyCondition = objectArray.map(item => item.text);
    } catch (e) {
      console.error("解析申请友链条件JSON失败:", e);
      // 可以在这里处理无效的JSON，例如不清空数组，以防用户误操作
    }
  }
});

// 获取友链分类列表
const fetchCategories = async () => {
  categoryLoading.value = true;
  try {
    const res = await getLinkCategories();
    if (res.code === 200) {
      categories.value = res.data || [];
      console.log("友链分类加载完成:", categories.value);
      console.log(
        "当前选中的默认分类ID:",
        model.value.friendLinkDefaultCategory
      );
    } else {
      ElMessage.error("获取友链分类列表失败");
    }
  } catch (error) {
    console.error(error);
    ElMessage.error("获取友链分类列表时发生错误");
  } finally {
    categoryLoading.value = false;
  }
};

// 处理图片上传
const handleImageUpload = async (
  files: File[],
  callback: (urls: string[]) => void
) => {
  const loadingInstance = ElMessage.info({
    message: "正在上传图片...",
    duration: 0
  });
  try {
    const urls = await Promise.all(
      files.map(async file => {
        const res = await uploadArticleImage(file);
        const url = res?.data?.url;
        if (!url) {
          throw new Error(`图片 ${file.name} 上传失败: 服务器未返回有效URL`);
        }
        return url;
      })
    );
    callback(urls);
    ElMessage.success("图片上传成功！");
  } catch (error: any) {
    console.error("图片上传失败:", error);
    ElMessage.error(error.message || "图片上传失败，请稍后再试。");
  } finally {
    loadingInstance.close();
  }
};

// 处理保存（当用户按 Ctrl+S 时）
const handleSave = async (markdown: string, html: string) => {
  // 保存 Markdown（用于编辑器再次编辑）
  model.value.friendLinkApplyCustomCode = markdown;
  // 保存渲染后的 HTML（用于前台展示）
  model.value.friendLinkApplyCustomCodeHtml = html;
};

// 在表单提交前同步更新 HTML 内容
const syncEditorContent = async () => {
  if (editorRef.value?.triggerSave) {
    editorRef.value.triggerSave();
    // 等待一小段时间确保 handleSave 被调用
    await new Promise(resolve => setTimeout(resolve, 100));
  }
};

// 暴露方法给父组件调用
defineExpose({
  syncEditorContent
});

onMounted(() => {
  fetchCategories();
});
</script>

<style lang="scss">
// 引入文章内容基础样式
@use "@/style/article-content-base.scss" as *;

// 友链编辑器容器 - 应用与文章编辑器相同的样式
.flink-editor-container {
  .markdown-editor-wrapper {
    .md-editor-container {
      height: 100%;

      // 应用所有文章内容基础样式
      @include article-content-base;
    }

    .md-editor-fullscreen {
      z-index: 2100;
    }
  }
}
</style>

<style scoped lang="scss">
.flink-editor-container {
  width: 100%;
}

.markdown-editor-wrapper {
  width: 100%;
  height: 400px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 4px;
  overflow: hidden;

  :deep(.md-editor-container) {
    height: 100%;
  }
}

.editor-tip {
  margin-top: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.5;
}
</style>
