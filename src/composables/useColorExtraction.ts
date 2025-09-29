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

  // 使用 fetch + blob 的方式提取图片主色调
  const extractDominantColor = (imageUrl: string): Promise<string> => {
    return new Promise(resolve => {
      const defaultColor = "var(--anzhiyu-main)";

      // 如果没有图片URL，直接返回默认颜色
      if (!imageUrl || typeof imageUrl !== "string") {
        resolve(defaultColor);
        return;
      }

      // 检查缓存
      if (colorCache[imageUrl]) {
        resolve(colorCache[imageUrl]);
        return;
      }

      // 使用 fetch 获取图片 blob 数据（借鉴 APlayer 的优化方案）
      fetch(imageUrl)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.blob();
        })
        .then(blob => {
          // 创建 blob URL（本地内存 URL，不触发新的网络请求）
          const blobUrl = URL.createObjectURL(blob);

          // 设置超时机制
          const timeout = setTimeout(() => {
            URL.revokeObjectURL(blobUrl); // 清理 blob URL
            resolve(defaultColor);
          }, 5000);

          const img = new Image();

          img.onload = () => {
            clearTimeout(timeout);

            try {
              const canvas = document.createElement("canvas");
              const ctx = canvas.getContext("2d");

              if (!ctx) {
                URL.revokeObjectURL(blobUrl);
                resolve(defaultColor);
                return;
              }

              // 限制图片尺寸以提高性能
              const maxSize = 300;
              const scale = Math.min(maxSize / img.width, maxSize / img.height);

              canvas.width = Math.floor(img.width * scale);
              canvas.height = Math.floor(img.height * scale);

              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

              const imageData = ctx.getImageData(
                0,
                0,
                canvas.width,
                canvas.height
              );
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
                URL.revokeObjectURL(blobUrl);
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

                // 发送颜色提取完成事件，传递 blob 数据供 AlbumCover 组件复用
                window.dispatchEvent(
                  new CustomEvent("colorExtracted", {
                    detail: {
                      imageUrl,
                      color: result,
                      imageElement: img, // 传递已加载的图片对象
                      blobUrl: blobUrl, // 🔑 传递 blob URL，供组件直接使用
                      blob: blob // 🔑 传递 blob 数据，供组件复用
                    }
                  })
                );

                // ⚠️ 注意：这里不立即清理 blob URL，让 AlbumCover 组件使用后再清理
                resolve(result);
              } else {
                colorCache[imageUrl] = defaultColor;

                // 即使使用默认颜色也发送事件，传递 blob 数据
                window.dispatchEvent(
                  new CustomEvent("colorExtracted", {
                    detail: {
                      imageUrl,
                      color: defaultColor,
                      imageElement: img, // 传递图片对象，即使颜色提取失败
                      blobUrl: blobUrl, // 传递 blob URL
                      blob: blob // 传递 blob 数据
                    }
                  })
                );

                // 清理 blob URL
                URL.revokeObjectURL(blobUrl);
                resolve(defaultColor);
              }
            } catch {
              // 提取主色调时发生错误
              resolve(defaultColor);
            }
          };

          img.onerror = _error => {
            clearTimeout(timeout);
            // 性能优化：缓存错误结果
            colorCache[imageUrl] = defaultColor;

            // 发送错误事件，清理 blob URL
            window.dispatchEvent(
              new CustomEvent("colorExtracted", {
                detail: {
                  imageUrl,
                  color: defaultColor,
                  imageElement: null, // 加载失败时传递 null
                  blobUrl: null,
                  blob: null
                }
              })
            );

            URL.revokeObjectURL(blobUrl);
            resolve(defaultColor);
          };

          // 设置图片源为 blob URL（无额外网络请求）
          img.src = blobUrl;
        })
        .catch(error => {
          console.warn(
            `[COLOR_EXTRACTION] 图片获取失败 (${imageUrl}):`,
            error.message || error
          );

          // 缓存错误结果
          colorCache[imageUrl] = defaultColor;

          // 发送错误事件
          window.dispatchEvent(
            new CustomEvent("colorExtracted", {
              detail: {
                imageUrl,
                color: defaultColor,
                imageElement: null,
                blobUrl: null,
                blob: null,
                error: error.message || "网络错误或跨域限制"
              }
            })
          );

          resolve(defaultColor);
        });
    });
  };

  // 当前正在处理的图片URL，避免重复处理
  let currentProcessingUrl: string | null = null;

  // 提取并设置主色调
  const extractAndSetDominantColor = async (imageUrl: string) => {
    // 如果正在处理相同的URL，直接返回
    if (currentProcessingUrl === imageUrl) {
      return;
    }

    // 检查缓存，如果已有结果直接使用
    if (colorCache[imageUrl]) {
      dominantColor.value = colorCache[imageUrl];

      // 发送事件通知其他组件（缓存命中时不传递图片对象，因为不需要重复加载）
      window.dispatchEvent(
        new CustomEvent("colorExtracted", {
          detail: {
            imageUrl,
            color: colorCache[imageUrl],
            imageElement: null, // 缓存命中时不提供图片对象，让组件自行加载
            fromCache: true // 标记这是来自缓存的结果
          }
        })
      );
      return;
    }

    if (colorExtractionTimer) {
      clearTimeout(colorExtractionTimer);
    }

    colorExtractionTimer = window.setTimeout(async () => {
      // 设置当前处理的URL
      currentProcessingUrl = imageUrl;

      try {
        const color = await extractDominantColor(imageUrl);
        dominantColor.value = color;
      } catch {
        dominantColor.value = "var(--anzhiyu-main)";
      } finally {
        // 清除处理状态
        currentProcessingUrl = null;
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
      style.backgroundColor = "var(--anzhiyu-main)";
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
    cleanup,

    // 暴露缓存供其他组件使用，避免重复加载
    getImageCache: () => colorCache
  };
}
