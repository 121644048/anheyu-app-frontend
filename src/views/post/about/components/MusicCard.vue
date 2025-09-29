<!--
 * @Description: 音乐卡片组件
 * @Author: 安知鱼
 * @Date: 2025-01-27
-->
<script setup lang="ts">
import type { Music } from "@/types/about";

interface Props {
  music: Music;
  authorName: string;
}

defineProps<Props>();
</script>

<template>
  <div
    class="author-content-item like-music"
    :style="`background: url(${music.background}) top / cover no-repeat;`"
  >
    <div class="card-content">
      <div class="author-content-item-tips">{{ music.tips }}</div>
      <span class="author-content-item-title">{{ music.title }}</span>
      <div class="content-bottom">
        <div class="tips">跟 {{ authorName }} 一起欣赏更多音乐</div>
      </div>
      <div class="banner-button-group">
        <a class="banner-button" @click="$router.push(music.link)">
          <i class="anzhiyufont anzhiyu-icon-arrow-circle-right" />
          <span class="banner-button-text">更多推荐</span>
        </a>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.like-music {
  min-height: 400px;
  overflow: hidden;
  color: var(--anzhiyu-white);

  @media screen and (width <= 768px) {
    width: 100% !important;
  }

  @media screen and (width >= 768px) and (width <= 896px) {
    .content-bottom .tips {
      display: none;
    }
  }

  &::after {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    content: "";
    box-shadow: 0 -69px 203px 11px #453e38 inset;
  }

  .content-bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: auto;
  }
}

.banner-button-group {
  position: absolute;
  right: 2rem;
  bottom: 1.5rem;

  @media screen and (width <= 768px) {
    right: 1rem;
    bottom: 1rem;
  }

  .banner-button {
    z-index: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 40px;
    padding: 10px;
    color: var(--anzhiyu-white);
    text-decoration: none;
    cursor: pointer;
    background: var(--anzhiyu-white-op);
    backdrop-filter: blur(20px);
    backdrop-filter: saturate(180%) blur(20px);
    border-bottom: 0 !important;
    border-radius: 20px;
    transition: 0.3s;
    transform: translateZ(0);

    @media screen and (width <= 768px) {
      width: auto;
      padding: 0;
      background: none;
      backdrop-filter: unset;

      &:hover {
        background: none !important;
      }
    }

    :deep([data-theme="dark"]) & {
      @media screen and (width <= 768px) {
        color: var(--anzhiyu-black) !important;
      }
    }

    i,
    svg {
      display: flex;
      align-items: center;
      justify-content: center;
      max-width: 40px;
      height: 40px;
      margin-right: 0.25rem;
      font-size: 22px;
      border-radius: 50px;

      @media screen and (width <= 768px) {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        padding: 6px;
        margin-right: 0.25rem;
        margin-left: 80px;
        font-size: 1.5rem;
        color: var(--anzhiyu-fontcolor);
        background: white;
        border-radius: 50%;
      }
    }

    .banner-button-text {
      margin-left: 4px;

      @media screen and (width <= 768px) {
        display: none;
      }
    }

    &:hover {
      color: var(--anzhiyu-white);
      background: var(--anzhiyu-main);
      border-radius: 20px !important;

      @media screen and (width <= 768px) {
        i {
          color: var(--anzhiyu-theme);
          background: var(--anzhiyu-background) !important;
        }
      }
    }
  }
}
</style>
