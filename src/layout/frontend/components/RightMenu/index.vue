<template>
  <div v-show="isVisible" id="rightMenu" ref="rightMenuRef" :style="menuStyle">
    <div class="rightMenu-group rightMenu-small">
      <div class="rightMenu-item" @click.stop="goBack">
        <i class="anzhiyufont anzhiyu-icon-arrow-left" />
      </div>
      <div class="rightMenu-item" @click.stop="goForward">
        <i class="anzhiyufont anzhiyu-icon-arrow-right" />
      </div>
      <div class="rightMenu-item" @click.stop="refreshPage">
        <i
          class="anzhiyufont anzhiyu-icon-arrow-rotate-right"
          style="font-size: 0.9rem"
        />
      </div>
      <div class="rightMenu-item" @click.stop="scrollToTop">
        <i class="anzhiyufont anzhiyu-icon-arrow-up" />
      </div>
    </div>

    <div v-if="isTextSelected" class="rightMenu-group rightMenu-line">
      <div class="rightMenu-item" @click.stop="copySelectedText">
        <i class="anzhiyufont anzhiyu-icon-copy" />
        <span>复制选中文本</span>
      </div>
      <div class="rightMenu-item" @click.stop="searchLocal">
        <i class="anzhiyufont anzhiyu-icon-magnifying-glass" />
        <span>站内搜索</span>
      </div>
      <div class="rightMenu-item" @click.stop="searchBaidu">
        <i class="anzhiyufont anzhiyu-icon-magnifying-glass" />
        <span>百度搜索</span>
      </div>
    </div>

    <div v-else class="rightMenu-group rightMenu-line">
      <a class="rightMenu-item menu-link" @click.stop="randomNavigate">
        <i class="anzhiyufont anzhiyu-icon-shuffle" />
        <span>随便逛逛</span>
      </a>
      <a class="rightMenu-item menu-link" @click.stop="gotoCategory">
        <i class="anzhiyufont anzhiyu-icon-cube" />
        <span>博客分类</span>
      </a>
      <a class="rightMenu-item menu-link" @click.stop="gotoTag">
        <i class="anzhiyufont anzhiyu-icon-tags" />
        <span>文章标签</span>
      </a>
    </div>

    <div v-if="isClickOnMusicPlayer" class="rightMenu-group rightMenu-line">
      <div class="rightMenu-item" @click.stop="togglePlayPause">
        <i
          class="anzhiyufont"
          :class="musicIsPlaying ? 'anzhiyu-icon-pause' : 'anzhiyu-icon-play'"
        />
        <span>{{ musicIsPlaying ? "暂停" : "播放" }}</span>
      </div>
      <div class="rightMenu-item" @click.stop="previousSong">
        <i class="anzhiyufont anzhiyu-icon-backward" />
        <span>上一首</span>
      </div>
      <div class="rightMenu-item" @click.stop="nextSong">
        <i class="anzhiyufont anzhiyu-icon-forward" />
        <span>下一首</span>
      </div>
      <div class="rightMenu-item" @click.stop="copySongName">
        <i class="anzhiyufont anzhiyu-icon-copy" />
        <span>复制歌名</span>
      </div>
    </div>

    <div class="rightMenu-group rightMenu-line">
      <div class="rightMenu-item" @click.stop="copyUrl">
        <i class="anzhiyufont anzhiyu-icon-copy" />
        <span> 复制地址 </span>
      </div>

      <div class="rightMenu-item" @click.stop="toggleTheme">
        <i class="anzhiyufont anzhiyu-icon-circle-half-stroke" />
        <span class="menu-darkmode-text">{{
          dataTheme ? "浅色模式" : "深色模式"
        }}</span>
      </div>

      <div
        v-if="hasCommentSection"
        class="rightMenu-item"
        @click.stop="handleToggleCommentBarrage"
      >
        <i class="anzhiyufont anzhiyu-icon-message" />
        <span class="menu-commentBarrage-text">{{
          isCommentBarrageVisible ? "隐藏热评" : "显示热评"
        }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  onMounted,
  onUnmounted,
  reactive,
  computed,
  nextTick,
  watch
} from "vue";
import { useRouter, useRoute } from "vue-router";
import { useArticleStore } from "@/store/modules/articleStore";
import { useCopyToClipboard } from "@pureadmin/utils";
import { useDataThemeChange } from "@/layout/hooks/useDataThemeChange";
import { useSnackbar } from "@/composables/useSnackbar";
import { useUiStore } from "@/store/modules/uiStore";
import { storeToRefs } from "pinia";
import gsap from "gsap";

const rightMenuRef = ref<HTMLElement | null>(null);
const isVisible = ref(false);
const isTextSelected = ref(false);
const position = reactive({ x: 0, y: 0 });
const capturedText = ref("");
const hasCommentSection = ref(false);
const isClickOnMusicPlayer = ref(false);
const transformOrigin = ref("top left");
const musicIsPlaying = ref(false);

const router = useRouter();
const route = useRoute();
const articleStore = useArticleStore();
const { copied, update } = useCopyToClipboard();
const { dataTheme, dataThemeChange } = useDataThemeChange();
const { showSnackbar } = useSnackbar();
const uiStore = useUiStore();

const { isCommentBarrageVisible, useCustomContextMenu } = storeToRefs(uiStore);
const { toggleCommentBarrage } = uiStore;

const menuStyle = computed(() => ({
  top: `${position.y}px`,
  left: `${position.x}px`,
  transformOrigin: transformOrigin.value
}));

const handleToggleCommentBarrage = () => {
  toggleCommentBarrage();
  hideMenu();
};

const handleContextMenu = (event: MouseEvent) => {
  // 如果关闭了本站右键菜单，则直接返回，显示浏览器原生菜单
  if (!useCustomContextMenu.value) {
    return;
  }

  // 仅在桌面端设备生效
  if (window.innerWidth < 768) return;

  event.preventDefault();

  const selection = window.getSelection();
  isTextSelected.value = selection ? !selection.isCollapsed : false;

  // 检查是否右键点击了音乐播放器
  const target = event.target as HTMLElement;
  const musicPlayer = target.closest("#nav-music");
  isClickOnMusicPlayer.value = !!musicPlayer;

  // 如果点击了音乐播放器，请求当前播放状态
  if (isClickOnMusicPlayer.value) {
    window.dispatchEvent(new CustomEvent("music-player-get-play-status"));
  }

  // 修改：在菜单显示时就捕获选中的文本
  if (isTextSelected.value && selection) {
    capturedText.value = selection.toString();
  } else {
    capturedText.value = "";
  }

  // 初始设置菜单位置
  position.x = event.clientX;
  position.y = event.clientY;
  isVisible.value = true;

  nextTick(() => {
    // 调整菜单位置以避免超出窗口边界
    adjustMenuPosition();

    // GSAP 动画
    gsap.fromTo(
      rightMenuRef.value,
      { scale: 0.9, opacity: 0, y: -10 },
      {
        scale: 1,
        opacity: 1,
        y: 0,
        duration: 0.2,
        ease: "power2.out"
      }
    );
  });
};

/**
 * 检查页面是否存在评论区域
 */
const checkCommentSection = () => {
  hasCommentSection.value = !!document.getElementById("post-comment");
};

/**
 * 调整菜单位置以避免超出窗口边界，并计算动画起点
 */
const adjustMenuPosition = () => {
  if (!rightMenuRef.value) return;

  const menu = rightMenuRef.value;
  const menuRect = menu.getBoundingClientRect();
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;

  // 获取菜单的实际尺寸
  const menuWidth = menuRect.width;
  const menuHeight = menuRect.height;

  // 保存原始点击位置
  const initialX = position.x;
  const initialY = position.y;

  // 计算最终位置和动画起点
  let finalX = initialX;
  let finalY = initialY;
  let originX = "left";
  let originY = "top";

  // 水平边界检测和调整
  if (initialX + menuWidth > windowWidth) {
    finalX = initialX - menuWidth;
    originX = "right";
  }

  // 垂直边界检测和调整
  if (initialY + menuHeight > windowHeight) {
    finalY = initialY - menuHeight;
    originY = "bottom";
  }

  // 确保菜单不会超出屏幕边缘（留出5px边距）
  finalX = finalX < 5 ? 5 : finalX;
  finalY = finalY < 5 ? 5 : finalY;

  // 应用最终位置
  position.x = finalX;
  position.y = finalY;

  // 设置动画起点
  transformOrigin.value = `${originY} ${originX}`;

  console.log(
    `菜单位置调整: 点击(${initialX}, ${initialY}) -> 最终(${finalX}, ${finalY}), 动画起点: ${transformOrigin.value}`
  );
};

const hideMenu = () => {
  if (isVisible.value) {
    gsap.to(rightMenuRef.value, {
      scale: 0.9,
      opacity: 0,
      duration: 0.1,
      ease: "power1.in",
      onComplete: () => {
        isVisible.value = false;
      }
    });
  }
};

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === "Escape") {
    hideMenu();
  }
};

const gotoCategory = () => {
  router.push("/categories");
  hideMenu();
};

const gotoTag = () => {
  router.push("/tags");
  hideMenu();
};

const goBack = () => {
  window.history.back();
  hideMenu();
};

const goForward = () => {
  window.history.forward();
  hideMenu();
};

const refreshPage = () => {
  window.location.reload();
  hideMenu();
};

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
  hideMenu();
};

const copySelectedText = () => {
  // 修改：直接使用暂存的文本
  const text = capturedText.value;
  if (text) {
    update(text);
    if (copied.value) {
      showSnackbar("复制成功，复制和转载请标注本文地址");
    }
  }
  hideMenu();
};

const searchBaidu = () => {
  const text = capturedText.value;
  if (text) {
    window.open(
      `https://www.baidu.com/s?wd=${encodeURIComponent(text)}`,
      "_blank"
    );
  }
  hideMenu();
};

const searchLocal = () => {
  const text = capturedText.value;
  if (text) {
    window.dispatchEvent(
      new CustomEvent("frontend-open-search", { detail: { keyword: text } })
    );
  }
  hideMenu();
};

const randomNavigate = () => {
  articleStore.navigateToRandomArticle();
  hideMenu();
};

const toggleTheme = () => {
  dataThemeChange(dataTheme.value ? "light" : "dark");
  hideMenu();
};

const copyUrl = () => {
  const url = window.location.href;
  update(url);
  if (copied.value) {
    showSnackbar("复制本页链接地址成功");
  }
  hideMenu();
};

// 音乐播放器控制函数
const togglePlayPause = () => {
  // 通过全局事件控制播放/暂停
  window.dispatchEvent(new CustomEvent("music-player-toggle-play"));
  hideMenu();
};

const previousSong = () => {
  // 通过全局事件与音乐播放器通信
  window.dispatchEvent(new CustomEvent("music-player-previous"));
  hideMenu();
};

const nextSong = () => {
  // 通过全局事件与音乐播放器通信
  window.dispatchEvent(new CustomEvent("music-player-next"));
  hideMenu();
};

const copySongName = () => {
  // 通过全局事件请求歌曲名称
  window.dispatchEvent(new CustomEvent("music-player-get-song-name"));
  hideMenu();
};

// 处理音乐播放器歌曲名称响应
const handleSongNameResponse = (event: CustomEvent) => {
  const { songName, artist } = event.detail;
  const fullName = artist ? `${artist} - ${songName}` : songName;

  update(fullName);
  if (copied.value) {
    showSnackbar("歌曲名称复制成功");
  }
};

// 处理音乐播放状态响应
const handleMusicPlayStatusResponse = (event: CustomEvent) => {
  const { isPlaying } = event.detail;
  musicIsPlaying.value = isPlaying;
};

onMounted(() => {
  window.addEventListener("contextmenu", handleContextMenu);
  window.addEventListener("click", hideMenu);
  window.addEventListener("keydown", handleKeydown);
  window.addEventListener("scroll", hideMenu);
  window.addEventListener(
    "music-player-song-name-response",
    handleSongNameResponse as EventListener
  );
  window.addEventListener(
    "music-player-play-status-response",
    handleMusicPlayStatusResponse as EventListener
  );

  // 初始检查评论区域
  checkCommentSection();
});

// 监听路由变化，重新检查评论区域
watch(
  () => route.path,
  () => {
    nextTick(() => {
      checkCommentSection();
    });
  }
);

onUnmounted(() => {
  window.removeEventListener("contextmenu", handleContextMenu);
  window.removeEventListener("click", hideMenu);
  window.removeEventListener("keydown", handleKeydown);
  window.removeEventListener("scroll", hideMenu);
  window.removeEventListener(
    "music-player-song-name-response",
    handleSongNameResponse as EventListener
  );
  window.removeEventListener(
    "music-player-play-status-response",
    handleMusicPlayStatusResponse as EventListener
  );
});
</script>

<style scoped lang="scss">
#rightMenu {
  position: fixed;
  z-index: 9999;
  padding: 8px;
  font-size: 14px;
  color: var(--anzhiyu-fontcolor);
  background-color: var(--anzhiyu-maskbg);
  backdrop-filter: blur(20px);
  backdrop-filter: saturate(180%) blur(20px);
  border: var(--style-border);
  border-radius: 12px;
  box-shadow: var(--anzhiyu-shadow-contextmenu);
  opacity: 0;

  /* transform-origin 现在通过 JavaScript 动态设置 */
}

.rightMenu-group {
  display: flex;
  gap: 4px;
  align-items: center;

  &:not(:last-child) {
    margin-bottom: 4px;
  }

  &.rightMenu-line {
    flex-direction: column;
    padding-top: 4px;
    border-top: 2px dashed var(--anzhiyu-theme-op);
  }
}

.rightMenu-item {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 6px 10px;
  white-space: nowrap;
  cursor: pointer;
  border-radius: 8px;
  transition:
    background-color 0.2s ease,
    color 0.2s ease;

  i {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1em;
    height: 1em;
    margin-right: 8px;
    font-size: 1rem;
  }

  &:hover {
    color: var(--anzhiyu-white);
    background-color: var(--anzhiyu-main);
  }
}

.rightMenu-small .rightMenu-item {
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;

  i {
    margin-right: 0;
  }
}
</style>
