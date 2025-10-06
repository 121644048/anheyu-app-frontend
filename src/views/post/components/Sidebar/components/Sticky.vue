<!--
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-08-05 18:31:42
 * @LastEditTime: 2025-10-01 22:26:26
 * @LastEditors: 安知鱼
-->
<script setup lang="ts">
import { computed, inject, ref } from "vue";
import type { Ref } from "vue";
import { useRoute } from "vue-router";
import type { PostCategory } from "@/api/post/type";
import { useSiteConfigStore } from "@/store/modules/siteConfig";

import TagsCard from "./TagsCard.vue";
import CardWebInfo from "./CardWebInfo.vue";
import CardToc from "./CardToc.vue";
import CardRecentPost from "./CardRecentPost.vue";
import Archives from "./Archives.vue";
import CardSeriesPost from "./CardSeriesPost.vue";

const props = defineProps({
  config: {
    type: Object,
    default: () => ({})
  }
});

const route = useRoute();
const isPostDetailPage = computed(() => route.name === "PostDetail");

const seriesCategory = inject<Ref<PostCategory | null>>(
  "seriesCategory",
  ref(null)
);

const tagsConfig = computed(() => {
  if (!props.config?.sidebar?.tags?.enable) return null;
  return {
    highlight: props.config.sidebar.tags.highlight || []
  };
});

const webInfoConfig = computed(() => {
  const { totalPostCount, runtimeEnable, totalWordCount } =
    props.config?.sidebar?.siteinfo || {};

  const launch_time = props.config?.footer?.runtime?.launch_time || null;

  return { totalPostCount, runtimeEnable, totalWordCount, launch_time };
});

// 获取自定义侧边栏内容
const siteConfigStore = useSiteConfigStore();
const customSidebar = computed(() => {
  return siteConfigStore.siteConfig?.CUSTOM_SIDEBAR || "";
});

defineOptions({
  name: "Sticky"
});
</script>

<template>
  <div class="sticky-container">
    <!-- 自定义侧边栏 -->
    <div v-if="customSidebar" class="card-widget">
      <div v-html="customSidebar" />
    </div>

    <template v-if="isPostDetailPage">
      <CardSeriesPost v-if="seriesCategory" />
      <CardToc />
      <CardRecentPost />
    </template>

    <template v-else>
      <div class="card-widget">
        <TagsCard v-if="tagsConfig" :config="tagsConfig" />
        <hr v-if="tagsConfig && webInfoConfig" />
        <Archives />
        <hr v-if="tagsConfig && webInfoConfig" />
        <CardWebInfo v-if="webInfoConfig" :config="webInfoConfig" />
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.sticky-container {
  position: sticky;
  top: calc(60px + 0.625rem);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
</style>
