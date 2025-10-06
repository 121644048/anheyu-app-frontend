<script setup lang="ts">
import { computed, ref, onMounted, nextTick } from "vue";
import { useCommentStore } from "@/store/modules/commentStore";
import type { Comment } from "@/api/comment/type";
import { UAParser } from "ua-parser-js";
import md5 from "blueimp-md5";
import IconLike from "../icon/IconLike.vue";
import IconReply from "../icon/IconReply.vue";
import IconLocation from "../icon/IconLocation.vue";
import IconOS from "../icon/IconOS.vue";
import IconBrowser from "../icon/IconBrowser.vue";
import CommentForm from "./CommentForm.vue";
import ReplyItem from "./ReplyItem.vue";

const props = defineProps({
  comment: { type: Object as () => Comment, required: true },
  config: { type: Object, required: true }
});

const emit = defineEmits(["comment-submitted"]);

const commentStore = useCommentStore();

// 子评论分页状态管理
const childrenPage = ref(1); // 从第1页开始
const childrenPageSize = ref(10);

// 计算已经显示的子评论数量
const displayedChildrenCount = computed(() => {
  return props.comment.children?.length || 0;
});

// 计算下一次应该请求的页码和每页大小
const getNextRequestParams = computed(() => {
  const displayed = displayedChildrenCount.value;

  if (displayed === 3) {
    // 第一次点击"加载更多"：需要获取前13条，然后跳过前3条
    // 由于API返回的是按时间排序的数据（从老到新），
    // 这样就能显示从最新数据开始的前13条
    return { page: 1, pageSize: 13, skipFirst: 3 };
  } else if (displayed > 3) {
    // 后续加载更多：每次显示10条新的评论
    // 目标：显示到第 (displayed + 10) 条
    const targetCount = displayed + 10;

    // 由于API返回的是按时间排序的数据（从老到新），
    // 我们需要获取前targetCount条数据，然后跳过前displayed条
    // 这样就能显示从最新数据开始的前targetCount条
    return { page: 1, pageSize: targetCount, skipFirst: displayed };
  }

  // 默认情况（不应该到这里）
  return { page: 1, pageSize: 10, skipFirst: 0 };
});

const contentWithFancybox = computed(() => {
  const content = props.comment.content_html;

  if (!content) {
    return "";
  }

  const imgTagRegex =
    /<img(?![^>]*class="[^"]*anzhiyu-owo-emotion[^"]*")[^>]+>/g;

  let matchFound = false;
  const processedContent = content.replace(imgTagRegex, imgTag => {
    matchFound = true;

    const srcMatch = /src=(["'])(.*?)\1/.exec(imgTag);
    const altMatch = /alt=(["'])(.*?)\1/.exec(imgTag);

    if (!srcMatch) {
      console.warn(
        "   - Image tag found, but could not extract 'src' attribute. Skipping.",
        imgTag
      );
      return imgTag;
    }

    const src = srcMatch[2];
    const caption = altMatch ? altMatch[2] : "";
    const galleryName = `gallery-comment-${props.comment.id}`;

    const replacement = `<a href="${src}" data-fancybox="${galleryName}" data-caption="${caption}">${imgTag}</a>`;
    return replacement;
  });

  return processedContent;
});

const isLiked = computed(() =>
  commentStore.likedCommentIds.has(props.comment.id)
);
const handleLike = () => {
  commentStore.toggleLikeComment(props.comment.id);
};

// 子评论相关计算属性
const isLoadingChildren = computed(() =>
  commentStore.loadingChildrenCommentIds.has(props.comment.id)
);
const hasMoreChildren = computed(
  () => props.comment.total_children > (props.comment.children?.length || 0)
);
const childrenCountText = computed(() => {
  const currentCount = props.comment.children?.length || 0;
  const totalCount = props.comment.total_children;
  const remainingCount = totalCount - currentCount;
  if (remainingCount <= 0) return "已显示全部回复";
  return `展开 ${remainingCount} 条回复`;
});

const isDev = computed(() => {
  return import.meta.env.DEV;
});

const isBlogger = computed(() => !!props.comment.is_admin_comment);

const isReplyFormVisible = computed(
  () => commentStore.activeReplyCommentId === props.comment.id
);

const gravatarSrc = computed(() => {
  const url = new URL(props.config.gravatar_url);
  url.pathname += `avatar/${props.comment.email_md5}`;
  url.searchParams.set("d", props.config.default_gravatar_type);
  url.searchParams.set("s", "140");
  return url.toString();
});

const avatarSrc = computed(() => {
  // 如果是匿名评论，使用匿名头像
  if (props.comment.is_anonymous) {
    const url = new URL(props.config.gravatar_url);
    url.pathname += `avatar/anonymous`;
    url.searchParams.set("d", "mp"); // Mystery Person - 匿名剪影头像
    url.searchParams.set("s", "140");
    url.searchParams.set("f", "y"); // 强制使用默认头像
    return url.toString();
  }

  const isQQ = /^[1-9]\d{4,10}$/.test(props.comment.nickname?.trim() || "");
  const qqEmailMd5 = md5(
    `${props.comment.nickname?.trim()}@qq.com`
  ).toLowerCase();
  if (isQQ && props.comment.email_md5?.toLowerCase() === qqEmailMd5) {
    return `https://thirdqq.qlogo.cn/g?b=sdk&nk=${props.comment.nickname.trim()}&s=140`;
  }
  return gravatarSrc.value;
});

const formattedDate = computed(() => {
  const now = new Date();
  const past = new Date(props.comment.created_at);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);
  const minutes = Math.floor(diffInSeconds / 60);
  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} 天前`;
  if (days < 30) return `${Math.floor(days / 7)} 周前`;
  if (days < 365) return `${Math.floor(days / 30)} 个月前`;
  return `${Math.floor(days / 365)} 年前`;
});

const deviceInfo = computed(() => {
  if (!props.comment.user_agent) return { os: null, browser: null };
  const parser = new UAParser(props.comment.user_agent);
  const result = parser.getResult();
  return {
    os: result.os.name
      ? `${result.os.name} ${result.os.version || ""}`.trim()
      : null,
    browser: result.browser.name
      ? `${result.browser.name} ${result.browser.version || ""}`.trim()
      : null
  };
});

const onAvatarError = (e: Event) => {
  (e.target as HTMLImageElement).src = gravatarSrc.value;
};

const handleReplyClick = () => {
  commentStore.toggleReplyForm(props.comment.id);
};
const handleReplySubmitted = () => {
  commentStore.setActiveReplyCommentId(null);
  emit("comment-submitted");
};
const handleCancelReply = () => {
  commentStore.setActiveReplyCommentId(null);
};

// 加载更多子评论
const handleLoadMoreChildren = async () => {
  const params = getNextRequestParams.value;

  try {
    await commentStore.loadMoreChildren(
      props.comment.id,
      params.page,
      params.pageSize,
      params.skipFirst || 0
    );

    childrenPage.value++;
  } catch (error) {
    console.error("加载更多子评论失败:", error);
  }
};
</script>

<template>
  <div :id="`comment-${comment.id}`" class="comment-item-container">
    <div class="comment-item">
      <a
        v-if="comment.website"
        :href="comment.website"
        target="_blank"
        rel="noopener noreferrer nofollow"
      >
        <img
          :src="avatarSrc"
          alt="avatar"
          class="comment-avatar"
          @error="onAvatarError"
        />
      </a>
      <img
        v-else
        :src="avatarSrc"
        alt="avatar"
        class="comment-avatar"
        @error="onAvatarError"
      />
      <div class="comment-main">
        <div class="comment-header">
          <div class="user-info">
            <span class="nickname">{{ comment.nickname }}</span>
            <span v-if="isBlogger" class="master-tag">{{
              config.master_tag
            }}</span>
            <span v-if="comment.pinned_at" class="pinned-tag"> 置顶 </span>
            <span class="timestamp">{{ formattedDate }}</span>
          </div>
          <div class="comment-actions">
            <button
              class="action-btn"
              :class="{ 'is-liked': isLiked }"
              title="点赞"
              @click="handleLike"
            >
              <IconLike />
              <span v-if="comment.like_count > 0" class="like-count">{{
                comment.like_count
              }}</span>
            </button>
            <el-tooltip
              :content="comment.is_anonymous ? '匿名评论无法回复' : '回复'"
              placement="top"
              :show-arrow="false"
            >
              <button
                class="action-btn"
                :class="{ 'is-disabled': comment.is_anonymous }"
                :disabled="comment.is_anonymous"
                :title="comment.is_anonymous ? '匿名评论无法回复' : '回复'"
                @click="handleReplyClick"
              >
                <IconReply />
              </button>
            </el-tooltip>
          </div>
        </div>
        <div class="comment-content" v-html="contentWithFancybox" />
        <div class="comment-meta">
          <span
            v-if="config.show_region && comment.ip_location"
            class="meta-item"
          >
            <IconLocation /> {{ comment.ip_location }}
          </span>
          <template v-if="config.show_ua">
            <span v-if="deviceInfo.os" class="meta-item"
              ><IconOS /> {{ deviceInfo.os }}</span
            >
            <span v-if="deviceInfo.browser" class="meta-item"
              ><IconBrowser /> {{ deviceInfo.browser }}</span
            >
          </template>
        </div>
      </div>
    </div>
    <div v-if="isReplyFormVisible" class="reply-form-wrapper">
      <CommentForm
        :target-path="comment.target_path"
        :parent-id="comment.id"
        :placeholder="`回复 @${comment.nickname}`"
        show-cancel-button
        @submitted="handleReplySubmitted"
        @cancel="handleCancelReply"
      />
    </div>
    <div
      v-if="comment.children && comment.children.length > 0"
      class="comment-children"
    >
      <ReplyItem
        v-for="child in comment.children"
        :key="child.id"
        :comment="child"
        :config="config"
        @comment-submitted="$emit('comment-submitted')"
      />
    </div>

    <!-- 加载更多子评论按钮 -->
    <div v-if="hasMoreChildren" class="load-more-children-wrapper">
      <button
        class="load-more-children-button"
        :class="{ 'is-loading': isLoadingChildren }"
        :disabled="isLoadingChildren"
        @click="handleLoadMoreChildren"
      >
        <span v-if="!isLoadingChildren">{{ childrenCountText }}</span>
        <span v-else>加载中...</span>
      </button>
    </div>

    <!-- 调试信息 (仅开发环境显示) -->
    <div
      v-if="isDev"
      class="debug-info"
      style="margin-top: 8px; margin-left: 56px; font-size: 12px; color: #999"
    >
      调试: total_children={{ comment.total_children }}, children.length={{
        comment.children?.length || 0
      }}, hasMore={{ hasMoreChildren }}
    </div>
  </div>
</template>

<style lang="scss" scoped>
.comment-item {
  display: flex;
  gap: 1rem;
}

.comment-avatar {
  width: 40px;
  height: 40px;
  border: 1px solid #eee;
  border-radius: 50%;
  transition: transform 0.3s;

  &:hover {
    transform: scale(1.1) rotate(10deg);
  }
}

.comment-main {
  flex: 1;
}

.comment-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.user-info {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
}

.nickname {
  font-weight: 600;
  color: var(--anzhiyu-fontcolor);
}

.timestamp {
  font-size: 0.8rem;
  color: var(--anzhiyu-fontcolor);
}

.master-tag {
  padding: 2px 6px;
  font-size: 0.7rem;
  font-weight: bold;
  color: #fff;
  background-color: var(--el-color-primary);
  border-radius: 4px;
}

.pinned-tag {
  display: flex;
  gap: 0.25rem;
  align-items: center;
  padding: 2px 6px;
  font-size: 0.7rem;
  font-weight: bold;
  color: #fff;
  background-color: #ff6b6b;
  border-radius: 4px;

  i {
    font-size: 0.7rem;
  }
}

.comment-actions {
  display: flex;
  gap: 0.5rem;
  height: 30px;
}

.action-btn {
  display: flex;
  align-items: center;
  padding: 4px;
  color: #8a919f;
  cursor: pointer;
  background: none;
  border: none;
  border-radius: 4px;
  transition:
    color 0.3s,
    background-color 0.3s;

  &:hover {
    color: var(--anzhiyu-fontcolor);
    background-color: #f1f3f4;
  }

  &.is-liked {
    color: var(--el-color-primary);
  }

  &.is-liked:hover {
    background-color: #f1f3f4;
  }

  &.is-disabled {
    color: #d0d0d0;
    cursor: not-allowed;
    opacity: 0.5;

    &:hover {
      color: #d0d0d0;
      background-color: transparent;
    }
  }

  .like-count {
    margin-left: 6px;
    font-size: 0.8rem;
  }
}

:deep(.comment-content) {
  font-size: 0.95rem;
  line-height: 1.6;
  color: var(--anzhiyu-fontcolor);

  a {
    border-bottom: none;
  }

  p {
    margin: 0.5rem 0;
  }

  img {
    max-width: 100%;
    max-height: 300px;
    vertical-align: middle;
    border-radius: 4px;

    &:not(.anzhiyu-owo-emotion) {
      cursor: zoom-in;
    }
  }

  .anzhiyu-owo-emotion {
    width: 3rem;
    height: auto;
  }

  blockquote {
    padding: 0.5rem 0.8rem;
    margin: 1rem 0;
    color: var(--anzhiyu-secondtext);
    background-color: var(--anzhiyu-secondbg);
    border: var(--style-border-always);
    border-radius: 8px;
  }
}

.comment-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
  margin-top: 0.75rem;
  font-size: 0.8rem;
  color: var(--anzhiyu-fontcolor);

  @media screen and (width <= 768px) {
    gap: 0.5rem;
    font-size: 0.75rem;
    margin-top: 0.5rem;
  }
}

.meta-item {
  display: flex;
  gap: 0.3rem;
  align-items: center;

  @media screen and (width <= 768px) {
    gap: 0.25rem;
  }
}

:deep(.meta-item svg) {
  width: 14px;
  height: 14px;

  @media screen and (width <= 768px) {
    width: 12px;
    height: 12px;
  }
}

.comment-children {
  display: flex;
  flex-direction: column;
  padding-top: 1rem;
  margin-top: 1rem;
  margin-left: 56px;

  .reply-item-container {
    padding: 1.25rem;
    border-top: var(--style-border-dashed);
  }
}

.reply-form-wrapper {
  margin-top: 1rem;
  margin-left: 56px;
}

.load-more-children-wrapper {
  margin-top: 1rem;
  margin-left: 56px;
  text-align: center;
}

.load-more-children-button {
  min-width: 120px;
  padding: 0.5rem 1rem;
  font-size: 0.7rem;
  color: var(--anzhiyu-fontcolor);
  text-align: center;
  letter-spacing: 3px;
  cursor: pointer;
  background-color: var(--anzhiyu-card-bg);
  border: var(--style-border);
  border-radius: 50px;
  box-shadow: 0 8px 16px -4px rgb(44 45 48 / 4.7%);
  transition: all 0.3s;

  &:hover:not(:disabled) {
    color: var(--anzhiyu-white);
    background-color: var(--anzhiyu-main);
    border: var(--style-border-none);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  &.is-loading {
    color: var(--anzhiyu-main);
  }
}

@media (width <= 768px) {
  .comment-children,
  .reply-form-wrapper,
  .load-more-children-wrapper {
    margin-left: 0;
  }
}
</style>
