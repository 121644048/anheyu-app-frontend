<template>
  <el-dialog
    v-model="dialogVisible"
    :title="isEdit ? '编辑页面' : '新建页面'"
    width="90%"
    top="2vh"
    :close-on-click-modal="false"
    append-to-body
    class="page-edit-dialog"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="100px"
      class="page-form"
    >
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="页面标题" prop="title">
            <el-input v-model="form.title" placeholder="请输入页面标题" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="页面路径" prop="path">
            <el-input
              v-model="form.path"
              placeholder="请输入页面路径，如 /about"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="页面描述" prop="description">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="3"
          placeholder="请输入页面描述"
        />
      </el-form-item>

      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="排序" prop="sort">
            <el-input-number
              v-model="form.sort"
              :min="0"
              :max="999"
              placeholder="排序值"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="发布状态" prop="is_published">
            <el-switch
              v-model="form.is_published"
              active-text="已发布"
              inactive-text="未发布"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="显示评论" prop="show_comment">
            <el-switch
              v-model="form.show_comment"
              active-text="显示"
              inactive-text="隐藏"
            />
            <div class="form-item-tip">需要在系统设置中开启评论功能后生效</div>
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="页面内容" prop="content">
        <div class="content-editor-container">
          <div class="markdown-editor-wrapper">
            <MarkdownEditor
              ref="editorRef"
              v-model="form.markdown_content"
              :on-upload-img="handleImageUpload"
              @onSave="handleEditorSave"
            />
          </div>
          <div class="editor-tip">
            支持 Markdown 语法和富文本编辑，内容将自动渲染为 HTML 格式
          </div>
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">
          {{ isEdit ? "更新" : "创建" }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, defineAsyncComponent } from "vue";
import { ElMessage } from "element-plus";
import type { FormInstance, FormRules } from "element-plus";
import { createPage, updatePage } from "@/api/page-management";
import type {
  PageData,
  CreatePageData,
  UpdatePageData
} from "@/api/page-management";
import { uploadArticleImage } from "@/api/post";

// 懒加载 Markdown 编辑器
const MarkdownEditor = defineAsyncComponent(
  () => import("@/components/MarkdownEditor/index.vue")
);

// Props
interface Props {
  visible: boolean;
  pageData?: PageData | null;
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  pageData: null
});

// Emits
const emit = defineEmits<{
  "update:visible": [value: boolean];
  success: [];
}>();

// 响应式数据
const formRef = ref<FormInstance>();
const saving = ref(false);
const editorRef = ref<any>();

// 表单数据
const form = reactive<CreatePageData>({
  title: "",
  path: "",
  content: "",
  markdown_content: "",
  description: "",
  is_published: true,
  show_comment: false,
  sort: 0
});

// 表单验证规则
const rules: FormRules = {
  title: [
    { required: true, message: "请输入页面标题", trigger: "blur" },
    { min: 1, max: 255, message: "标题长度在 1 到 255 个字符", trigger: "blur" }
  ],
  path: [
    { required: true, message: "请输入页面路径", trigger: "blur" },
    {
      pattern: /^\/[a-zA-Z0-9\/_-]+$/,
      message: "路径格式不正确，必须以/开头，只能包含字母、数字、/、_、-",
      trigger: "blur"
    }
  ]
};

// 计算属性
const dialogVisible = computed({
  get: () => props.visible,
  set: value => emit("update:visible", value)
});

const isEdit = computed(() => !!props.pageData);

// 监听页面数据变化，初始化表单
watch(
  () => props.pageData,
  newData => {
    if (newData) {
      // 编辑模式
      Object.assign(form, {
        title: newData.title,
        path: newData.path,
        content: newData.content,
        markdown_content: newData.markdown_content || "",
        description: newData.description || "",
        is_published: newData.is_published,
        show_comment: newData.show_comment,
        sort: newData.sort
      });
    } else {
      // 新建模式
      Object.assign(form, {
        title: "",
        path: "",
        content: "",
        markdown_content: "",
        description: "",
        is_published: true,
        show_comment: false,
        sort: 0
      });
    }
  },
  { immediate: true }
);

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

// 处理编辑器保存（当用户按 Ctrl+S 时）
const handleEditorSave = async (markdown: string, html: string) => {
  // 保存 Markdown（用于编辑器再次编辑）
  form.markdown_content = markdown;
  // 保存渲染后的 HTML（用于前台展示）
  form.content = html;
};

// 同步编辑器内容（在保存前调用）
const syncEditorContent = async () => {
  if (editorRef.value?.triggerSave) {
    editorRef.value.triggerSave();
    // 等待一小段时间确保 handleEditorSave 被调用
    await new Promise(resolve => setTimeout(resolve, 100));
  }
};

// 保存
const handleSave = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();

    // 先同步编辑器内容
    await syncEditorContent();

    saving.value = true;

    let response;
    if (isEdit.value && props.pageData) {
      // 更新页面
      const updateData: UpdatePageData = {
        title: form.title,
        path: form.path,
        content: form.content,
        markdown_content: form.markdown_content,
        description: form.description,
        is_published: form.is_published,
        show_comment: form.show_comment,
        sort: form.sort
      };
      response = await updatePage(props.pageData.id.toString(), updateData);
    } else {
      // 创建页面
      response = await createPage(form);
    }

    if (response.code === 200) {
      ElMessage.success(isEdit.value ? "更新成功" : "创建成功");
      emit("success");
    } else {
      ElMessage.error(
        response.message || (isEdit.value ? "更新失败" : "创建失败")
      );
    }
  } catch (error: any) {
    console.error("保存页面失败:", error);
    ElMessage.error("保存失败");
  } finally {
    saving.value = false;
  }
};

// 关闭对话框
const handleClose = () => {
  dialogVisible.value = false;
};
</script>

<style lang="scss">
// 引入文章内容基础样式
@use "@/style/article-content-base.scss" as *;

// 页面编辑器容器 - 应用与文章编辑器相同的样式
.page-form {
  .content-editor-container {
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
}
</style>

<style scoped lang="scss">
.page-form {
  .content-editor-container {
    width: 100%;
  }

  .markdown-editor-wrapper {
    width: 100%;
    height: 500px;
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
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

// 弹窗样式优化
:deep(.page-edit-dialog) {
  .el-dialog {
    max-height: calc(100vh - 4vh);
    margin: 2vh auto !important;
    display: flex;
    flex-direction: column;

    .el-dialog__header {
      flex-shrink: 0;
      padding: 15px 20px;
    }

    .el-dialog__body {
      flex: 1;
      overflow-y: auto;
      padding: 15px 20px;
      max-height: calc(100vh - 4vh - 120px);
    }

    .el-dialog__footer {
      flex-shrink: 0;
      padding: 15px 20px;
    }
  }
}

.form-item-tip {
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.4;
}

// 移动端适配
@media (max-width: 768px) {
  :deep(.page-edit-dialog) {
    .el-dialog {
      width: 98% !important;
      max-height: calc(100vh - 2vh);
      margin: 1vh auto !important;

      .el-dialog__body {
        max-height: calc(100vh - 2vh - 100px);
        padding: 10px 15px;
      }

      .el-dialog__header,
      .el-dialog__footer {
        padding: 10px 15px;
      }
    }
  }

  .page-form {
    .content-editor-container {
      .editor-container {
        height: 300px;
        min-height: 250px;
        max-height: 400px;
      }
    }
  }
}
</style>
