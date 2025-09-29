<!--
 * @Description: 作者页面内容组件
 * @Author: 安知鱼
 * @Date: 2025-08-20 14:51:39
 * @LastEditTime: 2025-08-20 19:34:35
 * @LastEditors: 安知鱼
-->
<script setup lang="ts">
import AboutSiteTips from "./AboutSiteTips.vue";
import type { AboutSiteTips as AboutSiteTipsType } from "@/types/about";

interface Props {
  name: string;
  description: string;
  aboutSiteTips: AboutSiteTipsType;
}

defineProps<Props>();

defineOptions({
  name: "AuthorPageContent"
});
</script>

<template>
  <div class="author-page-content">
    <div class="author-content">
      <div class="author-content-item myInfoAndSayHello">
        <div class="title1">你好，很高兴认识你👋</div>
        <div class="title2">
          我叫 <span class="inline-word">{{ name }}</span>
        </div>
        <div class="title1">{{ description }}</div>
      </div>
      <AboutSiteTips :config="aboutSiteTips" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.author-page-content {
  width: 100%;
}

.author-content-item {
  position: relative;
  flex: 1;
  padding: 1rem 2rem;
  overflow: hidden;
  background: var(--anzhiyu-card-bg);
  border: var(--style-border-always);
  border-radius: 12px;
  box-shadow: var(--anzhiyu-shadow-border);
}

.author-content {
  display: flex;
  flex-wrap: wrap;
  gap: 0.625rem;
  justify-content: space-between;
  width: 100%;
}

.myInfoAndSayHello {
  display: flex;
  flex: 4;
  flex-direction: column;
  justify-content: center;
  min-height: 200px;
  color: var(--anzhiyu-white);
  background: linear-gradient(120deg, #5b27ff 0, #00d4ff 100%);
  background-size: 200%;

  .title1 {
    line-height: 1.3;
    opacity: 0.8;
  }

  .title2 {
    margin: 0.625rem 0;
    font-size: 36px;
    font-weight: 700;
    line-height: 1.1;
  }
}

.author-content-item.aboutsiteTips {
  display: flex;
  flex: 3;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;

  h2 {
    margin-top: 0;
    margin-right: auto;
    font-family: Helvetica;
    font-size: 36px;
    line-height: 1.06;
    color: var(--anzhiyu-fontcolor);
    letter-spacing: -0.02em;
  }

  .mask {
    position: relative;
    height: 36px;
    margin-top: 4px;
    overflow: hidden;

    span:nth-child(1) {
      background-image: linear-gradient(45deg, #0ecffe 50%, #07a6f1);
    }

    span:nth-child(2) {
      background-image: linear-gradient(45deg, #18e198 50%, #0ec15d);
    }
  }
}

.author-content-item-tips {
  margin-bottom: 0.5rem;
  font-size: 0.6rem;
  opacity: 0.8;
}

.author-content-item {
  animation: slide-in 0.6s 0s backwards;
}

.inline-word {
  word-break: keep-all;
  white-space: nowrap;
}
</style>
