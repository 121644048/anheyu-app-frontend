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

<style lang="scss">
@keyframes code-expand-key {
  0% {
    opacity: 0.6;
  }

  50% {
    opacity: 0.1;
  }

  100% {
    opacity: 0.6;
  }
}

.md-editor-fullscreen {
  z-index: 2100;
}

.md-editor-container {
  height: 100%;

  .md-editor-code {
    overflow: hidden;
    border: var(--style-border-always);
    border-radius: 10px;

    &.is-collapsed {
      & > pre {
        height: v-bind(collapsedHeight);
        overflow: hidden;
      }

      .code-expand-btn i {
        animation: 1.2s ease 0s infinite normal none running code-expand-key;
      }
    }

    .code-expand-btn {
      position: absolute;
      bottom: 0;
      z-index: 10;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 32px;
      font-size: var(--global-font-size);
      font-size: 16px;
      text-align: center;
      cursor: pointer;
      background: var(--anzhiyu-secondbg);
      transition: all 0.3s;
      transform: translateZ(0);

      i {
        color: var(--anzhiyu-fontcolor);
        transition: transform 0.3s ease;
      }

      &:hover {
        background: var(--anzhiyu-main);
        transition: all 0.3s;

        i {
          color: var(--anzhiyu-white);
        }
      }

      &.is-expanded i {
        transform: rotate(180deg);
      }
    }

    &[open] {
      .md-editor-code-head {
        border-bottom: var(--style-border-always);

        .expand {
          transform: translate(0, -47%) rotate(0deg) !important;
        }
      }

      pre {
        max-height: 1000px;
        transition: max-height 0.35s ease-in-out;
      }
    }

    pre {
      max-height: 0;
      margin: 0;
      overflow: hidden;
      border-radius: 0;
      transition: max-height 0.35s ease-in-out;
    }
  }

  .md-editor-preview {
    .table-container {
      margin: 1rem 0;
      overflow: hidden;
      overflow-x: auto;
      border: var(--style-border-always);
      border-radius: 8px;

      table {
        display: table;
        width: 100%;
        margin: 0;
        empty-cells: show;
        border-spacing: 0;
        border-collapse: collapse;
      }

      thead {
        background: var(--anzhiyu-secondbg);
      }

      td,
      th {
        padding: 0.3rem 0.6rem;
        vertical-align: middle;
        border: var(--style-border-always);
      }

      tr > *:first-child {
        border-left: none;
      }

      tr > *:last-child {
        border-right: none;
      }

      tbody tr:last-child > * {
        border-bottom: none;
      }

      thead tr:first-child > * {
        border-top: none;
      }
    }

    ul {
      counter-reset: li 0;
    }

    ol > li::before {
      margin-top: 0.45em;
      width: 1.45em;
      height: 1.45em;
      border-radius: 0.725em;
      content: counter(li);
      counter-increment: li 1;
      text-align: center;
      font-size: 0.85em;
      line-height: 1.45em;
    }

    ol li:not(.tab),
    ul li:not(.tab) {
      position: relative;
      margin: 0.2rem 0;
    }

    ol > li:not(.tab) {
      padding: 0.2em 0.2em 0.2em 1.8em;
    }

    .task-list-item::before {
      display: none;
    }

    ul > li:not(.tab)::before {
      top: 0.6em;
      width: 0.84em;
      height: 0.84em;
      border-radius: 0.42em;
      content: "";
      line-height: 0.42em;
    }

    ul > li:not(.tab) {
      padding: 0.2em 0.2em 0.2em 1.4em;
    }

    ul > li:not(.tab):before {
      border: 0.21em solid var(--anzhiyu-lighttext);
      background: var(--anzhiyu-lighttext);
    }

    ol,
    ul {
      margin-top: 0.4rem;
      padding: 0 0 0 0.8rem;
      list-style: none;
      counter-reset: li 0;
    }

    ol li::before,
    ul li::before {
      position: absolute;
      top: 0;
      left: 0;
      background: var(--anzhiyu-main);
      color: #fff;
      transition: all 0.3s ease-out 0s;
    }

    a {
      padding: 0 0.2rem !important;
      font-family: inherit;
      font-weight: 500;
      line-height: 1.25rem;
      color: var(--anzhiyu-fontcolor);
      text-decoration: none;
      border-bottom: dotted 2px var(--anzhiyu-lighttext) !important;
      transition: all 0.2s ease 0s !important;

      &:hover {
        color: var(--anzhiyu-white);
        text-decoration: none;
        background: var(--anzhiyu-main);
        border-radius: 0.25rem !important;
        box-shadow: var(--anzhiyu-shadow-lightblack);
      }
    }

    blockquote {
      padding: 0.5rem 0.8rem;
      margin: 1rem 0;
      color: var(--anzhiyu-secondtext);
      background-color: var(--anzhiyu-secondbg);
      border: var(--style-border-always);
      border-radius: 8px;
    }

    .md-editor-code pre code {
      padding: 0;
      color: var(--hlnumber-color);
      background: var(--anzhiyu-card-bg);
    }

    span[rn-wrapper] {
      top: 0;
      height: 100%;
      background: var(--anzhiyu-secondbg);
      border-right: var(--style-border-always);

      span {
        transform: translateY(10px);
      }

      &::before {
        padding-right: 1rem;
        color: var(--hlnumber-color);
      }
    }

    .md-editor-code-block {
      padding: 10px 0;
    }

    .md-editor-code-head {
      display: flex;
      align-items: center;
      height: 2.15em;
      min-height: 24px;
      overflow: hidden;
      font-size: 1rem;
      color: var(--hltools-color);
      background: var(--hltools-bg);

      .expand {
        position: absolute;
        top: 50%;
        padding: 0.57rem 0.7rem;
        cursor: pointer;
        transition: transform 0.3s;
        transform: translate(0, -47%) rotate(-90deg);
      }

      .code-lang {
        position: absolute;
        left: 2.5rem;
        font-size: 1.15em;
        font-weight: 700;
        text-transform: uppercase;
        user-select: none;
      }

      .copy-button {
        position: absolute;
        right: 14px;
        cursor: pointer;
        transition: color 0.2s;
      }
    }
  }

  .tabs {
    position: relative;
    padding: 8px;
    margin: 1rem 0 !important;
    overflow: hidden;
    background: var(--anzhiyu-card-bg);
    border: 3px solid var(--anzhiyu-secondbg);
    border-radius: 12px;
    box-shadow: var(--anzhiyu-shadow-border);

    & > .nav-tabs {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      padding: 16px;
      margin: 0;
      background: var(--anzhiyu-card-bg);

      & > .tab {
        padding: 8px 18px;
        margin: 4px;
        line-height: 1;
        color: var(--anzhiyu-fontcolor);
        cursor: pointer;
        background: var(--anzhiyu-secondbg);
        border: var(--style-border-always);
        border-radius: 8px;
        transition: all 0.4s;

        &.active {
          cursor: default;
          background: var(--anzhiyu-background);
          border: var(--style-border-hover-always);
          border-radius: 8px;
        }

        &:not(.active):hover {
          color: var(--anzhiyu-white);
          background: var(--anzhiyu-main);
          border: var(--style-border-hover-always);
          transition: 0.3s;
        }
      }
    }

    & > .tab-contents .tab-item-content {
      position: relative;
      display: none;
      padding: 1.2rem;
      background: var(--anzhiyu-background);
      border: var(--style-border-always);
      border-radius: 8px;

      &.active {
        display: block;
      }
    }

    & > .tab-to-top {
      width: 100%;
      padding: 0 16px 10px 0;
      text-align: right;

      button {
        background: transparent;
      }
    }
  }
}
</style>
