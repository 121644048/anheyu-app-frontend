<!--
 * @Description: 漫画卡片组件
 * @Author: 安知鱼
 * @Date: 2025-01-27
-->
<script setup lang="ts">
import type { Comic } from "@/types/about";

interface Props {
  comic: Comic;
}

defineProps<Props>();
</script>

<template>
  <div class="author-content-item comic-content">
    <div class="card-content">
      <div class="author-content-item-tips">{{ comic.tips }}</div>
      <div class="author-content-item-title">{{ comic.title }}</div>
      <div class="comic-box">
        <a
          v-for="(item, index) in comic.list"
          :key="index"
          class="comic-item"
          :href="item.href"
          target="_blank"
          :title="item.name"
        >
          <div class="comic-item-cover">
            <img :src="item.cover" :alt="item.name" />
          </div>
        </a>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.comic-content {
  flex: 1;
  width: 39%;
  min-height: 300px;
  overflow: hidden;

  @media screen and (width <= 768px) {
    width: 100% !important;
  }

  &::after {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    content: "";
    box-shadow: 0 -48px 203px 11px #fbe9b8 inset;
  }

  .author-content-item-tips,
  .author-content-item-title {
    z-index: 2;
    color: var(--anzhiyu-white);
    pointer-events: none;
  }

  .comic-box {
    position: absolute;
    top: 0;
    left: 50%;
    display: flex;
    width: 120%;
    height: 100%;
    transform: translateX(-50%);
  }

  .comic-item {
    position: relative;
    width: 20%;
    height: 100%;
    overflow: hidden;
    color: white;
    text-decoration: none;
    transition: 0.8s;
    transform: skew(-10deg, 0deg);

    &:hover {
      width: 46%;

      .comic-item-cover {
        left: 16%;
        transform: skew(10deg, 0deg) scale(1.6);
      }
    }

    .comic-item-cover {
      position: absolute;
      top: 0;
      left: -50%;
      height: 100%;
      object-fit: cover;
      transition:
        scale 0.2s,
        all 0.8s;
      transform: skew(10deg, 0deg);

      img {
        max-width: none;
        height: 100%;
        border-radius: 0;
        transition: 0.8s;
      }
    }
  }
}
</style>
