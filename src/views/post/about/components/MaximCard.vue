<!--
 * @Description: 格言卡片组件
 * @Author: 安知鱼
 * @Date: 2025-01-27
-->
<script setup lang="ts">
import type { Maxim } from "@/types/about";

interface Props {
  maxim: Maxim;
}

defineProps<Props>();
</script>

<template>
  <div class="author-content-item maxim">
    <div class="author-content-item-tips">{{ maxim.tips }}</div>
    <span class="maxim-title">
      <span style="margin-bottom: 8px; opacity: 0.6">{{ maxim.top }}</span>
      <span>{{ maxim.bottom }}</span>
    </span>
  </div>
</template>

<style lang="scss" scoped>
.maxim {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  width: 39%;
  font-size: 36px;
  font-weight: 700;
  line-height: 1.1;

  @media screen and (width <= 768px) {
    width: 100% !important;
  }

  .maxim-title {
    display: flex;
    flex-direction: column;
  }
}
</style>
