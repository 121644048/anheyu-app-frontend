<!--
 * @Description: 性格卡片组件
 * @Author: 安知鱼
 * @Date: 2025-01-27
-->
<script setup lang="ts">
import type { Personalities } from "@/types/about";

interface Props {
  personalities: Personalities;
}

defineProps<Props>();
</script>

<template>
  <div class="author-content-item personalities">
    <div class="author-content-item-tips">{{ personalities.tips }}</div>
    <span class="author-content-item-title">{{
      personalities.authorName
    }}</span>
    <div
      class="title2"
      :style="{ color: personalities.personalityTypeColor || '#ac899c' }"
    >
      {{ personalities.personalityType }}
    </div>
    <div class="post-tips">
      在
      <a
        href="https://www.16personalities.com/"
        target="_blank"
        rel="noopener nofollow"
      >
        16personalities
      </a>
      了解更多关于
      <a
        :href="personalities.nameUrl"
        target="_blank"
        rel="noopener external nofollow"
      >
        {{ personalities.authorName }}
      </a>
    </div>
    <div class="image">
      <img class="no-lightbox" :src="personalities.personalityImg" alt="人格" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.personalities {
  width: 59%;

  @media screen and (width <= 768px) {
    width: 100% !important;
    height: 200px;
  }

  @media screen and (width <= 1200px) {
    .image {
      width: 180px;
    }
  }

  .title2 {
    font-size: 36px;
    font-weight: 700;
    line-height: 1.1;
  }

  .image {
    position: absolute;
    top: 10px;
    right: 30px;
    width: 220px;
    transition: transform 2s cubic-bezier(0.13, 0.45, 0.21, 1.02);

    @media screen and (width <= 768px) {
      width: 125px;
    }

    img {
      display: block;
      max-width: 100%;
      margin: 0 auto 20px;
      transition: filter 375ms ease-in 0.2s;
    }
  }

  &:hover .image {
    transform: rotate(-10deg);
  }
}

.post-tips {
  position: absolute;
  bottom: 1rem;
  left: 2rem;
  font-size: 14px;
  color: var(--anzhiyu-gray);

  @media screen and (width <= 768px) {
    left: auto;
  }

  a {
    color: var(--anzhiyu-gray) !important;
    border: none !important;

    &:hover {
      color: var(--anzhiyu-main) !important;
      background: none !important;
    }
  }
}
</style>
