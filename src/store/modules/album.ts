/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-06-24 00:34:51
 * @LastEditTime: 2025-06-24 00:34:58
 * @LastEditors: 安知鱼
 */
import { defineStore } from "pinia";
import { ref } from "vue";
import { getPublicAlbumCategories } from "@/api/album-home";

export interface AlbumCategory {
  id: number;
  name: string;
  description?: string;
  coverImage?: string;
  displayOrder?: number;
}

export const useAlbumStore = defineStore("anheyu-album", () => {
  // State: 定义排序状态，默认值为按排序号
  const sortOrder = ref("display_order_asc");

  // State: 定义分类状态，null 表示显示全部
  const categoryId = ref<number | null>(null);

  // State: 分类列表
  const categories = ref<AlbumCategory[]>([]);

  // Actions: 定义一个修改排序状态的方法
  function setSortOrder(newOrder: string) {
    if (sortOrder.value !== newOrder) {
      sortOrder.value = newOrder;
    }
  }

  // Actions: 定义一个修改分类的方法
  function setCategoryId(newCategoryId: number | null) {
    if (categoryId.value !== newCategoryId) {
      categoryId.value = newCategoryId;
    }
  }

  // Actions: 获取分类列表
  async function fetchCategories() {
    try {
      const res = await getPublicAlbumCategories();
      console.log("获取分类列表响应:", res);
      if (res.code === 200) {
        categories.value = res.data || [];
        console.log("分类列表已更新:", categories.value);
      }
    } catch (error) {
      console.error("获取相册分类失败:", error);
    }
  }

  return {
    sortOrder,
    categoryId,
    categories,
    setSortOrder,
    setCategoryId,
    fetchCategories
  };
});
