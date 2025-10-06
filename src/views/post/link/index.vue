<!--
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-08-21 17:48:59
 * @LastEditTime: 2025-10-01 16:22:17
 * @LastEditors: 安知鱼
-->
<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { useLinkStore } from "@/store/modules/link";
import LinkTopBanner from "./components/LinkTopBanner.vue";
import LinkListSection from "./components/LinkListSection.vue";
import ApplyLink from "./components/ApplyLink.vue";
import { useSiteConfigStore } from "@/store/modules/siteConfig";
import PostComment from "../components/PostComment/index.vue";

defineOptions({
  name: "PostLink"
});

const route = useRoute();
const linkStore = useLinkStore();
const siteConfigStore = useSiteConfigStore();
const friendLinkApplyCondition = computed(
  () => siteConfigStore.getSiteConfig?.FRIEND_LINK_APPLY_CONDITION
);
// 前台展示使用渲染后的 HTML
const friendLinkApplyCustomCodeHtml = computed(
  () => siteConfigStore.getSiteConfig?.FRIEND_LINK_APPLY_CUSTOM_CODE_HTML
);

onMounted(() => {
  linkStore.fetchInitialBannerLinks();
});

const applyLinkSectionRef = ref<HTMLElement | null>(null);

const handleScrollToApply = () => {
  if (applyLinkSectionRef.value) {
    const offset = 80;
    const elementPosition =
      applyLinkSectionRef.value.getBoundingClientRect().top +
      window.pageYOffset;
    const offsetPosition = elementPosition - offset;

    window.scrollTo({
      top: offsetPosition,
      behavior: "smooth"
    });
  }
};
</script>

<template>
  <div class="post-link-page">
    <LinkTopBanner @scrollToApply="handleScrollToApply" />

    <LinkListSection />

    <div ref="applyLinkSectionRef">
      <ApplyLink
        :friendLinkApplyCondition="friendLinkApplyCondition"
        :friendLinkApplyCustomCodeHtml="friendLinkApplyCustomCodeHtml"
      />
    </div>

    <div class="link-comment-section">
      <PostComment :target-path="route.path" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.post-link-page {
  width: 100%;
  max-width: 1400px;
  padding: 0 1.5rem;
  margin: 0 auto;
}

.link-comment-section {
  margin-top: 2rem;
}

@media (width <= 768px) {
  .post-link-page .flink_top :deep(.banner-button-group) {
    display: none;
  }
}
</style>
