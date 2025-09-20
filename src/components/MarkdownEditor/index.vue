<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from "vue";
import { MdEditor, type Themes } from "md-editor-v3";
import "md-editor-v3/lib/style.css";
import type { ExposeParam, ToolbarNames } from "md-editor-v3";
import { useSnackbar } from "@/composables/useSnackbar";
import { useSiteConfigStore } from "@/store/modules/siteConfig";

const props = defineProps<{
  modelValue: string;
  onUploadImg: (files: File[], callback: (urls: string[]) => void) => void;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "onSave", markdown: string, html: string): void;
}>();

const { showSnackbar } = useSnackbar();

const siteConfigStore = useSiteConfigStore();

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
      const newHeaderHtml = `
        <i class="anzhiyufont anzhiyu-icon-angle-down expand"></i>
        <div class="code-lang">${language}</div>
        <i class="anzhiyufont anzhiyu-icon-paste copy-button"></i>`;
      summaryElement.innerHTML = newHeaderHtml;
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
          // 直接设置高度样式而不是使用v-bind
          preElement.style.height = collapsedHeight.value;
          preElement.style.overflow = "hidden";
          if (!detailsElement.querySelector(".code-expand-btn")) {
            const expandBtn = document.createElement("div");
            expandBtn.className = "code-expand-btn";
            expandBtn.innerHTML =
              '<i class="anzhiyufont anzhiyu-icon-angle-double-down"></i>';
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

const handlePreviewClick = (event: MouseEvent) => {
  const target = event.target as HTMLElement;

  if (target.matches(".tabs .nav-tabs .tab:not(.active)")) {
    const tabsContainer = target.closest(".tabs");
    if (!tabsContainer) return;
    const targetId = target.dataset.href;
    if (!targetId) return;
    const currentActiveTab = tabsContainer.querySelector(".tab.active");
    const currentActiveContent = tabsContainer.querySelector(
      ".tab-item-content.active"
    );
    if (currentActiveTab) currentActiveTab.classList.remove("active");
    if (currentActiveContent) currentActiveContent.classList.remove("active");
    const newActiveContent = tabsContainer.querySelector(`#${targetId}`);
    target.classList.add("active");
    if (newActiveContent) newActiveContent.classList.add("active");
    return;
  }

  const copyButton = target.closest(".copy-button");
  if (copyButton) {
    event.preventDefault();
    event.stopPropagation();
    const codeContainer = copyButton.closest("details.md-editor-code");
    const codeElement = codeContainer?.querySelector("pre code");
    if (codeElement) {
      navigator.clipboard
        .writeText(codeElement.textContent || "")
        .then(() => {
          showSnackbar("复制成功，复制和转载请标注本文地址");
        })
        .catch(() => {
          showSnackbar("复制失败，请手动复制");
        });
    }
    return;
  }

  const expandCodeButton = target.closest(".code-expand-btn");
  if (expandCodeButton) {
    const container = expandCodeButton.closest<HTMLDetailsElement>(
      "details.md-editor-code"
    );
    if (container) {
      if (container.classList.contains("is-collapsed")) {
        container.open = true;
      }
      container.classList.toggle("is-collapsed");
      expandCodeButton.classList.toggle(
        "is-expanded",
        !container.classList.contains("is-collapsed")
      );
    }
    return;
  }

  const header = target.closest("summary.md-editor-code-head");
  if (header) {
    const details = header.closest<HTMLDetailsElement>(
      "details.md-editor-code"
    );
    if (details) {
      event.preventDefault();
      details.open = !details.open;
    }
  }
};

const observer = new MutationObserver(() => {
  const newTheme = document.documentElement.classList.contains("dark")
    ? "dark"
    : "light";
  if (theme.value !== newTheme) {
    theme.value = newTheme;
  }
});

onMounted(() => {
  theme.value = document.documentElement.classList.contains("dark")
    ? "dark"
    : "light";
  observer.observe(document.documentElement, { attributes: true });
  if (containerRef.value) {
    containerRef.value.addEventListener("click", handlePreviewClick);
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
    <MdEditor
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
