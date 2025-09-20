/**
 * @Description: 颜色提取逻辑 composable
 * @Author: 安知鱼
 * @Date: 2025-09-20 15:10:00
 */
import { ref } from "vue";
import type { ColorCache } from "../types/music";

export function useColorExtraction() {
  // 主色调状态
  const dominantColor = ref("var(--anzhiyu-main)");

  // 性能优化：缓存颜色提取结果
  const colorCache: ColorCache = {};

  // 颜色提取定时器
  let colorExtractionTimer: number | null = null;

  // 提取图片主色调
  const extractDominantColor = (imageUrl: string): Promise<string> => {
    return new Promise(resolve => {
      const defaultColor = "var(--anzhiyu-main)";

      // 如果没有图片URL，直接返回默认颜色
      if (!imageUrl || typeof imageUrl !== "string") {
        console.warn("图片URL无效，使用默认颜色");
        resolve(defaultColor);
        return;
      }

      // 检查缓存
      if (colorCache[imageUrl]) {
        resolve(colorCache[imageUrl]);
        return;
      }

      const img = new Image();

      // 设置超时机制
      const timeout = setTimeout(() => {
        console.warn("图片加载超时，使用默认颜色");
        resolve(defaultColor);
      }, 5000);

      img.onload = () => {
        clearTimeout(timeout);

        try {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          if (!ctx) {
            console.warn("无法获取Canvas上下文，使用默认颜色");
            resolve(defaultColor);
            return;
          }

          // 限制图片尺寸以提高性能
          const maxSize = 300;
          const scale = Math.min(maxSize / img.width, maxSize / img.height);

          canvas.width = Math.floor(img.width * scale);
          canvas.height = Math.floor(img.height * scale);

          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;

          const colorCounts: { [key: string]: number } = {};
          let validPixelCount = 0;

          // 增加采样步长以提高性能
          const step = Math.max(1, Math.floor(data.length / (4 * 1000))); // 最多采样1000个像素

          // 采样像素来提取颜色
          for (let i = 0; i < data.length; i += step * 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];

            if (a < 125) continue; // 跳过透明像素

            validPixelCount++;

            // 量化颜色以减少颜色数量
            const qr = Math.round(r / 32) * 32;
            const qg = Math.round(g / 32) * 32;
            const qb = Math.round(b / 32) * 32;

            const color = `${qr},${qg},${qb}`;
            colorCounts[color] = (colorCounts[color] || 0) + 1;
          }

          // 如果有效像素太少，使用默认颜色
          if (validPixelCount < 10) {
            console.warn("有效像素过少，使用默认颜色");
            resolve(defaultColor);
            return;
          }

          // 判断颜色是否为白色或接近白色
          const isWhitishColor = (colorStr: string): boolean => {
            const [r, g, b] = colorStr.split(",").map(Number);
            // 过滤掉RGB值都大于200的颜色（接近白色）
            return r > 200 && g > 200 && b > 200;
          };

          // 计算颜色亮度 (使用相对亮度公式)
          const calculateLuminance = (
            r: number,
            g: number,
            b: number
          ): number => {
            const [rs, gs, bs] = [r, g, b].map(c => {
              c = c / 255;
              return c <= 0.03928
                ? c / 12.92
                : Math.pow((c + 0.055) / 1.055, 2.4);
            });
            return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
          };

          // 确保颜色是深色的
          const ensureDarkColor = (r: number, g: number, b: number) => {
            const luminance = calculateLuminance(r, g, b);

            // 如果亮度大于0.5，认为是浅色，需要调暗
            if (luminance > 0.5) {
              // 通过降低RGB值来调暗颜色
              const darkeningFactor = 0.3; // 调暗系数，可以调整这个值
              return {
                r: Math.floor(r * darkeningFactor),
                g: Math.floor(g * darkeningFactor),
                b: Math.floor(b * darkeningFactor)
              };
            }

            // 如果亮度在0.3-0.5之间，稍微调暗一点
            if (luminance > 0.3) {
              const darkeningFactor = 0.6;
              return {
                r: Math.floor(r * darkeningFactor),
                g: Math.floor(g * darkeningFactor),
                b: Math.floor(b * darkeningFactor)
              };
            }

            // 如果已经是深色，保持不变
            return { r, g, b };
          };

          // 按像素数量排序，找到合适的主色调
          const sortedColors = Object.entries(colorCounts)
            .sort(([, a], [, b]) => b - a)
            .filter(([color]) => !isWhitishColor(color)); // 过滤掉白色

          // 找到第一个非白色的主色调
          let dominantColorStr = "";
          let maxCount = 0;

          if (sortedColors.length > 0) {
            [dominantColorStr, maxCount] = sortedColors[0];
          }

          // 如果找到了合适的主色调，使用它；否则使用默认颜色
          if (dominantColorStr && maxCount > 0) {
            // 确保RGB值不超过255并转换为深色
            const [r, g, b] = dominantColorStr.split(",").map(Number);
            const clampedR = Math.min(255, r);
            const clampedG = Math.min(255, g);
            const clampedB = Math.min(255, b);

            // 确保颜色是深色的
            const darkColor = ensureDarkColor(clampedR, clampedG, clampedB);

            const result = `rgba(${darkColor.r}, ${darkColor.g}, ${darkColor.b}, 1)`;

            // 性能优化：缓存结果
            colorCache[imageUrl] = result;
            console.log(
              "主色调提取成功:",
              result,
              `(原色调: rgba(${clampedR}, ${clampedG}, ${clampedB}, 1))`
            );
            resolve(result);
          } else {
            colorCache[imageUrl] = defaultColor;
            resolve(defaultColor);
          }
        } catch (error) {
          console.error("提取主色调时发生错误:", error);
          resolve(defaultColor);
        }
      };

      img.onerror = error => {
        clearTimeout(timeout);
        console.error("图片加载失败:", error, "URL:", imageUrl);
        // 性能优化：缓存错误结果
        colorCache[imageUrl] = defaultColor;
        resolve(defaultColor);
      };

      // 尝试不同的跨域策略
      try {
        img.crossOrigin = "anonymous";
        img.src = imageUrl;
      } catch (error) {
        console.error("设置图片源失败:", error);
        resolve(defaultColor);
      }
    });
  };

  // 提取并设置主色调
  const extractAndSetDominantColor = async (imageUrl: string) => {
    if (colorExtractionTimer) {
      clearTimeout(colorExtractionTimer);
    }

    colorExtractionTimer = window.setTimeout(async () => {
      try {
        const color = await extractDominantColor(imageUrl);
        dominantColor.value = color;
      } catch (error) {
        console.error("提取颜色失败:", error);
        dominantColor.value = "var(--anzhiyu-main)";
      }
    }, 100); // 防抖100ms
  };

  // 清理资源
  const cleanup = () => {
    if (colorExtractionTimer) {
      clearTimeout(colorExtractionTimer);
      colorExtractionTimer = null;
    }
  };

  // 重置为默认颜色
  const resetToDefaultColor = () => {
    dominantColor.value = "var(--anzhiyu-main)";
  };

  // 获取播放列表样式（基于主色调）
  const getPlaylistStyle = () => {
    // 如果是CSS变量，使用默认颜色
    let color = dominantColor.value.startsWith("var(")
      ? "rgba(49, 194, 124, 1)" // 默认绿色
      : dominantColor.value;

    // 处理rgba格式，转换为十六进制透明度
    if (color.startsWith("rgba(")) {
      // 从rgba(r, g, b, a)提取rgb值
      const rgba = color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*[\d.]+\)/);
      if (rgba) {
        const [, r, g, b] = rgba;
        color = `rgb(${r}, ${g}, ${b})`;
      }
    }

    const style: any = {
      background: `linear-gradient(135deg, ${color}dd 0%, ${color}bb 100%)`,
      backdropFilter: "blur(30px)",
      WebkitBackdropFilter: "blur(30px)" // Safari兼容性
    };

    // 添加备用背景
    if (color !== `rgb(49, 194, 124)`) {
      style.backgroundColor = color
        .replace("1)", "0.85)")
        .replace("rgb(", "rgba(");
    } else {
      style.backgroundColor = "rgba(49, 194, 124, 0.85)";
    }

    return style;
  };

  return {
    // 状态
    dominantColor,

    // 方法
    extractDominantColor,
    extractAndSetDominantColor,
    getPlaylistStyle,
    resetToDefaultColor,
    cleanup
  };
}
