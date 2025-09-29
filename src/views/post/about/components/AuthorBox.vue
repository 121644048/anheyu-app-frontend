<!--
 * @Description: 作者头像框组件
 * @Author: 安知鱼
 * @Date: 2025-01-27
-->
<script setup lang="ts">
import type { AvatarSkills } from "@/types/about";

interface Props {
  avatarImg: string;
  avatarSkills: AvatarSkills;
}

defineProps<Props>();
</script>

<template>
  <div class="author-box">
    <div class="author-tag-left">
      <span
        v-for="(item, index) in avatarSkills.left"
        :key="index"
        class="author-tag"
      >
        {{ item }}
      </span>
    </div>
    <div class="author-img">
      <img
        class="no-lightbox entered loaded"
        :src="avatarImg"
        alt="avatar"
        data-ll-status="loaded"
      />
    </div>
    <div class="author-tag-right">
      <span
        v-for="(item, index) in avatarSkills.right"
        :key="index"
        class="author-tag"
      >
        {{ item }}
      </span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.author-box {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 0 16px;

  @media screen and (width <= 768px) {
    margin: 0 0 12px;
  }

  .author-tag-left {
    display: flex;
    flex-direction: column;
    align-items: flex-end;

    @media screen and (width <= 768px) {
      display: none;
    }

    .author-tag {
      &:first-child,
      &:last-child {
        margin-right: -16px;
      }
    }
  }

  .author-tag-right {
    display: flex;
    flex-direction: column;
    align-items: flex-start;

    @media screen and (width <= 768px) {
      display: none;
    }

    .author-tag {
      &:first-child,
      &:last-child {
        margin-left: -16px;
      }
    }
  }

  .author-tag {
    padding: 1px 8px;
    margin-top: 6px;
    font-size: 14px;
    font-weight: 700;
    background: var(--anzhiyu-card-bg);
    border: var(--style-border-always);
    border-radius: 40px;
    box-shadow: var(--anzhiyu-shadow-lightblack);
    transform: translate(0, -4px);
    animation: 6s ease-in-out 0s infinite normal none running floating;

    &:nth-child(1) {
      animation-delay: 0s;
    }

    &:nth-child(2) {
      animation-delay: 0.6s;
    }

    &:nth-child(3) {
      animation-delay: 1.2s;
    }

    &:nth-child(4) {
      animation-delay: 1.8s;
    }
  }

  .author-img {
    position: relative;
    width: 180px;
    height: 180px;
    margin: 0 30px;
    user-select: none;
    background: var(--anzhiyu-secondbg);
    border-radius: 50%;
    transition: 0.3s;

    @media screen and (width <= 768px) {
      width: 120px;
      height: 120px;
      margin: 0 20px;
    }

    &:hover {
      transform: scale(1.1);
    }

    img {
      width: 180px;
      height: 180px;
      overflow: hidden;
      border-radius: 50%;

      @media screen and (width <= 768px) {
        width: 120px;
        height: 120px;
      }
    }

    &::before {
      position: absolute;
      right: 10px;
      bottom: 5px;
      z-index: 2;
      box-sizing: content-box;
      width: 30px;
      height: 30px;
      content: "";
      background: var(--anzhiyu-green);
      border: 5px solid var(--anzhiyu-background);
      border-radius: 50%;
      transition: 1s;

      @media screen and (width <= 768px) {
        right: -3px;
        bottom: -3px;
        width: 20px;
        height: 20px;
        border: 3px solid var(--anzhiyu-background);
      }
    }
  }
}
</style>
