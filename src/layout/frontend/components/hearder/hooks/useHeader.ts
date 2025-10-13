/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-08-07 15:37:04
 * @LastEditTime: 2025-08-16 14:44:53
 * @LastEditors: 安知鱼
 */
// hooks/useHeader.ts

import { ref, onMounted, onUnmounted } from "vue";
import { throttle } from "lodash-es";
import {
  updateMetaThemeColorDynamic,
  getCurrentArticlePrimaryColor
} from "@/utils/themeManager";

export function useHeader(isPostDetailPage: boolean = false) {
  const isHeaderTransparent = ref(true);
  const isScrolled = ref(false);
  const lastScrollTop = ref(0);

  const scrollPercent = ref(0);
  const isFooterVisible = ref(false);

  const handleScroll = () => {
    // 确保 scrollTop 不能是负数
    const scrollTop = Math.max(0, window.scrollY);
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = document.documentElement.clientHeight;

    const wasTransparent = isHeaderTransparent.value;
    isHeaderTransparent.value = scrollTop === 0;

    // 动态更新 meta theme-color
    if (wasTransparent !== isHeaderTransparent.value) {
      if (isHeaderTransparent.value) {
        // 滚动到顶部
        if (isPostDetailPage) {
          // 文章页顶部：恢复文章主色调
          const articleColor = getCurrentArticlePrimaryColor();
          if (articleColor) {
            updateMetaThemeColorDynamic(articleColor);
          } else {
            // 如果没有获取到文章主色，使用背景色作为备用方案
            updateMetaThemeColorDynamic("var(--anzhiyu-background)");
          }
        } else {
          // 首页顶部：使用背景色
          updateMetaThemeColorDynamic("var(--anzhiyu-background)");
        }
      } else {
        // 滚动往下：使用卡片背景色
        updateMetaThemeColorDynamic("var(--anzhiyu-card-bg)");
      }
    }

    // 到达顶部时强制 isScrolled 为 false
    if (scrollTop <= 0) {
      isScrolled.value = false;
    } else if (scrollTop > 60) {
      isScrolled.value = scrollTop > lastScrollTop.value;
    } else {
      isScrolled.value = false;
    }

    lastScrollTop.value = scrollTop;

    if (scrollHeight > clientHeight) {
      scrollPercent.value = Math.round(
        (scrollTop / (scrollHeight - clientHeight)) * 100
      );
    } else {
      scrollPercent.value = 0;
    }

    const footerEl = document.getElementById("footer-container");
    if (footerEl) {
      isFooterVisible.value = scrollTop + clientHeight >= footerEl.offsetTop;
    } else {
      isFooterVisible.value = false;
    }
  };

  const throttledScrollHandler = throttle(handleScroll, 72);

  onMounted(() => {
    window.addEventListener("scroll", throttledScrollHandler);
    handleScroll();
  });

  onUnmounted(() => {
    window.removeEventListener("scroll", throttledScrollHandler);
  });

  return {
    isHeaderTransparent,
    isScrolled,
    scrollPercent,
    isFooterVisible
  };
}
