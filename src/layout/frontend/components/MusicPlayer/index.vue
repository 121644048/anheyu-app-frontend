<!--
 * @Description: 重构后的音乐胶囊播放器组件
 * @Author: 安知鱼
 * @Date: 2025-09-20 15:40:00
 * @LastEditTime: 2025-09-20 17:17:40
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
    @click="handlePlayerClick"
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
      preload="metadata"
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
  return Math.floor(Math.random() * max);
};

// 初始化页脚区域观察器
const initFooterObserver = () => {
  const footerElement = document.getElementById("footer-container");

  if (!footerElement) {
    console.warn("未找到页脚元素 #footer-container");
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
  console.log("页脚区域观察器已初始化");
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

const handlePlayerClick = (event: MouseEvent) => {
  // 空的处理函数，主要逻辑移到了MusicCapsule组件
};

const togglePlaylist = () => {
  showPlaylist.value = !showPlaylist.value;
};

// 时间更新处理（需要更新歌词）
const onTimeUpdate = () => {
  audioPlayer.onTimeUpdate();
  lyricsComposable.updateCurrentLyricIndex();
};

// 加载歌曲并处理资源
const loadSongWithResources = async (song: Song) => {
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
      "歌曲资源加载完成:",
      song.name,
      resources.usingHighQuality ? "(使用高质量API)" : "(使用原始API)"
    );

    return true;
  } catch (error) {
    console.error("加载歌曲资源失败:", error);
    return false;
  }
};

// 初始化播放器
const initializePlayer = async () => {
  try {
    console.log("音乐播放器初始化中...");

    // 确保站点配置已加载
    if (!siteConfigStore.isLoaded) {
      console.log("正在等待站点配置加载...");
      await siteConfigStore.fetchSiteConfig();
    }

    // 获取歌单
    const playlistData = await musicAPI.fetchPlaylist();
    if (playlistData.length === 0) {
      console.error("歌单数据为空");
      return false;
    }

    playlist.value = playlistData;
    console.log("歌单加载成功", playlist.value.length, "首歌曲");

    // 随机选择第一首歌曲
    const randomIndex = getRandomIndex(playlist.value.length);
    console.log(
      `随机选择第${randomIndex + 1}首歌曲: ${playlist.value[randomIndex].name}`
    );

    // 设置音频引用
    audioPlayer.audioRef.value = audioElement.value;

    // 加载并播放随机选择的歌曲
    const song = playlist.value[randomIndex];
    await loadSongWithResources(song);

    const playSuccess = await audioPlayer.playSong(randomIndex);

    if (playSuccess) {
      // 完成加载后显示播放器
      isVisible.value = true;
      console.log("音乐播放器初始化完成");
      return true;
    } else {
      console.error("初始歌曲加载失败，尝试播放下一首");
      // 如果当前歌曲加载失败，尝试播放下一首（最多尝试5首）
      const maxFallbackAttempts = Math.min(5, playlist.value.length);
      for (let i = 1; i < maxFallbackAttempts; i++) {
        const nextIndex = (randomIndex + i) % playlist.value.length;
        const nextSong = playlist.value[nextIndex];

        console.log(
          `尝试备选歌曲 ${i}/${maxFallbackAttempts - 1}: ${nextSong.name}`
        );
        await loadSongWithResources(nextSong);

        const nextPlaySuccess = await audioPlayer.playSong(nextIndex);
        if (nextPlaySuccess) {
          isVisible.value = true;
          console.log(`✅ 音乐播放器初始化完成（使用第${i + 1}个备选歌曲）`);
          return true;
        } else {
          console.warn(`❌ 备选歌曲 ${i} 也无法播放: ${nextSong.name}`);
        }
      }

      // 所有歌曲都无法播放
      console.error("所有歌曲都无法播放");
      return false;
    }
  } catch (error) {
    console.error("初始化播放器失败:", error);
    return false;
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

// 处理来自右键菜单的音乐控制事件
const handleMusicControlEvents = () => {
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

  // 添加事件监听器
  window.addEventListener("music-player-previous", handlePrevious);
  window.addEventListener("music-player-next", handleNext);
  window.addEventListener("music-player-get-song-name", handleGetSongName);

  // 返回清理函数
  return () => {
    window.removeEventListener("music-player-previous", handlePrevious);
    window.removeEventListener("music-player-next", handleNext);
    window.removeEventListener("music-player-get-song-name", handleGetSongName);
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

// 监听当前歌曲变化，加载资源 (优化: 避免初始化时重复加载)
let isInitializing = true;
watch(
  () => audioPlayer.currentSong.value,
  async (newSong, oldSong) => {
    // 跳过初始化阶段的自动触发，避免重复加载
    if (isInitializing) {
      isInitializing = false;
      return;
    }

    if (newSong && newSong !== oldSong) {
      console.log("歌曲切换，重新加载资源:", newSong.name);
      await loadSongWithResources(newSong);
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
      console.error("音乐播放器初始化失败");
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
    console.error("音乐播放器初始化异常:", error);
    isVisible.value = false;
  }
});

onBeforeUnmount(() => {
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
  lyricsComposable.cleanup();
  colorExtraction.cleanup();

  console.log("音乐播放器资源已清理");
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
