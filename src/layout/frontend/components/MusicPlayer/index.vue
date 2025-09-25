<!--
 * @Description: 音乐胶囊播放器组件
 * @Author: 安知鱼
 * @Date: 2025-09-20 15:40:00
 * @LastEditTime: 2025-09-24 23:01:51
 * @LastEditors: 安知鱼
-->
<template>
  <div
    id="nav-music"
    :class="{
      'music-player': true,
      'music-hidden': !isVisible || musicAPI.isLoading.value,
      'in-footer-area': isInFooterArea,
      expanded: isExpanded,
      hovered: isHovered,
      collapsing: isCollapsing
    }"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <!-- 统一的音乐胶囊容器 -->
    <MusicCapsule
      :is-expanded="isExpanded"
      :is-hovered="isHovered"
      :is-playing="audioPlayer.audioState.isPlaying"
      :is-muted="audioPlayer.audioState.isMuted"
      :volume="audioPlayer.audioState.volume"
      :current-song="audioPlayer.currentSong.value"
      :lyrics="lyricsComposable.lyrics.value"
      :lyrics-state="lyricsComposable.lyricsState"
      :dominant-color="colorExtraction.dominantColor.value"
      :played-percentage="audioPlayer.playedPercentage.value"
      :set-lyric-ref="lyricsComposable.setLyricRef"
      @toggle-expand="toggleExpand"
      @toggle-play="audioPlayer.togglePlay"
      @previous="audioPlayer.previousSong"
      @next="audioPlayer.nextSong"
      @toggle-mute="audioPlayer.toggleMute"
      @toggle-playlist="togglePlaylist"
    />

    <!-- 播放列表 -->
    <Playlist
      :is-visible="showPlaylist && isExpanded"
      :playlist="playlist"
      :current-song-index="audioPlayer.currentSongIndex.value"
      :is-playing="audioPlayer.audioState.isPlaying"
      :loading-playlist-item="audioPlayer.loadingPlaylistItem.value"
      :playlist-style="colorExtraction.getPlaylistStyle()"
      @close="togglePlaylist"
      @select-song="audioPlayer.handlePlaylistItemClick"
    />

    <!-- 音频元素 -->
    <audio
      ref="audioElement"
      preload="none"
      @loadstart="audioPlayer.onLoadStart"
      @loadedmetadata="audioPlayer.onLoadedMetadata"
      @timeupdate="onTimeUpdate"
      @ended="audioPlayer.onEnded"
      @error="audioPlayer.onError"
    />
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  computed,
  onMounted,
  onBeforeUnmount,
  watch,
  nextTick
} from "vue";

// 导入composables
import { useAudioPlayer } from "@/composables/useAudioPlayer";
import { useLyrics } from "@/composables/useLyrics";
import { useMusicAPI } from "@/composables/useMusicAPI";
import { useColorExtraction } from "@/composables/useColorExtraction";
import { useSiteConfigStore } from "@/store/modules/siteConfig";

// 导入组件
import MusicCapsule from "@/components/MusicPlayer/MusicCapsule.vue";
import Playlist from "@/components/MusicPlayer/Playlist.vue";

// 导入类型
import type { Song } from "@/types/music";

// 基本状态
const isVisible = ref(false);
const showPlaylist = ref(false);
const isExpanded = ref(false);
const isHovered = ref(false);
const isCollapsing = ref(false);
const isInFooterArea = ref(false);

// 歌单数据
const playlist = ref<Song[]>([]);

// 音频元素引用
const audioElement = ref<HTMLAudioElement>();

// 页脚区域观察器
let footerObserver: IntersectionObserver | null = null;

// 音乐播放器实例计数
if (!(window as any).musicPlayerInstanceCount) {
  (window as any).musicPlayerInstanceCount = 0;
}
(window as any).musicPlayerInstanceCount++;
const instanceId = (window as any).musicPlayerInstanceCount;

// 初始化 composables
const siteConfigStore = useSiteConfigStore();
const musicAPI = useMusicAPI();
const audioPlayer = useAudioPlayer(playlist);
const lyricsComposable = useLyrics(
  computed(() => audioPlayer.audioState.currentTime)
);
const colorExtraction = useColorExtraction();

// 获取随机索引
const getRandomIndex = (max: number): number => {
  const randomIndex = Math.floor(Math.random() * max);
  return randomIndex;
};

// 初始化页脚区域观察器
const initFooterObserver = () => {
  const footerElement = document.getElementById("footer-container");

  if (!footerElement) {
    return;
  }

  footerObserver = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        // 当页脚区域进入视口时，隐藏音乐播放器
        isInFooterArea.value = entry.isIntersecting;
      });
    },
    {
      // 当页脚区域有任何部分进入视口时就触发
      threshold: 0.1,
      // 设置根边距，提前一点触发
      rootMargin: "50px 0px 0px 0px"
    }
  );

  footerObserver.observe(footerElement);
};

// 控制函数
const toggleExpand = () => {
  if (isExpanded.value) {
    // 如果当前是展开状态，准备收起
    isCollapsing.value = true;

    // 延迟执行收起，让动画有时间播放
    setTimeout(() => {
      isExpanded.value = false;
      // 动画完成后重置收起状态
      setTimeout(() => {
        isCollapsing.value = false;
      }, 500);
    }, 50);
  } else {
    // 展开时直接切换
    isExpanded.value = true;
    isCollapsing.value = false;
  }
};

const togglePlaylist = () => {
  showPlaylist.value = !showPlaylist.value;
};

// 时间更新处理（需要更新歌词）
const onTimeUpdate = () => {
  audioPlayer.onTimeUpdate();
  lyricsComposable.updateCurrentLyricIndex();
};

// 等待封面图片加载完成
const waitForCoverLoad = (imageUrl?: string): Promise<boolean> => {
  return new Promise(resolve => {
    // 如果没有封面图片，直接返回成功
    if (!imageUrl) {
      resolve(true);
      return;
    }

    const img = new Image();
    const timeoutId = setTimeout(() => {
      console.warn("Cover image load timeout, continuing anyway");
      resolve(false);
    }, 3000); // 3秒超时

    img.onload = () => {
      clearTimeout(timeoutId);
      resolve(true);
    };

    img.onerror = () => {
      clearTimeout(timeoutId);
      console.warn("Failed to load cover image:", imageUrl);
      resolve(false);
    };

    // 开始加载图片
    img.src = imageUrl;
  });
};

// 加载歌曲并处理资源
let loadResourcesCount = 0;
const loadSongWithResources = async (song: Song, caller = "unknown") => {
  loadResourcesCount++;
  const loadId = Date.now() + "-" + Math.random().toString(36).substr(2, 9);

  console.log(
    `[MUSIC_PLAYER] 开始加载歌曲资源 - 歌曲: ${song.name}, 调用者: ${caller}, 加载ID: ${loadId}, 总调用次数: ${loadResourcesCount}`
  );

  try {
    // 获取歌曲资源（音频和歌词）
    const resources = await musicAPI.fetchSongResources(song);

    // 设置歌词
    if (resources.lyricsText) {
      lyricsComposable.setLyrics(resources.lyricsText);
    } else {
      lyricsComposable.clearLyrics();
    }

    // 提取并设置主色调
    if (song.pic) {
      await colorExtraction.extractAndSetDominantColor(song.pic);
    } else {
      colorExtraction.resetToDefaultColor();
    }

    // 更新歌曲URL（如果获取到高质量版本）
    if (resources.audioUrl !== song.url) {
      song.url = resources.audioUrl;
    }

    console.log(
      `[MUSIC_PLAYER] 歌曲资源加载成功 - 歌曲: ${song.name}, 调用者: ${caller}, 加载ID: ${loadId}`
    );
    return true;
  } catch (error) {
    console.error(
      `[MUSIC_PLAYER] 歌曲资源加载失败 - 歌曲: ${song.name}, 调用者: ${caller}, 加载ID: ${loadId}`,
      error
    );
    return false;
  }
};

// 全局初始化状态管理（防止多个实例同时初始化）
const PLAYER_INIT_KEY = "music-player-initializing";
const PLAYER_INITIALIZED_KEY = "music-player-initialized";

const isPlayerInitializing = () => {
  return (window as any)[PLAYER_INIT_KEY] === true;
};

const isPlayerInitialized = () => {
  return (window as any)[PLAYER_INITIALIZED_KEY] === true;
};

const setPlayerInitializing = (status: boolean) => {
  (window as any)[PLAYER_INIT_KEY] = status;
};

const setPlayerInitialized = (status: boolean) => {
  (window as any)[PLAYER_INITIALIZED_KEY] = status;
};

// 初始化播放器
const initializePlayer = async () => {
  try {
    // 检查是否已经有播放器正在初始化或已初始化
    if (isPlayerInitializing()) {
      // 等待其他实例初始化完成
      let waitCount = 0;
      while (
        isPlayerInitializing() &&
        !isPlayerInitialized() &&
        waitCount < 50
      ) {
        await new Promise(resolve => setTimeout(resolve, 100));
        waitCount++;
      }

      if (isPlayerInitialized()) {
        return false; // 不需要重复初始化
      }
    }

    if (isPlayerInitialized()) {
      return false;
    }

    setPlayerInitializing(true);
    isInitializing = true; // 标记开始初始化，避免watch重复调用

    // 确保站点配置已加载
    if (!siteConfigStore.isLoaded) {
      await siteConfigStore.fetchSiteConfig();
    }

    // 获取歌单
    const playlistData = await musicAPI.fetchPlaylist();
    if (playlistData.length === 0) {
      return false;
    }

    // 随机选择第一首歌曲
    const randomIndex = getRandomIndex(playlistData.length);
    const firstSong = playlistData[randomIndex];

    // 设置音频引用
    audioPlayer.audioRef.value = audioElement.value;

    // 先加载第一首歌的资源（包括封面），避免watch重复调用
    const resourcesLoaded = await loadSongWithResources(
      firstSong,
      "initializePlayer"
    );
    if (!resourcesLoaded) {
      console.warn(
        "Failed to load first song resources, but showing player anyway"
      );
    }

    // 等待封面图片完全加载完成
    await waitForCoverLoad(firstSong.pic);

    // 资源加载完成后，设置播放列表和索引（此时watch不会触发重复调用）
    audioPlayer.currentSongIndex.value = randomIndex;
    playlist.value = playlistData;

    // 完成所有资源加载后显示播放器
    isVisible.value = true;
    setPlayerInitialized(true);
    return true;
  } catch (error) {
    return false;
  } finally {
    // 无论成功还是失败，都要重置初始化状态
    isInitializing = false;
    setPlayerInitializing(false);
  }
};

// 点击外部关闭播放列表
const handleClickOutside = (event: MouseEvent) => {
  if (!showPlaylist.value) return;

  const target = event.target as HTMLElement;
  const playlistContainer = document.querySelector(".playlist-container");
  const playlistButton = document.querySelector(".control-btn:last-child"); // 播放列表按钮

  // 如果点击的不是播放列表容器内部或播放列表按钮，则关闭播放列表
  if (
    playlistContainer &&
    !playlistContainer.contains(target) &&
    playlistButton &&
    !playlistButton.contains(target)
  ) {
    showPlaylist.value = false;
  }
};

// 全局事件监听器状态管理（防止重复注册）
const GLOBAL_LISTENERS_KEY = "music-player-global-listeners";
const isGlobalListenersRegistered = () => {
  return (window as any)[GLOBAL_LISTENERS_KEY] === true;
};
const setGlobalListenersRegistered = (status: boolean) => {
  (window as any)[GLOBAL_LISTENERS_KEY] = status;
};

// 处理来自右键菜单的音乐控制事件
const handleMusicControlEvents = () => {
  // 如果全局监听器已经注册，直接返回空清理函数
  if (isGlobalListenersRegistered()) {
    return () => {}; // 返回空的清理函数
  }

  // 播放/暂停切换
  const handleTogglePlay = () => {
    audioPlayer.togglePlay();
  };

  // 上一首
  const handlePrevious = () => {
    audioPlayer.previousSong();
  };

  // 下一首
  const handleNext = () => {
    audioPlayer.nextSong();
  };

  // 获取歌曲名称并复制
  const handleGetSongName = () => {
    const currentSong = audioPlayer.currentSong.value;
    if (currentSong) {
      // 触发一个自定义事件，将歌曲名称传递给右键菜单
      window.dispatchEvent(
        new CustomEvent("music-player-song-name-response", {
          detail: { songName: currentSong.name, artist: currentSong.artist }
        })
      );
    }
  };

  // 获取播放状态
  const handleGetPlayStatus = () => {
    window.dispatchEvent(
      new CustomEvent("music-player-play-status-response", {
        detail: { isPlaying: audioPlayer.audioState.isPlaying }
      })
    );
  };

  // 添加事件监听器
  window.addEventListener("music-player-toggle-play", handleTogglePlay);
  window.addEventListener("music-player-previous", handlePrevious);
  window.addEventListener("music-player-next", handleNext);
  window.addEventListener("music-player-get-song-name", handleGetSongName);
  window.addEventListener("music-player-get-play-status", handleGetPlayStatus);

  // 标记全局监听器已注册
  setGlobalListenersRegistered(true);

  // 返回清理函数
  return () => {
    window.removeEventListener("music-player-toggle-play", handleTogglePlay);
    window.removeEventListener("music-player-previous", handlePrevious);
    window.removeEventListener("music-player-next", handleNext);
    window.removeEventListener("music-player-get-song-name", handleGetSongName);
    window.removeEventListener(
      "music-player-get-play-status",
      handleGetPlayStatus
    );

    // 标记全局监听器已清理
    setGlobalListenersRegistered(false);
  };
};

// 监听播放状态变化，暂停时收起
watch(
  () => audioPlayer.audioState.isPlaying,
  newPlaying => {
    if (!newPlaying) {
      isExpanded.value = false;
    }
  }
);

// 监听当前歌曲变化，加载资源
let currentSongChangePromise: Promise<void> | null = null;
let watchTriggerCount = 0;
let isInitializing = false; // 标记是否正在初始化
let isFirstSongLoaded = false; // 标记第一首歌是否已在初始化时加载过

watch(
  () => audioPlayer.currentSong.value,
  async (newSong, oldSong) => {
    watchTriggerCount++;
    const triggerId =
      Date.now() + "-" + Math.random().toString(36).substr(2, 9);

    // 如果正在初始化播放器，跳过watch的资源加载（避免重复调用）
    if (isInitializing) {
      console.log(
        `[MUSIC_PLAYER] 跳过watch资源加载，正在初始化中 - trigger: ${triggerId}`
      );
      return;
    }

    // 如果是第一首歌且已经在初始化时加载过，跳过
    if (!isFirstSongLoaded && newSong) {
      console.log(
        `[MUSIC_PLAYER] 跳过第一首歌的watch加载，已在初始化时处理 - 歌曲: ${newSong.name}`
      );
      isFirstSongLoaded = true;
      return;
    }

    if (newSong && newSong !== oldSong) {
      console.log(
        `[MUSIC_PLAYER] watch触发资源加载 - 新歌曲: ${newSong.name}, trigger: ${triggerId}`
      );

      // 如果有正在进行的歌曲加载操作，等待它完成
      if (currentSongChangePromise) {
        try {
          await currentSongChangePromise;
        } catch (error) {}
      }

      // 创建新的加载Promise - 只加载歌词和封面色彩，不加载音频
      currentSongChangePromise = loadSongWithResources(
        newSong,
        "watch:currentSong"
      ).then(() => {});

      try {
        await currentSongChangePromise;
      } catch (error) {
        console.error(
          `[MUSIC_PLAYER] watch资源加载失败 - 歌曲: ${newSong.name}`,
          error
        );
      } finally {
        currentSongChangePromise = null;
      }
    }
  }
);

// 监听展开状态变化，检测歌词滚动需求
watch(isExpanded, newExpanded => {
  if (newExpanded) {
    // 展开时重新计算歌词位置和滚动需求
    setTimeout(() => {
      lyricsComposable.calculateLyricsPosition();
      lyricsComposable.checkCurrentLyricScrollNeed();
    }, 300); // 等待展开动画完成
  }
});

// 生命周期
let cleanupMusicControlEvents: (() => void) | null = null;

onMounted(async () => {
  try {
    const success = await initializePlayer();
    if (!success) {
      // 如果加载失败，可以选择显示错误状态或隐藏播放器
      setTimeout(() => {
        isVisible.value = false;
      }, 1000);
    }

    // 初始化页脚观察器
    setTimeout(() => {
      initFooterObserver();
    }, 1000); // 延迟初始化，确保页面DOM加载完成

    // 添加全局点击事件监听器，用于点击外部关闭播放列表
    document.addEventListener("click", handleClickOutside);

    // 初始化音乐控制事件监听器
    cleanupMusicControlEvents = handleMusicControlEvents();
  } catch (error) {
    isVisible.value = false;
  }
});

onBeforeUnmount(() => {
  (window as any).musicPlayerInstanceCount--;

  if (audioElement.value) {
    audioElement.value.pause();
    audioElement.value.src = "";
  }

  // 清理页脚观察器
  if (footerObserver) {
    footerObserver.disconnect();
    footerObserver = null;
  }

  // 移除全局点击事件监听器
  document.removeEventListener("click", handleClickOutside);

  // 清理音乐控制事件监听器
  if (cleanupMusicControlEvents) {
    cleanupMusicControlEvents();
  }

  // 清理 composables
  audioPlayer.cleanup(); // 添加audioPlayer清理
  lyricsComposable.cleanup();
  colorExtraction.cleanup();

  // 重置全局状态
  setPlayerInitialized(false);
  setPlayerInitializing(false);
});
</script>

<style scoped lang="scss">
#nav-music {
  position: fixed;
  left: 20px;
  bottom: 20px;
  z-index: 1009;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &.music-hidden {
    transform: translateX(-100%);
    opacity: 0;
  }

  // 当进入页脚区域时隐藏播放器
  &.in-footer-area {
    bottom: -10px;
    opacity: 0;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  // 收起动画状态
  &.collapsing {
    // 立即隐藏音乐控制区域
    :deep(.music-controls) {
      opacity: 0;
      transition: opacity 0.15s ease-out;
    }

    :deep(.music-controls .control-btn.play-pause-btn) {
      animation: playButtonCollapse 0.5s cubic-bezier(0.25, 0.8, 0.25, 1)
        forwards;
      z-index: 15;
    }

    :deep(.collapsed-info .collapsed-icon) {
      animation: playButtonExpand 0.5s cubic-bezier(0.25, 0.8, 0.25, 1) 0.3s
        forwards;
    }
  }
}

// 播放按钮收起动画 - 从控制区域移动到中心
@keyframes playButtonCollapse {
  0% {
    transform: translateX(0) scale(1);
    opacity: 0.8;
  }
  50% {
    transform: translateX(-50px) scale(1.2);
    opacity: 1;
  }
  100% {
    transform: translateX(-100px) scale(1.5);
    opacity: 0;
  }
}

// 播放按钮在中心位置出现动画
@keyframes playButtonExpand {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.5);
  }
  100% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.5);
    width: 32px;
    height: 32px;
    background: transparent;
    border-radius: 50%;
    backdrop-filter: none;
  }
}

@media (max-width: 768px) {
  #nav-music {
    display: none !important;
  }
}

@media (prefers-color-scheme: dark) {
  :deep(.playlist-container) {
    background: rgba(40, 40, 40, 0.95);
  }
}
</style>
