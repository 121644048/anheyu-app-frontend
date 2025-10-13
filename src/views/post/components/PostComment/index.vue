<script setup lang="ts">
import { onMounted, computed, watch, nextTick, ref, onUnmounted } from "vue";
import { useRoute } from "vue-router";
import type { Comment } from "@/api/comment/type";
import { useSiteConfigStore } from "@/store/modules/siteConfig";
import { useCommentStore } from "@/store/modules/commentStore";
import { useUserStoreHook } from "@/store/modules/user";
import { storeToRefs } from "pinia";
import { ElSkeleton, ElEmpty, ElButton } from "element-plus";
import CommentItem from "./components/CommentItem.vue";
import CommentForm from "./components/CommentForm.vue";
import Fancybox from "@/components/Fancybox/index.vue";

defineOptions({ name: "PostComment" });

const props = defineProps({
  targetPath: { type: String, required: true }
});

const emit = defineEmits(["comment-ids-loaded"]);

const route = useRoute();
const siteConfigStore = useSiteConfigStore();
const commentStore = useCommentStore();
const userStore = useUserStoreHook();
const { comments, totalComments, isLoading, isLoadingMore, hasMore } =
  storeToRefs(commentStore);

const quoteText = ref("");
const commentFormRef = ref();
const isAnonymousMode = ref(false);

// 评论区是否可见（用于懒加载DOM）
const isCommentListVisible = ref(false);
const commentContainerRef = ref<HTMLElement | null>(null);
let intersectionObserver: IntersectionObserver | null = null;

// 检查用户是否已登录
const isLoggedIn = computed(() => {
  return !!userStore.username && userStore.roles.length > 0;
});

// 滚动加载相关
const commentListRef = ref<HTMLElement | null>(null);
const isLoadingScroll = ref(false);

const commentInfoConfig = computed(() => {
  const config = siteConfigStore.getSiteConfig.comment;
  return {
    enable: config.enable,
    blogger_email: config.blogger_email,
    master_tag: config.master_tag,
    page_size: config.page_size,
    placeholder: config.placeholder,
    show_region: config.show_region,
    show_ua: config.show_ua,
    login_required: config.login_required,
    gravatar_url: siteConfigStore.getSiteConfig.GRAVATAR_URL,
    default_gravatar_type: siteConfigStore.getSiteConfig.DEFAULT_GRAVATAR_TYPE
  };
});

// 检查评论功能是否启用
const isCommentEnabled = computed(() => {
  return commentInfoConfig.value?.enable === true;
});

const fancyboxOptions = {
  groupAll: true,
  Hash: false,
  Thumbs: {
    autoStart: true
  }
};

/**
 * @description 处理URL哈希值变化，滚动到对应评论
 * @param hash - URL中的hash值 (例如 #comment-123)
 */
const handleHashChange = (hash: string) => {
  if (!hash) return;

  setTimeout(() => {
    try {
      const id = decodeURIComponent(hash.slice(1));

      if (id.startsWith("comment-")) {
        scrollToComment(id);
      }
    } catch (e) {
      console.error("处理URL哈希值失败:", e);
    }
  }, 800);
};

// 设置 Intersection Observer 监听评论区可见性
const setupIntersectionObserver = () => {
  if (!commentContainerRef.value) return;

  intersectionObserver = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !isCommentListVisible.value) {
          // 当评论区进入视口时，标记为可见并渲染DOM
          isCommentListVisible.value = true;
          // 渲染后可以断开观察器，因为不需要再次监听
          if (intersectionObserver) {
            intersectionObserver.disconnect();
          }
        }
      });
    },
    {
      // 提前一些触发，当评论区距离视口还有 200px 时就开始加载
      rootMargin: "200px"
    }
  );

  intersectionObserver.observe(commentContainerRef.value);
};

onMounted(() => {
  // 检查评论功能是否启用，未启用则不加载评论数据
  if (!isCommentEnabled.value) {
    return;
  }

  const pageSize = commentInfoConfig.value.page_size || 10;
  // 提前加载评论数据（用于弹幕等功能），但不渲染DOM
  commentStore.initComments(props.targetPath, pageSize);

  // 添加滚动监听器
  setupScrollListener();

  // 在下一帧设置 Intersection Observer
  nextTick(() => {
    setupIntersectionObserver();
  });

  // 处理初始哈希值
  handleHashChange(route.hash);
});

onUnmounted(() => {
  // 清理滚动监听器
  removeScrollListener();
  // 清理 Intersection Observer
  if (intersectionObserver) {
    intersectionObserver.disconnect();
    intersectionObserver = null;
  }
});

// 监听哈希值变化
watch(
  () => route.hash,
  newHash => {
    handleHashChange(newHash);
  }
);

watch(
  comments,
  newComments => {
    if (newComments && newComments.length > 0) {
      nextTick(() => {
        const commentIds: string[] = [];
        const collectIds = (commentList: Comment[]) => {
          for (const comment of commentList) {
            commentIds.push(`comment-${comment.id}`);
            if (comment.children && comment.children.length > 0) {
              collectIds(comment.children);
            }
          }
        };
        collectIds(newComments);
        emit("comment-ids-loaded", commentIds);
      });
    }
  },
  { deep: true }
);

const scrollToComment = (id: string) => {
  const commentElement = document.getElementById(id);
  if (commentElement) {
    commentElement.classList.add("comment--highlight");
    setTimeout(() => {
      commentElement.classList.remove("comment--highlight");
    }, 2000);

    const rect = commentElement.getBoundingClientRect();
    const absoluteTop = rect.top + window.scrollY;
    const top = absoluteTop - 80;
    window.scrollTo({
      top: top,
      behavior: "smooth"
    });
  }
};

const setQuoteText = (text: string) => {
  quoteText.value = text;
};

const handleCommentSubmitted = () => {
  quoteText.value = "";
};

const handleCancelQuote = () => {
  quoteText.value = "";
};

const handleAnonymousClick = () => {
  const newState = commentFormRef.value?.showAnonymousDialog();
  if (newState !== undefined) {
    isAnonymousMode.value = newState;
  }
};

const handleAnonymousStateChange = (state: boolean) => {
  isAnonymousMode.value = state;
};

// 滚动加载相关函数
const setupScrollListener = () => {
  const handleScroll = async () => {
    if (isLoadingScroll.value || !commentStore.hasMore) return;

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;

    // 当滚动到距离底部100px时，触发加载更多
    if (scrollTop + windowHeight >= documentHeight - 100) {
      isLoadingScroll.value = true;
      try {
        await commentStore.loadMore();
      } finally {
        isLoadingScroll.value = false;
      }
    }
  };

  window.addEventListener("scroll", handleScroll);

  // 保存清理函数引用
  (window as any).__commentScrollHandler = handleScroll;
};

const removeScrollListener = () => {
  if ((window as any).__commentScrollHandler) {
    window.removeEventListener(
      "scroll",
      (window as any).__commentScrollHandler
    );
    delete (window as any).__commentScrollHandler;
  }
};

defineExpose({
  scrollToComment,
  setQuoteText
});
</script>

<template>
  <div v-if="isCommentEnabled" id="post-comment">
    <div class="main-comment-form-container">
      <div class="comment-head">
        <div class="form-title">
          <IconifyIconOffline icon="ri:chat-1-fill" class="w-6 h-6" />
          评论
          <span
            v-if="!isLoading && totalComments > 0"
            class="comment-count-number"
          >
            {{ totalComments }}
          </span>
        </div>
        <div class="comment-tools">
          <el-tooltip
            v-if="!commentInfoConfig.login_required && !isLoggedIn"
            :content="
              isAnonymousMode ? '点击关闭匿名评论模式' : '点击开启匿名评论模式'
            "
            placement="top"
            :show-arrow="false"
          >
            <div
              :class="[
                'comment-randomInfo',
                { 'comment-randomInfo--active': isAnonymousMode }
              ]"
              @click="handleAnonymousClick"
            >
              <div class="comment-randomInfo-text">
                {{ isAnonymousMode ? "匿名中" : "匿名评论" }}
              </div>
            </div>
          </el-tooltip>

          <el-tooltip
            content="查看评论信息的隐私政策"
            placement="top"
            :show-arrow="false"
          >
            <div class="comment-randomInfo">
              <router-link to="/privacy">隐私政策</router-link>
            </div>
          </el-tooltip>
        </div>
      </div>

      <CommentForm
        ref="commentFormRef"
        :target-path="props.targetPath"
        :placeholder="commentInfoConfig.placeholder"
        :quote-text="quoteText"
        @submitted="handleCommentSubmitted"
        @cancel-quote="handleCancelQuote"
        @anonymous-state-change="handleAnonymousStateChange"
      />
    </div>

    <div ref="commentContainerRef" class="comment-list-container">
      <!-- 评论列表进入视口前显示占位符 -->
      <div v-if="!isCommentListVisible" class="comment-list-placeholder">
        <div class="comment-list-placeholder-content">
          <IconifyIconOffline icon="ri:chat-1-line" class="placeholder-icon" />
          <span>滚动到此处加载评论...</span>
        </div>
      </div>

      <!-- 评论列表进入视口后才渲染实际内容 -->
      <template v-else>
        <el-skeleton v-if="isLoading" :rows="8" animated />
        <el-empty
          v-else-if="comments.length === 0"
          description="暂无评论，快来抢沙发吧！"
        />
        <Fancybox v-else class="comments-wrapper" :options="fancyboxOptions">
          <div
            v-for="comment in comments"
            :key="comment.id"
            class="comment-thread-item"
          >
            <CommentItem
              :id="`comment-${comment.id}`"
              :comment="comment"
              :config="commentInfoConfig"
            />
          </div>
          <div v-if="isLoadingScroll" class="scroll-loading-container">
            <div class="scroll-loading-spinner">
              <i class="anzhiyufont anzhiyu-icon-refresh" />
              <span>正在加载更多评论...</span>
            </div>
          </div>
        </Fancybox>
      </template>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@keyframes comment-highlight-animation {
  0% {
    background-color: rgb(0 123 255 / 15%);
  }

  100% {
    background-color: transparent;
  }
}

#post-comment {
  margin-bottom: 3rem;
  border-radius: 8px;

  :deep(.comment--highlight) {
    border-radius: 8px;
    animation: comment-highlight-animation 2s ease-out;
  }
}

.main-comment-form-container {
  .comment-tools {
    display: flex;
    gap: 8px;
    align-items: center;
  }
  .form-title {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    font-size: 1.5rem;
    font-weight: 600;

    i {
      font-size: 1.5rem;
    }
  }
  .comment-randomInfo {
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      color: var(--anzhiyu-main);
    }

    &--active {
      color: var(--anzhiyu-main);
      font-weight: 600;

      .comment-randomInfo-text {
        position: relative;

        &::after {
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 100%;
          height: 2px;
          content: "";
          background: var(--anzhiyu-main);
          border-radius: 1px;
        }
      }
    }
  }
}

.comment-head {
  font-size: 0.8rem;
  margin-bottom: 0.625rem;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: space-between;
  .form-title {
    position: relative;
  }
  .comment-count-number {
    font-size: 12px;
    padding: 3px 6px;
    border-radius: 20px;
    background-color: var(--anzhiyu-fontcolor);
    color: var(--anzhiyu-card-bg);
    line-height: 1;
    position: absolute;
    top: 8px;
    left: calc(100% + 5px); /* 相对于父元素右边再偏移5px */
  }
}

.comment-list-container {
  width: 100%;
  margin-top: 3rem;

  .comment-list-placeholder {
    min-height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 3rem 0;
  }

  .comment-list-placeholder-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    color: var(--anzhiyu-secondtext);
    font-size: 0.875rem;
    opacity: 0.7;

    .placeholder-icon {
      width: 3rem;
      height: 3rem;
      opacity: 0.5;
    }
  }

  .comments-wrapper {
    display: flex;
    flex-direction: column;

    .comment-thread-item {
      & + .comment-thread-item {
        margin-top: 1.5rem;
      }

      &:first-child hr {
        display: none;
      }

      hr {
        margin-bottom: 1.5rem;
        border: none;
        border-top: 1px solid #eef2f8;
      }
    }
  }

  .scroll-loading-container {
    width: 100%;
    margin: 2rem auto 0;
    text-align: center;
  }

  .scroll-loading-spinner {
    display: inline-flex;
    gap: 0.5rem;
    align-items: center;
    padding: 1rem 2rem;
    font-size: 0.875rem;
    color: var(--anzhiyu-fontcolor);
    background-color: var(--anzhiyu-card-bg);
    border: var(--style-border);
    border-radius: 50px;
    box-shadow: 0 8px 16px -4px rgb(44 45 48 / 4.7%);

    i {
      font-size: 1rem;
      animation: spin 1s linear infinite;
    }
  }
}

@media (width <= 768px) {
  .comment-list-container {
    .comments-wrapper {
      .comment-thread-item {
        margin-top: 0 !important;
        margin-bottom: 0.5rem !important;
        background: var(--anzhiyu-card-bg);
        border-radius: 12px;
        transition: 0.3s;
      }
    }
  }
}
</style>
