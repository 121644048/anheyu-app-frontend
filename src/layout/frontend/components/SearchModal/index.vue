<template>
  <div class="SearchModal">
    <div ref="dialogRef" class="search-dialog">
      <div class="search-nav">
        <div class="search-dialog-title">搜索</div>
        <div
          class="search-close-button"
          aria-label="关闭搜索框"
          @click="closeModal"
        >
          <i class="anzhiyufont anzhiyu-icon-xmark" />
        </div>
      </div>
      <div class="search-wrap">
        <div class="search-input-container">
          <i class="anzhiyufont anzhiyu-icon-magnifying-glass search-icon" />
          <input
            ref="inputRef"
            v-model="keyword"
            class="search-input"
            type="text"
            placeholder="输入关键字，按 Enter 搜索"
            @keydown.enter.prevent="handleEnter"
            @input="handleInput"
          />
        </div>
        <div v-if="tipsVisible && !keyword.trim()" class="search-tips">
          <span>按 Esc 关闭</span>
          <span>·</span>
          <span>按 Ctrl/⌘ + K 打开</span>
        </div>

        <div v-if="keyword.trim() && !loading" class="search-results">
          <div v-if="searchResults.length > 0" class="results-header">
            <span class="results-count">找到 {{ total }} 条结果</span>
          </div>

          <div class="results-list">
            <div
              v-for="result in searchResults"
              :key="result.id"
              class="result-item"
              @click="handleResultClick(result)"
            >
              <div class="result-thumbnail">
                <img
                  :src="result.cover_url || defaultCover"
                  :alt="result.title"
                />
              </div>
              <div class="result-details">
                <div class="result-content">
                  <div class="result-title" v-html="result.title" />
                  <div class="result-snippet" v-html="result.snippet" />
                </div>
                <div class="result-footer">
                  <div class="result-meta">
                    <span class="result-author">{{ result.author }}</span>
                    <span class="result-date">
                      {{ formatDate(result.publish_date) }}
                    </span>
                    <span
                      v-if="result.tags && result.tags.length > 0"
                      class="result-tags"
                    >
                      <span
                        v-for="tag in result.tags.slice(0, 3)"
                        :key="tag"
                        class="tag"
                      >
                        {{ tag }}
                      </span>
                    </span>
                  </div>
                  <div class="result-arrow">
                    <i class="anzhiyufont anzhiyu-icon-arrow-right-s-line" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="totalPages > 1" class="pagination">
            <div
              class="page-btn"
              :disabled="currentPage <= 1"
              @click="changePage(currentPage - 1)"
            >
              上一页
            </div>
            <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
            <div
              class="page-btn"
              :disabled="currentPage >= totalPages"
              @click="changePage(currentPage + 1)"
            >
              下一页
            </div>
          </div>
        </div>

        <div
          v-if="keyword.trim() && !loading && searchResults.length === 0"
          class="no-results"
        >
          <div class="no-results-icon">🔍</div>
          <div class="no-results-text">未找到相关结果</div>
          <div class="no-results-tip">尝试使用其他关键词或检查拼写</div>
        </div>

        <div v-if="loading" class="loading">
          <div class="loading-spinner" />
          <div class="loading-text">搜索中...</div>
        </div>
      </div>
    </div>
    <div ref="maskRef" class="search-mask" @click="closeModal" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from "vue";
import { gsap } from "gsap";
import { useArticleStore } from "@/store/modules/articleStore";

interface SearchHit {
  id: string;
  title: string;
  snippet: string;
  author: string;
  category: string;
  tags: string[];
  publish_date: string;
  cover_url?: string;
  abbrlink?: string;
  view_count?: number;
  word_count?: number;
  reading_time?: number;
}

interface SearchResult {
  pagination: {
    total: number;
    page: number;
    size: number;
    totalPages: number;
  };
  hits: SearchHit[];
}

interface SearchResponse {
  code: number;
  message: string;
  data: SearchResult;
}

const articleStore = useArticleStore();
const defaultCover = articleStore.defaultCover;

const maskRef = ref<HTMLDivElement | null>(null);
const dialogRef = ref<HTMLDivElement | null>(null);
const inputRef = ref<HTMLInputElement | null>(null);

const isOpen = ref(false);
const keyword = ref("");
const loading = ref(false);
const searchResults = ref<SearchHit[]>([]);
const total = ref(0);
const currentPage = ref(1);
const totalPages = ref(0);
const pageSize = 10;

const tipsVisible = ref(true);

let searchTimeout: NodeJS.Timeout | null = null;
// 保存事件处理器引用以便卸载时正确移除
let handleOpenSearchRef: ((e: Event) => void) | null = null;

async function performSearch(page: number = 1) {
  if (!keyword.value.trim()) {
    searchResults.value = [];
    total.value = 0;
    totalPages.value = 0;
    return;
  }

  loading.value = true;
  currentPage.value = page;

  try {
    const response = await fetch(
      `/api/search?q=${encodeURIComponent(keyword.value.trim())}&page=${page}&size=${pageSize}`
    );

    if (!response.ok) {
      throw new Error(`搜索请求失败: ${response.status}`);
    }

    const data: SearchResponse = await response.json();

    if (data.code === 200) {
      const regex = new RegExp(keyword.value.trim(), "gi");
      searchResults.value = data.data.hits.map(hit => ({
        ...hit,
        title: hit.title.replace(regex, match => `<em>${match}</em>`),
        snippet: hit.snippet.replace(regex, match => `<em>${match}</em>`)
      }));
      total.value = data.data.pagination.total;
      totalPages.value = data.data.pagination.totalPages;
    } else {
      throw new Error(data.message || "搜索失败");
    }
  } catch (error) {
    console.error("搜索错误:", error);
    searchResults.value = [];
    total.value = 0;
    totalPages.value = 0;
  } finally {
    loading.value = false;
  }
}

function handleInput() {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }

  searchTimeout = setTimeout(() => {
    if (keyword.value.trim()) {
      performSearch(1);
    } else {
      searchResults.value = [];
      total.value = 0;
      totalPages.value = 0;
    }
  }, 300);
}

function handleEnter() {
  if (keyword.value.trim()) {
    performSearch(1);
  }
}

function changePage(page: number) {
  if (page >= 1 && page <= totalPages.value) {
    performSearch(page);
  }
}

function handleResultClick(result: SearchHit) {
  const targetId = result.abbrlink || result.id;
  window.location.href = `/posts/${targetId}`;
  closeModal();
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  } catch {
    return dateString;
  }
}

function openModal() {
  if (isOpen.value) return;
  isOpen.value = true;

  const mask = maskRef.value;
  const dialog = dialogRef.value;
  if (!mask || !dialog) return;

  gsap.set(mask, { display: "block", opacity: 0, pointerEvents: "auto" });
  gsap.set(dialog, { display: "flex", opacity: 0, y: 24, scale: 0.98 });

  const tl = gsap.timeline();
  tl.to(mask, {
    duration: 0.3,
    opacity: 1,
    ease: "power2.out",
    force3D: true
  })
    .fromTo(
      dialog,
      { opacity: 0, y: 24, scale: 0.98 },
      {
        duration: 0.35,
        opacity: 1,
        y: 0,
        scale: 1,
        ease: "power3.out",
        force3D: true
      },
      "<"
    )
    .add(() => {
      nextTick(() => inputRef.value?.focus());
    });
}

function closeModal() {
  if (!isOpen.value) return;
  const mask = maskRef.value;
  const dialog = dialogRef.value;
  if (!mask || !dialog) return;

  const tl = gsap.timeline({ onComplete: onClosed });
  tl.to(dialog, {
    duration: 0.25,
    opacity: 0,
    y: 16,
    scale: 0.98,
    ease: "power2.inOut",
    force3D: true
  }).to(
    mask,
    { duration: 0.3, opacity: 0, ease: "power2.inOut", force3D: true },
    "<"
  );

  function onClosed() {
    gsap.set(dialog, { display: "none" });
    gsap.set(mask, { display: "none" });
    isOpen.value = false;
    keyword.value = "";
    searchResults.value = [];
    total.value = 0;
    totalPages.value = 0;
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === "Escape") {
    e.preventDefault();
    closeModal();
    return;
  }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    openModal();
  }
}

// 移除全局点击监听，改为使用自定义事件或数据属性来精确控制

onMounted(() => {
  if (maskRef.value) {
    gsap.set(maskRef.value, { display: "none", opacity: 0 });
  }
  if (dialogRef.value) {
    gsap.set(dialogRef.value, { display: "none", opacity: 0 });
  }

  window.addEventListener("keydown", onKeydown);

  handleOpenSearchRef = (e: Event) => {
    const custom = e as CustomEvent;
    const kw = custom?.detail?.keyword as string | undefined;
    if (kw && typeof kw === "string") {
      keyword.value = kw;
    }
    openModal();
    if (keyword.value.trim()) {
      performSearch(1);
    }
  };

  window.addEventListener(
    "frontend-open-search",
    handleOpenSearchRef as EventListener
  );
});

onBeforeUnmount(() => {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }

  window.removeEventListener("keydown", onKeydown);
  if (handleOpenSearchRef) {
    window.removeEventListener(
      "frontend-open-search",
      handleOpenSearchRef as EventListener
    );
    handleOpenSearchRef = null;
  }
});
</script>

<style scoped lang="scss">
.search-mask {
  position: fixed;
  inset: 0;
  z-index: 1000;
  pointer-events: auto;
  background: var(--anzhiyu-maskbgdeep);
  backdrop-filter: blur(12px);
  transform: translateZ(0);
}

.search-dialog {
  position: fixed;
  inset: 0;
  z-index: 1001;
  display: flex;
  flex-direction: column;
  width: 40rem;
  max-width: 90vw;
  height: fit-content;
  max-height: 80dvh;
  padding: 0;
  margin: 5rem auto;
  background: var(--anzhiyu-card-bg);
  border: var(--style-border);
  border-radius: 16px;
  box-shadow: var(--anzhiyu-shadow-lightblack);
  transition:
    background-color 0.3s,
    box-shadow 0.3s,
    border-color 0.3s;
  will-change: transform, opacity;
}

.search-nav {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.5rem;
  border-bottom: var(--style-border);
}

.search-dialog-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--anzhiyu-fontcolor);
}

.search-close-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  color: var(--anzhiyu-secondtext);
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.search-close-button:hover {
  color: var(--anzhiyu-white);
  background: var(--anzhiyu-lighttext);
}

.search-close-button .anzhiyufont {
  font-size: 1.1rem;
}

.search-wrap {
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 1.25rem;
  overflow-y: auto;
}

.search-input-container {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 0.875rem;
  font-size: 1.1rem;
  color: var(--anzhiyu-secondtext);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  font-size: 1rem;
  color: var(--anzhiyu-fontcolor);
  background: var(--anzhiyu-secondbg);
  border: var(--style-border);
  border-radius: 8px;
  outline: none;
  outline: 0;
  transition:
    border-color 0.2s,
    background-color 0.2s,
    box-shadow 0.2s;
}

.search-input:focus {
  background-color: var(--anzhiyu-card-bg);
  border-color: var(--anzhiyu-theme);
  box-shadow: 0 0 0 3px var(--anzhiyu-theme-op);
}

.search-input::placeholder {
  color: var(--anzhiyu-secondtext);
}

.search-tips {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  justify-content: center;
  margin-top: 0.75rem;
  font-size: 0.8rem;
  color: var(--anzhiyu-secondtext);
}

.search-results {
  display: flex;
  flex-direction: column;
  margin-top: 1.5rem;
}

.results-header {
  padding-left: 0.5rem;
  margin-bottom: 0.5rem;
}

.results-count {
  font-size: 0.875rem;
  color: var(--anzhiyu-secondtext);
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.result-item {
  display: flex;
  gap: 1.25rem;
  align-items: center;
  padding: 1rem 1.25rem;
  cursor: pointer;
  background: var(--anzhiyu-card-bg);
  border: var(--style-border);
  border-radius: 12px;
  transition: all 0.25s ease-in-out;
}

.result-item:hover {
  border-color: var(--anzhiyu-theme);
  box-shadow: 0 4px 12px var(--anzhiyu-theme-op);
  transform: translateY(-2px);
}

.result-item:hover .result-arrow {
  opacity: 1;
  transform: translateX(0);
}

.result-item:hover .result-thumbnail img {
  transform: scale(1.1);
}

.result-thumbnail {
  flex-shrink: 0;
  width: 6rem;
  height: 6rem;
  overflow: hidden;
  border-radius: 8px;
}

.result-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease-out;
}

.result-details {
  display: flex;
  flex-grow: 1;
  flex-direction: column;
  align-self: stretch;
  min-width: 0;
}

.result-content {
  flex-grow: 1;
}

.result-title {
  display: -webkit-box;
  margin-bottom: 0.5rem;
  overflow: hidden;
  font-size: 1.1rem;
  font-weight: 600;
  line-height: 1.4;
  color: var(--anzhiyu-fontcolor);
  -webkit-line-clamp: 1;
  line-clamp: 1;
  -webkit-box-orient: vertical;
}

.result-title:deep(em) {
  font-style: normal;
  color: var(--anzhiyu-theme);
}

.result-snippet {
  display: -webkit-box;
  margin-bottom: 0.75rem;
  overflow: hidden;
  font-size: 0.9rem;
  line-height: 1.6;
  color: var(--anzhiyu-secondtext);
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
}

.result-snippet:deep(em) {
  font-style: normal;
  font-weight: 500;
}

.result-footer {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  padding-top: 0.5rem;
  margin-top: auto;
}

.result-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
  font-size: 0.8rem;
  color: var(--anzhiyu-secondtext);
}

.result-author,
.result-date {
  white-space: nowrap;
}

.result-tags {
  display: flex;
  gap: 0.375rem;
}

.tag {
  padding: 0.15rem 0.5rem;
  font-size: 0.75rem;
  color: var(--anzhiyu-theme);
  white-space: nowrap;
  background: var(--anzhiyu-theme-op);
  border-radius: 6px;
}

.result-arrow {
  font-size: 1.25rem;
  color: var(--anzhiyu-theme);
  opacity: 0;
  transition: all 0.25s ease-in-out;
  transform: translateX(-5px);
}

.pagination {
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: center;
  padding-top: 1.5rem;
  margin-top: 1.5rem;
  border-top: var(--style-border);
}

.page-btn {
  padding: 0.5rem 1rem;
  color: var(--anzhiyu-fontcolor);
  cursor: pointer;
  background: var(--anzhiyu-card-bg);
  border: var(--style-border);
  border-radius: 6px;
  transition: all 0.2s ease;
}

.page-btn:hover:not(:disabled) {
  color: var(--anzhiyu-theme);
  background: var(--anzhiyu-theme-op);
  border-color: var(--anzhiyu-theme);
}

.page-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.page-info {
  font-size: 0.9rem;
  color: var(--anzhiyu-secondtext);
}

.no-results,
.loading {
  padding: 2rem;
  margin-top: 2rem;
  text-align: center;
}

.no-results-icon {
  margin-bottom: 1rem;
  font-size: 3rem;
}

.no-results-text {
  margin-bottom: 0.5rem;
  font-size: 1.1rem;
  color: var(--anzhiyu-fontcolor);
}

.no-results-tip {
  font-size: 0.9rem;
  color: var(--anzhiyu-secondtext);
}

.loading-spinner {
  width: 2rem;
  height: 2rem;
  margin: 0 auto 1rem;
  border: var(--style-border);
  border-top: 2px solid var(--anzhiyu-theme);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-text {
  font-size: 0.9rem;
  color: var(--anzhiyu-secondtext);
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

:deep(em) {
  font-style: normal;
  color: var(--anzhiyu-theme);
}
</style>
