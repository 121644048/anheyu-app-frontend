<!--
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-08-16 12:25:11
 * @LastEditTime: 2025-10-12 00:48:15
 * @LastEditors: 安知鱼
-->
<script setup lang="ts">
import { useArticleStore } from "@/store/modules/articleStore";
import { onMounted } from "vue";
defineOptions({
  name: "RandomPost"
});

const articleStore = useArticleStore();

const toRandomPost = () => {
  articleStore.navigateToRandomArticle();
};

onMounted(() => {
  toRandomPost();
});
</script>

<template>
  <div />
</template>
