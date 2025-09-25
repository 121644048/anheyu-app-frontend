<!--
 * @Description: 音乐主页专用滚动歌词组件
 * @Author: 安知鱼
 * @Date: 2025-09-23 23:15:00
 * @核心原则: 只在歌词索引变化时滚动，保持逻辑简洁高效
 *           移除所有基于时间的复杂滚动逻辑，避免冲突和性能问题
-->
<template>
  <div
    ref="scrollContainer"
    class="music-home-lyrics-scroll"
    :style="{ '--dominant-color': dominantColor }"
    @scroll="handleScroll"
    @wheel="handleWheel"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
  >
    <div
      ref="lyricsContent"
      class="lyrics-scroll-content"
      :class="{ 'auto-scrolling': isAutoScrolling }"
      :style="containerPaddingStyle"
    >
      <!-- 无歌词状态 -->
      <div v-if="lyrics.length === 0" class="lyric-item no-lyrics">
        <div class="lyric-text">♪ 暂无歌词 ♪</div>
      </div>

      <!-- 歌词列表 -->
      <div
        v-for="(lyric, index) in lyrics"
        :key="index"
        :ref="el => setLyricRef(el, index)"
        class="lyric-item"
        :class="{
          'is-current': index === lyricsState.currentIndex,
          'is-passed': index < lyricsState.currentIndex,
          'is-upcoming': index > lyricsState.currentIndex
        }"
        :data-index="index"
        @click="handleLyricClick(index)"
      >
        <div class="lyric-text">
          {{ lyric.text }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from "vue";
import type { LyricLine, LyricsState } from "@/types/music";

interface Props {
  lyrics: LyricLine[];
  lyricsState: LyricsState;
  dominantColor: string;
  currentTime?: number; // 添加当前播放时间属性
  isDragging?: boolean; // 添加拖拽状态标识，用于优化拖拽期间的滚动性能
}

interface Emits {
  (e: "lyric-click", index: number): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 组件引用
const scrollContainer = ref<HTMLElement>();
const lyricsContent = ref<HTMLElement>();

// 歌词元素引用数组
const lyricRefs = ref<(HTMLElement | null)[]>([]);

// 滚动状态
const isAutoScrolling = ref(false);
const userScrolling = ref(false);
const scrollAnimationId = ref<number>();

// 容器内边距（用于居中显示歌词）- 响应式设计
const containerPadding = computed(() => {
  // 检测移动端
  if (typeof window !== "undefined") {
    const width = window.innerWidth;
    if (width <= 480) {
      return 80; // 超小屏幕 - 适应紧凑布局
    } else if (width <= 768) {
      return 100; // 移动端 - 合适的内边距
    } else if (width <= 1024) {
      return 240; // 平板
    }
  }
  return 300; // 桌面端
});

// 容器内边距样式计算属性
const containerPaddingStyle = computed(() => {
  // 如果没有歌词，不需要padding
  if (props.lyrics.length === 0) {
    console.log("📏 [容器样式] 无歌词状态，移除padding");
    return {
      paddingTop: "0px",
      paddingBottom: "0px"
    };
  }

  // 检测是否为移动端
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;

  // 移动端适配：使用合适的内边距，滚动位置通过滚动逻辑调整
  if (isMobile) {
    // 移动端使用合适的上下 padding，实际位置通过滚动计算调整
    const mobilePadding = window.innerWidth <= 480 ? 80 : 100; // 超小屏幕80px，其他移动端100px

    console.log("📏 [容器样式] 移动端歌词状态，应用标准padding:", {
      lyricsLength: props.lyrics.length,
      mobilePadding,
      screenWidth: window.innerWidth,
      reason: "移动端位置通过滚动逻辑调整，而不是padding"
    });
    return {
      paddingTop: `${mobilePadding}px`,
      paddingBottom: `${mobilePadding}px`
    };
  }

  // 桌面端使用正常的上下padding
  console.log("📏 [容器样式] 桌面端歌词状态，应用上下padding:", {
    lyricsLength: props.lyrics.length,
    padding: containerPadding.value
  });
  return {
    paddingTop: `${containerPadding.value}px`,
    paddingBottom: `${containerPadding.value}px`
  };
});

// 设置歌词元素引用 - 减少不必要的日志输出
const setLyricRef = (el: any, index: number) => {
  if (el && el instanceof HTMLElement) {
    lyricRefs.value[index] = el;
    // 大幅减少日志输出，只在真正需要调试时输出
    // 可以通过 window.musicDebug.debugLyricsScroll() 查看详细状态
  }
};

// 计算目标滚动位置 - 移动端偏上显示，桌面端居中显示
const calculateTargetScrollTop = (
  lyricElement: HTMLElement,
  containerHeight: number,
  lyricHeight: number
): number => {
  const lyricOffsetTop = lyricElement.offsetTop;

  // 检测是否为移动端
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;

  if (isMobile) {
    // 移动端：让当前歌词显示在屏幕上方1/3位置（大约第三句的位置）
    // 这样下方有更多空间显示后续歌词
    const targetPosition = containerHeight * 0.25; // 上方1/4位置
    const targetScrollTop = lyricOffsetTop - targetPosition + lyricHeight / 2;

    console.log("📱 [移动端滚动] 计算偏上滚动位置:", {
      lyricOffsetTop,
      containerHeight,
      targetPosition,
      targetScrollTop,
      reason: "移动端让当前歌词显示在第三句位置"
    });

    return targetScrollTop;
  } else {
    // 桌面端：居中显示
    const targetScrollTop =
      lyricOffsetTop - containerHeight / 2 + lyricHeight / 2;

    console.log("🖥️ [桌面端滚动] 计算居中滚动位置:", {
      lyricOffsetTop,
      containerHeight,
      targetScrollTop,
      reason: "桌面端歌词居中显示"
    });

    return targetScrollTop;
  }
};

// 处理歌词点击
const handleLyricClick = (index: number) => {
  console.log("🎵 [歌词点击] 开始处理歌词点击事件:", {
    clickedIndex: index,
    currentIndex: props.lyricsState.currentIndex,
    totalLyrics: props.lyrics.length,
    clickedLyric:
      props.lyrics[index]?.text?.substring(0, 30) + "..." || "未知歌词",
    clickedLyricTime: props.lyrics[index]?.time || "未知时间",
    userScrolling: userScrolling.value,
    isAutoScrolling: isAutoScrolling.value,
    currentTime: props.currentTime
  });

  // 发出事件给父组件
  emit("lyric-click", index);

  // 立即滚动到点击的歌词位置
  console.log("🎵 [歌词点击] 准备滚动到点击的歌词位置，重置滚动状态");

  // 重置用户滚动状态，允许自动滚动
  userScrolling.value = false;
  isAutoScrolling.value = false;

  // 清除当前滚动动画
  if (scrollAnimationId.value) {
    console.log("🎵 [歌词点击] 取消当前滚动动画");
    cancelAnimationFrame(scrollAnimationId.value);
  }

  // 直接滚动到点击的歌词位置
  scrollToLyricIndex(index);
};

// 用户滚动重置定时器
let userScrollResetTimer: number | null = null;

// 移动端触摸状态
const isTouching = ref(false);
let touchStartY = 0;

// 处理鼠标滚轮事件
const handleWheel = (event: WheelEvent) => {
  console.log("🖱️ [鼠标滚轮] 用户开始手动滚动:", {
    deltaY: event.deltaY,
    deltaX: event.deltaX,
    currentScrollTop: scrollContainer.value?.scrollTop || 0,
    previousUserScrolling: userScrolling.value,
    previousAutoScrolling: isAutoScrolling.value,
    currentLyricIndex: props.lyricsState.currentIndex
  });

  userScrolling.value = true;
  isAutoScrolling.value = false;

  // 清除当前滚动动画
  if (scrollAnimationId.value) {
    console.log("🖱️ [鼠标滚轮] 取消当前滚动动画 ID:", scrollAnimationId.value);
    cancelAnimationFrame(scrollAnimationId.value);
    scrollAnimationId.value = undefined;
  }

  // 清除之前的重置定时器
  if (userScrollResetTimer) {
    console.log("🖱️ [鼠标滚轮] 清除之前的重置定时器");
    clearTimeout(userScrollResetTimer);
    userScrollResetTimer = null;
  }

  userScrollResetTimer = window.setTimeout(() => {
    console.log("🖱️ [鼠标滚轮] 4秒后重置用户滚动状态:", {
      currentIndex: props.lyricsState.currentIndex,
      currentLyric:
        props.lyrics[props.lyricsState.currentIndex]?.text?.substring(0, 30) +
          "..." || "无歌词",
      beforeReset: {
        userScrolling: userScrolling.value,
        isAutoScrolling: isAutoScrolling.value
      }
    });

    userScrolling.value = false;
    userScrollResetTimer = null;

    const currentIndex = props.lyricsState.currentIndex;
    if (currentIndex >= 0) {
      console.log("🖱️ [鼠标滚轮] 恢复自动滚动到当前播放位置");
      scrollToCurrentLyricCenter(currentIndex);
    }
  }, 4000);
};

// 处理滚动事件 - 优化后只在真正需要时才处理
const handleScroll = () => {
  // 自动滚动期间完全忽略scroll事件，避免误判
  if (isAutoScrolling.value) {
    // console.log("📜 [滚动事件] 自动滚动中，忽略滚动事件");
    return;
  }

  // 如果已经标记为用户滚动，不重复处理
  if (userScrolling.value) {
    return;
  }

  console.log("📜 [滚动事件] 检测到可能的用户滚动:", {
    scrollTop: scrollContainer.value?.scrollTop,
    isAutoScrolling: isAutoScrolling.value,
    userScrolling: userScrolling.value
  });

  // 延迟100ms再判断，避免程序滚动刚结束时的误判
  setTimeout(() => {
    // 双重检查：确保不是在自动滚动状态
    if (!isAutoScrolling.value && !userScrolling.value) {
      console.log("📜 [滚动事件] 确认为用户主动滚动，标记状态");
      userScrolling.value = true;

      // 清除之前的重置定时器
      if (userScrollResetTimer) {
        clearTimeout(userScrollResetTimer);
        userScrollResetTimer = null;
      }

      userScrollResetTimer = window.setTimeout(() => {
        userScrolling.value = false;
        userScrollResetTimer = null;

        const currentIndex = props.lyricsState.currentIndex;
        if (currentIndex >= 0) {
          scrollToCurrentLyricCenter(currentIndex);
        }
      }, 4000);
    }
  }, 100);
};

// 移动端触摸事件处理
const handleTouchStart = (event: TouchEvent) => {
  console.log("📱 [触摸开始] 用户开始触摸滚动:", {
    touches: event.touches.length,
    clientY: event.touches[0]?.clientY || 0,
    timestamp: performance.now()
  });

  isTouching.value = true;
  touchStartY = event.touches[0]?.clientY || 0;

  // 清除之前的重置定时器
  if (userScrollResetTimer) {
    clearTimeout(userScrollResetTimer);
    userScrollResetTimer = null;
  }
};

const handleTouchMove = (event: TouchEvent) => {
  if (!isTouching.value) return;

  const currentY = event.touches[0]?.clientY || 0;
  const deltaY = touchStartY - currentY;

  // 只有明显的滑动才认为是用户滚动
  if (Math.abs(deltaY) > 10) {
    console.log("📱 [触摸移动] 用户正在触摸滚动:", {
      deltaY,
      previousUserScrolling: userScrolling.value,
      currentScrollTop: scrollContainer.value?.scrollTop || 0
    });

    userScrolling.value = true;
    isAutoScrolling.value = false;

    // 清除当前滚动动画
    if (scrollAnimationId.value) {
      cancelAnimationFrame(scrollAnimationId.value);
      scrollAnimationId.value = undefined;
    }
  }
};

const handleTouchEnd = () => {
  console.log("📱 [触摸结束] 用户结束触摸:", {
    userScrolling: userScrolling.value,
    timestamp: performance.now()
  });

  isTouching.value = false;
  touchStartY = 0;

  // 移动端触摸结束后3秒恢复自动滚动（比鼠标滚轮快1秒）
  if (userScrolling.value) {
    userScrollResetTimer = window.setTimeout(() => {
      console.log("📱 [触摸结束] 3秒后重置用户滚动状态 (移动端优化)");
      userScrolling.value = false;
      userScrollResetTimer = null;

      // 恢复到当前播放的歌词位置
      const currentIndex = props.lyricsState.currentIndex;
      if (currentIndex >= 0) {
        scrollToCurrentLyricCenter(currentIndex);
      }
    }, 3000); // 移动端优化：3秒而不是4秒
  }
};

// 滚动到指定歌词索引位置（带动画）
const scrollToLyricIndex = async (targetIndex: number) => {
  console.log("🎯 [滚动到指定歌词] 开始滚动:", {
    targetIndex,
    totalLyrics: props.lyrics.length,
    targetLyric:
      props.lyrics[targetIndex]?.text?.substring(0, 50) + "..." || "未知歌词",
    targetLyricTime: props.lyrics[targetIndex]?.time || "未知时间",
    userScrolling: userScrolling.value,
    isAutoScrolling: isAutoScrolling.value
  });

  if (
    !scrollContainer.value ||
    !lyricRefs.value.length ||
    targetIndex < 0 ||
    targetIndex >= props.lyrics.length
  ) {
    console.warn("🎯 [滚动到指定歌词] 滚动条件不满足:", {
      hasScrollContainer: !!scrollContainer.value,
      lyricRefsLength: lyricRefs.value.length,
      targetIndex,
      totalLyrics: props.lyrics.length,
      containerScrollTop: scrollContainer.value?.scrollTop || 0,
      containerHeight: scrollContainer.value?.clientHeight || 0
    });
    return;
  }

  const targetLyricEl = lyricRefs.value[targetIndex];

  if (!targetLyricEl) {
    console.warn("🎯 [滚动到指定歌词] 目标歌词元素不存在:", {
      targetIndex,
      availableRefs: lyricRefs.value
        .map((ref, i) => ({
          index: i,
          exists: !!ref,
          lyricText: props.lyrics[i]?.text?.substring(0, 20) + "..." || "无歌词"
        }))
        .slice(Math.max(0, targetIndex - 2), targetIndex + 3)
    });
    return;
  }

  await nextTick();

  const containerHeight = scrollContainer.value.clientHeight;
  const lyricOffsetTop = targetLyricEl.offsetTop;
  const lyricHeight = targetLyricEl.offsetHeight;
  const currentScrollTop = scrollContainer.value.scrollTop;

  // 计算目标滚动位置（移动端偏上，桌面端居中）
  const targetScrollTop = calculateTargetScrollTop(
    targetLyricEl,
    containerHeight,
    lyricHeight
  );

  // 计算滚动距离，判断是否需要滚动
  const scrollDistance = Math.abs(targetScrollTop - currentScrollTop);

  console.log("🎯 [滚动到指定歌词] 详细计算信息:", {
    containerHeight,
    lyricOffsetTop,
    lyricHeight,
    currentScrollTop,
    targetScrollTop,
    scrollDistance,
    needsScroll: scrollDistance > 5,
    lyricText: props.lyrics[targetIndex]?.text?.substring(0, 30) + "..."
  });

  // 如果距离很小，不需要滚动
  if (scrollDistance <= 5) {
    console.log("🎯 [滚动到指定歌词] 距离太小，无需滚动");
    return;
  }

  // 原生风格的滚动动画 - 根据距离调整时长
  const animationDuration = scrollDistance > 500 ? 300 : 200;
  smoothScrollTo(targetScrollTop, `点击歌词${targetIndex}`, animationDuration);
};

// 智能拖拽滚动到指定歌词索引位置（用于拖拽时的丝滑滚动）
const scrollToLyricIndexSmooth = async (targetIndex: number) => {
  if (
    !scrollContainer.value ||
    !lyricRefs.value.length ||
    targetIndex < 0 ||
    targetIndex >= props.lyrics.length
  ) {
    return;
  }

  const targetLyricEl = lyricRefs.value[targetIndex];
  if (!targetLyricEl) {
    return;
  }

  await nextTick();

  const containerHeight = scrollContainer.value.clientHeight;
  const lyricOffsetTop = targetLyricEl.offsetTop;
  const lyricHeight = targetLyricEl.offsetHeight;
  const currentScrollTop = scrollContainer.value.scrollTop;

  // 计算目标滚动位置（移动端偏上，桌面端居中）
  const targetScrollTop = calculateTargetScrollTop(
    targetLyricEl,
    containerHeight,
    lyricHeight
  );

  // 计算滚动距离
  const scrollDistance = Math.abs(targetScrollTop - currentScrollTop);

  if (props.isDragging) {
    const quickAnimationDuration = Math.min(100, scrollDistance / 10);
    smoothScrollTo(
      targetScrollTop,
      `拖拽快速滚动到歌词${targetIndex}`,
      quickAnimationDuration
    );
    return;
  }

  // 非拖拽状态下的平滑滚动
  if (scrollDistance < 10) {
    // 距离很小，直接跳转
    scrollContainer.value.scrollTop = targetScrollTop;
  } else {
    // 统一的自然滚动体验
    const animationDuration = scrollDistance > 400 ? 250 : 180;
    smoothScrollTo(
      targetScrollTop,
      `原生风格拖拽滚动到歌词${targetIndex}`,
      animationDuration
    );
  }
};

// 即时滚动到指定歌词索引位置（无动画，保留作为备用）
const scrollToLyricIndexInstant = async (targetIndex: number) => {
  if (
    !scrollContainer.value ||
    !lyricRefs.value.length ||
    targetIndex < 0 ||
    targetIndex >= props.lyrics.length
  ) {
    return;
  }

  const targetLyricEl = lyricRefs.value[targetIndex];
  if (!targetLyricEl) {
    return;
  }

  await nextTick();

  const containerHeight = scrollContainer.value.clientHeight;
  const lyricOffsetTop = targetLyricEl.offsetTop;
  const lyricHeight = targetLyricEl.offsetHeight;

  // 计算目标滚动位置（移动端偏上，桌面端居中）
  const targetScrollTop = calculateTargetScrollTop(
    targetLyricEl,
    containerHeight,
    lyricHeight
  );

  // 直接设置滚动位置，无动画
  scrollContainer.value.scrollTop = targetScrollTop;
};

// 计算居中滚动位置（自动滚动到当前播放位置）
const calculateCenterScroll = async () => {
  const currentIndex = props.lyricsState.currentIndex;

  console.log("📍 [自动滚动] 开始计算居中滚动位置:", {
    currentIndex,
    userScrolling: userScrolling.value,
    isAutoScrolling: isAutoScrolling.value,
    hasScrollContainer: !!scrollContainer.value,
    lyricRefsLength: lyricRefs.value.length,
    totalLyrics: props.lyrics.length,
    currentLyric:
      props.lyrics[currentIndex]?.text?.substring(0, 40) + "..." || "未知歌词",
    currentTime: props.currentTime,
    lyricTime: props.lyrics[currentIndex]?.time || "未知时间"
  });

  // 检查滚动条件
  if (
    !scrollContainer.value ||
    userScrolling.value ||
    !lyricRefs.value.length ||
    currentIndex < 0
  ) {
    console.log("📍 [自动滚动] 跳过滚动，条件不满足:", {
      hasScrollContainer: !!scrollContainer.value,
      userScrolling: userScrolling.value,
      lyricRefsLength: lyricRefs.value.length,
      currentIndex,
      reason: !scrollContainer.value
        ? "无容器"
        : userScrolling.value
          ? "用户滚动中"
          : !lyricRefs.value.length
            ? "无歌词引用"
            : currentIndex < 0
              ? "无有效索引"
              : "未知原因"
    });
    return;
  }

  const currentLyricEl = lyricRefs.value[currentIndex];

  if (!currentLyricEl) {
    console.warn("📍 [自动滚动] 当前歌词元素不存在:", {
      currentIndex,
      totalLyrics: props.lyrics.length,
      availableRefs: lyricRefs.value
        .map((ref, i) => ({
          index: i,
          exists: !!ref,
          lyricText: props.lyrics[i]?.text?.substring(0, 15) + "..." || "无歌词"
        }))
        .filter(item => item.exists)
        .slice(0, 5), // 只显示前5个存在的引用
      lyricRefsTotal: lyricRefs.value.filter(ref => !!ref).length
    });
    return;
  }

  await nextTick();

  const containerHeight = scrollContainer.value.clientHeight;
  const lyricOffsetTop = currentLyricEl.offsetTop;
  const lyricHeight = currentLyricEl.offsetHeight;
  const currentScrollTop = scrollContainer.value.scrollTop;

  // 计算目标滚动位置（移动端偏上，桌面端居中）
  const targetScrollTop = calculateTargetScrollTop(
    currentLyricEl,
    containerHeight,
    lyricHeight
  );

  // 计算滚动距离
  const scrollDistance = Math.abs(targetScrollTop - currentScrollTop);

  console.log("📍 [自动滚动] 详细计算信息:", {
    containerHeight,
    lyricOffsetTop,
    lyricHeight,
    currentScrollTop,
    targetScrollTop,
    scrollDistance,
    needsScroll: scrollDistance > 5,
    scrollDirection:
      targetScrollTop > currentScrollTop ? "向下滚动" : "向上滚动",
    lyricText: props.lyrics[currentIndex]?.text?.substring(0, 30) + "..."
  });

  // 如果距离很小，不需要滚动
  if (scrollDistance <= 5) {
    console.log("📍 [自动滚动] 距离太小，歌词已在中心位置，无需滚动");
    return;
  }

  // 原生风格的自动滚动
  const animationDuration = scrollDistance > 600 ? 400 : 250;
  smoothScrollTo(
    targetScrollTop,
    `自动滚动到歌词${currentIndex}`,
    animationDuration
  );
};

// 平滑滚动到指定位置
const smoothScrollTo = (
  targetScrollTop: number,
  reason = "未知原因",
  customDuration = 800
) => {
  if (!scrollContainer.value) {
    console.warn("🌊 [平滑滚动] 滚动容器不存在");
    return;
  }

  // 🚀 性能优化：拖拽期间跳过动画，直接设置位置
  if (props.isDragging) {
    console.log("⚡ [拖拽优化] 跳过平滑滚动动画，直接设置位置", {
      reason,
      targetScrollTop: Math.round(targetScrollTop),
      currentScrollTop: Math.round(scrollContainer.value.scrollTop)
    });

    scrollContainer.value.scrollTop = targetScrollTop;
    return;
  }

  const startScrollTop = scrollContainer.value.scrollTop;
  const distance = targetScrollTop - startScrollTop;
  const duration = customDuration;
  const startTime = performance.now();

  // 预先获取缓动函数信息用于日志
  const absDistance = Math.abs(distance);
  const easingConfig = selectEasingFunction(absDistance);

  console.log("🌊 [原生滚动] 开始:", {
    reason,
    distance: Math.round(absDistance),
    duration,
    easing: easingConfig.name,
    isDragging: props.isDragging || false
  });

  // 如果距离很小，不需要滚动
  if (Math.abs(distance) <= 5) {
    console.log("🌊 [平滑滚动] 距离太小，跳过滚动");
    return;
  }

  // 清除之前的滚动动画
  if (scrollAnimationId.value) {
    console.log("🌊 [平滑滚动] 取消之前的滚动动画");
    cancelAnimationFrame(scrollAnimationId.value);
  }

  isAutoScrolling.value = true;
  let frameCount = 0;

  const animateScroll = (currentTime: number) => {
    if (!scrollContainer.value) {
      console.warn("🌊 [平滑滚动] 动画中滚动容器消失");
      isAutoScrolling.value = false;
      return;
    }

    // 🚀 性能优化：如果在动画过程中开始拖拽，立即结束动画
    if (props.isDragging) {
      console.log("⚡ [拖拽优化] 动画中检测到拖拽，立即结束动画");
      isAutoScrolling.value = false;
      return;
    }

    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // 使用预选的缓动函数
    const easeProgress = easingConfig.func(progress);
    const currentScrollTop = startScrollTop + distance * easeProgress;

    scrollContainer.value.scrollTop = currentScrollTop;
    frameCount++;

    // 减少日志输出 - 只在完成时输出，保持清爽
    if (progress >= 1) {
      console.log("🌊 [原生滚动] 完成:", {
        reason,
        frames: frameCount,
        easing: easingConfig.name
      });
    }

    if (progress < 1 && !userScrolling.value && !props.isDragging) {
      scrollAnimationId.value = requestAnimationFrame(animateScroll);
    } else {
      // 动画已在上面输出完成日志，避免重复输出
      isAutoScrolling.value = false;
    }
  };

  scrollAnimationId.value = requestAnimationFrame(animateScroll);
};

// 缓动函数集合
const easeInOutCubic = (t: number): number => {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

// 快速启动，平滑结束 - 适合大跨度滚动
const easeOutQuart = (t: number): number => {
  return 1 - Math.pow(1 - t, 4);
};

// 平滑启动，快速结束 - 适合短距离滚动
const easeInOutQuad = (t: number): number => {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
};

// 简化的缓动函数 - 模拟原生滚动感觉
const easeOutExpo = (t: number): number => {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
};

// 原生滚动风格的线性缓动
const easeLinear = (t: number): number => {
  return t;
};

const selectEasingFunction = (distance: number) => {
  if (props.isDragging) {
    return { func: easeInOutQuad, name: "拖拽滚动" };
  }

  if (distance <= 200) {
    // 短距离：使用二次缓动，更顺滑
    return { func: easeInOutQuad, name: "短距离滚动" };
  } else if (distance <= 500) {
    // 中距离：使用三次缓动，平衡流畅度和速度
    return { func: easeInOutCubic, name: "中距离滚动" };
  } else {
    // 长距离：使用四次缓出，模拟的长距离滚动
    return { func: easeOutQuart, name: "长距离滚动" };
  }
};

// 滚动到当前歌词的居中位置（基于索引）- 智能调整动画时间
const scrollToCurrentLyricCenter = (currentIndex: number) => {
  if (
    !scrollContainer.value ||
    userScrolling.value ||
    props.lyrics.length === 0 ||
    currentIndex < 0 ||
    currentIndex >= props.lyrics.length
  ) {
    return;
  }

  const currentLyricEl = lyricRefs.value[currentIndex];
  if (!currentLyricEl) {
    return;
  }

  const containerHeight = scrollContainer.value.clientHeight;
  const lyricOffsetTop = currentLyricEl.offsetTop;
  const lyricHeight = currentLyricEl.offsetHeight;
  const currentScrollTop = scrollContainer.value.scrollTop;

  // 计算目标滚动位置（移动端偏上，桌面端居中）
  const targetScrollTop = calculateTargetScrollTop(
    currentLyricEl,
    containerHeight,
    lyricHeight
  );

  // 计算滚动距离
  const scrollDistance = Math.abs(targetScrollTop - currentScrollTop);

  // 🚀 风格：拖拽时也使用快速动画
  if (props.isDragging) {
    console.log("⚡ [拖拽优化] 当前歌词滚动使用快速动画", {
      currentIndex,
      scrollDistance: Math.round(scrollDistance)
    });

    // 拖拽时使用极快的动画（80ms），保持流畅
    const ultraFastDuration = Math.min(80, scrollDistance / 15);
    smoothScrollTo(
      targetScrollTop,
      `拖拽到当前歌词${currentIndex}`,
      ultraFastDuration
    );
    return;
  }

  // 风格的动画时长策略 - 精确模拟的滚动时长
  let animationDuration: number;
  let animationStrategy: string;

  if (scrollDistance <= 80) {
    // 极短距离：快速响应，风格
    animationDuration = 200;
    animationStrategy = "快速滚动";
  } else if (scrollDistance <= 300) {
    // 短距离：流畅自然，模拟的短距离滚动
    animationDuration = 400;
    animationStrategy = "自然滚动";
  } else if (scrollDistance <= 800) {
    // 中等距离：平衡速度和流畅度
    animationDuration = 600;
    animationStrategy = "平衡滚动";
  } else {
    // 长距离：有明显的缓动感，类似的长距离滚动
    animationDuration = 800;
    animationStrategy = "长距离滚动";
  }

  console.log("🎯 [原生滚动] 滚动策略:", {
    currentIndex,
    scrollDistance: Math.round(scrollDistance),
    animationDuration,
    strategy: animationStrategy,
    target: Math.round(targetScrollTop),
    current: Math.round(currentScrollTop),
    isDragging: props.isDragging || false
  });

  // 使用智能调整的滚动参数
  smoothScrollTo(
    targetScrollTop,
    `${animationStrategy}到索引${currentIndex}`,
    animationDuration
  );
};

// 移除复杂的基于时间的滚动微调逻辑 - 不再需要
// 歌词滚动只在索引变化时触发，保持简洁高效

// 更新容器内边距 - 现在由响应式计算属性自动处理
// 不再需要手动更新，containerPadding 现在是基于屏幕宽度的计算属性

// 移除滚动更新节流控制 - 不再需要频繁的时间驱动滚动更新

// 防止重复滚动的标记
let isScrollingInProgress = false;

// 监听当前歌词索引变化，确保高亮歌词始终居中（这是核心的自动滚动逻辑）
watch(
  () => props.lyricsState.currentIndex,
  (newIndex, oldIndex) => {
    console.log("🎵 [歌词索引变化] 检测到歌词索引改变:", {
      oldIndex,
      newIndex,
      userScrolling: userScrolling.value,
      isAutoScrolling: isAutoScrolling.value,
      isScrollingInProgress,
      totalLyrics: props.lyrics.length,
      oldLyric:
        props.lyrics[oldIndex]?.text?.substring(0, 30) + "..." || "无歌词",
      newLyric:
        props.lyrics[newIndex]?.text?.substring(0, 30) + "..." || "无歌词",
      currentTime: props.currentTime
    });

    // 歌词索引变化时应该优先滚动，这是最重要的触发条件
    if (newIndex >= 0 && newIndex !== oldIndex && !isScrollingInProgress) {
      console.log("🎵 [歌词索引变化] 歌词切换，开始自动滚动到新歌词位置");

      // 标记滚动进行中，防止重复触发
      isScrollingInProgress = true;

      // 如果用户正在滚动，但歌词已经切换，我们需要权衡是否滚动
      if (userScrolling.value) {
        console.log("🎵 [歌词索引变化] 检测到用户滚动状态，但歌词已切换");

        // 如果用户滚动定时器还在，说明用户可能已经停止滚动，强制滚动到新歌词
        if (userScrollResetTimer) {
          console.log(
            "🎵 [歌词索引变化] 歌词切换优先，清除用户滚动状态并执行滚动"
          );
          clearTimeout(userScrollResetTimer);
          userScrollResetTimer = null;
          userScrolling.value = false;
        }
      }

      // 如果现在用户没在滚动，直接滚动
      if (!userScrolling.value) {
        // 使用requestAnimationFrame确保滚动更新的流畅性
        requestAnimationFrame(() => {
          scrollToCurrentLyricCenter(newIndex);
          // 滚动完成后重置标记
          setTimeout(() => {
            isScrollingInProgress = false;
          }, 500);
        });
      } else {
        console.log(
          "🎵 [歌词索引变化] 用户仍在滚动中，延迟1秒后检查是否需要滚动"
        );
        // 如果用户仍在滚动，等待1秒后检查
        setTimeout(() => {
          if (
            props.lyricsState.currentIndex === newIndex &&
            !userScrolling.value
          ) {
            console.log("🎵 [歌词索引变化] 延迟滚动执行");
            scrollToCurrentLyricCenter(newIndex);
          }
          isScrollingInProgress = false;
        }, 1000);
      }
    } else {
      console.log("🎵 [歌词索引变化] 跳过自动滚动:", {
        reason:
          newIndex < 0
            ? "索引无效"
            : newIndex === oldIndex
              ? "索引未变化"
              : isScrollingInProgress
                ? "滚动进行中"
                : "未知原因"
      });
    }
  },
  { immediate: false }
);

// 移除基于时间的微调滚动监听 - 只需要在歌词索引变化时滚动即可
// 时间变化不需要触发滚动，避免不必要的滚动操作

// 监听歌词数据变化（歌曲切换时触发）
watch(
  () => props.lyrics,
  (newLyrics, oldLyrics) => {
    console.log("🎵 [歌词数据变化] 歌词数据发生变化:", {
      oldLyricsLength: oldLyrics?.length || 0,
      newLyricsLength: newLyrics?.length || 0,
      firstOldLyric: oldLyrics?.[0]?.text?.substring(0, 30) + "..." || "无",
      firstNewLyric: newLyrics?.[0]?.text?.substring(0, 30) + "..." || "无",
      lastOldLyric:
        oldLyrics?.[oldLyrics.length - 1]?.text?.substring(0, 30) + "..." ||
        "无",
      lastNewLyric:
        newLyrics?.[newLyrics.length - 1]?.text?.substring(0, 30) + "..." ||
        "无",
      currentIndex: props.lyricsState.currentIndex,
      hasSignificantChange:
        (oldLyrics?.length || 0) !== (newLyrics?.length || 0) ||
        oldLyrics?.[0]?.text !== newLyrics?.[0]?.text
    });

    // 🎵 重要：切换歌曲时完全重置滚动状态
    console.log("🎵 [歌词数据变化] 完全重置滚动状态和清理资源");
    userScrolling.value = false;
    isAutoScrolling.value = false;
    lyricRefs.value = [];

    // 重置容器滚动位置
    if (scrollContainer.value) {
      scrollContainer.value.scrollTop = 0;
      console.log("🎵 [歌词数据变化] 滚动容器位置已重置到顶部");
    }

    // 清除正在进行的滚动动画
    if (scrollAnimationId.value) {
      console.log(
        "🎵 [歌词数据变化] 清除正在进行的滚动动画 ID:",
        scrollAnimationId.value
      );
      cancelAnimationFrame(scrollAnimationId.value);
      scrollAnimationId.value = undefined;
    }

    // 如果新歌词为空，直接返回
    if (!newLyrics || newLyrics.length === 0) {
      console.log("🎵 [歌词数据变化] 新歌词为空，无需初始化滚动");
      return;
    }

    // 延迟执行滚动计算，确保DOM更新完成
    nextTick(() => {
      console.log("🎵 [歌词数据变化] DOM更新完成，准备在500ms后执行初始滚动");
      setTimeout(() => {
        // 滚动到当前高亮歌词的居中位置
        const currentIndex = props.lyricsState.currentIndex;
        console.log("🎵 [歌词数据变化] 开始执行初始滚动:", {
          currentIndex,
          hasValidIndex: currentIndex >= 0 && currentIndex < newLyrics.length,
          targetLyric:
            newLyrics[currentIndex]?.text?.substring(0, 40) + "..." || "无歌词",
          scrollMethod:
            currentIndex >= 0
              ? "scrollToCurrentLyricCenter"
              : "calculateCenterScroll"
        });

        if (currentIndex >= 0 && currentIndex < newLyrics.length) {
          scrollToCurrentLyricCenter(currentIndex);
        } else {
          // 如果没有有效的当前索引，滚动到顶部或使用传统的居中滚动
          console.log("🎵 [歌词数据变化] 无有效索引，使用备用滚动方法");
          calculateCenterScroll();
        }
      }, 500);
    });
  },
  { deep: true }
);

// 组件挂载时的初始化
onMounted(() => {
  console.log("🚀 [组件初始化] 歌词滚动组件已挂载:", {
    lyricsLength: props.lyrics.length,
    currentIndex: props.lyricsState.currentIndex,
    hasScrollContainer: !!scrollContainer.value,
    containerHeight: scrollContainer.value?.clientHeight || 0,
    containerScrollTop: scrollContainer.value?.scrollTop || 0,
    firstLyric: props.lyrics[0]?.text?.substring(0, 30) + "..." || "无歌词",
    currentLyric:
      props.lyrics[props.lyricsState.currentIndex]?.text?.substring(0, 30) +
        "..." || "无歌词",
    timestamp: new Date().toLocaleTimeString()
  });

  // 容器内边距现在由响应式计算属性自动处理，无需手动初始化
  // containerPadding 会根据屏幕宽度自动调整

  // 延迟执行初始滚动，确保所有DOM元素都已渲染完成
  console.log("🚀 [组件初始化] 准备在800ms后执行初始滚动");
  setTimeout(() => {
    console.log("🚀 [组件初始化] 开始执行初始滚动:", {
      currentIndex: props.lyricsState.currentIndex,
      totalLyrics: props.lyrics.length,
      lyricRefsLength: lyricRefs.value.length,
      hasValidRefs: lyricRefs.value.filter(ref => !!ref).length,
      userScrolling: userScrolling.value
    });

    // 滚动到当前高亮歌词的居中位置
    const currentIndex = props.lyricsState.currentIndex;
    if (currentIndex >= 0 && currentIndex < props.lyrics.length) {
      console.log("🚀 [组件初始化] 滚动到当前歌词位置");
      scrollToCurrentLyricCenter(currentIndex);
    } else {
      // 如果没有当前索引，使用传统的居中滚动
      console.log("🚀 [组件初始化] 使用备用居中滚动方法");
      calculateCenterScroll();
    }
  }, 800);
});

// 组件卸载清理
onUnmounted(() => {
  console.log("🧹 [组件卸载] 开始清理歌词滚动组件资源:", {
    hasScrollAnimation: !!scrollAnimationId.value,
    hasUserScrollResetTimer: !!userScrollResetTimer,
    isScrollingInProgress,
    userScrolling: userScrolling.value,
    isAutoScrolling: isAutoScrolling.value,
    lyricRefsLength: lyricRefs.value.length,
    timestamp: new Date().toLocaleTimeString()
  });

  // 清理滚动动画
  if (scrollAnimationId.value) {
    console.log("🧹 [组件卸载] 清理滚动动画");
    cancelAnimationFrame(scrollAnimationId.value);
    scrollAnimationId.value = undefined;
  }

  // 清理用户滚动重置定时器
  if (userScrollResetTimer) {
    console.log("🧹 [组件卸载] 清理用户滚动重置定时器");
    clearTimeout(userScrollResetTimer);
    userScrollResetTimer = null;
  }

  // 重置所有状态
  userScrolling.value = false;
  isAutoScrolling.value = false;
  isScrollingInProgress = false;
  lyricRefs.value = [];

  // 响应式计算属性无需手动清理

  console.log("🧹 [组件卸载] 歌词滚动组件资源清理完成");
});

// 重置用户滚动状态并触发自动滚动（父组件调用）
const resetScrollState = () => {
  console.log("🔄 [重置滚动状态] 父组件请求重置滚动状态:", {
    previousUserScrolling: userScrolling.value,
    previousAutoScrolling: isAutoScrolling.value,
    isScrollingInProgress,
    currentIndex: props.lyricsState.currentIndex,
    currentLyric:
      props.lyrics[props.lyricsState.currentIndex]?.text?.substring(0, 30) +
        "..." || "无歌词",
    hasScrollAnimation: !!scrollAnimationId.value,
    hasUserScrollResetTimer: !!userScrollResetTimer
  });

  // 清理所有滚动相关的状态和定时器
  if (scrollAnimationId.value) {
    console.log("🔄 [重置滚动状态] 清理当前滚动动画");
    cancelAnimationFrame(scrollAnimationId.value);
    scrollAnimationId.value = undefined;
  }

  if (userScrollResetTimer) {
    console.log("🔄 [重置滚动状态] 清理用户滚动重置定时器");
    clearTimeout(userScrollResetTimer);
    userScrollResetTimer = null;
  }

  // 重置所有状态
  userScrolling.value = false;
  isAutoScrolling.value = false;
  isScrollingInProgress = false;

  // 立即滚动到当前高亮歌词的居中位置
  const currentIndex = props.lyricsState.currentIndex;
  if (currentIndex >= 0 && currentIndex < props.lyrics.length) {
    console.log("🔄 [重置滚动状态] 准备滚动到当前歌词位置");
    requestAnimationFrame(() => {
      scrollToCurrentLyricCenter(currentIndex);
    });
  } else {
    console.log("🔄 [重置滚动状态] 无有效歌词索引，跳过滚动");
  }
};

// 调试方法：诊断歌词滚动问题
const debugScrollIssue = () => {
  const currentIndex = props.lyricsState.currentIndex;
  const currentLyricEl = lyricRefs.value[currentIndex];

  console.group("🔍 [滚动调试] 歌词滚动状态诊断");

  console.log("📊 [滚动调试] 基本状态:", {
    currentIndex,
    totalLyrics: props.lyrics.length,
    userScrolling: userScrolling.value,
    isAutoScrolling: isAutoScrolling.value,
    isScrollingInProgress,
    hasScrollAnimation: !!scrollAnimationId.value,
    hasUserScrollResetTimer: !!userScrollResetTimer,
    currentTime: props.currentTime?.toFixed(2) || "无时间"
  });

  console.log("📦 [滚动调试] 容器状态:", {
    hasScrollContainer: !!scrollContainer.value,
    containerHeight: scrollContainer.value?.clientHeight || 0,
    containerScrollTop: scrollContainer.value?.scrollTop || 0,
    containerPadding: containerPadding.value
  });

  console.log("📝 [滚动调试] 歌词元素状态:", {
    lyricRefsLength: lyricRefs.value.length,
    validRefsCount: lyricRefs.value.filter(ref => !!ref).length,
    hasCurrentLyricEl: !!currentLyricEl,
    currentLyricElInfo: currentLyricEl
      ? {
          offsetTop: currentLyricEl.offsetTop,
          offsetHeight: currentLyricEl.offsetHeight,
          scrollTop: currentLyricEl.scrollTop,
          isVisible: currentLyricEl.offsetParent !== null
        }
      : null
  });

  console.log("🎵 [滚动调试] 歌词数据:", {
    currentLyric:
      props.lyrics[currentIndex]?.text?.substring(0, 50) + "..." || "无歌词",
    currentLyricTime: props.lyrics[currentIndex]?.time?.toFixed(2) || "无时间",
    nextLyric:
      props.lyrics[currentIndex + 1]?.text?.substring(0, 30) + "..." ||
      "无下一句",
    nextLyricTime: props.lyrics[currentIndex + 1]?.time?.toFixed(2) || "无时间"
  });

  // 检查滚动条件
  const shouldScroll =
    currentIndex >= 0 &&
    !userScrolling.value &&
    !!scrollContainer.value &&
    !!currentLyricEl;

  console.log("✅ [滚动调试] 滚动条件检查:", {
    hasValidIndex: currentIndex >= 0,
    notUserScrolling: !userScrolling.value,
    hasContainer: !!scrollContainer.value,
    hasCurrentElement: !!currentLyricEl,
    shouldScroll,
    blockingReason: !shouldScroll
      ? currentIndex < 0
        ? "无效索引"
        : userScrolling.value
          ? "用户正在滚动"
          : !scrollContainer.value
            ? "无滚动容器"
            : !currentLyricEl
              ? "无当前歌词元素"
              : "未知原因"
      : "无阻塞"
  });

  if (shouldScroll && currentLyricEl && scrollContainer.value) {
    const containerHeight = scrollContainer.value.clientHeight;
    const lyricOffsetTop = currentLyricEl.offsetTop;
    const lyricHeight = currentLyricEl.offsetHeight;
    const currentScrollTop = scrollContainer.value.scrollTop;
    const targetScrollTop =
      lyricOffsetTop - containerHeight / 2 + lyricHeight / 2;
    const scrollDistance = Math.abs(targetScrollTop - currentScrollTop);

    console.log("📐 [滚动调试] 滚动计算:", {
      containerHeight,
      lyricOffsetTop,
      lyricHeight,
      currentScrollTop,
      targetScrollTop,
      scrollDistance,
      needsScroll: scrollDistance > 5
    });
  }

  console.groupEnd();
};

// 强制执行滚动（用于调试）
const forceScroll = () => {
  console.log("🚀 [强制滚动] 强制执行滚动到当前歌词");

  // 重置所有状态
  userScrolling.value = false;
  isAutoScrolling.value = false;
  isScrollingInProgress = false;

  // 清理滚动动画
  if (scrollAnimationId.value) {
    console.log("🚀 [强制滚动] 清理滚动动画");
    cancelAnimationFrame(scrollAnimationId.value);
    scrollAnimationId.value = undefined;
  }

  // 清理用户滚动重置定时器
  if (userScrollResetTimer) {
    console.log("🚀 [强制滚动] 清理用户滚动重置定时器");
    clearTimeout(userScrollResetTimer);
    userScrollResetTimer = null;
  }

  const currentIndex = props.lyricsState.currentIndex;
  if (currentIndex >= 0 && currentIndex < props.lyrics.length) {
    console.log("🚀 [强制滚动] 开始滚动到歌词索引:", currentIndex);
    scrollToCurrentLyricCenter(currentIndex);
  } else {
    console.warn("🚀 [强制滚动] 无有效歌词索引，无法滚动:", {
      currentIndex,
      totalLyrics: props.lyrics.length
    });
  }
};

// 暴露给父组件的方法
defineExpose({
  calculateCenterScroll,
  scrollToLyricIndex,
  scrollToLyricIndexSmooth,
  scrollToLyricIndexInstant,
  resetScrollState,
  debugScrollIssue,
  forceScroll
});
</script>

<style scoped lang="scss">
.music-home-lyrics-scroll {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;

  // 添加渐隐遮罩效果
  -webkit-mask: linear-gradient(
    to bottom,
    transparent 0%,
    black 10%,
    black 90%,
    transparent 100%
  );
  mask: linear-gradient(
    to bottom,
    transparent 0%,
    black 10%,
    black 90%,
    transparent 100%
  );

  &::-webkit-scrollbar {
    display: none;
  }

  .lyrics-scroll-content {
    width: 100%;
    position: relative;
    padding: 0 20px;
    min-height: 100%;

    &.auto-scrolling {
      pointer-events: none;

      .lyric-item {
        pointer-events: auto;
      }
    }
  }

  // 歌词项目
  .lyric-item {
    position: relative;
    margin: 6px 0;
    padding: 12px 12px;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    text-align: center;
    user-select: none;

    // 悬停效果
    &:hover:not(.no-lyrics) {
      background: rgba(255, 255, 255, 0.08);

      .lyric-text {
        color: rgba(255, 255, 255, 0.9);
      }
    }

    // 已播放状态
    &.is-passed {
      .lyric-text {
        color: rgba(255, 255, 255, 0.4);
        opacity: 0.6;
        filter: blur(2px); // 模糊效果
      }
    }

    // 当前播放状态 - 风格
    &.is-current {
      .lyric-text {
        color: #ffffff;
        font-weight: 700;
        opacity: 1;
        transform: scale(1.05); // 轻微放大，增强焦点效果
        transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        text-shadow: 0px 2px 0px #ffffff00; // 文字阴影效果
      }
    }

    // 即将播放状态
    &.is-upcoming {
      .lyric-text {
        color: rgba(255, 255, 255, 0.6);
        opacity: 0.8;
        filter: blur(2px); // 模糊效果
      }
    }

    // 无歌词状态
    &.no-lyrics {
      cursor: default;
      margin: 100px 0;

      .lyric-text {
        color: rgba(255, 255, 255, 0.5);
        font-size: 32px;
        font-style: italic;
        font-weight: 400;
      }
    }

    // 歌词文本样式 - 风格
    .lyric-text {
      width: 100%;
      line-height: 1.6;
      word-wrap: break-word;
      word-break: break-word;
      white-space: pre-wrap;
      transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      font-size: 28px;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.7);
      position: relative;
      z-index: 1;
    }
  }
}

// 移动端适配
@media (max-width: 768px) {
  .music-home-lyrics-scroll {
    // 移动端优化触摸滚动
    -webkit-overflow-scrolling: touch;
    overscroll-behavior-y: contain;

    // 移动端优化渐隐效果
    -webkit-mask: linear-gradient(
      to bottom,
      transparent 0%,
      black 8%,
      black 92%,
      transparent 100%
    );
    mask: linear-gradient(
      to bottom,
      transparent 0%,
      black 8%,
      black 92%,
      transparent 100%
    );

    .lyrics-scroll-content {
      padding: 0 20px; // 稍微增加左右内边距
    }

    .lyric-item {
      margin: 6px 0; // 增加垂直间距
      padding: 10px 12px; // 增加触摸区域
      border-radius: 10px;

      // 移动端悬停效果调整（改为触摸高亮）
      &:active:not(.no-lyrics) {
        background: rgba(255, 255, 255, 0.12);
        transform: scale(0.98);
        transition: all 0.15s ease;
      }

      // 当前播放状态 - 移动端优化
      &.is-current {
        .lyric-text {
          transform: scale(1.08); // 移动端稍微放大
          text-shadow: 0px 2px 0px #ffffff00; // 统一的文字阴影效果
        }
      }

      &.no-lyrics {
        margin: 60px 0;

        .lyric-text {
          font-size: 22px;
        }
      }

      .lyric-text {
        font-size: 22px; // 移动端更大字体，便于阅读
        font-weight: 500;
        line-height: 1.5; // 更好的行高
        letter-spacing: 0.02em; // 微调字间距
      }
    }
  }
}

// 超小屏幕适配
@media (max-width: 480px) {
  .music-home-lyrics-scroll {
    .lyrics-scroll-content {
      padding: 0 16px; // 超小屏幕减少内边距
    }

    .lyric-item {
      margin: 5px 0;
      padding: 8px 10px;

      // 当前播放状态 - 超小屏幕优化
      &.is-current {
        .lyric-text {
          transform: scale(1.06);
          text-shadow: 0px 2px 0px #ffffff00;
        }
      }

      &.no-lyrics {
        margin: 40px 0;

        .lyric-text {
          font-size: 19px;
        }
      }

      .lyric-text {
        font-size: 19px; // 超小屏幕保持适当大小
        line-height: 1.4;
        letter-spacing: 0.01em;
      }
    }
  }
}

// 平板端适配
@media (min-width: 769px) and (max-width: 1024px) {
  .music-home-lyrics-scroll {
    .lyric-item {
      .lyric-text {
        font-size: 26px; // 平板端适中字体
      }

      &.is-current {
        .lyric-text {
          transform: scale(1.06);
        }
      }
    }
  }
}
</style>
