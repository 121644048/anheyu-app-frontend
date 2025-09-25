<!--
 * @Description: 音乐馆页面
 * @Author: 安知鱼
 * @Date: 2025-09-23 12:13:32
 * @LastEditTime: 2025-09-25 18:02:25
 * @LastEditors: 安知鱼
-->
<template>
  <div class="music-home" :class="{ 'no-song': !currentSong }">
    <!-- 顶部导航 -->
    <FrontendHeader />

    <!-- 动态音乐背景 -->
    <div
      id="music_bg"
      class="music-background"
      :style="{
        backgroundImage: currentSong?.pic
          ? `url('${currentSong.pic}')`
          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        backgroundColor: currentSong?.pic
          ? colorExtraction.dominantColor.value || 'rgb(102, 126, 234)'
          : 'transparent'
      }"
    />
    <div class="background-overlay" />

    <!-- 主容器 -->
    <div class="music-container">
      <!-- 播放器区域 -->
      <div class="player-section">
        <!-- 专辑封面 -->
        <div class="album-artwork">
          <div
            class="artwork-container"
            :class="{ 'is-playing': audioPlayer.audioState.isPlaying }"
          >
            <img
              src="https://upload-bbs.miyoushe.com/upload/2025/09/23/125766904/61321cddd1e632df60cbc751953923f1_6948385422724592803.png"
              alt="唱片背景"
              class="vinyl-background"
            />
            <img
              src="https://upload-bbs.miyoushe.com/upload/2025/09/23/125766904/22e3492b5f5f27a08d725a057213caa7_6260158843656131388.png"
              alt="唱片外圈"
              class="artwork-image-vinyl-background"
            />
            <img
              src="https://upload-bbs.miyoushe.com/upload/2025/09/23/125766904/f42b2b702883aafb66c3fdaa6163bc71_404470491737554604.png"
              alt="唱片内圈"
              class="artwork-image-vinyl-inner-background"
            />
            <img
              src="https://upload-bbs.miyoushe.com/upload/2025/09/23/125766904/2f2c279fd93eabeb5ebff8e984964c48_5554239981642930129.png"
              alt="撞针"
              class="artwork-image-needle-background"
              :class="{ 'needle-playing': audioPlayer.audioState.isPlaying }"
            />
            <img
              src="https://upload-bbs.miyoushe.com/upload/2025/09/23/125766904/e93123a26f65d8984d75f9e1ffba8f24_5652931152834495590.png"
              alt="凹槽背景"
              class="artwork-image-groove-background"
            />
            <img
              v-if="currentSong?.pic"
              :src="currentSong.pic"
              :alt="currentSong.name"
              class="artwork-image"
              :style="{ borderColor: borderColor }"
            />
            <img
              v-if="currentSong?.pic"
              :src="currentSong.pic"
              :alt="currentSong.name + '模糊背景'"
              class="artwork-image-blur"
            />
            <!-- 清晰边框圆环 -->
            <div v-if="currentSong?.pic" class="artwork-border-ring" />
            <div v-else class="artwork-placeholder">
              <IconifyIconOffline :icon="Music2Line" />
            </div>

            <!-- 播放指示器 -->
            <div
              v-if="audioPlayer.audioState.isPlaying"
              class="playing-indicator"
            >
              <div class="sound-wave">
                <div class="wave-bar" />
                <div class="wave-bar" />
                <div class="wave-bar" />
                <div class="wave-bar" />
              </div>
            </div>
          </div>
          <!-- 歌曲信息 -->
          <div class="track-info">
            <h2 class="track-title">
              {{
                (currentSong?.name || "") +
                (currentSong?.artist ? " - " + currentSong.artist : "")
              }}
            </h2>
          </div>
        </div>

        <!-- 歌词展示区域 -->
        <div class="lyrics-section">
          <MusicHomeLyricsScroll
            ref="lyricsScrollRef"
            :lyrics="lyricsComposable.lyrics.value"
            :lyrics-state="lyricsComposable.lyricsState"
            :dominant-color="colorExtraction.dominantColor.value"
            :current-time="audioPlayer.audioState.currentTime"
            :is-dragging="isDragging"
            @lyric-click="handleLyricClick"
          />
        </div>
      </div>

      <!-- 播放控制 -->
      <div class="playback-controls">
        <div class="progress-container anzhiyumusic-style">
          <span class="time-label">{{
            formatTime(audioPlayer.audioState.currentTime)
          }}</span>
          <div
            class="progress-track"
            :class="{
              dragging: isDragging,
              'anzhiyumusic-progress': true,
              'is-loading': audioPlayer.audioLoadingState.value.isLoading
            }"
            @click="handleProgressClick"
            @mouseenter="showProgressThumb = true"
            @mouseleave="showProgressThumb = false"
            @mousedown="handleProgressMouseDown"
          >
            <!-- 音频加载进度条（在缓冲进度之下） -->
            <div
              v-if="audioPlayer.audioLoadingState.value.isLoading"
              class="progress-loading"
              :style="{
                width: `${audioPlayer.audioLoadingState.value.progress}%`
              }"
            />

            <!-- anzhiyumusic风格的缓冲进度条（改进视觉效果） -->
            <div
              class="progress-buffer"
              :class="{ 'has-content': audioPlayer.loadedPercentage.value > 0 }"
              :style="{
                width: `${audioPlayer.loadedPercentage}%`
              }"
            />

            <!-- 播放进度条 -->
            <div
              class="progress-fill"
              :class="{ 'anzhiyumusic-fill': true }"
              :style="{
                width: `${isDragging ? dragProgress : audioPlayer.playedPercentage.value}%`
              }"
            />

            <!-- 进度条拖拽thumb -->
            <div
              class="progress-thumb"
              :class="{
                show: showProgressThumb || isDragging,
                'anzhiyumusic-thumb': true
              }"
              :style="{ left: `${thumbPosition}%` }"
            />
          </div>
          <span class="time-label">{{
            formatTime(audioPlayer.audioState.duration)
          }}</span>
        </div>

        <!-- anzhiyumusic 风格控制按钮 - 重新排列顺序 -->
        <div class="control-buttons">
          <!-- 1. 刷新缓存按钮 -->
          <button
            class="control-btn secondary"
            :title="cacheStatus.isLoading ? '加载中...' : '刷新缓存'"
            :disabled="cacheStatus.isLoading"
            @click="refreshCache"
          >
            <IconifyIconOffline
              :icon="cacheStatus.isLoading ? LoaderLine : RefreshLine"
              :style="
                cacheStatus.isLoading
                  ? 'animation: spin 1s linear infinite;'
                  : ''
              "
            />
          </button>

          <!-- 2. anzhiyumusic 风格的音量按钮 -->
          <div ref="volumeControlRef" class="volume-control-wrapper">
            <button
              class="control-btn secondary volume-toggle"
              title="音量控制"
              @click="toggleVolumeSlider"
            >
              <IconifyIconOffline
                :icon="
                  audioPlayer.audioState.isMuted
                    ? VolumeMuteFill
                    : audioPlayer.audioState.volume > 0.6
                      ? VolumeUpFill
                      : audioPlayer.audioState.volume > 0.3
                        ? VolumeDownFill
                        : VolumeOffVibrateFill
                "
              />
            </button>

            <!-- anzhiyumusic 风格垂直音量条 -->
            <div
              class="vertical-volume-slider"
              :class="{ show: showVolumeSlider }"
            >
              <div class="volume-track">
                <div
                  class="volume-fill"
                  :style="{ height: `${audioPlayer.audioState.volume * 100}%` }"
                />
                <input
                  type="range"
                  orient="vertical"
                  min="0"
                  max="100"
                  class="volume-range"
                  :value="audioPlayer.audioState.volume * 100"
                  @input="handleVerticalVolumeChange"
                  @mousedown="startVolumeDrag"
                  @mouseup="endVolumeDrag"
                />
              </div>
            </div>
          </div>

          <!-- 3. 上一曲 -->
          <button
            class="control-btn secondary"
            title="上一曲"
            :disabled="!hasPlaylist"
            @click="() => audioPlayer.previousSong()"
          >
            <i class="anzhiyufont anzhiyu-icon-backward" />
          </button>

          <!-- 4. 播放/暂停 -->
          <button
            class="control-btn primary"
            :title="getPlayButtonTitle()"
            :disabled="!currentSong"
            :class="{
              'is-loading': audioPlayer.audioLoadingState.value.isLoading
            }"
            @click="handlePlayPause"
          >
            <!-- 加载状态图标 -->
            <IconifyIconOffline
              v-if="audioPlayer.audioLoadingState.value.isLoading"
              :icon="LoaderLine"
              class="loading-icon"
            />
            <!-- 播放/暂停图标 -->
            <i
              v-else
              class="anzhiyufont"
              :class="
                audioPlayer.audioState.isPlaying
                  ? 'anzhiyu-icon-pause'
                  : 'anzhiyu-icon-play'
              "
            />
          </button>

          <!-- 5. 下一曲 -->
          <button
            class="control-btn secondary"
            title="下一曲"
            :disabled="!hasPlaylist"
            @click="() => audioPlayer.nextSong()"
          >
            <i class="anzhiyufont anzhiyu-icon-forward" />
          </button>

          <!-- 6. 显示/隐藏列表按钮 -->
          <button
            class="control-btn secondary"
            :title="showPlaylist ? '隐藏列表' : '显示列表'"
            @click="togglePlaylist"
          >
            <IconifyIconOffline :icon="ListUnordered" />
          </button>

          <!-- 7. 播放模式切换 -->
          <button
            class="control-btn secondary"
            :title="getPlayModeTitle()"
            @click="togglePlayMode"
          >
            <IconifyIconOffline :icon="getPlayModeIcon()" />
          </button>
        </div>
      </div>
    </div>

    <!-- 播放列表 - 现代化设计 -->
    <div
      v-if="showPlaylist"
      ref="playlistContainer"
      class="playlist-container"
      @click="handlePlaylistBackdropClick"
    >
      <!-- 遮罩层 -->
      <div ref="playlistBackdrop" class="playlist-backdrop" />

      <!-- 播放列表主体 -->
      <div ref="playlistPanel" class="playlist-panel">
        <!-- 拖拽手柄（移动端） -->
        <div class="playlist-handle">
          <div class="handle-bar" />
        </div>

        <!-- 播放列表头部 -->
        <div class="playlist-header">
          <div class="header-content">
            <div class="header-info">
              <h3 class="playlist-title">当前播放</h3>
              <span class="playlist-count">{{ playlist.length }} 首歌曲</span>
            </div>
            <button class="close-btn" @click="togglePlaylist">
              <i class="anzhiyufont anzhiyu-icon-xmark" />
            </button>
          </div>
        </div>

        <!-- 播放列表内容 -->
        <div class="playlist-body">
          <div ref="playlistList" class="playlist-list">
            <div
              v-for="(song, index) in playlist"
              :key="song.id || index"
              class="song-item"
              :class="{
                'is-active': index === audioPlayer.currentSongIndex.value
              }"
              @click="selectSong(index)"
            >
              <!-- 序号或播放状态 -->
              <div class="song-number">
                <span
                  v-if="index !== audioPlayer.currentSongIndex.value"
                  class="number"
                >
                  {{ String(index + 1).padStart(2, "0") }}
                </span>
                <div v-else class="playing-indicator">
                  <div
                    v-if="audioPlayer.audioState.isPlaying"
                    class="wave-animation"
                  >
                    <span class="wave-bar" />
                    <span class="wave-bar" />
                    <span class="wave-bar" />
                  </div>
                  <i v-else class="anzhiyufont anzhiyu-icon-pause" />
                </div>
              </div>

              <!-- 歌曲信息 -->
              <div class="song-content">
                <div class="song-meta">
                  <h4 class="song-title">{{ song.name }}</h4>
                  <p class="song-artist">{{ song.artist || "未知歌手" }}</p>
                </div>
              </div>

              <!-- 专辑封面 -->
              <div class="song-artwork">
                <img
                  v-if="song.pic"
                  :src="song.pic"
                  :alt="song.name"
                  @error="handleImageError"
                />
                <div v-else class="artwork-placeholder">
                  <IconifyIconOffline :icon="Music2Line" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 音频元素 -->
    <audio
      ref="audioElement"
      preload="none"
      @timeupdate="onTimeUpdate"
      @loadedmetadata="() => audioPlayer.onLoadedMetadata()"
      @loadstart="() => audioPlayer.onLoadStart()"
      @ended="() => audioPlayer.onEnded()"
      @error="event => audioPlayer.onError(event)"
    />
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  computed,
  reactive,
  onMounted,
  onBeforeUnmount,
  watch,
  nextTick
} from "vue";
import { gsap } from "gsap";
import FrontendHeader from "@/layout/frontend/components/hearder/index.vue";
import MusicHomeLyricsScroll from "@/components/MusicPlayer/MusicHomeLyricsScroll.vue";

// 导入composables
import { useAudioPlayer } from "@/composables/useAudioPlayer";
import { useLyrics } from "@/composables/useLyrics";
import { useMusicAPI } from "@/composables/useMusicAPI";
import { useColorExtraction } from "@/composables/useColorExtraction";

// 音乐播放器相关图标
import Music2Line from "@iconify-icons/ri/music-2-line";
import RefreshLine from "@iconify-icons/ri/refresh-line";
import LoaderLine from "@iconify-icons/ri/loader-line";
import VolumeMuteFill from "@iconify-icons/ri/volume-mute-fill";
import VolumeUpFill from "@iconify-icons/ri/volume-up-fill";
import VolumeDownFill from "@iconify-icons/ri/volume-down-fill";
import VolumeOffVibrateFill from "@iconify-icons/ri/volume-off-vibrate-fill";
import ListUnordered from "@iconify-icons/ri/list-unordered";
import ShuffleFill from "@iconify-icons/ri/shuffle-fill";
import RepeatOneFill from "@iconify-icons/ri/repeat-one-fill";
import OrderPlayFill from "@iconify-icons/ri/order-play-fill";

// 导入API
import { getPlaylistApi } from "@/api/music";

// 导入类型
import type { Song } from "@/types/music";

// 组件状态
const isLoadingCover = ref(false);
const showPlaylist = ref(false);
const audioElement = ref<HTMLAudioElement>();
const lyricsScrollRef = ref<{
  calculateCenterScroll: () => void;
  scrollToLyricIndex: (index: number) => void;
  scrollToLyricIndexSmooth: (index: number) => void;
  scrollToLyricIndexInstant: (index: number) => void;
  resetScrollState: () => void;
  debugScrollIssue: () => void;
  forceScroll: () => void;
}>();

// 进度条拖拽状态
const showProgressThumb = ref(false);
const isDragging = ref(false);
const dragProgress = ref(0); // 拖拽时的临时进度
const thumbPosition = ref(0); // thumb的位置百分比

// anzhiyumusic 风格音量控制状态
const showVolumeSlider = ref(false);
const volumeControlRef = ref<HTMLElement>();
const isVolumeDragging = ref(false);

// 播放模式和缓存状态
type PlayMode = "sequence" | "shuffle" | "repeat";
const playMode = ref<PlayMode>("shuffle");
const cacheStatus = reactive({
  isLoading: false,
  lastUpdateTime: null as Date | null,
  cacheKey: "music-playlist-cache"
});

// anzhiyumusic风格的拖拽性能优化
const dragLyricIndex = ref(-1); // 拖拽时的歌词索引
const lastLyricScrollTime = ref(0); // 上次歌词滚动时间
const cachedProgressRect = ref<DOMRect | null>(null); // 缓存的进度条位置信息
const LYRIC_SCROLL_THROTTLE = 50; // 优化为50ms，提升拖拽时的流畅度
const lastDragTime = ref(0); // 上次拖拽时间，用于优化拖拽响应

// 播放列表数据
const playlist = ref<Song[]>([]);

// 播放列表相关 refs
const playlistContainer = ref<HTMLElement>();
const playlistBackdrop = ref<HTMLElement>();
const playlistPanel = ref<HTMLElement>();
const playlistList = ref<HTMLElement>();

// 初始化composables
const musicAPI = useMusicAPI();
const colorExtraction = useColorExtraction();
const audioPlayer = useAudioPlayer(playlist, playMode);
const lyricsComposable = useLyrics(
  computed(() => audioPlayer.audioState.currentTime),
  isDragging
);

// 计算属性
const hasPlaylist = computed(() => playlist.value.length > 0);
const currentSong = computed(() => audioPlayer.currentSong.value);

// 基于主色调生成边框颜色
const borderColor = computed(() => {
  const dominantColor = colorExtraction.dominantColor.value;

  // 如果是CSS变量，使用默认白色边框
  if (dominantColor.startsWith("var(")) {
    return "rgba(255, 255, 255, 0.5)";
  }

  // 如果是rgba格式，提取RGB值并添加透明度
  if (dominantColor.startsWith("rgba(")) {
    // 从rgba(r, g, b, a)提取rgb值
    const rgba = dominantColor.match(
      /rgba\((\d+),\s*(\d+),\s*(\d+),\s*[\d.]+\)/
    );
    if (rgba) {
      const [, r, g, b] = rgba;
      return `rgba(${r}, ${g}, ${b}, 0.7)`;
    }
  }

  // 如果是rgb格式，转换为rgba
  if (dominantColor.startsWith("rgb(")) {
    const rgb = dominantColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgb) {
      const [, r, g, b] = rgb;
      return `rgba(${r}, ${g}, ${b}, 0.7)`;
    }
  }

  // 默认使用白色边框
  return "rgba(255, 255, 255, 0.5)";
});

// 方法
const formatTime = (seconds: number): string => {
  if (!seconds || isNaN(seconds)) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

// anzhiyumusic风格的歌词同步配置
const LYRIC_ADVANCE_TIME = 0.3; // 减少提前显示时间，更精准同步
const DRAG_LYRIC_ADVANCE_TIME = 0.1; // 拖拽时的提前量更小，保证跟手感

// 根据时间查找对应的歌词索引（anzhiyumusic风格）
const findLyricIndexByTime = (time: number, isDragging = false): number => {
  const lyrics = lyricsComposable.lyrics.value;
  if (lyrics.length === 0) return -1;

  // 拖拽时使用更小的提前量，确保歌词跟随手势
  const advanceTime = isDragging ? DRAG_LYRIC_ADVANCE_TIME : LYRIC_ADVANCE_TIME;
  const adjustedTime = time + advanceTime;

  // 优化的查找逻辑，模拟anzhiyumusic的精准定位
  let result = -1;
  for (let i = lyrics.length - 1; i >= 0; i--) {
    if (adjustedTime >= lyrics[i].time) {
      result = i;
      break;
    }
  }

  return result;
};

// anzhiyumusic风格的实时歌词滚动（拖拽专用）
const realtimeLyricScroll = (lyricIndex: number) => {
  const now = performance.now();
  // 优化节流时间，确保拖拽时的流畅体验
  if (now - lastLyricScrollTime.value < 50) {
    // 从原来的100ms优化到50ms
    return;
  }

  lastLyricScrollTime.value = now;
  if (lyricIndex >= 0 && lyricsScrollRef.value?.scrollToLyricIndexSmooth) {
    // 使用专门为拖拽优化的滚动方法
    lyricsScrollRef.value.scrollToLyricIndexSmooth(lyricIndex);
  }
};

const onCoverLoad = () => {
  isLoadingCover.value = false;
};

const onCoverError = () => {
  isLoadingCover.value = false;
};

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  img.style.display = "none";
};

const handleProgressClick = (event: MouseEvent) => {
  const target = event.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();
  const percentage = (event.clientX - rect.left) / rect.width;
  const newTime = percentage * audioPlayer.audioState.duration;

  console.log("🎵 [进度条点击] 处理进度条点击事件:", {
    clickX: event.clientX,
    rectLeft: rect.left,
    rectWidth: rect.width,
    percentage: (percentage * 100).toFixed(1) + "%",
    currentTime: audioPlayer.audioState.currentTime.toFixed(2),
    newTime: newTime.toFixed(2),
    duration: audioPlayer.audioState.duration.toFixed(2),
    timeDiff: (newTime - audioPlayer.audioState.currentTime).toFixed(2),
    hasAudio: !!audioPlayer.audioRef.value,
    currentLyricIndex: lyricsComposable.lyricsState.currentIndex
  });

  if (audioPlayer.audioRef.value) {
    // 跳转到新时间位置
    audioPlayer.seek(newTime);

    console.log("🎵 [进度条点击] 时间跳转完成，准备更新歌词状态");

    // 立即更新歌词状态，确保在暂停状态下也能滚动
    lyricsComposable.updateCurrentLyricIndex();

    // 重置用户滚动状态，允许自动滚动
    if (lyricsScrollRef.value) {
      console.log("🎵 [进度条点击] 重置歌词滚动状态并触发滚动");
      // 通过调用组件的公开方法来重置滚动状态并触发滚动
      nextTick(() => {
        if (lyricsScrollRef.value?.resetScrollState) {
          lyricsScrollRef.value.resetScrollState();
        }
      });
    } else {
      console.warn("🎵 [进度条点击] 歌词滚动组件引用不存在");
    }
  } else {
    console.warn("🎵 [进度条点击] 音频元素不存在，无法跳转");
  }
};

const handleVolumeChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const volume = parseFloat(target.value) / 100;
  audioPlayer.setVolume(volume);
};

// anzhiyumusic 风格音量控制方法
const toggleVolumeSlider = () => {
  showVolumeSlider.value = !showVolumeSlider.value;
  console.log("🔊 [音量控制] 切换垂直音量条显示:", {
    show: showVolumeSlider.value,
    currentVolume: (audioPlayer.audioState.volume * 100).toFixed(0) + "%"
  });
};

const handleVerticalVolumeChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const volume = parseFloat(target.value) / 100;
  audioPlayer.setVolume(volume);

  console.log("🔊 [垂直音量条] 音量变化:", {
    volume: (volume * 100).toFixed(0) + "%",
    isMuted: audioPlayer.audioState.isMuted
  });
};

const startVolumeDrag = () => {
  isVolumeDragging.value = true;
  console.log("🔊 [音量拖拽] 开始拖拽音量");
};

const endVolumeDrag = () => {
  isVolumeDragging.value = false;
  console.log("🔊 [音量拖拽] 结束拖拽音量");
};

// 点击外部关闭音量条
const handleClickOutside = (event: MouseEvent) => {
  if (
    showVolumeSlider.value &&
    volumeControlRef.value &&
    !volumeControlRef.value.contains(event.target as Node)
  ) {
    showVolumeSlider.value = false;
    console.log("🔊 [音量控制] 点击外部，关闭音量条");
  }
};

const handleProgressMouseDown = (event: MouseEvent) => {
  event.preventDefault();
  isDragging.value = true;

  // 保存进度条元素引用并缓存位置信息
  const progressTrack = event.currentTarget as HTMLElement;
  cachedProgressRect.value = progressTrack.getBoundingClientRect();

  // 高性能的百分比计算函数（使用缓存的rect）
  const calculatePercentage = (clientX: number) => {
    if (!cachedProgressRect.value) return 0;
    return Math.max(
      0,
      Math.min(
        100,
        ((clientX - cachedProgressRect.value.left) /
          cachedProgressRect.value.width) *
          100
      )
    );
  };

  // 高性能的时间和歌词计算函数
  const updateDragState = (percentage: number) => {
    // 毫秒级的进度条视觉更新
    dragProgress.value = percentage;
    thumbPosition.value = percentage;

    // 只有在有音频时长时才计算时间和歌词
    if (audioPlayer.audioState.duration > 0) {
      const currentDragTime =
        (percentage / 100) * audioPlayer.audioState.duration;

      // 避免重复计算：只有时间发生明显变化时才更新
      if (
        Math.abs(currentDragTime - audioPlayer.audioState.currentTime) > 0.2
      ) {
        // 直接更新音频播放器的当前时间，让时间显示跟随拖拽
        audioPlayer.audioState.currentTime = currentDragTime;

        const currentLyricIndex = findLyricIndexByTime(currentDragTime, true); // 标记为拖拽状态

        // 只有歌词索引改变时才更新（避免重复滚动）
        if (currentLyricIndex !== dragLyricIndex.value) {
          dragLyricIndex.value = currentLyricIndex;
          // 使用anzhiyumusic风格的实时歌词滚动
          realtimeLyricScroll(currentLyricIndex);
        }
      }
    }
  };

  // 高性能的mousemove处理 - 专注于视觉更新
  const handleMouseMove = (moveEvent: MouseEvent) => {
    if (!isDragging.value) return;

    const percentage = calculatePercentage(moveEvent.clientX);
    updateDragState(percentage);
  };

  const handleMouseUp = (upEvent: MouseEvent) => {
    const finalPercentage = calculatePercentage(upEvent.clientX);
    const newTime = (finalPercentage / 100) * audioPlayer.audioState.duration;

    // 清理事件监听和状态
    isDragging.value = false;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);

    // 拖拽结束时才更新音频位置
    if (audioPlayer.audioRef.value && audioPlayer.audioState.duration) {
      audioPlayer.seek(newTime);
    }

    // 重置拖拽状态
    dragLyricIndex.value = -1;
    cachedProgressRect.value = null; // 清理缓存

    // 立即同步thumb位置到实际播放进度（避免transition导致的位置跳跃）
    nextTick(() => {
      thumbPosition.value = audioPlayer.playedPercentage.value;

      // 拖拽结束时立即更新歌词索引（无防抖），确保准确响应
      lyricsComposable.updateCurrentLyricIndex();

      // 拖拽结束后，歌词滚动会自动由时间驱动的连续滚动接管
      // 不需要手动触发滚动，时间变化会自动触发平滑滚动
    });
  };

  // 绑定事件监听器
  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", handleMouseUp);

  // 立即处理初始位置
  const initialPercentage = calculatePercentage(event.clientX);
  updateDragState(initialPercentage);

  // 立即更新到拖拽开始位置的歌词（使用平滑滚动确保丝滑体验）
  if (
    dragLyricIndex.value >= 0 &&
    lyricsScrollRef.value?.scrollToLyricIndexSmooth
  ) {
    lyricsScrollRef.value.scrollToLyricIndexSmooth(dragLyricIndex.value);
  }
};

const togglePlaylist = async () => {
  console.log("🎵 [播放列表] 切换播放列表状态", {
    currentState: showPlaylist.value,
    action: showPlaylist.value ? "关闭" : "显示",
    screenWidth: window.innerWidth,
    isMobile: window.innerWidth <= 768
  });

  if (showPlaylist.value) {
    // 关闭播放列表
    await hidePlaylist();
  } else {
    // 显示播放列表
    await showPlaylistWithAnimation();
  }
};

// 显示播放列表（保留面板动画，移除song-item动画）
const showPlaylistWithAnimation = async () => {
  showPlaylist.value = true;

  await nextTick();

  if (
    !playlistContainer.value ||
    !playlistBackdrop.value ||
    !playlistPanel.value
  )
    return;

  // 检测是否为移动端
  const isMobile = window.innerWidth <= 768;

  console.log("🎵 [播放列表] 显示播放列表面板动画（无song-item动画）", {
    isMobile,
    screenWidth: window.innerWidth,
    hasContainer: !!playlistContainer.value,
    hasBackdrop: !!playlistBackdrop.value,
    hasPanel: !!playlistPanel.value
  });

  // 初始状态
  gsap.set(playlistBackdrop.value, { opacity: 0 });

  if (isMobile) {
    // 移动端：从底部滑入
    gsap.set(playlistPanel.value, {
      y: "100%",
      x: "0%",
      opacity: 1
    });

    // 动画时间线
    const tl = gsap.timeline();
    tl.to(playlistBackdrop.value, {
      opacity: 1,
      duration: 0.3,
      ease: "power2.out"
    }).to(
      playlistPanel.value,
      {
        y: "0%",
        duration: 0.4,
        ease: "power3.out"
      },
      0.1
    );

    // song-item无动画，直接显示
  } else {
    // 桌面端：从右侧滑入
    gsap.set(playlistPanel.value, {
      x: "100%",
      y: "0%",
      opacity: 1
    });

    const tl = gsap.timeline();
    tl.to(playlistBackdrop.value, {
      opacity: 1,
      duration: 0.25,
      ease: "power2.out"
    }).to(
      playlistPanel.value,
      {
        x: "0%",
        duration: 0.35,
        ease: "power3.out"
      },
      0.1
    );

    // song-item无动画，直接显示
  }
};

// 隐藏播放列表（保留面板动画，移除song-item动画）
const hidePlaylist = () => {
  return new Promise<void>(resolve => {
    if (
      !playlistContainer.value ||
      !playlistBackdrop.value ||
      !playlistPanel.value
    ) {
      showPlaylist.value = false;
      resolve();
      return;
    }

    const isMobile = window.innerWidth <= 768;
    console.log("🎵 [播放列表] 隐藏播放列表面板动画（无song-item动画）", {
      isMobile,
      hasContainer: !!playlistContainer.value
    });

    const tl = gsap.timeline({
      onComplete: () => {
        showPlaylist.value = false;
        resolve();
      }
    });

    // 面板消失动画（无song-item动画）
    if (isMobile) {
      tl.to(
        playlistPanel.value,
        {
          y: "100%",
          x: "0%",
          duration: 0.35,
          ease: "power2.in"
        },
        0
      );
    } else {
      tl.to(
        playlistPanel.value,
        {
          x: "100%",
          y: "0%",
          duration: 0.3,
          ease: "power2.in"
        },
        0
      );
    }

    // 遮罩消失
    tl.to(
      playlistBackdrop.value,
      {
        opacity: 0,
        duration: 0.2,
        ease: "power1.in"
      },
      0.1
    );
  });
};

// 点击遮罩层关闭播放列表
const handlePlaylistBackdropClick = (event: Event) => {
  // 点击遮罩层或容器本身（但不是面板）时关闭播放列表
  if (
    event.target === playlistBackdrop.value ||
    event.target === playlistContainer.value
  ) {
    togglePlaylist();
  }
};

const selectSong = (index: number) => {
  audioPlayer.handlePlaylistItemClick(index);
};

const handlePlayPause = () => {
  audioPlayer.togglePlay();
};

// 获取播放按钮的标题
const getPlayButtonTitle = (): string => {
  if (audioPlayer.audioLoadingState.value.isLoading) {
    const loadingType = audioPlayer.audioLoadingState.value.loadingType;
    const progress = audioPlayer.audioLoadingState.value.progress;
    return `加载中... (${progress}%) - ${loadingType === "full" ? "完整音频" : "音频信息"}`;
  }
  return audioPlayer.audioState.isPlaying ? "暂停" : "播放";
};

const handleLyricClick = (lyricIndex: number) => {
  const lyrics = lyricsComposable.lyrics.value;

  console.log("🎵 [歌词点击处理] 处理歌词点击事件:", {
    lyricIndex,
    totalLyrics: lyrics.length,
    hasAudio: !!audioPlayer.audioRef.value,
    targetLyric: lyrics[lyricIndex]?.text?.substring(0, 50) + "..." || "无歌词",
    targetTime: lyrics[lyricIndex]?.time?.toFixed(2) || "无时间",
    currentTime: audioPlayer.audioState.currentTime.toFixed(2),
    currentIndex: lyricsComposable.lyricsState.currentIndex,
    isPlaying: audioPlayer.audioState.isPlaying
  });

  if (lyrics && lyrics[lyricIndex] && audioPlayer.audioRef.value) {
    const targetTime = lyrics[lyricIndex].time;

    console.log("🎵 [歌词点击处理] 准备跳转到目标时间:", {
      targetTime: targetTime.toFixed(2),
      timeDiff: (targetTime - audioPlayer.audioState.currentTime).toFixed(2),
      direction:
        targetTime > audioPlayer.audioState.currentTime
          ? "向前跳转"
          : "向后跳转"
    });

    // 使用 seek 方法跳转到指定时间，确保一致性和边界检查
    audioPlayer.seek(targetTime);

    console.log("🎵 [歌词点击处理] 时间跳转完成，歌词滚动将自动处理");

    // 歌词索引和滚动都会通过时间驱动的连续滚动自动处理
    // 不需要手动触发滚动，时间变化会自动触发平滑的连续滚动
  } else {
    console.warn("🎵 [歌词点击处理] 歌词点击失败:", {
      hasLyrics: !!lyrics,
      hasTargetLyric: !!(lyrics && lyrics[lyricIndex]),
      hasAudioRef: !!audioPlayer.audioRef.value,
      lyricIndex
    });
  }
};

// 播放模式控制方法
const getPlayModeIcon = () => {
  switch (playMode.value) {
    case "shuffle":
      return ShuffleFill;
    case "repeat":
      return RepeatOneFill;
    case "sequence":
    default:
      return OrderPlayFill;
  }
};

const getPlayModeTitle = (): string => {
  switch (playMode.value) {
    case "shuffle":
      return "随机播放";
    case "repeat":
      return "单曲循环";
    case "sequence":
    default:
      return "顺序播放";
  }
};

const togglePlayMode = () => {
  const modes: PlayMode[] = ["sequence", "shuffle", "repeat"];
  const currentIndex = modes.indexOf(playMode.value);
  const nextIndex = (currentIndex + 1) % modes.length;
  playMode.value = modes[nextIndex];

  // 保存播放模式到本地存储
  localStorage.setItem("music-play-mode", playMode.value);

  console.log("🔄 [播放模式] 切换到:", getPlayModeTitle(), {
    mode: playMode.value,
    icon: getPlayModeIcon()
  });
};

// 缓存相关方法
const getCacheKey = () =>
  `${cacheStatus.cacheKey}-${new Date().toDateString()}`;

const getCachedPlaylist = (): Song[] | null => {
  try {
    const cached = localStorage.getItem(getCacheKey());
    if (cached) {
      const parsedCache = JSON.parse(cached);
      console.log("💾 [缓存] 从缓存加载播放列表:", {
        songCount: parsedCache.songs?.length || 0,
        cacheTime: parsedCache.timestamp
      });
      return parsedCache.songs || null;
    }
  } catch (error) {
    console.error("❌ [缓存] 读取缓存失败:", error);
  }
  return null;
};

const setCachedPlaylist = (songs: Song[]) => {
  try {
    const cacheData = {
      songs,
      timestamp: new Date().toISOString(),
      version: "1.0"
    };
    localStorage.setItem(getCacheKey(), JSON.stringify(cacheData));
    cacheStatus.lastUpdateTime = new Date();

    // 清理旧缓存（保留最近3天）
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(cacheStatus.cacheKey) && key !== getCacheKey()) {
        localStorage.removeItem(key);
      }
    });

    console.log("💾 [缓存] 播放列表已缓存:", {
      songCount: songs.length,
      cacheKey: getCacheKey()
    });
  } catch (error) {
    console.error("❌ [缓存] 缓存失败:", error);
  }
};

const refreshCache = async () => {
  if (cacheStatus.isLoading) return;

  cacheStatus.isLoading = true;
  console.log("🔄 [刷新缓存] 开始刷新播放列表缓存");

  try {
    const response = await getPlaylistApi();
    if (response.data && response.data.songs) {
      playlist.value = response.data.songs;

      // 更新缓存
      setCachedPlaylist(playlist.value);

      // 如果当前没有歌曲，选择第一首
      if (playlist.value.length > 0 && !audioPlayer.currentSong.value) {
        audioPlayer.currentSongIndex.value = 0;
        await audioPlayer.loadAudio(playlist.value[0]);
      }

      console.log("✅ [刷新缓存] 播放列表缓存已刷新:", {
        songCount: playlist.value.length,
        currentSong: audioPlayer.currentSong.value?.name || "无"
      });
    }
  } catch (error) {
    console.error("❌ [刷新缓存] 刷新失败:", error);
  } finally {
    cacheStatus.isLoading = false;
  }
};

const loadPlaylist = async () => {
  // 首先尝试从缓存加载
  const cachedSongs = getCachedPlaylist();
  if (cachedSongs && cachedSongs.length > 0) {
    playlist.value = cachedSongs;
    if (playlist.value.length > 0) {
      audioPlayer.currentSongIndex.value = 0;
      await audioPlayer.loadAudio(playlist.value[0]);
    }
    return;
  }

  // 缓存不存在或为空，从API加载
  try {
    const response = await getPlaylistApi();
    if (response.data && response.data.songs) {
      playlist.value = response.data.songs;

      // 缓存到本地存储
      setCachedPlaylist(playlist.value);

      // 如果有歌曲，自动选择第一首
      if (playlist.value.length > 0) {
        audioPlayer.currentSongIndex.value = 0;
        await audioPlayer.loadAudio(playlist.value[0]);
      }
    }
  } catch (error) {
    console.error("❌ [播放列表] 加载失败:", error);
  }
};

const onTimeUpdate = () => {
  // 如果正在拖拽进度条，不更新音频播放器的时间状态，避免与拖拽状态冲突
  if (!isDragging.value) {
    console.log("🎵 [时间更新] 音频时间更新:", {
      currentTime: audioPlayer.audioState.currentTime.toFixed(2),
      duration: audioPlayer.audioState.duration.toFixed(2),
      playedPercentage: audioPlayer.playedPercentage.value.toFixed(1) + "%",
      isPlaying: audioPlayer.audioState.isPlaying,
      currentLyricIndex: lyricsComposable.lyricsState.currentIndex,
      dragState: "非拖拽状态"
    });

    // 更新音频播放器状态
    audioPlayer.onTimeUpdate();
    // 歌词索引会通过 useLyrics 内部的 watch 自动更新，无需手动调用
  } else {
    console.log("🎵 [时间更新] 拖拽中，跳过时间更新:", {
      dragProgress: dragProgress.value.toFixed(1) + "%",
      dragLyricIndex: dragLyricIndex.value,
      currentTime: audioPlayer.audioState.currentTime.toFixed(2)
    });
  }
  // 拖拽时不需要任何操作，时间和歌词都由拖拽逻辑控制
};

// 监听播放进度，同步thumb位置（非拖拽状态下）
watch(
  () => audioPlayer.playedPercentage.value,
  newPercentage => {
    if (!isDragging.value) {
      thumbPosition.value = newPercentage;
      console.log("🎵 [进度同步] 更新进度条位置:", {
        percentage: newPercentage.toFixed(1) + "%",
        currentTime: audioPlayer.audioState.currentTime.toFixed(2),
        duration: audioPlayer.audioState.duration.toFixed(2)
      });
    }
  }
);

// 监听当前歌曲变化，提取颜色和加载歌词
watch(
  () => audioPlayer.currentSong.value,
  async (newSong, oldSong) => {
    console.log("🎵 [歌曲变化] 当前歌曲发生变化:", {
      oldSong: oldSong
        ? {
            name: oldSong.name?.substring(0, 30) + "..." || "未知歌曲",
            artist: oldSong.artist || "未知艺术家",
            hasPic: !!oldSong.pic,
            hasUrl: !!oldSong.url
          }
        : null,
      newSong: newSong
        ? {
            name: newSong.name?.substring(0, 30) + "..." || "未知歌曲",
            artist: newSong.artist || "未知艺术家",
            hasPic: !!newSong.pic,
            hasUrl: !!newSong.url
          }
        : null,
      currentTime: audioPlayer.audioState.currentTime.toFixed(2),
      isPlaying: audioPlayer.audioState.isPlaying
    });

    // 🎵 重置进度条相关状态
    if (oldSong !== newSong) {
      console.log("🎵 [歌曲变化] 重置进度条和拖拽状态");

      // 重置拖拽相关状态
      isDragging.value = false;
      dragProgress.value = 0;
      thumbPosition.value = 0;
      dragLyricIndex.value = -1;
      lastLyricScrollTime.value = 0;
      cachedProgressRect.value = null;

      // 清理可能正在进行的拖拽事件
      document.removeEventListener("mousemove", () => {});
      document.removeEventListener("mouseup", () => {});
    }

    // 处理专辑封面和颜色提取
    if (newSong?.pic) {
      console.log("🎵 [歌曲变化] 开始提取专辑封面主色调");
      isLoadingCover.value = true;
      await colorExtraction.extractAndSetDominantColor(newSong.pic);
    } else {
      console.log("🎵 [歌曲变化] 无专辑封面，重置为默认颜色");
      colorExtraction.resetToDefaultColor();
    }

    // 注意：歌曲资源获取（高质量音频和歌词）现在由 useAudioPlayer.loadSongWithResources 处理
    // 这样可以确保先获取资源再加载音频，避免时序问题
    console.log("🎵 [歌曲变化] UI处理完成，音频和歌词由音频播放器内部处理");
  },
  { immediate: true }
);

// 监听音频播放器的歌词变化
watch(
  () => audioPlayer.currentLyricsText.value,
  newLyricsText => {
    if (newLyricsText) {
      console.log(
        "🎵 [歌词变化] 音频播放器提供新歌词，长度:",
        newLyricsText.length
      );
      lyricsComposable.setLyrics(newLyricsText);

      // 歌词设置完成后，延迟触发滚动计算
      nextTick().then(() => {
        console.log("🎵 [歌词变化] DOM更新完成，800ms后触发歌词居中滚动");
        setTimeout(() => {
          if (lyricsScrollRef.value?.calculateCenterScroll) {
            console.log("🎵 [歌词变化] 执行歌词居中滚动");
            lyricsScrollRef.value.calculateCenterScroll();
          } else {
            console.warn("🎵 [歌词变化] 歌词滚动组件引用不存在");
          }
        }, 800);
      });
    } else {
      console.log("🎵 [歌词变化] 清空歌词");
      lyricsComposable.clearLyrics();
    }
  },
  { immediate: true }
);

// anzhiyumusic风格的键盘快捷键处理
const handleKeydown = (event: KeyboardEvent) => {
  // 只在没有输入框焦点时响应快捷键
  if (
    event.target instanceof HTMLInputElement ||
    event.target instanceof HTMLTextAreaElement
  ) {
    return;
  }

  console.log("⌨️ [键盘快捷键] 检测到按键:", {
    key: event.key,
    code: event.code,
    isPlaying: audioPlayer.audioState.isPlaying,
    currentVolume: audioPlayer.audioState.volume
  });

  switch (event.code) {
    case "Space":
      // anzhiyumusic风格：空格键暂停/播放
      event.preventDefault();
      handlePlayPause();
      console.log("⌨️ [Space] 切换播放状态");
      break;

    case "ArrowUp":
      // anzhiyumusic风格：上箭头增加音量
      event.preventDefault();
      const newVolumeUp = Math.min(1, audioPlayer.audioState.volume + 0.1);
      audioPlayer.setVolume(newVolumeUp);
      console.log("⌨️ [↑] 音量增加到:", (newVolumeUp * 100).toFixed(0) + "%");
      break;

    case "ArrowDown":
      // anzhiyumusic风格：下箭头减少音量
      event.preventDefault();
      const newVolumeDown = Math.max(0, audioPlayer.audioState.volume - 0.1);
      audioPlayer.setVolume(newVolumeDown);
      console.log("⌨️ [↓] 音量减少到:", (newVolumeDown * 100).toFixed(0) + "%");
      break;

    case "ArrowLeft":
      // anzhiyumusic风格：左箭头上一曲
      event.preventDefault();
      if (hasPlaylist.value) {
        audioPlayer.previousSong();
        console.log("⌨️ [←] 上一曲");
      }
      break;

    case "ArrowRight":
      // anzhiyumusic风格：右箭头下一曲
      event.preventDefault();
      if (hasPlaylist.value) {
        audioPlayer.nextSong();
        console.log("⌨️ [→] 下一曲");
      }
      break;

    default:
      break;
  }
};

// 组件挂载
onMounted(async () => {
  console.log("🚀 [组件挂载] 音乐主页组件开始挂载:", {
    hasAudioElement: !!audioElement.value,
    hasLyricsScrollRef: !!lyricsScrollRef.value,
    timestamp: new Date().toLocaleTimeString()
  });

  // 设置音频元素引用
  if (audioElement.value) {
    console.log("🚀 [组件挂载] 设置音频元素引用");
    audioPlayer.audioRef.value = audioElement.value;
  } else {
    console.warn("🚀 [组件挂载] 音频元素不存在");
  }

  // 恢复播放模式设置
  const savedPlayMode = localStorage.getItem("music-play-mode") as PlayMode;
  if (
    savedPlayMode &&
    ["sequence", "shuffle", "repeat"].includes(savedPlayMode)
  ) {
    playMode.value = savedPlayMode;
    console.log("🔄 [播放模式] 恢复保存的播放模式:", getPlayModeTitle());
  } else {
    console.log("🔄 [播放模式] 使用默认播放模式:", getPlayModeTitle());
  }

  // 加载播放列表（优先从缓存加载）
  console.log("🚀 [组件挂载] 开始加载播放列表");
  await loadPlaylist();

  // 默认不显示播放列表
  showPlaylist.value = false;

  // 添加anzhiyumusic风格的键盘事件监听
  document.addEventListener("keydown", handleKeydown);

  // 添加点击外部关闭音量条的事件监听
  document.addEventListener("click", handleClickOutside);

  console.log("⌨️ [键盘快捷键] anzhiyumusic风格快捷键已启用:", {
    shortcuts: [
      "Space - 播放/暂停",
      "↑ - 音量+",
      "↓ - 音量-",
      "← - 上一曲",
      "→ - 下一曲"
    ]
  });

  console.log("🔊 [音量控制] anzhiyumusic风格音量控制已启用");

  console.log("🚀 [组件挂载] 音乐主页组件挂载完成:", {
    playlistLength: playlist.value.length,
    currentSongIndex: audioPlayer.currentSongIndex.value,
    hasCurrentSong: !!audioPlayer.currentSong.value,
    currentSongName: audioPlayer.currentSong.value?.name || "无歌曲"
  });

  // 暴露调试方法到全局，方便在控制台调试
  (window as any).musicDebug = {
    // 歌词滚动调试
    debugLyricsScroll: () => {
      if (lyricsScrollRef.value?.debugScrollIssue) {
        lyricsScrollRef.value.debugScrollIssue();
      } else {
        console.warn("🔍 歌词滚动组件引用不存在");
      }
    },

    // 强制歌词滚动
    forceLyricsScroll: () => {
      if (lyricsScrollRef.value?.forceScroll) {
        lyricsScrollRef.value.forceScroll();
      } else {
        console.warn("🚀 歌词滚动组件引用不存在");
      }
    },

    // 重置歌词滚动状态
    resetLyricsScroll: () => {
      if (lyricsScrollRef.value?.resetScrollState) {
        lyricsScrollRef.value.resetScrollState();
      } else {
        console.warn("🔄 歌词滚动组件引用不存在");
      }
    },

    // 立即重置用户滚动状态（针对滚动被阻止的问题）
    fixUserScrolling: () => {
      console.log(
        "🛠️ [快速修复] 立即重置用户滚动状态 - 简化后的滚动只在歌词索引变化时触发"
      );
      if (lyricsScrollRef.value?.resetScrollState) {
        lyricsScrollRef.value.resetScrollState();
        console.log(
          "✅ [快速修复] 用户滚动状态已重置，歌词索引变化时将正常滚动"
        );
      } else {
        console.warn("🛠️ [快速修复] 歌词滚动组件引用不存在");
      }
    },

    // 获取当前歌词状态
    getLyricsState: () => {
      return {
        currentIndex: lyricsComposable.lyricsState.currentIndex,
        totalLyrics: lyricsComposable.lyrics.value.length,
        currentTime: audioPlayer.audioState.currentTime,
        isPlaying: audioPlayer.audioState.isPlaying,
        currentLyric:
          lyricsComposable.lyrics.value[
            lyricsComposable.lyricsState.currentIndex
          ]?.text || "无歌词"
      };
    },

    // 获取音频状态
    getAudioState: () => {
      return {
        currentTime: audioPlayer.audioState.currentTime,
        duration: audioPlayer.audioState.duration,
        isPlaying: audioPlayer.audioState.isPlaying,
        volume: audioPlayer.audioState.volume,
        playedPercentage: audioPlayer.playedPercentage.value
      };
    },

    // anzhiyumusic键盘快捷键说明
    showKeyboardShortcuts: () => {
      console.log("⌨️ [anzhiyumusic快捷键说明]:", {
        Space: "播放/暂停音乐",
        "↑": "音量增加 10%",
        "↓": "音量减少 10%",
        "←": "上一曲",
        "→": "下一曲",
        note: "需要确保页面焦点在音乐播放器上，且没有输入框被激活"
      });
    }
  };

  console.log("🛠️ [调试工具] 全局调试方法已暴露到 window.musicDebug:", {
    availableMethods: [
      "debugLyricsScroll() - 诊断歌词滚动问题",
      "forceLyricsScroll() - 强制执行歌词滚动",
      "resetLyricsScroll() - 重置歌词滚动状态",
      "fixUserScrolling() - 立即修复用户滚动状态问题",
      "getLyricsState() - 获取当前歌词状态",
      "getAudioState() - 获取音频播放状态"
    ]
  });
});

// 组件卸载
onBeforeUnmount(() => {
  // 清理anzhiyumusic键盘事件监听
  document.removeEventListener("keydown", handleKeydown);
  // 清理音量控制点击外部事件监听
  document.removeEventListener("click", handleClickOutside);
  console.log("🧹 [组件卸载] 已清理键盘快捷键和音量控制监听");

  audioPlayer.cleanup();
  lyricsComposable.cleanup();
  colorExtraction.cleanup();

  // 清理全局调试方法
  if ((window as any).musicDebug) {
    delete (window as any).musicDebug;
    console.log("🧹 [组件卸载] 已清理全局调试方法");
  }
});
</script>

<style lang="scss" scoped>
.music-home {
  min-height: 100vh;
  position: relative;
  background: transparent; // 移除黑色背景，让动态背景显示
  color: #fff;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

// 动态音乐背景
#music_bg,
.music-background {
  display: block;
  position: fixed;
  z-index: -1;
  width: 200%;
  height: 200%;
  top: -50%;
  left: -50%;
  background-position: center center;
  background-size: cover;
  background-repeat: no-repeat;
  transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  filter: blur(60px) brightness(0.4) saturate(1.2);
  transform: scale(1.1) rotate(0deg);
  will-change: background-image, background-color, transform;

  .music-home:not(.no-song) & {
    animation: musicBackgroundFlow 20s ease-in-out infinite;
  }

  // 当没有歌曲时的状态
  .music-home.no-song & {
    opacity: 0.8;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
    filter: blur(80px) brightness(0.3) saturate(0.9);
  }
}

.background-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    135deg,
    rgba(0, 0, 0, 0.3) 0%,
    rgba(0, 0, 0, 0.5) 50%,
    rgba(0, 0, 0, 0.4) 100%
  );
  backdrop-filter: blur(10px);
  z-index: 0;
}

.music-container {
  position: relative;
  z-index: 3;
  max-width: 1200px;
  margin: 0 auto;
  // 桌面端需要考虑 frontend-header 的 60px 高度
  min-height: calc(100vh - 60px);
  box-sizing: border-box;
}

.top-actions {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 40px;
  display: none;

  .page-title {
    h1 {
      font-size: 48px;
      font-weight: 800;
      margin: 0 0 4px;
      letter-spacing: -0.02em;
    }

    p {
      font-size: 16px;
      color: rgba(255, 255, 255, 0.6);
      margin: 0;
      font-weight: 400;
    }
  }

  .action-buttons {
    display: flex;
    gap: 12px;
  }

  .action-btn {
    width: 44px;
    height: 44px;
    border-radius: 22px;
    background: rgba(255, 255, 255, 0.1);
    border: none;
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    transition: all 0.2s ease;
    backdrop-filter: blur(20px);

    &:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: scale(1.05);
    }

    &:active {
      transform: scale(0.95);
    }
  }
}

// Player section
.player-section {
  display: flex;
  // 桌面端确保不会超出容器高度
  max-height: calc(100vh - 60px);
  overflow: hidden;
  box-sizing: border-box;
}

.album-artwork {
  position: relative;
  height: 100%;
  width: 100%;
  display: flex;
  flex: 1;
  align-items: center;
  overflow: visible;
  flex-direction: column;

  .artwork-container {
    height: 100%;
    width: 100%;
    position: relative;
    aspect-ratio: 1;
    border-radius: 24px;
    overflow: visible;
    transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1;

    &.is-playing {
      transform: scale(1.02);
    }
  }

  .vinyl-background {
    position: absolute;
    top: 60%;
    left: 68%;
    transform: translate(-50%, -50%);
    width: 100%;
    height: 100%;
    object-fit: contain;
    z-index: 0;
    pointer-events: none;
  }
  .artwork-image-vinyl-background {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 50%;
    z-index: 1;
    transition: transform 0.3s ease;

    // 播放时的唱片旋转
    .artwork-container.is-playing & {
      animation: vinyl-spin 3s linear infinite;
    }
  }
  .artwork-image-vinyl-inner-background {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 50%;
    transform: translate(-50%, -50%);
    z-index: 1;
  }
  .artwork-image-needle-background {
    position: absolute;
    top: 15%;
    right: 19%;
    height: 58%;
    z-index: 3;
    transform-origin: 50% 70px;
    transition: transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);

    &.needle-playing {
      transform: rotate(14deg);
    }
    @media (max-width: 768px) {
      height: 60%;
      transform-origin: 50% 40px;
    }
  }
  .artwork-image-groove-background {
    position: absolute;
    top: 17%;
    right: 19.4%;
    height: 56.5%;
  }

  .artwork-image {
    width: 30%;
    height: 30%;
    border-radius: 50%;
    object-fit: cover;
    position: relative;
    z-index: 2;
    border: 7px solid transparent;
    transition: transform 0.3s ease;

    // 播放时的专辑封面旋转
    .artwork-container.is-playing & {
      animation: vinyl-spin 3s linear infinite;
    }
  }

  .artwork-image-blur {
    width: 50%;
    height: 50%;
    border-radius: 50%;
    object-fit: cover;
    position: absolute;
    z-index: 1;
    opacity: 0.7;
    filter: blur(8px);
    clip-path: circle(90% at center);
  }

  .artwork-border-ring {
    width: 50%;
    height: 50%;
    border-radius: 50%;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 1;
    border: 3px solid rgba(139, 139, 139, 0.5);
    background: transparent;
    pointer-events: none;
    box-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
  }

  .artwork-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    z-index: 2;

    i {
      font-size: 64px;
      color: rgba(255, 255, 255, 0.3);
    }
  }

  .playing-indicator {
    position: absolute;
    bottom: 23%;
    right: 21%;
    width: 32px;
    height: 32px;
    background: rgba(0, 0, 0, 0.6);
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(20px);
    z-index: 3;
    @media (max-width: 768px) {
      display: none;
    }
  }

  .sound-wave {
    display: flex;
    gap: 2px;
    align-items: flex-end;
    height: 16px;

    .wave-bar {
      width: 2px;
      background: white;
      border-radius: 1px;
      animation: wave 1.2s ease-in-out infinite;

      &:nth-child(1) {
        animation-delay: 0s;
      }
      &:nth-child(2) {
        animation-delay: 0.1s;
      }
      &:nth-child(3) {
        animation-delay: 0.2s;
      }
      &:nth-child(4) {
        animation-delay: 0.3s;
      }
    }
  }
}

// 歌曲信息和歌词的容器
.track-info-and-lyrics {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  height: 100%;
  flex: 1;
  margin-bottom: 32px;
  text-align: center;
  min-height: 540px;
  max-height: 540px;
}

// Track info
.track-info {
  position: relative;
  bottom: 100px;
  .track-title {
    font-size: 32px;
    font-weight: 700;
    margin: 0;
    line-height: 1.2;
    letter-spacing: -0.01em;
  }
}

// Playback controls
.playback-controls {
  padding: 0 20px;

  .progress-container {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 32px;
    padding: 8px 0; // 为 thumb 留出垂直空间

    .time-label {
      font-size: 13px;
      color: rgba(255, 255, 255, 0.6);
      font-weight: 500;
      font-variant-numeric: tabular-nums;
      min-width: 36px;
    }

    .progress-track {
      flex: 1;
      height: 6px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 3px;
      position: relative;
      cursor: pointer;
      transition: all 0.3s ease-in-out;
      overflow: visible; // 改为 visible 以显示 thumb

      &:hover {
        height: 8px;
      }

      &.is-loading {
        background: rgba(255, 255, 255, 0.15);
      }

      // 音频加载进度条（最底层，淡蓝色渐变）
      .progress-loading {
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        background: linear-gradient(
          90deg,
          rgba(217, 217, 217, 0.3) 0%,
          rgba(217, 217, 217, 0.5) 50%,
          rgba(217, 217, 217, 0.3) 100%
        );
        border-radius: 3px;
        transition: width 0.3s ease;
        z-index: 1;
        overflow: hidden; // 防止内容溢出

        // 加载时的呼吸动画
        animation: loadingPulse 2s ease-in-out infinite;
      }

      // 缓冲进度条（中间层，改进视觉效果）
      .progress-buffer {
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 3px;
        transition:
          width 0.2s ease,
          background-color 0.3s ease;
        z-index: 2;
        overflow: hidden; // 防止内容溢出

        &.has-content {
          background: rgba(255, 255, 255, 0.4);
          box-shadow: 0 0 4px rgba(255, 255, 255, 0.2);
        }
      }

      .progress-fill {
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        background: white;
        border-radius: 3px;
        transition: width 0.1s ease;
        z-index: 3;
        overflow: hidden; // 防止内容溢出
        box-shadow: 0 0 8px rgba(255, 255, 255, 0.4);
      }

      // 拖拽时禁用进度条填充的transition，确保与小球同步
      &.dragging .progress-fill {
        transition: none !important;
      }

      .progress-thumb {
        position: absolute;
        top: 50%;
        left: 0;
        margin-top: -8px;
        margin-left: -8px;
        height: 16px;
        width: 16px;
        background: #fff !important;
        border-radius: 50%;
        cursor: pointer;
        z-index: 4; // 确保thumb在所有进度条元素之上
        // 分离不同属性的transition - 位置变化要快，其他效果可以慢一些
        transition:
          transform 0.2s ease-in-out,
          box-shadow 0.2s ease-in-out;
        transform: scale(0);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);

        &.show {
          transform: scale(1);
        }
      }

      // 当正在拖拽时的样式
      &.dragging .progress-thumb {
        transform: scale(1.2);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
        z-index: 5; // 拖拽时提升到最高层级
        // 拖拽时禁用所有transition，确保小球与进度条填充同步
        transition: none !important;
      }
    }
  }

  .control-buttons {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px; // 减小间距以容纳更多按钮
    margin-bottom: 32px;
    flex-wrap: wrap; // 允许换行以适应不同屏幕尺寸

    .control-btn {
      border: none;
      background: none;
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;

      &:disabled {
        opacity: 0.4;
        cursor: not-allowed;

        &.secondary {
          background: rgba(255, 255, 255, 0.3);
          color: rgba(0, 0, 0, 0.4);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        &.primary {
          background: rgba(255, 255, 255, 0.5);
          color: rgba(0, 0, 0, 0.3);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
        }
      }

      &.secondary {
        width: 56px;
        height: 56px;
        background: rgba(255, 255, 255, 0.9);
        color: rgba(0, 0, 0, 0.8);
        border-radius: 50%;
        font-size: 20px;
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
        backdrop-filter: blur(10px);

        &:hover:not(:disabled) {
          transform: scale(1.05);
          background: rgba(255, 255, 255, 0.95);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
        }

        &:active {
          transform: scale(0.95);
        }
      }

      &.primary {
        width: 64px;
        height: 64px;
        background: white;
        color: black;
        border-radius: 50%;
        font-size: 24px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
        position: relative;
        overflow: hidden;

        &:hover:not(:disabled) {
          transform: scale(1.05);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4);
        }

        &:active {
          transform: scale(0.95);
        }

        // 加载状态样式
        &.is-loading {
          background: linear-gradient(
            45deg,
            #f0f0f0 0%,
            white 50%,
            #f0f0f0 100%
          );
          background-size: 200% 200%;
          animation: loadingGradient 2s ease-in-out infinite;

          .loading-icon {
            animation: spin 1s linear infinite;
            font-size: 20px;
            color: rgba(0, 0, 0, 0.6);
          }
        }
      }
    }

    // anzhiyumusic 风格音量控制容器
    .volume-control-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;

      // volume-toggle 继承 .control-btn.secondary 样式，无需额外定义

      // anzhiyumusic 风格垂直音量条
      .vertical-volume-slider {
        position: absolute;
        bottom: 70px;
        left: 50%;
        transform: translateX(-50%);
        width: 40px;
        height: 120px;
        background: rgba(255, 255, 255, 0.95);
        border-radius: 20px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        backdrop-filter: blur(15px);
        padding: 10px 8px;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        z-index: 1000;

        &.show {
          opacity: 1;
          visibility: visible;
          transform: translateX(-50%) translateY(-10px);
        }

        .volume-track {
          position: relative;
          width: 24px;
          height: 100px;
          border-radius: 12px;

          .volume-fill {
            display: none;
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            border-radius: 12px;
            transition: height 0.1s ease;
            box-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
          }

          .volume-range {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            writing-mode: bt-lr; /* 垂直方向 */
            writing-mode: vertical-lr;
            direction: rtl;
            background: transparent;
            border: none;
            outline: none;
            cursor: pointer;
            z-index: 2;

            // Webkit 样式
            &::-webkit-slider-thumb {
              -webkit-appearance: none;
              width: 20px;
              height: 20px;
              border-radius: 50%;
              background: white;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
              cursor: pointer;
              border: 2px solid var(--dominant-color, #667eea);
              transition: all 0.2s ease;

              &:hover {
                transform: scale(1.2);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
              }
            }

            &::-webkit-slider-track {
              background: transparent;
              border: none;
            }

            // Firefox 样式
            &::-moz-range-thumb {
              width: 20px;
              height: 20px;
              border-radius: 50%;
              background: white;
              border: 2px solid var(--dominant-color, #667eea);
              cursor: pointer;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
              transition: all 0.2s ease;

              &:hover {
                transform: scale(1.2);
              }
            }

            &::-moz-range-track {
              background: transparent;
              border: none;
            }
          }
        }

        // anzhiyumusic 风格的小箭头指示器
        &::before {
          content: "";
          position: absolute;
          bottom: -5px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-top: 8px solid rgba(255, 255, 255, 0.95);
        }
      }
    }
  }

  // anzhiyumusic 风格音量控制 - 已移动到 control-buttons 内，隐藏原有控制
  .volume-controls {
    display: none; // 现在使用 anzhiyumusic 风格的垂直音量条

    .volume-btn {
      background: none;
      border: none;
      color: rgba(255, 255, 255, 0.7);
      cursor: pointer;
      font-size: 18px;
      padding: 8px;
      transition: color 0.2s ease;

      &:hover {
        color: white;
      }
    }

    .volume-slider {
      .volume-input {
        width: 120px;
        height: 4px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 2px;
        outline: none;
        cursor: pointer;

        &::-webkit-slider-thumb {
          appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }

        &::-moz-range-thumb {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }
      }
    }
  }
}

// 歌词展示区域样式
.lyrics-section {
  flex: 1;
  border-radius: 16px;
  min-height: 540px;
  max-height: 540px;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  &:hover {
    :deep(.music-home-lyrics-scroll .lyric-item .lyric-text) {
      filter: blur(0px);
    }
  }
}

// Animations

// 唱片旋转动画
@keyframes vinyl-spin {
  from {
    transform: translate(-50%, -50%) rotate(0deg);
  }
  to {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}

// 专辑封面旋转动画 (单独的旋转，不需要translate)
@keyframes album-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

// 音乐背景流动动画
@keyframes musicBackgroundFlow {
  0% {
    transform: scale(1.1) rotate(0deg);
    filter: blur(60px) brightness(0.4) saturate(1.2);
  }
  25% {
    transform: scale(1.15) rotate(0.5deg);
    filter: blur(65px) brightness(0.3) saturate(1.4);
  }
  50% {
    transform: scale(1.2) rotate(-0.3deg);
    filter: blur(70px) brightness(0.5) saturate(1.1);
  }
  75% {
    transform: scale(1.15) rotate(0.2deg);
    filter: blur(62px) brightness(0.35) saturate(1.3);
  }
  100% {
    transform: scale(1.1) rotate(0deg);
    filter: blur(60px) brightness(0.4) saturate(1.2);
  }
}

@keyframes wave {
  0%,
  100% {
    height: 6px;
  }
  50% {
    height: 16px;
  }
}

@keyframes equalizer {
  0%,
  100% {
    height: 4px;
  }
  50% {
    height: 14px;
  }
}

// 现代化播放列表样式
.playlist-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2000;
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  // pointer-events 通过内联样式动态控制

  @media (max-width: 768px) {
    align-items: flex-end;
    justify-content: center;
  }
}

.playlist-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.playlist-panel {
  position: relative;
  width: 420px;
  height: 100vh;
  background: var(--anzhiyu-card-bg);
  border-left: var(--style-border);
  box-shadow: var(--anzhiyu-shadow-blackdeep);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transform: translateX(100%); // 桌面端默认在右侧外面，等待动画显示

  @media (max-width: 768px) {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100%;
    height: 85vh;
    max-height: 540px;
    border-left: none;
    border-top-left-radius: 24px;
    border-top-right-radius: 24px;
    border-top: var(--style-border);
    transform: translateY(100%); // 默认在底部外面，等待动画显示
  }

  @media (max-width: 1024px) and (min-width: 769px) {
    width: 380px;
  }
}

// 移动端拖拽手柄
.playlist-handle {
  display: none;
  justify-content: center;
  padding: 12px 0 8px;

  @media (max-width: 768px) {
    display: flex;
  }

  .handle-bar {
    width: 36px;
    height: 4px;
    background: var(--anzhiyu-gray-op);
    border-radius: 2px;
  }
}

// 播放列表头部
.playlist-header {
  padding: 24px 20px;
  border-bottom: var(--style-border);
  background: var(--anzhiyu-card-bg);

  @media (max-width: 768px) {
    padding: 16px 20px 20px;
  }

  .header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .header-info {
    flex: 1;

    .playlist-title {
      font-size: 20px;
      font-weight: 600;
      color: var(--anzhiyu-fontcolor);
      margin: 0 0 4px 0;
      line-height: 1.3;
    }

    .playlist-count {
      font-size: 13px;
      color: var(--anzhiyu-secondtext);
      font-weight: 500;
    }
  }

  .close-btn {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    border: none;
    background: var(--anzhiyu-card-btn-bg);
    color: var(--anzhiyu-fontcolor);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;

    &:hover {
      background: var(--anzhiyu-theme-op-light);
      color: var(--anzhiyu-main);
      transform: scale(1.05);
    }

    &:active {
      transform: scale(0.95);
    }

    i {
      font-size: 16px;
    }
  }
}

// 播放列表主体
.playlist-body {
  flex: 1;
  overflow: hidden;
}

.playlist-list {
  height: 100%;
  overflow-y: auto;
  padding: 8px 0 24px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--anzhiyu-scrollbar);
    border-radius: 3px;

    &:hover {
      background: var(--anzhiyu-main-op);
    }
  }
}

// 歌曲项目
.song-item {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  margin: 2px 12px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  border: 2px solid transparent;

  &:hover {
    background: var(--anzhiyu-ahoverbg);
    transform: translateX(2px);
  }

  &.is-active {
    background: var(--anzhiyu-theme-op-light);
    border-color: var(--anzhiyu-theme-op);

    .song-title {
      color: var(--anzhiyu-main);
      font-weight: 600;
    }

    .number {
      color: var(--anzhiyu-main);
      font-weight: 600;
    }
  }
}

// 歌曲序号
.song-number {
  width: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;

  .number {
    font-size: 14px;
    color: var(--anzhiyu-secondtext);
    font-weight: 500;
    font-family: "SF Mono", "Monaco", "Menlo", monospace;
  }

  .playing-indicator {
    display: flex;
    align-items: center;
    justify-content: center;

    .wave-animation {
      display: flex;
      align-items: end;
      gap: 2px;
      height: 16px;

      .wave-bar {
        width: 2px;
        background: var(--anzhiyu-main);
        border-radius: 1px;
        animation: waveAnimation 1s ease-in-out infinite;

        &:nth-child(1) {
          animation-delay: 0s;
        }
        &:nth-child(2) {
          animation-delay: 0.3s;
        }
        &:nth-child(3) {
          animation-delay: 0.6s;
        }
      }
    }

    i {
      color: var(--anzhiyu-main);
      font-size: 14px;
    }
  }
}

// 歌曲内容
.song-content {
  flex: 1;
  min-width: 0;
  margin-right: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;

  .song-meta {
    flex: 1;
    min-width: 0;

    .song-title {
      font-size: 15px;
      font-weight: 500;
      color: var(--anzhiyu-fontcolor);
      margin: 0 0 2px 0;
      line-height: 1.4;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .song-artist {
      font-size: 13px;
      color: var(--anzhiyu-secondtext);
      margin: 0;
      line-height: 1.3;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
}

// 专辑封面
.song-artwork {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  background: var(--anzhiyu-card-btn-bg);
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.2s ease;

    .song-item:hover & {
      transform: scale(1.05);
    }
  }

  .artwork-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--anzhiyu-secondtext);
    font-size: 18px;
  }
}

@keyframes waveAnimation {
  0%,
  40%,
  100% {
    height: 3px;
  }
  20% {
    height: 16px;
  }
}

// 加载进度条呼吸动画
@keyframes loadingPulse {
  0%,
  100% {
    opacity: 0.3;
    transform: scaleX(1);
  }
  50% {
    opacity: 0.7;
    transform: scaleX(1.02);
  }
}

// 播放按钮加载渐变动画
@keyframes loadingGradient {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

// 旋转动画（用于加载图标）
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

// Responsive design
@media (max-width: 1024px) {
  .music-container {
    padding: 0 20px 0;
    // 中等屏幕仍需考虑 header 高度
    min-height: calc(100vh - 60px);
  }
  .top-actions {
    .page-title h1 {
      font-size: 36px;
    }
  }

  .player-section {
    gap: 32px;
    // 中等屏幕限制最大高度
    max-height: calc(100vh - 60px);
  }

  .track-info {
    bottom: 0;
  }
}

@media (max-width: 768px) {
  // 移动端也显示头部导航，确保固定在顶部
  :global(.frontend-header) {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 2000; // 确保在音乐播放器之上
    background: var(--anzhiyu-card-bg);
    backdrop-filter: blur(20px);
  }

  .music-container {
    padding: 0;
    margin: 0;
    max-width: 100%;
    height: calc(100vh - 60px); // 减去 header 的 60px 高度
    max-height: calc(100vh - 60px);
    width: 100vw;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    overflow: hidden !important;
    position: fixed;
    top: 60px; // 从 header 下方开始
    left: 0;
    z-index: 1000;
    box-sizing: border-box;

    // 确保在不同高度下都不出现滚动条
    @media (max-height: 750px) {
      height: calc(100vh - 60px);
      max-height: calc(100vh - 60px);
      overflow: hidden !important;
    }

    @media (max-height: 650px) {
      height: calc(100vh - 60px);
      max-height: calc(100vh - 60px);
      overflow: hidden !important;
    }

    @media (max-height: 550px) {
      height: calc(100vh - 60px);
      max-height: calc(100vh - 60px);
      overflow: hidden !important;
    }
  }

  // 移动端背景优化
  #music_bg,
  .music-background {
    background-size: cover; // 移动端也使用 cover 填满背景
    filter: blur(40px) brightness(0.3) saturate(1.1); // 减少模糊以提高性能

    .music-home:not(.no-song) & {
      animation-duration: 30s; // 移动端动画更慢，省电
    }
  }

  .top-actions {
    margin-bottom: 32px;

    .page-title h1 {
      font-size: 28px;
    }

    .action-btn {
      width: 40px;
      height: 40px;
      font-size: 16px;
    }
  }

  // 修复移动端 player-section 布局 - 考虑 header 高度
  .player-section {
    flex-direction: column;
    gap: 0;
    align-items: center;
    flex: 1 1 0; // 占用剩余空间，可以增长和缩小
    padding: 8px 20px 4px; // 减少默认内边距
    box-sizing: border-box;
    justify-content: flex-start;
    overflow: hidden;
    min-height: 0; // 确保flex item可以缩小
    max-height: calc(
      100vh - 60px - 180px
    ); // 减去 header(60px) 和 playback-controls(180px)

    // 针对不同屏幕高度的适配 - 减少内边距和最大高度
    @media (max-height: 750px) {
      max-height: calc(100vh - 60px - 160px);
      padding: 6px 20px 3px;
    }

    @media (max-height: 650px) {
      max-height: calc(100vh - 60px - 140px);
      padding: 4px 20px 2px;
    }

    @media (max-height: 550px) {
      max-height: calc(100vh - 60px - 120px);
      padding: 2px 20px 1px;
    }

    @media (max-height: 480px) {
      max-height: calc(100vh - 60px - 100px);
      padding: 1px 20px 0px;
    }

    @media (max-height: 400px) {
      max-height: calc(100vh - 60px - 80px);
      padding: 0px 20px 0px;
    }
  }

  // 专辑封面区域 - 减少空白，优化空间利用
  .album-artwork {
    width: 100%;
    height: auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex-shrink: 1; // 允许缩小以适应容器
    margin-bottom: 12px;
    padding: 0;
    min-height: 0; // 确保可以缩小

    flex: 0 1 auto; // 不增长，但可以缩小

    .artwork-container {
      width: min(75vw, 300px); // 增大尺寸，更好利用屏幕空间
      height: min(75vw, 300px);
      max-width: 300px;
      max-height: 300px;

      // 针对较矮屏幕的专辑封面尺寸适配
      @media (max-height: 750px) {
        width: min(70vw, 260px);
        height: min(70vw, 260px);
        max-width: 260px;
        max-height: 260px;
      }

      @media (max-height: 650px) {
        width: min(65vw, 220px);
        height: min(65vw, 220px);
        max-width: 220px;
        max-height: 220px;
      }

      @media (max-height: 550px) {
        width: min(60vw, 180px);
        height: min(60vw, 180px);
        max-width: 180px;
        max-height: 180px;
      }
    }

    // 针对较矮屏幕的间距调整
    @media (max-height: 750px) {
      margin-bottom: 8px;
    }

    @media (max-height: 650px) {
      margin-bottom: 6px;
    }

    @media (max-height: 550px) {
      margin-bottom: 4px;
    }
  }

  // 歌曲信息区域 - 紧凑布局
  .track-info {
    position: relative;
    bottom: 0;
    margin: 8px 0; // 减少上下间距
    text-align: center;
    flex-shrink: 1; // 允许缩小以适应容器
    padding: 0 20px;
    min-height: 0; // 确保可以缩小

    .track-title {
      font-size: 18px; // 稍微减小字体以节省空间
      line-height: 1.3; // 更紧凑的行高
      margin: 0;
      word-wrap: break-word;
      max-width: 100%;
      font-weight: 600;

      // 针对较矮屏幕的字体大小适配
      @media (max-height: 750px) {
        font-size: 17px;
        line-height: 1.25;
      }

      @media (max-height: 650px) {
        font-size: 16px;
        line-height: 1.2;
      }

      @media (max-height: 550px) {
        font-size: 15px;
        line-height: 1.15;
      }
    }

    // 针对较矮屏幕的间距调整
    @media (max-height: 750px) {
      margin: 6px 0;
    }

    @media (max-height: 650px) {
      margin: 4px 0;
    }

    @media (max-height: 550px) {
      margin: 2px 0;
    }
  }

  // 歌词区域 - 占剩余空间，确保可滚动
  .lyrics-section {
    width: 100%;
    flex: 1 1 0; // 占用剩余空间，可以缩小
    min-height: 0; // 移除固定最小高度，让flex控制
    margin: 0;
    overflow: hidden;
    padding: 0 0 12px; // 减少底部空白
    position: relative;

    // 针对较矮屏幕的歌词区域适配 - 只调整padding
    @media (max-height: 750px) {
      padding: 0 0 8px;
    }

    @media (max-height: 650px) {
      padding: 0 0 6px;
    }

    @media (max-height: 550px) {
      padding: 0 0 4px;
    }
  }

  // 移除不需要的容器
  .track-info-and-lyrics {
    display: none; // 在移动端不使用这个容器
  }

  // 播放控制区域 - 固定在底部
  .playback-controls {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 180px; // 固定高度
    max-height: 180px; // 限制最大高度
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(20px);
    padding: 20px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    z-index: 10;
    overflow: hidden; // 防止内容溢出
    flex-shrink: 0; // 防止被压缩

    // 针对较矮屏幕的播放控制区域适配
    @media (max-height: 750px) {
      height: 160px;
      max-height: 160px;
      padding: 16px;
    }

    @media (max-height: 650px) {
      height: 140px;
      max-height: 140px;
      padding: 12px;
    }

    @media (max-height: 550px) {
      height: 120px;
      max-height: 120px;
      padding: 8px;
    }

    @media (max-height: 480px) {
      height: 100px;
      max-height: 100px;
      padding: 6px;
    }

    @media (max-height: 400px) {
      height: 80px;
      max-height: 80px;
      padding: 4px;
    }

    .progress-container {
      margin-bottom: 20px;

      .time-label {
        font-size: 12px;
        min-width: 32px;
        color: rgba(255, 255, 255, 0.8);
      }

      .progress-track {
        height: 4px;

        &:hover {
          height: 6px;
        }

        .progress-thumb {
          height: 14px;
          width: 14px;
          margin-top: -7px;
          margin-left: -7px;
        }
      }

      // 针对较矮屏幕的进度条适配
      @media (max-height: 750px) {
        margin-bottom: 16px;
      }

      @media (max-height: 650px) {
        margin-bottom: 12px;
      }

      @media (max-height: 550px) {
        margin-bottom: 8px;
      }

      @media (max-height: 480px) {
        margin-bottom: 6px;
      }

      @media (max-height: 400px) {
        margin-bottom: 4px;
      }
    }

    .control-buttons {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 4px;
      padding: 0 16px;
      margin: 0;
      flex: 1; // 占满剩余空间

      .control-btn.secondary {
        width: 44px;
        height: 44px;
        font-size: 16px;
        flex: 0 0 44px; // 固定大小，不允许伸缩
        border-radius: 22px; // 确保完全圆形

        // 针对较矮屏幕的按钮适配
        @media (max-height: 650px) {
          width: 40px;
          height: 40px;
          font-size: 15px;
          flex: 0 0 40px;
          border-radius: 20px;
        }

        @media (max-height: 550px) {
          width: 36px;
          height: 36px;
          font-size: 14px;
          flex: 0 0 36px;
          border-radius: 18px;
        }

        @media (max-height: 480px) {
          width: 32px;
          height: 32px;
          font-size: 13px;
          flex: 0 0 32px;
          border-radius: 16px;
        }

        @media (max-height: 400px) {
          width: 28px;
          height: 28px;
          font-size: 12px;
          flex: 0 0 28px;
          border-radius: 14px;
        }
      }

      .control-btn.primary {
        width: 50px;
        height: 50px;
        font-size: 18px;
        flex: 0 0 50px; // 固定大小，不允许伸缩
        border-radius: 25px; // 确保完全圆形

        // 针对较矮屏幕的主按钮适配
        @media (max-height: 650px) {
          width: 46px;
          height: 46px;
          font-size: 17px;
          flex: 0 0 46px;
          border-radius: 23px;
        }

        @media (max-height: 550px) {
          width: 42px;
          height: 42px;
          font-size: 16px;
          flex: 0 0 42px;
          border-radius: 21px;
        }

        @media (max-height: 480px) {
          width: 38px;
          height: 38px;
          font-size: 15px;
          flex: 0 0 38px;
          border-radius: 19px;
        }

        @media (max-height: 400px) {
          width: 34px;
          height: 34px;
          font-size: 14px;
          flex: 0 0 34px;
          border-radius: 17px;
        }
      }

      // 移动端显示的5个按钮顺序
      // 1. 播放模式切换
      .control-btn:nth-child(7) {
        // 播放模式
        display: flex;
        order: 1;
      }

      // 2. 上一曲
      .control-btn:nth-child(3) {
        // 上一曲
        display: flex;
        order: 2;
      }

      // 3. 播放/暂停 (居中)
      .control-btn:nth-child(4) {
        // 播放/暂停
        display: flex;
        order: 3;
      }

      // 4. 下一曲
      .control-btn:nth-child(5) {
        // 下一曲
        display: flex;
        order: 4;
      }

      // 5. 歌曲列表
      .control-btn:nth-child(6) {
        // 列表按钮
        display: flex;
        order: 5;
      }

      // 隐藏的按钮
      .control-btn:nth-child(1), // 刷新按钮
      .volume-control-wrapper {
        // 音量控制
        display: none; // 在移动端全屏模式下隐藏
      }
    }
  }
}

// 超小屏幕进一步优化布局和按钮
@media (max-width: 480px) {
  .music-container {
    .player-section {
      padding: 0px 16px 0px;
      // 超小屏幕也需要考虑 header 高度
      max-height: calc(100vh - 60px - 180px);

      // 超小屏幕高度适配
      @media (max-height: 750px) {
        padding: 0px 14px 0px;
        max-height: calc(100vh - 60px - 160px);
      }

      @media (max-height: 650px) {
        padding: 0px 12px 0px;
        max-height: calc(100vh - 60px - 140px);
      }

      @media (max-height: 550px) {
        padding: 0px 10px 0px;
        max-height: calc(100vh - 60px - 120px);
      }

      @media (max-height: 480px) {
        padding: 0px 8px 0px;
        max-height: calc(100vh - 60px - 100px);
      }

      @media (max-height: 400px) {
        padding: 0px 6px 0px;
        max-height: calc(100vh - 60px - 80px);
      }
    }

    .album-artwork {
      margin-bottom: 8px; // 更少的底部间距

      .artwork-container {
        width: min(78vw, 280px); // 超小屏幕上稍微再大一点
        height: min(78vw, 280px);
        max-width: 280px;
        max-height: 280px;

        // 超小屏幕高度适配
        @media (max-height: 750px) {
          width: min(72vw, 240px);
          height: min(72vw, 240px);
          max-width: 240px;
          max-height: 240px;
        }

        @media (max-height: 650px) {
          width: min(68vw, 200px);
          height: min(68vw, 200px);
          max-width: 200px;
          max-height: 200px;
        }

        @media (max-height: 550px) {
          width: min(64vw, 160px);
          height: min(64vw, 160px);
          max-width: 160px;
          max-height: 160px;
        }
      }
    }

    .track-info {
      margin: 6px 0; // 更紧凑的间距

      .track-title {
        font-size: 17px; // 超小屏幕适配字体

        // 超小屏幕高度适配
        @media (max-height: 750px) {
          font-size: 16px;
        }

        @media (max-height: 650px) {
          font-size: 15px;
        }

        @media (max-height: 550px) {
          font-size: 14px;
        }
      }
    }

    .lyrics-section {
      // 移除固定最小高度，使用flex自动计算
      min-height: 0;
      padding: 0 0 8px;

      // 超小屏幕高度适配 - 只调整padding
      @media (max-height: 750px) {
        padding: 0 0 6px;
      }

      @media (max-height: 650px) {
        padding: 0 0 4px;
      }

      @media (max-height: 550px) {
        padding: 0 0 2px;
      }
    }
  }

  .music-container .playback-controls .control-buttons {
    gap: 2px;
    padding: 0 12px;

    .control-btn.secondary {
      width: 40px;
      height: 40px;
      font-size: 15px;
      flex: 0 0 40px;
      border-radius: 20px;

      // 超小屏幕高度适配
      @media (max-height: 650px) {
        width: 36px;
        height: 36px;
        font-size: 14px;
        flex: 0 0 36px;
        border-radius: 18px;
      }

      @media (max-height: 550px) {
        width: 32px;
        height: 32px;
        font-size: 13px;
        flex: 0 0 32px;
        border-radius: 16px;
      }
    }

    .control-btn.primary {
      width: 46px;
      height: 46px;
      font-size: 17px;
      flex: 0 0 46px;
      border-radius: 23px;

      // 超小屏幕高度适配
      @media (max-height: 650px) {
        width: 42px;
        height: 42px;
        font-size: 16px;
        flex: 0 0 42px;
        border-radius: 21px;
      }

      @media (max-height: 550px) {
        width: 38px;
        height: 38px;
        font-size: 15px;
        flex: 0 0 38px;
        border-radius: 19px;
      }
    }
  }
}
</style>
