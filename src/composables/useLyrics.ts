/**
 * @Description: 歌词处理逻辑 composable
 * @Author: 安知鱼
 * @Date: 2025-09-20 15:00:00
 */
import { ref, reactive, nextTick, shallowRef, type Ref } from "vue";
import type { LyricLine, LyricsState } from "../types/music";

export function useLyrics(currentTime: Ref<number>) {
  // 歌词数据
  const lyrics = ref<LyricLine[]>([]);

  // 歌词状态
  const lyricsState = reactive<LyricsState>({
    currentIndex: -1,
    translateY: 0,
    shouldScroll: []
  });

  // 歌词DOM引用
  const lyricRefs = shallowRef<(HTMLElement | null)[]>([]);

  // 防抖定时器
  let lyricScrollTimer: number | null = null;

  // 解析歌词文本
  const parseLyrics = (lrcText: string): LyricLine[] => {
    const lines = lrcText.split("\n");
    const result: LyricLine[] = [];

    lines.forEach(line => {
      const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/);
      if (match) {
        const minutes = parseInt(match[1]);
        const seconds = parseInt(match[2]);
        const milliseconds = parseInt(match[3].padEnd(3, "0"));
        const time = minutes * 60 + seconds + milliseconds / 1000;
        const text = match[4].trim();

        if (text) {
          result.push({ time, text });
        }
      }
    });

    return result.sort((a, b) => a.time - b.time);
  };

  // 设置歌词
  const setLyrics = (lrcText: string) => {
    lyrics.value = parseLyrics(lrcText);
    lyricRefs.value = new Array(lyrics.value.length).fill(null);
    lyricsState.shouldScroll = new Array(lyrics.value.length).fill(false);
    lyricsState.currentIndex = findCurrentLyricIndex();
    calculateLyricsPosition();

    nextTick(() => {
      checkCurrentLyricScrollNeed();
    });
  };

  // 根据当前播放时间查找对应的歌词索引
  const findCurrentLyricIndex = (): number => {
    if (lyrics.value.length === 0) return -1;

    const current = currentTime.value;

    for (let i = lyrics.value.length - 1; i >= 0; i--) {
      if (current >= lyrics.value[i].time) {
        return i;
      }
    }

    return -1;
  };

  // 计算歌词滚动位置
  const calculateLyricsPosition = () => {
    if (lyrics.value.length === 0) {
      lyricsState.translateY = 0;
      return;
    }

    const lineHeight = 20;

    if (lyricsState.currentIndex < 0) {
      lyricsState.translateY = 0;
      return;
    }

    const targetY = 0 - lyricsState.currentIndex * lineHeight;
    lyricsState.translateY = targetY;
  };

  // 检测当前播放歌词是否需要滚动
  const checkCurrentLyricScrollNeed = async () => {
    // 清除之前的定时器
    if (lyricScrollTimer) {
      clearTimeout(lyricScrollTimer);
    }

    lyricScrollTimer = window.setTimeout(async () => {
      await nextTick();

      // 先清除所有歌词的滚动状态
      lyrics.value.forEach((_, i) => {
        const lyricEl = lyricRefs.value[i];
        if (lyricEl) {
          lyricEl.classList.remove("text-scrolling");
          lyricEl.removeAttribute("data-long-text");
          lyricEl.style.removeProperty("--scroll-duration");
        }
      });

      // 重置滚动状态数组
      lyricsState.shouldScroll = new Array(lyrics.value.length).fill(false);

      // 只检测当前播放的歌词
      const currentIndex = lyricsState.currentIndex;
      if (currentIndex >= 0 && currentIndex < lyrics.value.length) {
        const lyricEl = lyricRefs.value[currentIndex];
        if (lyricEl && lyricEl.parentElement) {
          const container = lyricEl.parentElement;
          const containerWidth = container.clientWidth;
          const textWidth = lyricEl.scrollWidth;

          // 添加容错空间
          const threshold = 10;
          const needsScroll = textWidth > containerWidth + threshold;

          // 调试信息
          if (process.env.NODE_ENV === "development") {
            console.log(`当前歌词 ${currentIndex}: "${lyrics.value[currentIndex]?.text?.substring(0, 30)}..."
            容器宽度: ${containerWidth}px,
            文本宽度: ${textWidth}px,
            需要滚动: ${needsScroll}`);
          }

          lyricsState.shouldScroll[currentIndex] = needsScroll;

          // 如果当前歌词需要滚动，设置滚动动画
          if (needsScroll) {
            const textLength = lyrics.value[currentIndex]?.text?.length || 0;
            const overflowRatio = textWidth / containerWidth;

            // 动态计算滚动时间
            const baseTime = 8;
            const lengthFactor = Math.min(textLength * 0.15, 12);
            const overflowFactor = Math.min(overflowRatio * 2, 8);
            const scrollDuration = Math.max(
              baseTime,
              lengthFactor + overflowFactor
            );

            lyricEl.style.setProperty(
              "--scroll-duration",
              `${scrollDuration}s`
            );

            // 为超长文本添加特殊标记
            if (textLength > 50 || overflowRatio > 2.5) {
              lyricEl.setAttribute("data-long-text", "true");
            }

            // 应用滚动类名
            lyricEl.classList.add("text-scrolling");

            // 调试信息
            if (process.env.NODE_ENV === "development") {
              console.log(
                `当前歌词开始滚动: 长度=${textLength}, 溢出比=${overflowRatio.toFixed(2)}, 滚动时间=${scrollDuration.toFixed(1)}s`
              );
            }
          }
        }
      }
    }, 100); // 100ms防抖
  };

  // 设置歌词行的DOM引用
  const setLyricRef = (el: any, index: number) => {
    if (el && el instanceof HTMLElement) {
      lyricRefs.value[index] = el;
    }
  };

  // 更新当前歌词索引
  const updateCurrentLyricIndex = () => {
    if (lyrics.value.length > 0) {
      const newLyricIndex = findCurrentLyricIndex();

      if (newLyricIndex !== lyricsState.currentIndex) {
        lyricsState.currentIndex = newLyricIndex;
        calculateLyricsPosition();
        checkCurrentLyricScrollNeed();
      }
    }
  };

  // 清空歌词
  const clearLyrics = () => {
    lyrics.value = [];
    lyricRefs.value = [];
    lyricsState.currentIndex = -1;
    lyricsState.translateY = 0;
    lyricsState.shouldScroll = [];
  };

  // 清理资源
  const cleanup = () => {
    if (lyricScrollTimer) {
      clearTimeout(lyricScrollTimer);
      lyricScrollTimer = null;
    }
  };

  return {
    // 状态
    lyrics,
    lyricsState,
    lyricRefs,

    // 方法
    parseLyrics,
    setLyrics,
    clearLyrics,
    setLyricRef,
    updateCurrentLyricIndex,
    findCurrentLyricIndex,
    calculateLyricsPosition,
    checkCurrentLyricScrollNeed,
    cleanup
  };
}
