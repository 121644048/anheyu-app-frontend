<!--
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-08-04 10:11:57
 * @LastEditTime: 2025-08-08 18:16:13
 * @LastEditors: 安知鱼
-->
<script setup lang="ts">
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { useSiteConfigStore } from "@/store/modules/siteConfig";
import { useUiStore } from "@/store/modules/uiStore";
import AuthorInfoCard from "./components/AuthorInfoCard.vue";
import CardWechat from "./components/CardWechat.vue";
import Sticky from "./components/Sticky.vue";

defineOptions({
  name: "Sidebar"
});

const siteConfigStore = useSiteConfigStore();
const siteConfig = computed(() => siteConfigStore.getSiteConfig);

const uiStore = useUiStore();
const { isSidebarVisible } = storeToRefs(uiStore);

const authorInfoConfig = computed(() => {
  if (!siteConfig.value?.sidebar?.author?.enable) return null;
  return {
    description: siteConfig.value.sidebar.author.description,
    statusImg: siteConfig.value.sidebar.author.statusImg,
    skills: siteConfig.value.sidebar.author.skills,
    social: siteConfig.value.sidebar.author.social,
    userAvatar: siteConfig.value.USER_AVATAR,
    ownerName: siteConfig.value.frontDesk.siteOwner.name,
    subTitle: siteConfig.value.SUB_TITLE
  };
});

const wechatConfig = computed(() => {
  if (!siteConfig.value?.sidebar?.wechat?.enable) return null;
  return {
    face: siteConfig.value.sidebar.wechat.face,
    backFace: siteConfig.value.sidebar.wechat.backFace,
    blurBackground: siteConfig.value.sidebar.wechat.blurBackground
  };
});
</script>

<template>
  <aside v-if="isSidebarVisible" class="aside-content">
    <AuthorInfoCard v-if="authorInfoConfig" :config="authorInfoConfig" />
    <CardWechat v-if="wechatConfig" :config="wechatConfig" />

    <Sticky :config="siteConfig" />
  </aside>
</template>

<style lang="scss" scoped>
.aside-content {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  width: 300px;
  transition: all 0.3s;
}

@media (width <= 992px) {
  .aside-content {
    display: none;
  }
}
</style>
