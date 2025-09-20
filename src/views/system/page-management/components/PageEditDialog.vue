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
      </el-row>

      <el-form-item label="页面内容" prop="content">
        <div class="content-editor-container">
          <div class="editor-toolbar">
            <el-button size="small" @click="handlePreview">
              <el-icon><View /></el-icon>
              预览
            </el-button>
            <el-button size="small" @click="handleFormat">
              <el-icon><Mic /></el-icon>
              格式化
            </el-button>
          </div>
          <div
            ref="editorContainer"
            class="editor-container"
            :style="{ height: `${editorHeight}px` }"
          />
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
import {
  ref,
  reactive,
  computed,
  watch,
  nextTick,
  onMounted,
  onUnmounted
} from "vue";
import { ElMessage } from "element-plus";
import { View, Mic } from "@element-plus/icons-vue";
import type { FormInstance, FormRules } from "element-plus";
import { createPage, updatePage } from "@/api/page-management";
import type {
  PageData,
  CreatePageData,
  UpdatePageData
} from "@/api/page-management";

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
const editorContainer = ref<HTMLElement>();
let editorInstance: any = null; // 保存编辑器实例

// 表单数据
const form = reactive<CreatePageData>({
  title: "",
  path: "",
  content: "",
  description: "",
  is_published: true,
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
  ],
  content: [{ required: true, message: "请输入页面内容", trigger: "blur" }]
};

// 计算属性
const dialogVisible = computed({
  get: () => props.visible,
  set: value => emit("update:visible", value)
});

const isEdit = computed(() => !!props.pageData);

// 计算编辑器高度
const editorHeight = computed(() => {
  // 根据屏幕高度动态计算编辑器高度
  const screenHeight = window.innerHeight;
  const isMobile = screenHeight < 768;

  if (isMobile) {
    // 移动端：更保守的高度
    return Math.min(300, Math.max(250, screenHeight * 0.4));
  } else {
    // 桌面端：适中的高度
    return Math.min(500, Math.max(250, screenHeight * 0.5));
  }
});

// 更新编辑器内容
const updateEditorContent = (content: string) => {
  if (editorInstance) {
    editorInstance.setValue(content);
  }
};

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
        description: newData.description || "",
        is_published: newData.is_published,
        sort: newData.sort
      });
    } else {
      // 新建模式
      Object.assign(form, {
        title: "",
        path: "",
        content: "",
        description: "",
        is_published: true,
        sort: 0
      });
    }
  },
  { immediate: true }
);

// 初始化编辑器
const initEditor = async () => {
  if (!editorContainer.value) return;

  try {
    // 动态导入Monaco编辑器
    const monaco = await import("monaco-editor");

    // 销毁旧的编辑器实例
    if (editorInstance) {
      editorInstance.dispose();
      editorInstance = null;
    }

    // 创建编辑器实例
    editorInstance = monaco.editor.create(editorContainer.value, {
      value: form.content,
      language: "html",
      theme: "vs-dark",
      automaticLayout: true,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      fontSize: 14,
      lineNumbers: "on",
      wordWrap: "on",
      folding: true,
      lineHeight: 20
    });

    // 监听内容变化
    editorInstance.onDidChangeModelContent(() => {
      form.content = editorInstance.getValue();
    });

    // 保存编辑器实例以便后续使用
    (window as any).pageEditor = editorInstance;
  } catch (error) {
    console.error("初始化编辑器失败:", error);
    ElMessage.error("初始化编辑器失败");
  }
};

// 预览
const handlePreview = () => {
  if (!form.content.trim()) {
    ElMessage.warning("请先输入页面内容");
    return;
  }

  // 创建预览窗口
  const previewWindow = window.open("", "_blank");
  if (previewWindow) {
    previewWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${form.title} - 预览</title>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; }
          .preview-header { background: #f5f5f5; padding: 10px; margin-bottom: 20px; border-radius: 4px; }
          .preview-content { max-width: 800px; margin: 0 auto; }
        </style>
      </head>
      <body>
        <div class="preview-header">
          <strong>预览模式</strong> - ${form.title}
        </div>
        <div class="preview-content">
          ${form.content}
        </div>
      </body>
      </html>
    `);
    previewWindow.document.close();
  }
};

// 格式化HTML
const handleFormat = () => {
  try {
    // 简单的HTML格式化
    const formatted = form.content
      .replace(/></g, ">\n<")
      .replace(/\n\s*\n/g, "\n")
      .trim();
    form.content = formatted;
    ElMessage.success("格式化完成");
  } catch (error) {
    ElMessage.error("格式化失败");
  }
};

// 保存
const handleSave = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
    saving.value = true;

    let response;
    if (isEdit.value && props.pageData) {
      // 更新页面
      const updateData: UpdatePageData = {
        title: form.title,
        path: form.path,
        content: form.content,
        description: form.description,
        is_published: form.is_published,
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
  // 清理编辑器实例
  if (editorInstance) {
    editorInstance.dispose();
    editorInstance = null;
  }
  dialogVisible.value = false;
};

// 监听对话框显示状态
watch(dialogVisible, async visible => {
  if (visible) {
    await nextTick();
    await initEditor();
  }
});

onMounted(() => {
  // 组件挂载后的初始化
});

onUnmounted(() => {
  // 组件卸载时的清理
  if (editorInstance) {
    editorInstance.dispose();
    (window as any).pageEditor = null;
  }
});
</script>

<style scoped lang="scss">
.page-form {
  .content-editor-container {
    border: 1px solid var(--el-border-color);
    border-radius: 4px;
    width: 100%;

    .editor-toolbar {
      padding: 8px 12px;
      background-color: var(--el-bg-color-page);
      border-bottom: 1px solid var(--el-border-color);
      display: flex;
      gap: 8px;
    }

    .editor-container {
      min-height: 250px;
      max-height: 500px;
    }
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
