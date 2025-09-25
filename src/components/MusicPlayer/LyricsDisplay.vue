<!--
 * @Description: 歌词显示组件
 * @Author: 安知鱼
 * @Date: 2025-09-20 15:20:00
-->
<template>
  <div class="lyrics-container" :style="{ '--dominant-color': dominantColor }">
    <div
      class="lyrics-content"
      :style="{ transform: `translateY(${lyricsState.translateY}px)` }"
    >
      <div v-if="lyrics.length === 0" class="lyric-line no-lyrics">
        <div class="lyric-text">♪ 暂无歌词 ♪</div>
      </div>
      <div
        v-for="(lyric, index) in lyrics"
        :key="index"
        :class="{
          'lyric-line': true,
          current: index === lyricsState.currentIndex,
          passed: index < lyricsState.currentIndex,
          upcoming: index > lyricsState.currentIndex
        }"
      >
        <div
          :ref="el => setLyricRef(el, index)"
          class="lyric-text"
          :class="{ 'text-scrolling': lyricsState.shouldScroll[index] }"
        >
          {{ lyric.text }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { LyricLine, LyricsState } from "@/types/music";

interface Props {
  lyrics: LyricLine[];
  lyricsState: LyricsState;
  dominantColor: string;
  setLyricRef: (el: any, index: number) => void;
}

defineProps<Props>();
</script>

<style scoped lang="scss">
.lyrics-container {
  flex: 1;
  overflow: hidden;
  height: 40px;
  position: relative;
  display: flex;
  align-items: flex-start;

  .lyrics-content {
    width: 100%;
    transition: transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    will-change: transform;
    position: absolute;
    top: 0;
    left: 0;

    .lyric-line {
      height: 20px;
      overflow: hidden;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: flex-start;

      // 为长文本添加渐变遮罩效果
      &::after {
        content: "";
        position: absolute;
        right: 0;
        top: 0;
        width: 20px;
        height: 100%;
        background: linear-gradient(
          to right,
          transparent,
          var(--dominant-color)
        );
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.3s ease;
      }

      // 当文本需要滚动时显示渐变遮罩
      &:has(.text-scrolling)::after {
        opacity: 0.8;
      }

      &.no-lyrics {
        justify-content: center;
        .lyric-text {
          color: rgba(255, 255, 255, 0.6);
          font-style: italic;
        }
      }

      // 已经播放过的歌词
      &.passed {
        .lyric-text {
          color: rgba(255, 255, 255, 0.3);
          font-size: 10px;
          font-weight: 400;
        }
      }

      // 当前正在播放的歌词
      &.current {
        .lyric-text {
          color: rgba(255, 255, 255, 1);
          font-size: 11px;
          font-weight: 600;
          text-shadow: 0 1px 3px rgba(255, 255, 255, 0.3);
          animation: lyricGlow 1s ease-in-out;
        }
      }

      // 即将播放的歌词
      &.upcoming {
        .lyric-text {
          color: rgba(255, 255, 255, 0.5);
          font-size: 10px;
          font-weight: 400;
        }
      }

      .lyric-text {
        white-space: nowrap;
        min-width: 100%;
        width: max-content;
        transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        position: relative;
        font-size: 10px;
        font-weight: 400;

        // 默认滚动持续时间，可被JS动态覆盖
        --scroll-duration: 12s;

        // 为长文本添加更好的可读性
        text-overflow: unset;
        overflow: visible;

        // 只有需要滚动的文本才应用动画
        &.text-scrolling {
          animation: lyricTextScroll var(--scroll-duration)
            cubic-bezier(0.25, 0.46, 0.45, 0.94) 1;
          animation-fill-mode: forwards; // 保持动画结束状态
          justify-content: flex-start;

          // 滚动时添加轻微的阴影效果，增强可读性
          text-shadow:
            0 1px 3px rgba(0, 0, 0, 0.5),
            0 0 10px rgba(255, 255, 255, 0.1);
        }

        // 超长歌词的特殊处理
        &:is([data-long-text]) {
          font-size: 11px; // 稍微缩小字体
          letter-spacing: -0.5px; // 减少字符间距

          &.text-scrolling {
            animation: lyricTextScrollSlow var(--scroll-duration)
              cubic-bezier(0.25, 0.46, 0.45, 0.94) 1;
            animation-fill-mode: forwards;
          }
        }
      }
    }
  }
}

// 动画效果
@keyframes lyricGlow {
  0% {
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    transform: scale(1);
  }
  50% {
    text-shadow:
      0 1px 3px rgba(255, 255, 255, 0.4),
      0 0 8px rgba(255, 255, 255, 0.2);
    transform: scale(1.02);
  }
  100% {
    text-shadow: 0 1px 3px rgba(255, 255, 255, 0.3);
    transform: scale(1);
  }
}

// 歌词文本平滑滚动动画 - 优化版本，更自然的滚动节奏
@keyframes lyricTextScroll {
  0% {
    transform: translateX(0);
  }
  15% {
    transform: translateX(0);
  }
  85% {
    transform: translateX(calc(-100% + 100px));
  }
  100% {
    transform: translateX(calc(-100% + 100px));
  }
}

// 为超长文本提供更慢的滚动动画
@keyframes lyricTextScrollSlow {
  0% {
    transform: translateX(0);
  }
  20% {
    transform: translateX(0);
  }
  80% {
    transform: translateX(calc(-100% + 100px));
  }
  100% {
    transform: translateX(calc(-100% + 100px));
  }
}
</style>
