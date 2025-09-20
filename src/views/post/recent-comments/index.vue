<template>
  <div class="recent-comments-page">
    <AnBannerCard
      :tips="recentCommentsConfig?.banner?.title"
      :title="recentCommentsConfig?.banner?.description"
      :description="recentCommentsConfig?.banner?.tip"
      :background-image="recentCommentsConfig?.banner?.background"
      :height="300"
    />

    <div class="comments-page">
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner" />
        <span>正在加载评论...</span>
      </div>

      <div v-else-if="!comments.length" class="empty-state">
        <i class="anzhiyufont anzhiyu-icon-comments" />
        <span>暂无评论</span>
      </div>

      <template v-else>
        <div
          v-for="comment in comments"
          :key="comment.id"
          class="comment-card"
          :title="comment.content_html"
          @click="handleCommentClick(comment)"
        >
          <div class="comment-info">
            <img
              :src="`https://weavatar.com/avatar/${comment.email_md5}?d=https%3A%2F%2Fbu.dusays.com%2F2024%2F04%2F18%2F66209793d5145.png`"
              :alt="`${comment.nickname}的头像`"
            />
            <div>
              <span class="comment-user">{{ comment.nickname }}</span>
            </div>
            <span class="comment-time">{{
              formatTime(comment.created_at)
            }}</span>
          </div>
          <div class="comment-content" v-html="comment.content_html" />
          <div class="comment-title">
            <i class="anzhiyufont anzhiyu-icon-comments" />
            {{ comment.target_title || "未知文章" }}
          </div>
        </div>
      </template>

      <div v-if="hasMore && !loading" class="load-more">
        <button class="load-more-btn" @click="loadMore">加载更多评论</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import AnBannerCard from "@/components/AnBannerCard";
import { useSiteConfigStore } from "@/store/modules/siteConfig";
import { computed, ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { getLatestPublicComments } from "@/api/comment";
import type { Comment } from "@/api/comment/type";

defineOptions({
  name: "RecentComments"
});

const route = useRoute();
const router = useRouter();
const siteConfigStore = useSiteConfigStore();

const recentCommentsConfig = computed(
  () => siteConfigStore.getSiteConfig?.recent_comments
);

// 评论数据相关状态
const comments = ref<Comment[]>([]);
const loading = ref(false);
const currentPage = ref(1);
const pageSize = ref(12);
const hasMore = ref(true);

// 获取最近评论数据
const fetchComments = async (page: number = 1, append: boolean = false) => {
  try {
    loading.value = true;
    const response = await getLatestPublicComments({
      page,
      pageSize: pageSize.value
    });

    if (response.code === 200 && response.data) {
      const { list, total } = response.data;

      if (append) {
        comments.value.push(...list);
      } else {
        comments.value = list;
      }

      // 判断是否还有更多数据
      hasMore.value = comments.value.length < total;
      currentPage.value = page;
    }
  } catch (error) {
    console.error("获取最近评论失败:", error);
  } finally {
    loading.value = false;
  }
};

// 加载更多评论
const loadMore = () => {
  if (!loading.value && hasMore.value) {
    fetchComments(currentPage.value + 1, true);
  }
};

// 处理评论点击
const handleCommentClick = (comment: Comment) => {
  // 跳转到对应的文章页面
  if (!comment || !comment.target_path) return;
  router.push({
    path: comment.target_path,
    hash: `#comment-${comment.id}`
  });
};

// 格式化时间
const formatTime = (timeStr: string) => {
  try {
    const date = new Date(timeStr);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "今天";
    } else if (diffDays === 1) {
      return "昨天";
    } else if (diffDays < 7) {
      return `${diffDays}天前`;
    } else {
      return `${date.getMonth() + 1}/${date.getDate()}`;
    }
  } catch {
    return "未知时间";
  }
};

// 组件挂载时获取数据
onMounted(() => {
  fetchComments();
});
</script>

<style lang="scss" scoped>
.recent-comments-page {
  max-width: 1400px;
  padding: 0 1.5rem 1.5rem;
  margin: 0 auto;
  .comment-content :deep(.anzhiyu-owo-emotion) {
    width: 3rem;
    height: auto;
    max-width: 100%;
    max-height: 300px;
    vertical-align: middle;
    border-radius: 4px;
  }
}

.comments-page {
  width: 100%;
  margin-top: 16px;
  min-height: 100px;
  column-count: 3;
  column-gap: 12px;

  .loading-state,
  .empty-state,
  .load-more {
    column-span: all;
  }

  .loading-state {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    color: var(--anzhiyu-secondtext);

    .loading-spinner {
      width: 32px;
      height: 32px;
      border: 3px solid var(--anzhiyu-border);
      border-top: 3px solid var(--anzhiyu-main);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 16px;
    }

    @keyframes spin {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }
  }

  .empty-state {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    color: var(--anzhiyu-secondtext);

    i {
      font-size: 48px;
      margin-bottom: 16px;
      opacity: 0.5;
    }
  }

  .comment-card {
    position: relative;
    width: 100%;
    break-inside: avoid;
    margin-bottom: 12px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    background: var(--anzhiyu-card-bg);
    border-radius: 12px;
    border: var(--style-border-always);
    padding: 14px;
    transition: 0.3s;
    overflow: hidden;
    gap: 8px;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
      border-color: var(--anzhiyu-lighttext);
    }

    .comment-info {
      display: flex;
      align-items: center;
      padding-bottom: 8px;
      width: 100%;
      gap: 8px;
      border-bottom: var(--style-border-always);

      img {
        width: 30px;
        height: 30px;
        object-fit: cover;
        border-radius: 30px;
        margin: 0px !important;
      }

      .comment-user {
        font-weight: 700;
        text-overflow: ellipsis;
        white-space: nowrap;
        overflow: hidden;
      }

      .comment-time {
        font-size: 12px;
        color: var(--anzhiyu-secondtext);
        margin-left: auto;
      }
    }

    .comment-content {
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      line-clamp: 2;
      -webkit-line-clamp: 2;
      line-height: 1.7;
      font-size: 14px;
      transition: 0.3s;
      overflow: hidden;

      :deep(p) {
        margin: 0;
      }

      :deep(img) {
        max-width: 100%;
        height: auto;
        border-radius: 4px;
      }
    }

    .comment-title {
      font-size: 12px;
      color: var(--anzhiyu-secondtext);
      margin-top: auto;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      line-clamp: 1;
      -webkit-line-clamp: 1;
      line-height: 1;
      opacity: 0.6;
      padding-top: 8px;
      transition: 0.3s;
      overflow: hidden;
    }
  }

  .load-more {
    width: 100%;
    display: flex;
    justify-content: center;
    margin-top: 20px;

    .load-more-btn {
      background: var(--anzhiyu-main);
      color: white;
      border: none;
      border-radius: 8px;
      padding: 12px 24px;
      font-size: 14px;
      cursor: pointer;
      transition: 0.3s;

      &:hover {
        background: var(--anzhiyu-main-hover);
        transform: translateY(-1px);
      }

      &:active {
        transform: translateY(0);
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .comments-page {
    column-count: 2;
  }
}

@media (max-width: 480px) {
  .comments-page {
    column-count: 1;
  }
}
</style>
