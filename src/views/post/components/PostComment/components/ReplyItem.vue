<script setup lang="ts">
import { computed, ref } from "vue";
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

const props = defineProps({
  comment: { type: Object as () => Comment, required: true },
  config: { type: Object, required: true }
});

const emit = defineEmits(["comment-submitted"]);

const commentStore = useCommentStore();

const contentWithFancybox = computed(() => {
  const content = props.comment.content_html;
  if (!content) return "";

  const imgTagRegex =
    /<img(?![^>]*class="[^"]*anzhiyu-owo-emotion[^"]*")[^>]+>/g;

  return content.replace(imgTagRegex, imgTag => {
    const srcMatch = /src=(["'])(.*?)\1/.exec(imgTag);
    const altMatch = /alt=(["'])(.*?)\1/.exec(imgTag);

    if (!srcMatch) {
      return imgTag;
    }

    const src = srcMatch[2];
    const caption = altMatch ? altMatch[2] : "";
    const galleryName = `gallery-comment-${props.comment.parent_id || props.comment.id}`;

    return `<a href="${src}" data-fancybox="${galleryName}" data-caption="${caption}">${imgTag}</a>`;
  });
});

const isLiked = computed(() =>
  commentStore.likedCommentIds.has(props.comment.id)
);
const handleLike = () => {
  commentStore.toggleLikeComment(props.comment.id);
};

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

const scrollToParent = () => {
  if (!props.comment.parent_id) return;
  const parentElement = document.querySelector(
    `#comment-${props.comment.parent_id}`
  );
  if (parentElement) {
    parentElement.scrollIntoView({ behavior: "smooth", block: "center" });
    parentElement.classList.add("comment--highlight");
    setTimeout(() => {
      parentElement.classList.remove("comment--highlight");
    }, 2000);
  }
};
</script>

<template>
  <div :id="`comment-${comment.id}`" class="reply-item-container">
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
            <a href="#" class="nickname" @click.prevent="scrollToParent">{{
              comment.nickname
            }}</a>
            <span v-if="isBlogger" class="master-tag">{{
              config.master_tag
            }}</span>
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

        <div v-if="comment.reply_to_nick" class="reply-to-block">
          回复
          <a href="#" @click.prevent="scrollToParent">{{
            "@" + comment.reply_to_nick
          }}</a>
          :
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
  </div>
</template>

<style lang="scss" scoped>
@media (width <= 768px) {
  .reply-form-wrapper {
    margin-left: 0;
  }
}

.comment-item {
  display: flex;
  gap: 1rem;
}

.comment-avatar {
  width: 32px;
  height: 32px;
  border: 1px solid #eee;
  border-radius: 50%;
  transition: transform 0.3s;

  &:hover {
    transform: scale(1.1) rotate(10deg);
  }
}

.comment-main {
  display: flex;
  flex: 1;
  flex-direction: column;
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
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--anzhiyu-fontcolor);
  text-decoration: none;

  &:hover {
    color: var(--el-color-primary);
  }
}

.master-tag {
  padding: 2px 6px;
  font-size: 0.7rem;
  font-weight: bold;
  color: #fff;
  background-color: var(--el-color-primary);
  border-radius: 4px;
}

.timestamp {
  font-size: 0.8rem;
  color: var(--anzhiyu-fontcolor);
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

.reply-to-block {
  margin-bottom: 0.5rem;
  font-size: 0.75rem;
  color: var(--anzhiyu-secondtext);

  a {
    padding: 0 0.2em;
    font-weight: 500;
    text-decoration: none;

    &:hover {
      color: var(--anzhiyu-white);
      background-color: var(--anzhiyu-theme);
      border-radius: 4px;
    }
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
    margin: 0;
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

.reply-form-wrapper {
  margin-top: 1rem;
  margin-left: 48px;
}
</style>
