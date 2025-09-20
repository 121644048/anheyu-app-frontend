<!--
 * @Description: 播放列表组件
 * @Author: 安知鱼
 * @Date: 2025-09-20 15:30:00
-->
<template>
  <div v-show="isVisible" class="playlist-container" :style="playlistStyle">
    <div class="playlist-header">
      <span>播放列表 ({{ playlist.length }})</span>
      <div class="close-playlist" @click="emit('close')">×</div>
    </div>
    <div class="playlist-content">
      <div
        v-for="(song, index) in playlist"
        :key="song.id || index"
        :class="{
          'playlist-item': true,
          active: index === currentSongIndex,
          playing: index === currentSongIndex && isPlaying,
          loading: index === loadingPlaylistItem
        }"
        @click="emit('selectSong', index)"
      >
        <span class="item-index">{{ index + 1 }}</span>

        <!-- 播放指示器 -->
        <div class="play-indicator">
          <div class="play-bars">
            <div class="bar" />
            <div class="bar" />
            <div class="bar" />
            <div class="bar" />
          </div>
        </div>

        <!-- Loading指示器 -->
        <div class="loading-indicator">
          <div class="loading-spinner" />
        </div>

        <div class="item-content">
          <span class="item-title">{{ song.name }}</span>
          <span class="item-artist">{{ song.artist }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Song } from "../../types/music";

interface Props {
  isVisible: boolean;
  playlist: Song[];
  currentSongIndex: number;
  isPlaying: boolean;
  loadingPlaylistItem: number;
  playlistStyle: any;
}

defineProps<Props>();

const emit = defineEmits<{
  close: [];
  selectSong: [index: number];
}>();
</script>

<style scoped lang="scss">
.playlist-container {
  position: absolute;
  top: -320px;
  left: 0;
  width: 360px;
  max-height: 300px;
  background: rgba(49, 194, 124, 0.85);
  backdrop-filter: blur(30px);
  -webkit-backdrop-filter: blur(30px);
  border-radius: 16px;
  overflow: hidden;
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  animation: playlistSlideIn 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
  transform-origin: bottom left;

  .playlist-header {
    padding: 14px 18px 12px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.15);
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: white;
    font-weight: 600;
    font-size: 13px;
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.15) 0%,
      rgba(255, 255, 255, 0.08) 100%
    );
    user-select: none;

    .close-playlist {
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      border-radius: 50%;
      font-size: 18px;
      transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
      color: rgba(255, 255, 255, 0.8);

      &:hover {
        background: rgba(255, 255, 255, 0.2);
        color: white;
        transform: scale(1.1);
      }

      &:active {
        transform: scale(0.95);
      }
    }
  }

  .playlist-content {
    max-height: 250px;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 255, 255, 0.4) transparent;

    // 自定义滚动条样式
    &::-webkit-scrollbar {
      width: 5px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.4);
      border-radius: 3px;
      transition: background 0.3s ease;

      &:hover {
        background: rgba(255, 255, 255, 0.6);
      }
    }

    .playlist-item {
      padding: 8px 18px;
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
      color: rgba(255, 255, 255, 0.9);
      user-select: none;
      position: relative;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      min-height: 36px;

      // 添加序号指示器
      &::before {
        content: "";
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        width: 3px;
        background: transparent;
        transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
      }

      &:hover:not(.active):not(.loading) {
        background: rgba(255, 255, 255, 0.12);
        color: white;
        transform: translateX(1px);

        &::before {
          background: rgba(255, 255, 255, 0.5);
        }

        .item-index {
          opacity: 1;
          color: rgba(255, 255, 255, 0.9);
        }
      }

      &.active {
        background: linear-gradient(
          135deg,
          rgba(255, 255, 255, 0.2) 0%,
          rgba(255, 255, 255, 0.1) 100%
        );
        color: white;
        font-weight: 600;

        &::before {
          background: rgba(255, 255, 255, 0.8);
          box-shadow: 0 0 6px rgba(255, 255, 255, 0.3);
        }

        .item-index {
          opacity: 0;
          visibility: hidden;
        }

        .play-indicator {
          opacity: 1;
          visibility: visible;
          animation: playIndicatorPulse 2s ease-in-out infinite;
        }

        .item-content .item-title {
          color: rgba(255, 255, 255, 1);
          font-weight: 600;
        }

        .item-content .item-artist {
          opacity: 0.9;
        }
      }

      &:last-child {
        border-bottom: none;
      }

      .item-index {
        width: 20px;
        font-size: 12px;
        opacity: 0.5;
        font-weight: 500;
        text-align: center;
        transition: all 0.3s ease;
        position: relative;
        z-index: 1;
        visibility: visible;
      }

      .play-indicator {
        position: absolute;
        left: 18px;
        top: 50%;
        transform: translateY(-50%);
        width: 20px;
        height: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
        z-index: 2;

        .play-bars {
          display: flex;
          gap: 2px;
          align-items: flex-end;
          height: 12px;

          .bar {
            width: 2px;
            background: rgba(255, 255, 255, 0.9);
            border-radius: 1px;
            animation: playBarsPulse 1.5s ease-in-out infinite;

            &:nth-child(1) {
              height: 4px;
              animation-delay: 0s;
            }

            &:nth-child(2) {
              height: 8px;
              animation-delay: 0.2s;
            }

            &:nth-child(3) {
              height: 6px;
              animation-delay: 0.4s;
            }

            &:nth-child(4) {
              height: 10px;
              animation-delay: 0.6s;
            }
          }
        }
      }

      .loading-indicator {
        position: absolute;
        left: 18px;
        top: 50%;
        transform: translateY(-50%);
        width: 20px;
        height: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
        z-index: 3;

        .loading-spinner {
          width: 10px;
          height: 10px;
          border: 1.5px solid rgba(255, 255, 255, 0.3);
          border-top: 1.5px solid rgba(255, 255, 255, 0.8);
          border-radius: 50%;
          animation: loadingSpinner 1s linear infinite;
        }
      }

      // Loading状态样式
      &.loading {
        background: rgba(255, 255, 255, 0.08);
        cursor: wait;

        .item-index {
          opacity: 0;
          visibility: hidden;
        }

        .play-indicator {
          opacity: 0;
          visibility: hidden;
        }

        .loading-indicator {
          opacity: 1;
          visibility: visible;
        }

        .item-content {
          opacity: 0.7;

          .item-title {
            color: rgba(255, 255, 255, 0.8);
          }
        }
      }

      .item-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 1px;
        min-width: 0;

        .item-title {
          font-size: 13px;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          line-height: 1.3;
          transition: all 0.3s ease;
        }

        .item-artist {
          font-size: 11px;
          opacity: 0.7;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-weight: 400;
          transition: all 0.3s ease;
          line-height: 1.2;
        }
      }
    }
  }
}

// 动画效果
@keyframes playlistSlideIn {
  0% {
    opacity: 0;
    transform: scale(0.9) translateY(20px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes playIndicatorPulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.05);
  }
}

@keyframes playBarsPulse {
  0%,
  100% {
    transform: scaleY(0.3);
    opacity: 0.7;
  }
  50% {
    transform: scaleY(1);
    opacity: 1;
  }
}

@keyframes loadingSpinner {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
