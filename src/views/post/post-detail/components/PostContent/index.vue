<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from "vue";
import { useSnackbar } from "@/composables/useSnackbar";
import { useSiteConfigStore } from "@/store/modules/siteConfig";
import "katex/dist/katex.min.css";

import { Fancybox } from "@fancyapps/ui";
import "@fancyapps/ui/dist/fancybox/fancybox.css";

defineProps({
  content: {
    type: String,
    default: "PostContent"
  }
});

const { showSnackbar } = useSnackbar();
const siteConfigStore = useSiteConfigStore();

const codeMaxLines = computed(
  () => siteConfigStore.getSiteConfig?.code_block?.code_max_lines || 10
);

const postContentRef = ref<HTMLElement | null>(null);

const collapsedHeight = computed(() => {
  const lines = codeMaxLines.value > 0 ? codeMaxLines.value : 10;
  const height = lines * 25 + 50;
  return `${height}px`;
});

const handleContentClick = (event: Event) => {
  const target = event.target as HTMLElement;

  const tabButton = target.closest(".tabs .nav-tabs .tab");
  if (tabButton && tabButton instanceof HTMLButtonElement) {
    event.preventDefault();
    if (tabButton.classList.contains("active")) {
      return;
    }
    const tabsContainer = tabButton.closest(".tabs");
    if (!tabsContainer) return;
    const targetId = tabButton.dataset.href;
    if (!targetId) return;

    tabsContainer.querySelectorAll(".nav-tabs .tab").forEach(btn => {
      btn.classList.remove("active");
    });
    tabsContainer.querySelectorAll(".tab-item-content").forEach(content => {
      content.classList.remove("active");
    });

    tabButton.classList.add("active");
    const targetContent = tabsContainer.querySelector(`#${targetId}`);
    if (targetContent) {
      targetContent.classList.add("active");
    }
    return;
  }

  const scrollToTopButton = target.closest(".tab-to-top button");
  if (scrollToTopButton) {
    event.preventDefault();
    const tabsContainer = scrollToTopButton.closest(".tabs");
    if (tabsContainer) {
      tabsContainer.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
    return;
  }

  const copyButton = target.closest(".copy-button");
  if (copyButton) {
    event.preventDefault();
    event.stopPropagation();
    const codeContainer = copyButton.closest(".md-editor-code");
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

  const expandButton = target.closest(".expand");
  if (expandButton) {
    const detailsElement = expandButton.closest(".md-editor-code");
    event.preventDefault();
    if (detailsElement) {
      detailsElement.hasAttribute("open")
        ? detailsElement.removeAttribute("open")
        : detailsElement.setAttribute("open", "");
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
};

onMounted(() => {
  if (postContentRef.value) {
    postContentRef.value.addEventListener("click", handleContentClick);

    Fancybox.bind(postContentRef.value, "img:not(a img)", {
      groupAll: true
    });
  }
});

onUnmounted(() => {
  if (postContentRef.value) {
    postContentRef.value.removeEventListener("click", handleContentClick);
    Fancybox.unbind(postContentRef.value);
    Fancybox.close(true);
  }
});
</script>

<template>
  <article
    id="article-container"
    ref="postContentRef"
    class="post-content"
    v-html="content"
  />
</template>

<style lang="scss">
@use "./editor-code.scss";

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

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

.post-content {
  line-height: 1.8;
  word-wrap: break-word;
  overflow-wrap: break-word;

  img:not(a img) {
    cursor: zoom-in;
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

  .md-editor-code {
    position: relative;
    margin: 20px 0;
    overflow: hidden;
    font-size: 12px;
    line-height: 1;
    color: var(--md-theme-code-block-color);
    border: var(--style-border-always);
    border-radius: 10px;

    &.is-collapsed {
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
          transform: translate(0, -47%) rotate(0deg);
        }
      }

      pre {
        max-height: 1000px;
      }
    }

    pre {
      position: relative;
      max-height: 0;
      margin: 0;
      overflow: hidden;
      line-height: 1.6;
      transition: max-height 0.35s ease-in-out;

      code {
        position: relative;
        display: block;
        padding-left: 3.6rem;
        margin: 0;
        overflow: auto;
        font-family: source-code-pro, Menlo, Monaco, Consolas, "Courier New",
          monospace;
        font-size: 16px;
        line-height: 1.6;
        color: var(--hlnumber-color);
        background: var(--anzhiyu-card-bg);
        border-radius: 0;
      }
    }

    .md-editor-code-block {
      display: inline-block;
      width: 100%;
      padding: 10px 0;
      overflow: auto;
      color: #a9b7c6;
      vertical-align: bottom;
    }

    span[rn-wrapper] {
      position: absolute;
      top: 0;
      left: 0;
      width: 3em;
      height: 100%;
      font-size: 100%;
      letter-spacing: -1px;
      pointer-events: none;
      counter-reset: linenumber;
      user-select: none;
      background: var(--anzhiyu-secondbg);
      border-right: var(--style-border-always);

      & > span {
        display: block;
        pointer-events: none;
        counter-increment: linenumber;

        &::before {
          display: block;
          padding-right: 0.5em;
          color: #999;
          text-align: right;
          content: counter(linenumber);
        }
      }

      span {
        transform: translateY(12px);
      }

      &::before {
        padding-right: 1rem;
        color: var(--hlnumber-color);
      }
    }

    .md-editor-code-head {
      position: sticky;
      top: 0;
      display: flex;
      align-items: center;
      width: 100%;
      height: 2.15em;
      min-height: 24px;
      margin-bottom: 0;
      overflow: hidden;
      font-size: 1rem;
      color: var(--hltools-color);
      list-style: none;
      cursor: pointer;
      background: var(--hltools-bg);
      -webkit-tap-highlight-color: rgb(0 0 0 / 0%);

      .expand {
        position: absolute;
        top: 50%;
        padding: 0.57rem 0.7rem;

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
    margin: 1rem 0;
    overflow: hidden;
    background: var(--anzhiyu-card-bg);
    border: 3px solid var(--anzhiyu-secondbg);
    border-radius: 12px;
    box-shadow: var(--anzhiyu-shadow-border);

    & > .tab-to-top {
      width: 100%;
      padding: 0 16px 10px 0;
      text-align: right;

      button {
        background: transparent;
      }
    }

    & > .nav-tabs {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      padding: 16px;
      margin: 0;
      background: var(--anzhiyu-card-bg);

      .tab {
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

    & > .tab-contents {
      padding: 1rem;

      .tab-item-content {
        position: relative;
        display: none;
        padding: 1.2rem;
        background: var(--anzhiyu-background);
        border: var(--style-border-always);
        border-radius: 8px;
        animation: fadeIn 0.5s;

        &.active {
          display: block;
        }
      }
    }
  }

  .md-editor-admonition-note {
    --md-admonition-color: #212121;
    --md-admonition-bg-color: #fff;
    --md-admonition-border-color: rgb(166.2 166.2 166.2);
  }

  .md-editor-admonition-tip {
    --md-admonition-color: #616161;
    --md-admonition-bg-color: #f5f5f5;
    --md-admonition-border-color: rgb(185.8 185.8 185.8);
  }

  .md-editor-admonition-info {
    --md-admonition-color: #424242;
    --md-admonition-bg-color: #f0f0f0;
    --md-admonition-border-color: rgb(170.4 170.4 170.4);
  }

  .md-editor-admonition-quote {
    --md-admonition-color: #455a64;
    --md-admonition-bg-color: #eceff1;
    --md-admonition-border-color: rgb(169.2 179.4 184.6);
  }

  .md-editor-admonition-abstract {
    --md-admonition-color: #0288d1;
    --md-admonition-bg-color: #e1f5fe;
    --md-admonition-border-color: rgb(135.8 201.4 236);
  }

  .md-editor-admonition-attention {
    --md-admonition-color: #1e88e5;
    --md-admonition-bg-color: #e3f2fd;
    --md-admonition-border-color: rgb(148.2 199.6 243.4);
  }

  .md-editor-admonition-example {
    --md-admonition-color: #5e35b1;
    --md-admonition-bg-color: #ede7f6;
    --md-admonition-border-color: rgb(179.8 159.8 218.4);
  }

  .md-editor-admonition-hint {
    --md-admonition-color: #00897b;
    --md-admonition-bg-color: #e0f2f1;
    --md-admonition-border-color: rgb(134.4 200 193.8);
  }

  .md-editor-admonition-success {
    --md-admonition-color: #388e3c;
    --md-admonition-bg-color: #e8f5e9;
    --md-admonition-border-color: rgb(161.6 203.8 163.8);
  }

  .md-editor-admonition-question {
    --md-admonition-color: #f9a825;
    --md-admonition-bg-color: #fffde7;
    --md-admonition-border-color: rgb(252.6 219 153.4);
  }

  .md-editor-admonition-caution {
    --md-admonition-color: #fb8c00;
    --md-admonition-bg-color: #fff8e1;
    --md-admonition-border-color: rgb(253.4 204.8 135);
  }

  .md-editor-admonition-warning {
    --md-admonition-color: #f57c00;
    --md-admonition-bg-color: #fff3e0;
    --md-admonition-border-color: rgb(251 195.4 134.4);
  }

  .md-editor-admonition-danger {
    --md-admonition-color: #d84315;
    --md-admonition-bg-color: #ffebee;
    --md-admonition-border-color: rgb(239.4 167.8 151.2);
  }

  .md-editor-admonition-failure {
    --md-admonition-color: #d32f2f;
    --md-admonition-bg-color: #fee2e6;
    --md-admonition-border-color: rgb(236.8 154.4 156.8);
  }

  .md-editor-admonition-bug {
    --md-admonition-color: #c31a1a;
    --md-admonition-bg-color: #fddadd;
    --md-admonition-border-color: rgb(229.8 141.2 143);
  }

  .md-editor-admonition-error {
    --md-admonition-color: #b71c1c;
    --md-admonition-bg-color: #fdd2d6;
    --md-admonition-border-color: rgb(225 137.2 139.6);
  }

  [data-theme="dark"] {
    .md-editor-admonition-note {
      --md-admonition-color: #e0e0e0;
      --md-admonition-bg-color: #1e1e1e;
      --md-admonition-border-color: rgb(107.6 107.6 107.6);
    }

    .md-editor-admonition-tip {
      --md-admonition-color: #b0b0b0;
      --md-admonition-bg-color: #262626;
      --md-admonition-border-color: rgb(93.2 93.2 93.2);
    }

    .md-editor-admonition-info {
      --md-admonition-color: #b3b3b3;
      --md-admonition-bg-color: #2b2b2b;
      --md-admonition-border-color: rgb(97.4 97.4 97.4);
    }

    .md-editor-admonition-quote {
      --md-admonition-color: #b0bec5;
      --md-admonition-bg-color: #263238;
      --md-admonition-border-color: rgb(93.2 106 112.4);
    }

    .md-editor-admonition-abstract {
      --md-admonition-color: #81d4fa;
      --md-admonition-bg-color: #012f45;
      --md-admonition-border-color: rgb(52.2 113 141.4);
    }

    .md-editor-admonition-attention {
      --md-admonition-color: #64b5f6;
      --md-admonition-bg-color: #102a4c;
      --md-admonition-border-color: rgb(49.6 97.6 144);
    }

    .md-editor-admonition-example {
      --md-admonition-color: #9575cd;
      --md-admonition-bg-color: #271b52;
      --md-admonition-border-color: rgb(83 63 131.2);
    }

    .md-editor-admonition-hint {
      --md-admonition-color: #4db6ac;
      --md-admonition-bg-color: #003d3a;
      --md-admonition-border-color: rgb(30.8 109.4 103.6);
    }

    .md-editor-admonition-success {
      --md-admonition-color: #81c784;
      --md-admonition-bg-color: #1b5e20;
      --md-admonition-border-color: rgb(67.8 136 72);
    }

    .md-editor-admonition-question {
      --md-admonition-color: #ffd54f;
      --md-admonition-bg-color: #3e2f00;
      --md-admonition-border-color: rgb(139.2 113.4 31.6);
    }

    .md-editor-admonition-caution {
      --md-admonition-color: #ffcc80;
      --md-admonition-bg-color: #3e2600;
      --md-admonition-border-color: rgb(139.2 104.4 51.2);
    }

    .md-editor-admonition-warning {
      --md-admonition-color: #ffb74d;
      --md-admonition-bg-color: #3d2600;
      --md-admonition-border-color: rgb(138.6 96 30.8);
    }

    .md-editor-admonition-danger {
      --md-admonition-color: #ef9a9a;
      --md-admonition-bg-color: #3c0000;
      --md-admonition-border-color: rgb(131.6 61.6 61.6);
    }

    .md-editor-admonition-failure {
      --md-admonition-color: #ef9a9a;
      --md-admonition-bg-color: #3c0900;
      --md-admonition-border-color: rgb(131.6 67 61.6);
    }

    .md-editor-admonition-bug {
      --md-admonition-color: #e68381;
      --md-admonition-bg-color: #300000;
      --md-admonition-border-color: rgb(120.8 52.4 51.6);
    }

    .md-editor-admonition-error {
      --md-admonition-color: #ef5350;
      --md-admonition-bg-color: #300000;
      --md-admonition-border-color: rgb(124.4 33.2 32);
    }
  }

  .md-editor-admonition {
    display: flow-root;
    padding: 1em 1em 0.5em;
    margin: 1rem 0;
    font-size: 14px;
    font-weight: 400;
    color: var(--md-admonition-color);
    background-color: var(--md-admonition-bg-color);
    border: 1px solid var(--md-admonition-border-color);
    border-radius: 6px;
    page-break-inside: avoid;
    p {
      color: var(--md-admonition-color);
    }
  }

  .md-editor-admonition-title {
    position: relative;
    padding: 0;
    margin: 0;
    font-weight: 700;
  }

  .md-editor-admonition p {
    padding: 0;
    margin: 0.5em 0;
  }

  .md-editor-admonition p:first-of-type {
    margin-top: 0;
  }

  .md-editor-admonition + p:empty,
  .md-editor-admonition + p:empty + p:empty {
    display: none;
  }

  .md-editor-katex-inline[data-processed] {
    display: initial;
  }

  .md-editor-katex-block[data-processed] {
    display: block;
  }

  .md-editor-mermaid {
    overflow: hidden;
    line-height: normal;

    &:not([data-processed]) {
      white-space: pre;
    }

    p {
      font-size: 16px;
    }

    &[data-processed] {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    &[data-processed] .md-editor-mermaid-action {
      position: absolute;
      top: 10px;
      right: 10px;
      z-index: 1;
      cursor: pointer;
      opacity: 0;
      transition: opacity 0.3s;
    }

    &[data-processed] {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;

      svg {
        transform-origin: top left;
      }

      &:hover .md-editor-mermaid-action {
        opacity: 1;
      }

      .md-editor-mermaid-action svg {
        width: 20px;
        height: 20px;
      }
    }

    &[data-grab] {
      cursor: grab;
    }
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

  input[type="checkbox"] {
    position: relative;
    box-sizing: border-box;
    display: inline-block;
    flex-shrink: 0;
    width: 16px;
    height: 16px;
    padding: 0;
    margin-right: 8px;
    appearance: none;
    appearance: none;
    appearance: none;
    appearance: none;
    appearance: none;
    pointer-events: none;
    cursor: pointer;
    border: 2px solid var(--anzhiyu-theme);
    border-radius: 2px;
    outline: 0;
    transition: all 0.15s ease-out 0s;

    &:checked {
      background: var(--anzhiyu-theme);
    }

    &::before,
    &::after {
      position: absolute;
      content: "";
      background: #fff;
    }

    &:checked::before {
      top: 7px;
      left: 0;
      width: 6px;
      height: 2px;
    }

    &:checked::after {
      right: 3px;
      bottom: 1px;
      width: 2px;
      height: 10px;
    }

    &::before {
      top: 5px;
      left: 1px;
      width: 0;
      height: 2px;
      transition: all 0.2s ease-in;
      transform: rotate(45deg);
    }

    &::after {
      right: 7px;
      bottom: 3px;
      width: 2px;
      height: 0;
      transition-delay: 0.25s;
      transform: rotate(40deg);
    }
  }

  .table-container {
    margin: 1rem 0;
    overflow: hidden;
    overflow-x: scroll;
    border: var(--style-border-always);
    border-radius: 8px;

    p {
      margin: 8px 0;
    }

    table {
      display: table;
      width: 100%;
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

  code {
    padding: 0.2rem 0.4rem;
    padding: 2px 4px;
    margin: 0 4px;
    line-height: 2;
    color: #fff;
    background: var(--anzhiyu-code-stress);
    border-radius: 4px;
    box-shadow: var(--anzhiyu-shadow-border);
  }

  blockquote {
    padding: 0.5rem 0.8rem;
    margin: 1rem 0;
    color: var(--anzhiyu-secondtext);
    background-color: var(--anzhiyu-secondbg);
    border: var(--style-border-always);
    border-radius: 8px;
  }

  p {
    margin: 24px 0;
    font-size: 17px;
    font-weight: 400;
    line-height: 1.7;
    color: var(--anzhiyu-fontcolor);
    text-align: left;
    letter-spacing: 0.6px;
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    position: relative;
    margin: 20px 0 14px;
    font-weight: 700;
    color: var(--text-highlight-color);
  }

  > :last-child {
    margin-bottom: 0 !important;
  }

  img {
    display: block;
    max-width: 100%;
    margin: 0 auto 20px;
    border-radius: 8px;
    transition: 0.3s;
  }

  iframe {
    margin: 0 0 20px;
    border-radius: 12px;
  }

  kbd {
    padding: 3px 5px;
    margin: 0 3px;
    font-family: Monaco, "Ubuntu Mono", monospace;
    font-size: 0.9em;
    font-weight: 600;
    line-height: 1em;
    color: #34495e;
    white-space: nowrap;
    background-color: #f8f8f8;
    border: 1px solid #b4b4b4;
    border-radius: 3px;
    box-shadow:
      0 1px 3px rgb(0 0 0 / 25%),
      0 2px 1px 0 rgb(255 255 255 / 60%) inset;
  }

  ol,
  ul {
    p {
      margin: 0 0 8px;
    }

    li {
      margin: 4px 0;

      &::marker {
        font-size: 1.05em;
        font-weight: 600;
      }

      &:hover::marker {
        color: var(--pseudo-hover);
      }
    }

    ol,
    ul {
      padding-left: 20px;
    }
  }
}
</style>
