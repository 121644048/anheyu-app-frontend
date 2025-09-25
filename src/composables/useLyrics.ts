/**
 * @Description: 歌词处理逻辑 composable
 * @Author: 安知鱼
 * @Date: 2025-09-20 15:00:00
 */
import { ref, reactive, nextTick, shallowRef, watch, type Ref } from "vue";
import type { LyricLine, LyricsState, LyricInput } from "../types/music";

export function useLyrics(currentTime: Ref<number>, isDragging?: Ref<boolean>) {
  const LYRIC_ADVANCE_TIME = 0.3; // 歌词提前显示时间（秒）
  const DRAG_LYRIC_ADVANCE_TIME = 0.1; // 拖拽时使用更小的提前量

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
  let timeUpdateDebounceTimer: number | null = null;

  // 验证和标准化歌词文本格式
  const validateAndNormalizeLyrics = (input: LyricInput): string => {
    try {
      // 如果是字符串，直接返回
      if (typeof input === "string") {
        return input;
      }

      // 如果输入是对象，尝试提取LRC内容
      if (typeof input === "object" && input !== null) {
        // 类型保护：检查是否有data属性且data有lrc属性
        if (
          "data" in input &&
          input.data &&
          typeof input.data === "object" &&
          "lrc" in input.data
        ) {
          return input.data.lrc;
        }

        // 类型保护：检查是否直接有lrc属性
        if ("lrc" in input && typeof input.lrc === "string") {
          return input.lrc;
        }

        // 类型保护：检查是否有lyric属性
        if ("lyric" in input && typeof input.lyric === "string") {
          return input.lyric;
        }
      }

      console.warn("无法识别的歌词格式:", typeof input, input);
      return "";
    } catch (error) {
      console.error("歌词格式验证失败:", error);
      return "";
    }
  };

  // 解析歌词文本 - 支持多种时间戳格式
  const parseLyrics = (lrcInput: LyricInput): LyricLine[] => {
    // 先进行格式验证和标准化
    const lrcText = validateAndNormalizeLyrics(lrcInput);

    if (!lrcText || typeof lrcText !== "string") {
      console.warn("歌词内容为空或格式无效");
      return [];
    }

    const lines = lrcText.split("\n");
    const result: LyricLine[] = [];

    lines.forEach((line, lineIndex) => {
      // 支持多种LRC时间戳格式
      // 格式1: [00:12.34] 或 [00:12.345] (标准格式)
      let match = line.match(/\[(\d{1,2}):(\d{2})\.(\d{2,3})\](.*)/);

      if (!match) {
        // 格式2: [00:12:34] (某些API使用的格式)
        match = line.match(/\[(\d{1,2}):(\d{2}):(\d{2})\](.*)/);
        if (match) {
          // 转换为标准格式处理
          const minutes = parseInt(match[1]);
          const seconds = parseInt(match[2]);
          const centiseconds = parseInt(match[3]);
          const time = minutes * 60 + seconds + centiseconds / 100;
          const text = match[4].trim();

          if (text) {
            result.push({ time, text });
          }
          return;
        }
      }

      if (!match) {
        // 格式3: [00:12] (简化格式，只有分钟和秒)
        match = line.match(/\[(\d{1,2}):(\d{2})\](.*)/);
        if (match) {
          const minutes = parseInt(match[1]);
          const seconds = parseInt(match[2]);
          const time = minutes * 60 + seconds;
          const text = match[3].trim();

          if (text) {
            result.push({ time, text });
          }
          return;
        }
      }

      // 标准格式处理
      if (match) {
        const minutes = parseInt(match[1]);
        const seconds = parseInt(match[2]);
        const milliseconds = parseInt(match[3].padEnd(3, "0"));
        const time = minutes * 60 + seconds + milliseconds / 1000;
        const text = match[4].trim();

        if (text && text.length > 0) {
          result.push({ time, text });
        }
      } else if (line.trim() && !line.startsWith("[") && lineIndex < 10) {
        // 检查前10行是否有非LRC格式的内容，记录警告
        console.warn(
          `无法解析的歌词行 ${lineIndex + 1}: "${line.substring(0, 50)}..."`
        );
      }
    });

    // 按时间排序并去重
    const sortedResult = result.sort((a, b) => a.time - b.time);

    // 去除重复的时间戳
    const uniqueResult = sortedResult.filter((item, index) => {
      return (
        index === 0 || Math.abs(item.time - sortedResult[index - 1].time) > 0.1
      );
    });

    return uniqueResult;
  };

  // 设置歌词
  const setLyrics = (lrcInput: LyricInput) => {
    console.log("🎵 [设置歌词] 开始设置新歌词:", {
      inputType: typeof lrcInput,
      currentTime: currentTime.value.toFixed(2),
      oldLyricsLength: lyrics.value.length,
      oldCurrentIndex: lyricsState.currentIndex
    });

    // 🎵 重要：切换歌词时重置所有状态
    console.log("🎵 [设置歌词] 重置歌词相关状态");
    lyricsState.currentIndex = -1;
    lyricsState.translateY = 0;
    lyricsState.shouldScroll = [];

    // 清理定时器
    if (lyricScrollTimer) {
      clearTimeout(lyricScrollTimer);
      lyricScrollTimer = null;
    }
    if (timeUpdateDebounceTimer) {
      clearTimeout(timeUpdateDebounceTimer);
      timeUpdateDebounceTimer = null;
    }

    // 解析歌词
    const parsedLyrics = parseLyrics(lrcInput);

    console.log("🎵 [设置歌词] 歌词解析完成:", {
      newLyricsLength: parsedLyrics.length,
      firstLyric: parsedLyrics[0]?.text?.substring(0, 40) + "..." || "无歌词",
      firstLyricTime: parsedLyrics[0]?.time?.toFixed(2) || "无时间",
      lastLyric:
        parsedLyrics[parsedLyrics.length - 1]?.text?.substring(0, 40) + "..." ||
        "无歌词",
      lastLyricTime:
        parsedLyrics[parsedLyrics.length - 1]?.time?.toFixed(2) || "无时间"
    });

    // 设置新歌词
    lyrics.value = parsedLyrics;
    lyricRefs.value = new Array(lyrics.value.length).fill(null);
    lyricsState.shouldScroll = new Array(lyrics.value.length).fill(false);

    // 查找当前歌词索引（基于重置后的时间 0）
    const newCurrentIndex = findCurrentLyricIndex();
    lyricsState.currentIndex = newCurrentIndex;

    console.log("🎵 [设置歌词] 初始化歌词状态完成:", {
      newCurrentIndex,
      currentLyric:
        newCurrentIndex >= 0
          ? lyrics.value[newCurrentIndex]?.text?.substring(0, 40) + "..."
          : "无歌词",
      refsLength: lyricRefs.value.length,
      scrollStateLength: lyricsState.shouldScroll.length
    });

    calculateLyricsPosition();

    nextTick(() => {
      console.log("🎵 [设置歌词] DOM更新完成，检查歌词滚动需求");
      checkCurrentLyricScrollNeed();
    });
  };

  // 根据当前播放时间查找对应的歌词索引
  const findCurrentLyricIndex = (): number => {
    if (lyrics.value.length === 0) {
      console.log("🎵 [查找歌词索引] 无歌词数据，返回 -1");
      return -1;
    }

    const advanceTime = isDragging?.value
      ? DRAG_LYRIC_ADVANCE_TIME
      : LYRIC_ADVANCE_TIME;
    const current = currentTime.value + advanceTime;
    const originalTime = currentTime.value;

    console.log("🎵 [查找歌词索引] 开始查找当前歌词索引:", {
      originalTime: originalTime.toFixed(2),
      adjustedTime: current.toFixed(2),
      advanceTime: LYRIC_ADVANCE_TIME,
      totalLyrics: lyrics.value.length,
      firstLyricTime: lyrics.value[0]?.time?.toFixed(2) || "未知",
      lastLyricTime:
        lyrics.value[lyrics.value.length - 1]?.time?.toFixed(2) || "未知"
    });

    let foundIndex = -1;
    for (let i = lyrics.value.length - 1; i >= 0; i--) {
      if (current >= lyrics.value[i].time) {
        foundIndex = i;
        break;
      }
    }

    console.log("🎵 [查找歌词索引] 查找结果:", {
      foundIndex,
      foundLyric:
        foundIndex >= 0
          ? lyrics.value[foundIndex]?.text?.substring(0, 40) + "..."
          : "无歌词",
      foundLyricTime:
        foundIndex >= 0 ? lyrics.value[foundIndex]?.time?.toFixed(2) : "无时间",
      nextLyric:
        foundIndex >= 0 && foundIndex < lyrics.value.length - 1
          ? lyrics.value[foundIndex + 1]?.text?.substring(0, 30) + "..."
          : "无下一句",
      nextLyricTime:
        foundIndex >= 0 && foundIndex < lyrics.value.length - 1
          ? lyrics.value[foundIndex + 1]?.time?.toFixed(2)
          : "无时间"
    });

    return foundIndex;
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

  // 获取单句歌词的持续时间
  const getLyricDuration = (currentIndex: number): number => {
    if (currentIndex < 0 || currentIndex >= lyrics.value.length) {
      return 0;
    }

    // 如果是最后一句歌词，默认给个合理的时间
    if (currentIndex === lyrics.value.length - 1) {
      return 8; // 默认8秒
    }

    // 计算到下一句歌词的时间差
    const currentTime = lyrics.value[currentIndex].time;
    const nextTime = lyrics.value[currentIndex + 1].time;
    const duration = nextTime - currentTime;

    // 确保时间在合理范围内 (最小2秒，最大20秒)
    return Math.max(2, Math.min(20, duration));
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

          lyricsState.shouldScroll[currentIndex] = needsScroll;

          // 如果当前歌词需要滚动，设置滚动动画
          if (needsScroll) {
            const textLength = lyrics.value[currentIndex]?.text?.length || 0;
            const overflowRatio = textWidth / containerWidth;
            const lyricDuration = getLyricDuration(currentIndex);

            // 基于歌词时长优化滚动速度计算
            let scrollDuration: number;
            let startDelay: number;

            if (overflowRatio <= 1.5) {
              // 轻微溢出：滚动时间为歌词时长的70%，延迟30%后开始滚动
              scrollDuration = lyricDuration * 0.7;
              startDelay = lyricDuration * 0.3;
            } else if (overflowRatio <= 2.5) {
              // 中等溢出：滚动时间为歌词时长的80%，延迟20%后开始滚动
              scrollDuration = lyricDuration * 0.8;
              startDelay = lyricDuration * 0.2;
            } else {
              // 严重溢出：滚动时间为歌词时长的90%，延迟10%后开始滚动
              scrollDuration = lyricDuration * 0.9;
              startDelay = lyricDuration * 0.1;
            }

            // 根据文本长度微调滚动速度
            const lengthFactor = Math.max(0.8, Math.min(1.2, textLength / 40));
            scrollDuration = scrollDuration * lengthFactor;

            // 确保滚动时间在合理范围内 (最小3秒，最大18秒)
            scrollDuration = Math.max(3, Math.min(18, scrollDuration));
            // 确保延迟时间合理 (最小0.5秒，最大3秒)
            startDelay = Math.max(0.5, Math.min(3, startDelay));

            lyricEl.style.setProperty(
              "--scroll-duration",
              `${scrollDuration}s`
            );

            // 为超长文本添加特殊标记
            if (textLength > 50 || overflowRatio > 2.5) {
              lyricEl.setAttribute("data-long-text", "true");
            }

            // 延迟启动滚动动画，让用户先阅读开头
            setTimeout(() => {
              if (
                lyricEl.parentElement &&
                lyricsState.currentIndex === currentIndex
              ) {
                lyricEl.classList.add("text-scrolling");
              }
            }, startDelay * 1000);
          }
        }
      }
    }, 72);
  };

  // 设置歌词行的DOM引用
  const setLyricRef = (el: any, index: number) => {
    if (el && el instanceof HTMLElement) {
      lyricRefs.value[index] = el;
    }
  };

  // 更新当前歌词索引（防抖版本）
  const updateCurrentLyricIndexDebounced = () => {
    if (lyrics.value.length === 0) {
      console.log("🎵 [更新歌词索引] 无歌词数据，跳过更新");
      return;
    }

    const oldIndex = lyricsState.currentIndex;
    const newLyricIndex = findCurrentLyricIndex();

    console.log("🎵 [更新歌词索引] 检查歌词索引更新:", {
      oldIndex,
      newLyricIndex,
      indexChanged: newLyricIndex !== oldIndex,
      currentTime: currentTime.value.toFixed(2),
      oldLyric:
        oldIndex >= 0
          ? lyrics.value[oldIndex]?.text?.substring(0, 30) + "..."
          : "无歌词",
      newLyric:
        newLyricIndex >= 0
          ? lyrics.value[newLyricIndex]?.text?.substring(0, 30) + "..."
          : "无歌词",
      totalLyrics: lyrics.value.length
    });

    if (newLyricIndex !== oldIndex) {
      console.log("🎵 [更新歌词索引] 歌词索引发生变化，开始更新:", {
        direction: newLyricIndex > oldIndex ? "向前" : "向后",
        indexDiff: newLyricIndex - oldIndex,
        newLyricTime:
          newLyricIndex >= 0
            ? lyrics.value[newLyricIndex]?.time?.toFixed(2)
            : "无时间"
      });

      lyricsState.currentIndex = newLyricIndex;
      calculateLyricsPosition();
      checkCurrentLyricScrollNeed();

      console.log("🎵 [更新歌词索引] 歌词索引更新完成");
    } else {
      console.log("🎵 [更新歌词索引] 歌词索引未变化，跳过更新");
    }
  };

  // 立即更新当前歌词索引（无防抖，用于拖拽结束等需要立即响应的场景）
  const updateCurrentLyricIndex = () => {
    console.log("🎵 [立即更新歌词索引] 立即更新歌词索引请求:", {
      currentTime: currentTime.value.toFixed(2),
      currentIndex: lyricsState.currentIndex,
      hasDebounceTimer: !!timeUpdateDebounceTimer,
      reason: "立即响应（如拖拽结束）"
    });

    // 清除防抖定时器
    if (timeUpdateDebounceTimer) {
      console.log("🎵 [立即更新歌词索引] 清除防抖定时器");
      clearTimeout(timeUpdateDebounceTimer);
      timeUpdateDebounceTimer = null;
    }

    // 立即执行更新
    updateCurrentLyricIndexDebounced();
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
    if (timeUpdateDebounceTimer) {
      clearTimeout(timeUpdateDebounceTimer);
      timeUpdateDebounceTimer = null;
    }
  };

  // 监听时间变化，自动更新歌词索引（带防抖优化和拖拽优化）
  watch(
    currentTime,
    (newTime, oldTime) => {
      if (lyrics.value.length === 0) {
        return;
      }

      // 计算时间变化
      const timeDiff = Math.abs(newTime - (oldTime || 0));
      const isSignificantTimeChange = timeDiff > 1; // 大于1秒的变化被认为是显著变化（如拖拽）
      const isDraggingNow = isDragging?.value || false;

      console.log("🎵 [时间监听] 播放时间变化:", {
        oldTime: oldTime?.toFixed(2) || "未知",
        newTime: newTime.toFixed(2),
        timeDiff: timeDiff.toFixed(2),
        isSignificantChange: isSignificantTimeChange,
        isDragging: isDraggingNow,
        hasDebounceTimer: !!timeUpdateDebounceTimer,
        currentIndex: lyricsState.currentIndex,
        lyricsLength: lyrics.value.length
      });

      // 清除之前的防抖定时器
      if (timeUpdateDebounceTimer) {
        console.log("🎵 [时间监听] 清除之前的防抖定时器");
        clearTimeout(timeUpdateDebounceTimer);
      }

      // 🚀 性能优化：如果正在拖拽，使用不同的更新策略
      if (isDraggingNow) {
        console.log("⚡ [拖拽优化] 拖拽期间使用即时更新，跳过防抖");
        // 拖拽时立即更新，不使用防抖，确保歌词跟随流畅
        updateCurrentLyricIndexDebounced();
        timeUpdateDebounceTimer = null;
        return;
      }

      // 对于显著的时间变化（如拖拽跳转），立即更新
      if (isSignificantTimeChange) {
        console.log("🎵 [时间监听] 检测到显著时间变化，立即更新歌词索引");
        updateCurrentLyricIndexDebounced();
        timeUpdateDebounceTimer = null;
        return;
      }

      // 正常播放时使用防抖，50ms内的多次更新会被合并
      timeUpdateDebounceTimer = window.setTimeout(() => {
        console.log("🎵 [时间监听] 防抖定时器触发，执行歌词索引更新");
        updateCurrentLyricIndexDebounced();
        timeUpdateDebounceTimer = null;
      }, 50);
    },
    { immediate: false }
  );

  return {
    // 状态
    lyrics,
    lyricsState,
    lyricRefs,

    // 方法
    parseLyrics,
    validateAndNormalizeLyrics,
    setLyrics,
    clearLyrics,
    setLyricRef,
    updateCurrentLyricIndex,
    findCurrentLyricIndex,
    calculateLyricsPosition,
    checkCurrentLyricScrollNeed,
    getLyricDuration,
    cleanup
  };
}
