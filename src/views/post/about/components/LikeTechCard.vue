<!--
 * @Description: 喜欢的技术卡片组件
 * @Author: 安知鱼
 * @Date: 2025-01-27
-->
<script setup lang="ts">
import type { Like } from "@/types/about";

interface Props {
  like: Like;
}

defineProps<Props>();
</script>

<template>
  <div
    class="author-content-item like-technology"
    :style="`background: url(${like.background}) top / cover no-repeat;`"
  >
    <div class="card-content">
      <div class="author-content-item-tips">{{ like.tips }}</div>
      <span class="author-content-item-title">{{ like.title }}</span>
      <div class="content-bottom">
        <div class="tips">{{ like.bottom }}</div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.like-technology {
  min-height: 230px;
  color: var(--anzhiyu-white);

  @media screen and (width <= 768px) {
    width: 100% !important;
  }

  .content-bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: auto;
  }
}
</style>
