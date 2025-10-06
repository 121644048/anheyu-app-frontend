<template>
  <div id="console" :class="{ show: isConsoleShow }">
    <div class="console-content">
      <div class="console-card-group">
        <div class="console-card-group-left">
          <div class="card-newest-comments console-card">
            <div class="card-content">
              <div class="author-content-item-tips">互动</div>
              <div class="card-hor-content">
                <span class="author-content-item-title">最近评论</span>
                <a
                  class="go_to_recent_comments !text-[var(--anzhiyu-fontcolor)]"
                  href="/recentcomments"
                  title="最近评论"
                >
                  <i
                    class="anzhiyufont anzhiyu-icon-circle-arrow-right !text-[22px]"
                /></a>
              </div>
            </div>
            <div class="console_recentcomments">
              <template v-if="latestComments && latestComments.length > 0">
                <div
                  v-for="comment in latestComments"
                  :key="comment.id"
                  class="comment-card"
                  @click="goToArticle(comment)"
                >
                  <div class="comment-info">
                    <img
                      :src="getAvatarUrl(comment.email_md5)"
                      alt="最近评论头像"
                    />
                    <div>
                      <span class="comment-user">{{ comment.nickname }}</span>
                    </div>
                    <span class="comment-time">{{
                      formatCommentDate(comment.created_at)
                    }}</span>
                  </div>
                  <div class="comment-content" v-html="comment.content_html" />
                  <div class="comment-title" :title="comment.target_title">
                    <i class="anzhiyufont anzhiyu-icon-comments" />
                    {{ comment.target_title }}
                  </div>
                </div>
              </template>
              <div v-else class="no-comments">暂无评论</div>
            </div>
          </div>
        </div>
        <div class="console-card-group-right">
          <div class="console-card tags">
            <div class="card-content">
              <div class="author-content-item-tips">标签</div>
              <div class="author-content-item-title">寻找感兴趣的领域</div>
            </div>
            <div class="card-tag-cloud">
              <a
                v-for="tag in tags"
                :key="tag.id"
                class="tag-item"
                @click="goToTag(tag.name)"
              >
                {{ tag.name }}
                <sup>{{ tag.count }}</sup>
              </a>
            </div>
          </div>
          <div class="console-card history">
            <ul class="card-archive-list">
              <li
                v-for="archive in displayArchives"
                :key="archive.year"
                class="card-archive-list-item"
                @click="goToArchive(archive.year)"
              >
                <div class="card-archive-list-link">
                  <div class="card-archive-list-date">{{ archive.year }}</div>
                  <div class="card-archive-list-count-group">
                    <div class="card-archive-list-count">
                      {{ archive.count }}
                    </div>
                    <div class="card-archive-list-count-unit">篇</div>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div class="button-group">
        <el-tooltip
          content="显示模式切换"
          placement="top"
          :show-arrow="false"
          :offset="12"
          popper-class="custom-tooltip"
        >
          <div class="console-btn-item" :class="{ on: dataTheme }">
            <button class="darkmode_switch_button" @click="handleThemeToggle">
              <i class="anzhiyufont anzhiyu-icon-moon" />
            </button>
          </div>
        </el-tooltip>

        <el-tooltip
          content="热评开关"
          placement="top"
          :show-arrow="false"
          :offset="12"
          popper-class="custom-tooltip"
        >
          <div
            class="console-btn-item"
            :class="{ on: isCommentBarrageVisible }"
          >
            <button class="commentBarrage" @click="toggleCommentBarrage()">
              <IconifyIconOffline icon="ri:chat-1-fill" class="w-6 h-6" />
            </button>
          </div>
        </el-tooltip>

        <el-tooltip
          content="快捷键开关"
          placement="top"
          :show-arrow="false"
          :offset="12"
          popper-class="custom-tooltip"
        >
          <div
            id="consoleKeyboard"
            class="console-btn-item"
            :class="{ on: isShortcutsEnabled }"
          >
            <button class="keyboard-switch" @click="toggleShortcuts()">
              <i class="anzhiyufont anzhiyu-icon-keyboard" />
            </button>
          </div>
        </el-tooltip>

        <el-tooltip
          v-if="siteConfig?.music?.player?.enable"
          content="音乐胶囊开关"
          placement="top"
          :show-arrow="false"
          :offset="12"
          popper-class="custom-tooltip"
        >
          <div class="console-btn-item" :class="{ on: isMusicPlayerVisible }">
            <button class="music-player-switch" @click="toggleMusicPlayer()">
              <i class="anzhiyufont anzhiyu-icon-music" />
            </button>
          </div>
        </el-tooltip>

        <el-tooltip
          content="侧边栏开关"
          placement="top"
          :show-arrow="false"
          :offset="12"
          popper-class="custom-tooltip"
        >
          <div class="console-btn-item" :class="{ on: isSidebarVisible }">
            <button class="sidebar-switch" @click="toggleSidebar()">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="28"
                viewBox="0 0 24 24"
              >
                <g fill="currentColor">
                  <path d="M17 22h2a4 4 0 0 0 4-4V6a4 4 0 0 0-4-4h-2z" />
                  <path
                    fill-rule="evenodd"
                    d="M15 2H5a4 4 0 0 0-4 4v12a4 4 0 0 0 4 4h10zm-6.707 8.707a1 1 0 0 1 1.414-1.414l2 2a1 1 0 0 1 0 1.414l-2 2a1 1 0 0 1-1.414-1.414L9.586 12z"
                    clip-rule="evenodd"
                  />
                </g>
              </svg>
            </button>
          </div>
        </el-tooltip>
      </div>
    </div>
    <div class="console-mask" @click="appStore.toggleConsole(false)" />
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { storeToRefs } from "pinia";
import { useAppStore } from "@/store/modules/app";
import { useArticleStore } from "@/store/modules/articleStore";
import { useSiteConfigStore } from "@/store/modules/siteConfig";
import { useCommentStore } from "@/store/modules/commentStore";
import type { Comment } from "@/api/comment/type";
import { useDataThemeChange } from "@/layout/hooks/useDataThemeChange";
import { useUiStore } from "@/store/modules/uiStore";
import IconifyIconOffline from "@/components/ReIcon/src/iconifyIconOffline";

const { dataTheme, dataThemeChange } = useDataThemeChange();

const appStore = useAppStore();
const articleStore = useArticleStore();
const commentStore = useCommentStore();
const router = useRouter();
const uiStore = useUiStore();

const {
  isCommentBarrageVisible,
  isShortcutsEnabled,
  isMusicPlayerVisible,
  isSidebarVisible
} = storeToRefs(uiStore);
const {
  toggleCommentBarrage,
  toggleShortcuts,
  toggleMusicPlayer,
  toggleSidebar
} = uiStore;

const siteConfigStore = useSiteConfigStore();
const siteConfig = computed(() => siteConfigStore.getSiteConfig);

const { tags, archives } = storeToRefs(articleStore);
const { latestComments } = storeToRefs(commentStore);
const totalPostCount = computed(
  () => siteConfig.value?.sidebar?.siteinfo?.totalPostCount
);

const isConsoleShow = computed(() => appStore.isConsoleOpen);

const handleThemeToggle = () => {
  const newTheme = dataTheme.value ? "light" : "dark";
  dataThemeChange(newTheme);
};

const commentInfoConfig = computed(() => {
  return {
    gravatar_url: siteConfigStore.getSiteConfig.GRAVATAR_URL,
    default_gravatar_type: siteConfigStore.getSiteConfig.DEFAULT_GRAVATAR_TYPE
  };
});

const getAvatarUrl = (emailMd5: string) => {
  const url = new URL(commentInfoConfig.value.gravatar_url);
  url.pathname += `avatar/${emailMd5}`;
  url.searchParams.set("d", commentInfoConfig.value.default_gravatar_type);
  url.searchParams.set("s", "140");
  return url.toString();
};

const formatCommentDate = (dateString: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return `${date.getMonth() + 1}/${date.getDate()}`;
};

const goToArticle = (comment: Comment) => {
  if (!comment || !comment.target_path) return;
  router.push({
    path: comment.target_path,
    hash: `#comment-${comment.id}`
  });
  appStore.toggleConsole(false);
};

const goToTag = (tagName: string) => {
  router.push({ path: `/tags/${tagName}/` });
  appStore.toggleConsole(false);
};

const goToArchive = (year: string) => {
  const path = year === "全部文章" ? "/archives" : `/archives/${year}/`;
  router.push({ path });
  appStore.toggleConsole(false);
};

const archivesByYear = computed(() => {
  if (!archives.value || archives.value.length === 0) return [];

  const yearMap = new Map<number, number>();
  archives.value.forEach(item => {
    const year = item.year;
    const currentCount = yearMap.get(year) || 0;
    yearMap.set(year, currentCount + item.count);
  });

  return Array.from(yearMap, ([year, count]) => ({
    year: String(year),
    count
  }));
});

const displayArchives = computed(() => {
  const yearArchives = archivesByYear.value.slice(0, 7);
  if (totalPostCount.value > 0) {
    yearArchives.push({
      year: "全部文章",
      count: totalPostCount.value
    });
  }
  return yearArchives;
});

onMounted(() => {
  articleStore.fetchTags();
  articleStore.fetchArchives();
  commentStore.fetchLatestComments(6);
});
</script>

<style scoped lang="scss">
#console {
  display: flex;
  position: fixed;
  width: 100vw;
  height: 100dvh;
  top: 0;
  left: 0;
  z-index: 9999;
  justify-content: center;
  opacity: 0;
  transition: 0.3s ease-out;
  flex-direction: column;
  align-items: center;
  pointer-events: none;
  user-select: none;
  -webkit-user-select: none;
  &.show {
    opacity: 1;
    pointer-events: all;
    .button-group {
      transform: translateY(0);
      opacity: 1;
      transition-delay: 0.2s;
    }

    .console-mask {
      backdrop-filter: saturate(180%) blur(20px);
      -webkit-backdrop-filter: blur(20px);
      transform: translateZ(0);
      animation: 0.6s ease 0s 1 normal none running to_show;
    }
    .console-content > * {
      pointer-events: auto;
    }
    .console-card-group {
      transform: translateY(0);
      opacity: 1;
      transition-delay: 0.1s;
    }
  }
  .console-card-group-left {
    width: 40%;
    height: 100%;
    max-width: 550px;
    min-width: 300px;
    .card-newest-comments {
      height: 100%;
    }
  }
  .console-card {
    background: var(--anzhiyu-maskbg);
    border-radius: 12px;
    overflow: hidden;
    border: var(--style-border);
    box-shadow: var(--anzhiyu-shadow-border);
    padding: 32px 36px 36px 36px;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
  .author-content-item-tips {
    opacity: 0.8;
    font-size: 0.75rem;
    margin-bottom: 0.625rem;
  }
  .card-hor-content {
    width: 100%;
    display: flex;
    align-items: center;
  }
  .console_recentcomments {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    flex: 1;
    overflow-y: scroll;
    align-content: flex-start;
    flex-shrink: 0;
    &::-webkit-scrollbar {
      display: none;
    }
    .comment-card {
      position: relative;
      background: var(--anzhiyu-card-bg);
      border-radius: 12px;
      border: var(--style-border-always);
      padding: 14px;
      cursor: pointer;
      transition: 0.3s;
      overflow: hidden;
      gap: 8px;
      display: flex;
      flex-direction: column;
      width: calc(100% / 2 - 4px);
      flex-shrink: 0;
      justify-content: space-between;
      .comment-content :deep(.anzhiyu-owo-emotion) {
        width: 3rem;
        height: auto;
        max-width: 100%;
        max-height: 300px;
        vertical-align: middle;
        border-radius: 4px;
      }
      &:hover {
        border-color: var(--anzhiyu-lighttext);
      }
    }
    .comment-info {
      display: flex;
      align-items: end;
      align-items: center;
      gap: 8px;
      border-bottom: var(--style-border-always);
      padding-bottom: 8px;
      width: 100%;
      flex-shrink: 0;
      min-height: 40px;
      img {
        width: 24px;
        height: 24px;
        object-fit: cover;
        border-radius: 30px;
        margin: 0;
      }
      div {
        display: flex;
        flex-direction: column;
        line-height: 1.5;
      }
      .comment-user {
        font-weight: 700;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      span.comment-time {
        font-size: 12px;
        color: var(--anzhiyu-secondtext);
        margin-left: auto;
      }
    }
    .comment-content {
      transition: 0.3s;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      line-clamp: 2;
      -webkit-line-clamp: 2;
      line-height: 1.7;
      font-size: 14px;
      flex-shrink: 0;
      min-height: 48px;
      :deep(p) {
        margin: 0;
      }
    }
    .comment-title {
      font-size: 12px;
      color: var(--anzhiyu-secondtext);
      margin-top: auto;
      transition: 0.3s;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      line-clamp: 1;
      -webkit-line-clamp: 1;
      line-height: 1;
      opacity: 0.6;
      padding-top: 8px;
      flex-shrink: 0;
      min-height: 20px;
    }
  }
  .go_to_recent_comments {
    margin-left: auto;
  }
  .author-content-item-title {
    font-size: 28px;
    font-weight: 700;
    line-height: 1;
    display: flex;
  }

  .console-card-group-right {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
    width: 60%;
    overflow: hidden;
    max-width: 900px;
    min-width: 500px;
  }

  .console-content {
    display: flex;
    position: fixed;
    flex-direction: column;
    max-height: 800px;
    max-width: 1400px;
    left: 50%;
    width: 100dvw;
    align-items: center;
    justify-content: center;
    padding-top: 30px;
    gap: 16px;
    transform: translateX(-50%);
    color: var(--anzhiyu-fontcolor);
    pointer-events: none;
  }
  .console-mask {
    background: var(--anzhiyu-maskbgdeep);
    backdrop-filter: saturate(180%) blur(20px);
    -webkit-backdrop-filter: blur(20px);
    width: 100vw;
    height: 100dvh;
    top: 0;
    left: 0;
    position: absolute;
    z-index: -1;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    transform-style: preserve-3d;
    -webkit-transform-style: preserve-3d;
    transform: translateZ(0);
  }
  .console-card-group {
    display: flex;
    justify-content: center;
    align-items: center;
    transform: translateY(20px);
    transition: 0.3s;
    opacity: 0;
    gap: 0.5rem;
    max-height: calc(100dvh - 180px);
    max-width: calc(100% - 64px);
    height: 800px;
    width: 100%;
  }

  .console-card.tags {
    flex: 1;
    min-height: 0;
    .card-tag-cloud {
      display: flex;
      flex-wrap: wrap;
      overflow-y: scroll;
      gap: 6px;
      min-height: 0;
      &::-webkit-scrollbar {
        width: 8px;
      }
      &::-webkit-scrollbar-track {
        background-color: transparent;
      }
      &::-webkit-scrollbar-thumb {
        background-color: var(--anzhiyu-main-op);
      }
      a {
        color: var(--anzhiyu-fontcolor);
        padding: 2px 8px;
        border-radius: 8px;
        background: var(--anzhiyu-card-bg);
        border: var(--style-border);
        font-size: 14px;
        font-weight: 700;
        &:hover {
          background: var(--anzhiyu-lighttext);
          color: var(--anzhiyu-card-bg) !important;
          box-shadow: var(--anzhiyu-shadow-main);
        }
        sup {
          opacity: 0.6;
          top: -0.4rem;
          font-size: 75%;
          line-height: 0;
          position: relative;
          vertical-align: baseline;
        }
      }
    }
  }

  .console-card.history {
    margin-top: 8px;
    padding: 0;
    background: 0 0;
    box-shadow: none;
    border: none;
    overflow: hidden;
    border-radius: 0;
    flex-shrink: 0;
    .card-archive-list {
      display: flex;
      flex-direction: row;
      justify-content: flex-start;
      flex-wrap: wrap;
      gap: 8px;
      li.card-archive-list-item {
        flex: 0 0 calc(25% - 6px);
        cursor: pointer;
        transition: 0.3s;
        border-radius: 12px;
        height: 82px;

        &:hover .card-archive-list-link {
          background: var(--anzhiyu-main);
          color: var(--anzhiyu-card-bg);
        }
      }
      .card-archive-list-link {
        border-radius: 8px;
        display: flex;
        flex-direction: column;
        border: var(--style-border);
        background: var(--anzhiyu-maskbgdeep);
        padding: 12px 16px;
        box-shadow: var(--anzhiyu-shadow-border);
        transition: 0.3s;
        justify-content: center;
        height: 100%;
      }
    }
    .card-archive-list-date {
      font-size: 14px;
      opacity: 0.6;
    }
    .card-archive-list-count-group {
      display: flex;
      flex-direction: row;
      align-items: baseline;
      gap: 4px;
    }
    .card-archive-list-count {
      width: auto;
      text-align: left;
      font-size: 1.1rem;
      line-height: 0.9;
      font-weight: 700;
    }
    .card-archive-list-count-unit {
      width: auto;
      text-align: left;
      font-size: 14px;
      font-weight: 700;
    }
    .card-archive-list-item {
      width: 100%;
    }
  }
  .button-group {
    display: flex;
    justify-content: center;
    width: fit-content;
    transform: translateY(20px);
    transition: 0.3s;
    opacity: 0;
    .console-btn-item:not(:last-child) {
      margin-right: 0.5rem;
    }
    .console-btn-item button {
      width: 100%;
      height: 100%;
      background: var(--anzhiyu-card-bg);
      border: var(--style-border);
      border-radius: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--anzhiyu-fontcolor);
      transition: 0.3s;
      box-shadow: var(--anzhiyu-shadow-border);
      &:hover {
        background: var(--anzhiyu-main);
        color: var(--anzhiyu-white);
      }
    }
    .console-btn-item {
      width: 60px;
      height: 60px;
      transition: 0.3s;
      cursor: pointer;
      &.on button {
        background: var(--anzhiyu-orange);
        color: var(--anzhiyu-white);
        transition: 0.3s;
        &:hover {
          filter: brightness(1.2);
        }
      }
    }
  }
}

@media (max-width: 1024px) {
  #console {
    .console-card-group-right {
      display: flex;
      flex-direction: column;
      justify-content: center;
      height: 100%;
      width: 100%;
      overflow: hidden;
      max-width: 900px;
    }
    .console-card-group {
      width: 100%;
    }

    .console-card-group-left {
      display: none;
    }
    .console-card.history .card-archive-list li.card-archive-list-item {
      flex: 0 0 calc(50% - 4px);
      height: 82px;
    }
  }
}

@media (max-width: 768px) {
  #console {
    .console-card {
      padding: 24px;
    }
    .author-content-item-title {
      font-size: 24px;
    }
    .console-card.history .card-archive-list li.card-archive-list-item {
      flex: 0 0 100%;
      height: 82px;
    }
  }
}
</style>
