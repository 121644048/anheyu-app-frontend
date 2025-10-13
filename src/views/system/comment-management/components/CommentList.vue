<script setup lang="ts">
import { ref } from "vue";
import type { AdminComment } from "@/api/comment/type";
import {
  ElCheckboxGroup,
  ElCheckbox,
  ElTag,
  ElButton,
  ElTooltip,
  ElLink,
  ElDropdown,
  ElDropdownMenu,
  ElDropdownItem
} from "element-plus";
import dayjs from "dayjs";
import md5 from "blueimp-md5";
import { useSiteConfigStore } from "@/store/modules/siteConfig";
import { IconifyIconOffline } from "@/components/ReIcon";
import StarFillIcon from "@iconify-icons/ri/star-fill";
import StarIcon from "@iconify-icons/ri/star-line";
import EditIcon from "@iconify-icons/ri/edit-line";
import ReplyIcon from "@iconify-icons/ri/chat-1-line";
import DeleteIcon from "@iconify-icons/ri/delete-bin-line";
import MapPinIcon from "@iconify-icons/ri/map-pin-2-line";
import ThumbUpIcon from "@iconify-icons/ri/thumb-up-line";
import ArrowDownIcon from "@iconify-icons/ri/arrow-down-s-line";

const siteConfigStore = useSiteConfigStore();

defineProps<{
  comments: AdminComment[];
  loading: boolean;
}>();

const emit = defineEmits<{
  (e: "selectionChange", ids: string[]): void;
  (e: "update:pin", comment: AdminComment, pinned: boolean): void;
  (e: "update:status", comment: AdminComment, status: number): void;
  (e: "delete", id: string): void;
  (e: "edit", comment: AdminComment): void;
  (e: "reply", comment: AdminComment): void;
}>();

const selectedComments = ref<string[]>([]);

const handleSelectionChange = (value: string[]) => {
  emit("selectionChange", value);
};

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "N/A";
  return dayjs(dateStr).format("YYYY-MM-DD HH:mm:ss");
};

const handleCardClick = (commentId: string, event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (target.closest(".el-button, .el-link, .el-dropdown, .el-checkbox")) {
    return;
  }
  const index = selectedComments.value.indexOf(commentId);
  if (index === -1) {
    selectedComments.value.push(commentId);
  } else {
    selectedComments.value.splice(index, 1);
  }
  handleSelectionChange(selectedComments.value);
};

const getGravatarUrl = (emailMD5: string) => {
  const config = siteConfigStore.getSiteConfig;
  let baseUrl = config.GRAVATAR_URL + "/avatar";
  const defaultType = config.DEFAULT_GRAVATAR_TYPE || "identicon";
  baseUrl = baseUrl.replace(/\/+$/, "");
  return `${baseUrl}/${emailMD5 || ""}?d=${defaultType}&s=80`;
};

const getAvatarSrc = (comment: AdminComment) => {
  if (!comment.nickname || !comment.email_md5) {
    return getGravatarUrl(comment.email_md5);
  }
  const isQQ = /^[1-9]\d{4,10}$/.test(comment.nickname.trim());
  if (isQQ) {
    const qqEmailMd5 = md5(`${comment.nickname.trim()}@qq.com`).toLowerCase();
    if (comment.email_md5.toLowerCase() === qqEmailMd5) {
      return `https://thirdqq.qlogo.cn/g?b=sdk&nk=${comment.nickname.trim()}&s=80`;
    }
  }
  return getGravatarUrl(comment.email_md5);
};

const handleAvatarError = (event: Event, comment: AdminComment) => {
  const target = event.target as HTMLImageElement;
  const gravatarUrl = getGravatarUrl(comment.email_md5);
  if (target.src !== gravatarUrl) {
    target.src = gravatarUrl;
  }
};
</script>

<template>
  <div v-loading="loading" class="comment-list-container">
    <el-checkbox-group
      v-model="selectedComments"
      @change="handleSelectionChange"
    >
      <div
        v-for="comment in comments"
        :key="comment.id"
        class="comment-card"
        :class="{ 'is-pinned': !!comment.pinned_at }"
        @click="handleCardClick(comment.id, $event)"
      >
        <el-checkbox :label="comment.id" :value="comment.id" size="large" />
        <img
          :src="getAvatarSrc(comment)"
          alt="avatar"
          class="comment-avatar"
          @error="handleAvatarError($event, comment)"
        />
        <div class="comment-main">
          <div class="comment-header">
            <div class="author-line">
              <span class="nickname">{{ comment.nickname }}</span>
              <el-tag
                v-if="comment.is_admin_comment"
                type="danger"
                size="small"
                effect="dark"
                >博主</el-tag
              >
              <span v-if="comment.reply_to_nick" class="reply-info">
                回复 @{{ comment.reply_to_nick }}
              </span>
            </div>
            <div class="actions">
              <el-tooltip
                :content="comment.pinned_at ? '取消置顶' : '置顶评论'"
                placement="top"
                :show-arrow="false"
              >
                <el-button
                  :type="comment.pinned_at ? 'primary' : ''"
                  circle
                  @click="emit('update:pin', comment, !comment.pinned_at)"
                >
                  <IconifyIconOffline
                    :icon="comment.pinned_at ? StarFillIcon : StarIcon"
                  />
                </el-button>
              </el-tooltip>
              <el-tooltip content="编辑" placement="top" :show-arrow="false">
                <el-button type="warning" circle @click="emit('edit', comment)">
                  <IconifyIconOffline :icon="EditIcon" />
                </el-button>
              </el-tooltip>
              <el-tooltip content="回复" placement="top" :show-arrow="false">
                <el-button
                  type="primary"
                  circle
                  @click="emit('reply', comment)"
                >
                  <IconifyIconOffline :icon="ReplyIcon" />
                </el-button>
              </el-tooltip>
              <el-tooltip content="删除" placement="top" :show-arrow="false">
                <el-button
                  type="danger"
                  circle
                  @click="emit('delete', comment.id)"
                >
                  <IconifyIconOffline :icon="DeleteIcon" />
                </el-button>
              </el-tooltip>
            </div>
          </div>
          <div class="comment-content" v-html="comment.content_html" />
          <div class="comment-footer">
            <div class="meta-info">
              <el-tooltip placement="top" :show-arrow="false">
                <template #content>
                  发布于: {{ formatDate(comment.created_at) }}
                  <template v-if="comment.pinned_at">
                    <br />
                    置顶于: {{ formatDate(comment.pinned_at) }}
                  </template>
                </template>
                <span class="meta-item time">{{
                  formatDate(comment.created_at)
                }}</span>
              </el-tooltip>
              <span class="meta-item article-slug">
                在
                <el-link
                  type="primary"
                  :href="comment.target_path"
                  target="_blank"
                  :underline="false"
                  >{{ comment.target_title || comment.target_path }}</el-link
                >
                中
              </span>
              <span class="meta-item">
                <IconifyIconOffline :icon="MapPinIcon" />
                {{ comment.ip_location }} ({{ comment.ip_address }})
              </span>
              <span class="meta-item">
                <IconifyIconOffline :icon="ThumbUpIcon" />
                {{ comment.like_count }} 点赞
              </span>
            </div>
            <div class="status-control">
              <el-dropdown
                @command="status => emit('update:status', comment, status)"
              >
                <el-tag
                  :type="comment.status === 1 ? 'success' : 'warning'"
                  style="cursor: pointer"
                  effect="dark"
                >
                  <div class="flex items-center justify-center">
                    {{ comment.status === 1 ? "已发布" : "待审核" }}
                    <IconifyIconOffline
                      :icon="ArrowDownIcon"
                      class="el-icon--right"
                    />
                  </div>
                </el-tag>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item :command="1">设为已发布</el-dropdown-item>
                    <el-dropdown-item :command="2">设为待审核</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
        </div>
      </div>
    </el-checkbox-group>
  </div>
</template>

<style lang="scss" scoped>
.comment-card {
  display: flex;
  padding: 16px;
  margin-bottom: 16px;
  cursor: pointer;
  background-color: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  transition: box-shadow 0.3s;
}

.comment-avatar {
  width: 45px;
  height: 45px;
  margin: 0 16px;
  object-fit: cover;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 50%;
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
  margin-bottom: 8px;
}

.author-line {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 14px;

  .nickname {
    font-weight: bold;
    color: var(--el-text-color-primary);
  }

  .reply-info {
    color: var(--el-text-color-secondary);
  }
}

.actions {
  display: flex;
  gap: 8px;
}

.comment-content {
  font-size: 14px;
  line-height: 1.6;
  color: var(--el-text-color-regular);

  :deep(p) {
    margin: 0 0 8px;
  }

  :deep(a) {
    color: var(--el-color-primary);
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  :deep(img) {
    max-width: 300%;
    max-height: 300px;
    vertical-align: middle;
    border-radius: 4px;

    &:not(.anzhiyu-owo-emotion) {
      cursor: zoom-in;
    }
  }

  :deep(.tanzhiyu-owo-emotion) {
    width: 3rem;
    height: auto;
  }
}

.comment-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.meta-info {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
}

.meta-item {
  display: flex;
  gap: 4px;
  align-items: center;

  &.article-slug .el-link {
    font-size: 12px;
  }
}
</style>
