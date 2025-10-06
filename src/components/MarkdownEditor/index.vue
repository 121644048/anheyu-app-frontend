<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from "vue";
import { useSiteConfigStore } from "@/store/modules/siteConfig";

// 动态导入类型定义
type MdEditor = any;
type Themes = any;
type ExposeParam = any;
type ToolbarNames = any;

const props = defineProps<{
  modelValue: string;
  onUploadImg: (files: File[], callback: (urls: string[]) => void) => void;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "onSave", markdown: string, html: string): void;
}>();

const siteConfigStore = useSiteConfigStore();

// 动态导入的编辑器组件和加载状态
const MdEditorComponent = ref<any>(null);
const isEditorLoading = ref(true);
const loadError = ref<string>("");

// 重新加载方法
const reloadPage = () => {
  window.location.reload();
};

const codeMaxLines = computed(
  () => siteConfigStore.getSiteConfig?.code_block?.code_max_lines || 10
);

const collapsedHeight = computed(() => {
  const lines = codeMaxLines.value > 0 ? codeMaxLines.value : 10;
  const height = lines * 25 + 15;
  return `${height}px`;
});

const sanitize = (html: string): string => {
  const doc = new DOMParser().parseFromString(html, "text/html");

  // 处理代码块
  doc.querySelectorAll("details.md-editor-code").forEach(detailsElement => {
    const summaryElement = detailsElement.querySelector(
      "summary.md-editor-code-head"
    );
    if (!summaryElement) return;

    if (!summaryElement.querySelector(".copy-button")) {
      const langSpan = detailsElement.querySelector(".md-editor-code-lang");
      const language = langSpan ? langSpan.textContent?.trim() : "";

      // 内置代码复制逻辑
      const copyHandler = `
        event.preventDefault();
        event.stopPropagation();
        const code = this.closest('.md-editor-code').querySelector('pre code');
        if(code) {
          navigator.clipboard.writeText(code.textContent || '').then(() => {
            const msg = document.createElement('div');
            msg.className = 'copy-success-toast';
            msg.textContent = '复制成功，复制和转载请标注本文地址';
            msg.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#67c23a;color:white;padding:12px 20px;border-radius:4px;z-index:9999;box-shadow:0 2px 12px rgba(0,0,0,0.15);';
            document.body.appendChild(msg);
            setTimeout(() => msg.remove(), 2000);
          }).catch(() => {
            const msg = document.createElement('div');
            msg.className = 'copy-error-toast';
            msg.textContent = '复制失败，请手动复制';
            msg.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#f56c6c;color:white;padding:12px 20px;border-radius:4px;z-index:9999;box-shadow:0 2px 12px rgba(0,0,0,0.15);';
            document.body.appendChild(msg);
            setTimeout(() => msg.remove(), 2000);
          });
        }
      `
        .replace(/\s+/g, " ")
        .trim();

      // 内置代码块展开/收起逻辑（details 的 toggle）
      const toggleHandler = `
        event.preventDefault();
        this.closest('details').open = !this.closest('details').open;
      `
        .replace(/\s+/g, " ")
        .trim();

      summaryElement.innerHTML = `
        <i class="anzhiyufont anzhiyu-icon-angle-down expand" onclick="${toggleHandler}"></i>
        <div class="code-lang">${language}</div>
        <i class="anzhiyufont anzhiyu-icon-paste copy-button" onclick="${copyHandler}"></i>`;
    }

    if (codeMaxLines.value !== -1) {
      const preElement = detailsElement.querySelector("pre");
      if (preElement) {
        let lineCount = 0;
        const rnWrapper = preElement.querySelector("span[rn-wrapper]");

        if (rnWrapper) {
          lineCount = rnWrapper.children.length;
        } else {
          lineCount = (preElement.textContent?.match(/\n/g) || []).length + 1;
        }

        if (lineCount > codeMaxLines.value) {
          detailsElement.classList.add("is-collapsible", "is-collapsed");
          preElement.style.height = collapsedHeight.value;
          preElement.style.overflow = "hidden";

          if (!detailsElement.querySelector(".code-expand-btn")) {
            const expandBtn = document.createElement("div");
            expandBtn.className = "code-expand-btn";

            // 内置展开/折叠逻辑 - 绑定到按钮上
            const expandHandler = `
              const container = this.closest('details.md-editor-code');
              const pre = container.querySelector('pre');
              const icon = this.querySelector('i');
              if(container.classList.contains('is-collapsed')) {
                container.open = true;
                if(pre) {
                  pre.style.height = '';
                  pre.style.overflow = '';
                }
                if(icon) {
                  icon.style.transform = 'rotate(180deg)';
                }
              } else {
                if(pre) {
                  pre.style.height = '${collapsedHeight.value}';
                  pre.style.overflow = 'hidden';
                }
                if(icon) {
                  icon.style.transform = 'rotate(0deg)';
                }
              }
              container.classList.toggle('is-collapsed');
              this.classList.toggle('is-expanded', !container.classList.contains('is-collapsed'));
            `
              .replace(/\s+/g, " ")
              .trim();

            // 事件绑定到按钮上，图标添加过渡动画
            expandBtn.setAttribute("onclick", expandHandler);
            expandBtn.innerHTML = `<i class="anzhiyufont anzhiyu-icon-angle-double-down" style="transition: transform 0.3s ease;"></i>`;
            detailsElement.appendChild(expandBtn);
          }
        }
      }
    }
  });

  doc.querySelectorAll("table").forEach(table => {
    if (table.parentElement?.classList.contains("table-container")) {
      return;
    }
    const container = document.createElement("div");
    container.className = "table-container";
    if (table.parentNode) {
      table.parentNode.insertBefore(container, table);
      container.appendChild(table);
    }
  });

  return doc.body.innerHTML;
};

const handleSave = async (markdown: string, htmlPromise: Promise<string>) => {
  const rawHtml = await htmlPromise;
  const sanitizedHtml = sanitize(rawHtml);
  emit("onSave", markdown, sanitizedHtml);
};

const toolbars: ToolbarNames[] = [
  "bold",
  "underline",
  "italic",
  "strikeThrough",
  "-",
  "title",
  "sub",
  "sup",
  "quote",
  "unorderedList",
  "orderedList",
  "task",
  "-",
  "codeRow",
  "code",
  "link",
  "image",
  "table",
  "mermaid",
  "katex",
  "revoke",
  "next",
  "save",
  "=",
  "pageFullscreen",
  "fullscreen",
  "preview",
  "previewOnly",
  "htmlPreview",
  "catalog"
];

const editorRef = ref<ExposeParam>();
const theme = ref<Themes>("light");
const containerRef = ref<HTMLElement | null>(null);

// 预览区域点击事件处理 - 现在大部分逻辑已内置到 HTML 中
// 这里保留是为了未来可能需要的额外处理
const handlePreviewClick = (event: MouseEvent) => {
  // 所有交互逻辑已经通过 onclick 内联事件处理器实现
  // 如果未来需要添加额外的全局处理逻辑，可以在这里扩展
};

const observer = new MutationObserver(() => {
  const newTheme = document.documentElement.classList.contains("dark")
    ? "dark"
    : "light";
  if (theme.value !== newTheme) {
    theme.value = newTheme;
  }
});

onMounted(async () => {
  // 动态导入 md-editor-v3
  try {
    const [{ MdEditor }, { installMarkdownEditorExtensions }] =
      await Promise.all([import("md-editor-v3"), import("./config")]);

    // 动态导入样式
    await import("md-editor-v3/lib/style.css");

    // 初始化编辑器扩展
    installMarkdownEditorExtensions();

    MdEditorComponent.value = MdEditor;
    isEditorLoading.value = false;

    // 初始化主题和监听器
    theme.value = document.documentElement.classList.contains("dark")
      ? "dark"
      : "light";
    observer.observe(document.documentElement, { attributes: true });
    if (containerRef.value) {
      containerRef.value.addEventListener("click", handlePreviewClick);
    }
  } catch (error) {
    console.error("Failed to load markdown editor:", error);
    loadError.value = "Markdown编辑器加载失败";
    isEditorLoading.value = false;
  }
});

onUnmounted(() => {
  observer.disconnect();
  if (containerRef.value) {
    containerRef.value.removeEventListener("click", handlePreviewClick);
  }
});

defineExpose({
  triggerSave: () => editorRef.value?.triggerSave()
});
</script>
<template>
  <div ref="containerRef" class="md-editor-container">
    <!-- 加载中状态 -->
    <div v-if="isEditorLoading" class="editor-loading">
      <div class="loading-spinner" />
      <span>正在加载Markdown编辑器...</span>
    </div>

    <!-- 加载失败状态 -->
    <div v-else-if="loadError" class="editor-error">
      <div class="error-icon">⚠️</div>
      <span>{{ loadError }}</span>
      <button class="retry-btn" @click="reloadPage">重新加载</button>
    </div>

    <!-- 动态渲染的编辑器 -->
    <component
      :is="MdEditorComponent"
      v-else-if="MdEditorComponent"
      ref="editorRef"
      style="height: 100%; max-height: 100%"
      :model-value="modelValue"
      :theme="theme"
      :toolbars="toolbars"
      :showCodeRowNumber="true"
      :sanitize="sanitize"
      :auto-fold-threshold="99999999"
      :showToolbarName="true"
      @update:model-value="val => emit('update:modelValue', val)"
      @onUploadImg="onUploadImg"
      @onSave="handleSave"
    />
  </div>
</template>

<style scoped lang="scss">
.md-editor-container {
  height: 100%;
}

.editor-loading,
.editor-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: var(--anzhiyu-fontcolor);
  text-align: center;
  gap: 16px;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--anzhiyu-gray-op);
  border-top: 3px solid var(--anzhiyu-main);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.error-icon {
  font-size: 32px;
}

.retry-btn {
  padding: 8px 16px;
  background: var(--anzhiyu-main);
  color: var(--anzhiyu-white);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background: var(--anzhiyu-main-op-deep);
  }
}
</style>
