<script setup lang="ts">
import { onMounted, computed, watch, nextTick, ref, onUnmounted } from "vue";
import { useRoute } from "vue-router";
import type { Comment } from "@/api/comment/type";
import { useSiteConfigStore } from "@/store/modules/siteConfig";
import { useCommentStore } from "@/store/modules/commentStore";
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
const { comments, totalComments, isLoading, isLoadingMore, hasMore } =
  storeToRefs(commentStore);

const quoteText = ref("");

// 滚动加载相关
const commentListRef = ref<HTMLElement | null>(null);
const isLoadingScroll = ref(false);

const commentInfoConfig = computed(() => {
  const config = siteConfigStore.getSiteConfig.comment;
  return {
    blogger_email: config.blogger_email,
    master_tag: config.master_tag,
    page_size: config.page_size,
    placeholder: config.placeholder,
    show_region: config.show_region,
    show_ua: config.show_ua,
    gravatar_url: siteConfigStore.getSiteConfig.GRAVATAR_URL,
    default_gravatar_type: siteConfigStore.getSiteConfig.DEFAULT_GRAVATAR_TYPE
  };
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

onMounted(() => {
  const pageSize = commentInfoConfig.value.page_size || 10;
  commentStore.initComments(props.targetPath, pageSize);

  // 添加滚动监听器
  setupScrollListener();

  // 处理初始哈希值
  handleHashChange(route.hash);
});

onUnmounted(() => {
  // 清理滚动监听器
  removeScrollListener();
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
  <div id="post-comment">
    <div class="main-comment-form-container">
      <h3 class="form-title">
        <i class="anzhiyufont anzhiyu-icon-comments" />
        评论
        <span v-if="!isLoading && totalComments > 0">
          {{ `(${totalComments})` }}
        </span>
      </h3>
      <CommentForm
        :target-path="props.targetPath"
        :placeholder="commentInfoConfig.placeholder"
        :quote-text="quoteText"
        @submitted="handleCommentSubmitted"
        @cancel-quote="handleCancelQuote"
      />
    </div>

    <div class="comment-list-container">
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
  .form-title {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    margin-bottom: 1.5rem;
    font-size: 1.5rem;
    font-weight: 600;

    i {
      font-size: 1.5rem;
    }
  }
}

.comment-list-container {
  width: 100%;
  margin-top: 3rem;
  overflow: hidden;

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
    @keyframes spin {
      from {
        transform: rotate(0deg);
      }

      to {
        transform: rotate(360deg);
      }
    }

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
</style>
