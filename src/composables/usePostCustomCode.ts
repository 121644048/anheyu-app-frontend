/**
 * @description: 文章页面自定义代码工具
 * 专门用于处理文章页面的自定义HTML代码
 */

import { useSiteConfigStore } from "@/store/modules/siteConfig";
import { computed } from "vue";

/**
 * 获取文章页面自定义HTML配置
 */
export function usePostCustomCode() {
  const siteConfigStore = useSiteConfigStore();

  const postTopHTML = computed(() => {
    const config = siteConfigStore.siteConfig;
    return config?.CUSTOM_POST_TOP_HTML || "";
  });

  const postBottomHTML = computed(() => {
    const config = siteConfigStore.siteConfig;
    return config?.CUSTOM_POST_BOTTOM_HTML || "";
  });

  return {
    postTopHTML,
    postBottomHTML
  };
}
