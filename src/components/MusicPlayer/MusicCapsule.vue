<!--
 * @Description: 音乐胶囊组件
 * @Author: 安知鱼
 * @Date: 2025-09-20 15:35:00
-->
<template>
  <div
    class="music-capsule-container"
    :class="{ expanded: isExpanded, playing: isPlaying }"
    :style="{
      backgroundColor: isExpanded ? dominantColor : '',
      '--dominant-color': dominantColor
    }"
    @click="handleCapsuleClick"
  >
    <!-- 封面图片 -->
    <AlbumCover :image-url="currentSong?.pic" :is-playing="isPlaying" />

    <!-- 收起状态的歌曲信息 -->
    <div class="collapsed-info" :class="{ hidden: isExpanded }">
      <div class="collapsed-title">{{ currentSong?.name || "未知歌曲" }}</div>
      <div class="collapsed-icon" @click="handleIconClick">
        <svg
          v-if="!isPlaying"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="white"
        >
          <path d="M8 5v14l11-7z" />
        </svg>
        <div v-else class="pause-bars" :class="{ playing: isPlaying }">
          <div class="bar" />
          <div class="bar" />
        </div>
      </div>
    </div>

    <!-- 歌曲信息（展开时显示） -->
    <div class="song-info" :class="{ visible: isExpanded }">
      <div class="song-title">{{ currentSong?.name || "未知歌曲" }}</div>
      <LyricsDisplay
        :lyrics="lyrics"
        :lyrics-state="lyricsState"
        :dominant-color="dominantColor"
        :set-lyric-ref="setLyricRef"
      />
    </div>

    <!-- 控制区域（展开且hover时显示） -->
    <PlayControls
      :is-visible="isExpanded && isHovered"
      :is-playing="isPlaying"
      :is-muted="isMuted"
      :volume="volume"
      :dominant-color="dominantColor"
      @previous="emit('previous')"
      @toggle-play="emit('togglePlay')"
      @next="emit('next')"
      @toggle-mute="emit('toggleMute')"
      @toggle-playlist="emit('togglePlaylist')"
    />

    <!-- 进度条覆盖层 -->
    <div
      class="progress-overlay"
      :style="{
        width: playedPercentage + '%'
      }"
    />
  </div>
</template>

<script setup lang="ts">
import type { Song, LyricLine, LyricsState } from "@/types/music";
import AlbumCover from "./AlbumCover.vue";
import LyricsDisplay from "./LyricsDisplay.vue";
import PlayControls from "./PlayControls.vue";

interface Props {
  isExpanded: boolean;
  isHovered: boolean;
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  currentSong?: Song;
  lyrics: LyricLine[];
  lyricsState: LyricsState;
  dominantColor: string;
  playedPercentage: number;
  setLyricRef: (el: any, index: number) => void;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  toggleExpand: [];
  togglePlay: [];
  previous: [];
  next: [];
  toggleMute: [];
  togglePlaylist: [];
}>();

const handleCapsuleClick = (event: MouseEvent) => {
  event.stopPropagation();

  // 检查是否点击了控制区域
  const target = event.target as HTMLElement;
  const isControlArea = target.closest(".music-controls");

  if (isControlArea) {
    // 点击了控制区域，不处理
    return;
  }

  // 点击任何地方（除了控制区域）都切换展开/收起状态
  emit("toggleExpand");
};

// 处理收缩状态下图标的点击事件
const handleIconClick = (event: MouseEvent) => {
  // 如果在收缩状态下且正在播放，直接展开（不阻止事件冒泡）
  if (!props.isExpanded && props.isPlaying) {
    // 不调用 event.stopPropagation()，让事件冒泡到父容器触发展开
    return;
  }

  // 其他情况下（收缩状态但暂停），阻止事件冒泡并触发播放/暂停
  event.stopPropagation();
  emit("togglePlay");
};
</script>

<style scoped lang="scss">
.music-capsule-container {
  max-width: 240px;
  width: fit-content;
  height: 40px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  position: relative;
  cursor: pointer;
  backdrop-filter: blur(20px);
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  background-color: var(--anzhiyu-card-bg);
  border: var(--style-border);

  &:hover {
    transform: scale(1.02);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.25);

    // 收起状态hover时显示主色调背景
    &:not(.expanded) {
      background-color: var(--dominant-color) !important;
    }
  }

  // 展开状态
  &.expanded {
    width: 280px;
    max-width: 280px;

    &:hover {
      transform: scale(1);
    }
  }

  // 播放状态下的封面边框（通过深度选择器）
  &.expanded.playing :deep(.album-cover) {
    border-color: var(--anzhiyu-card-bg);
  }

  .collapsed-info {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    padding: 0 15px 0 45px;
    width: 100%;
    height: 100%;
    opacity: 1;
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);

    &.hidden {
      opacity: 0;
      pointer-events: none;
    }

    .collapsed-title {
      flex: 1;
      font-size: 11px;
      font-weight: 600;
      max-width: 60px;
      color: var(--anzhiyu-fontcolor);
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
      min-width: 0;
    }

    .collapsed-icon {
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%) scale(0.8);
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      pointer-events: none;
      transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);

      svg {
        width: 14px;
        height: 14px;
        filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
      }

      .pause-bars {
        display: flex;
        gap: 2px;

        .bar {
          width: 2px;
          height: 10px;
          background: white;
          border-radius: 1px;
          filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
        }

        &.playing .bar {
          animation: pulse 1.5s ease-in-out infinite alternate;

          &:nth-child(2) {
            animation-delay: 0.3s;
          }
        }
      }
    }
  }

  // 收起状态hover时的特殊样式
  &:hover:not(.expanded) {
    :deep(.album-cover) {
      opacity: 0.3;
    }

    .collapsed-info {
      .collapsed-title {
        opacity: 0.3;
      }

      .collapsed-icon {
        opacity: 1;
        pointer-events: auto;
        transform: translate(-50%, -50%) scale(1.5);
        width: 32px;
        height: 32px;
        background: transparent !important;
        border-radius: 50%;
        backdrop-filter: none !important;
        z-index: 10;

        svg {
          width: 20px;
          height: 20px;
        }

        .pause-bars {
          .bar {
            width: 3px;
            height: 10px;
          }
        }
      }
    }
  }
}

.song-info {
  position: absolute;
  left: 50px;
  right: 20px;
  top: 50%;
  transform: translateY(-50%) translateX(-20px);
  color: white;
  opacity: 0;
  transition: all 0.6s cubic-bezier(0.25, 0.8, 0.25, 1);
  pointer-events: none;
  cursor: pointer;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px;

  &.visible {
    opacity: 1;
    transform: translateY(-50%) translateX(0);
    pointer-events: auto;
  }

  &:hover {
    opacity: 0.9;
  }

  .song-title {
    width: 50px;
    flex-shrink: 0;
    font-size: 11px;
    font-weight: 600;
    line-height: 1.2;
    white-space: nowrap;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    overflow: hidden;
    text-overflow: ellipsis;
    color: rgba(255, 255, 255, 0.9);
    user-select: none;
  }
}

// 进度条覆盖层
.progress-overlay {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: rgba(255, 255, 255, 0.15);
  transition: width 0.3s ease;
  pointer-events: none;
  z-index: 1;
}

// 动画效果
@keyframes pulse {
  from {
    opacity: 1;
    transform: scaleY(1);
  }
  to {
    opacity: 0.5;
    transform: scaleY(0.3);
  }
}
</style>
