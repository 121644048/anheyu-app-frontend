<script setup lang="ts">
import { computed, ref } from "vue";
import { useLinkStore } from "@/store/modules/link";
import { getRandomLinks } from "@/api/postLink";

defineOptions({
  name: "LinkTopBanner"
});

const emit = defineEmits(["scrollToApply"]);

const linkStore = useLinkStore();
const isVisitingRandom = ref(false);

const linkList = computed(() => linkStore.bannerLinks);

const handleRandomVisit = async () => {
  if (isVisitingRandom.value) return;
  isVisitingRandom.value = true;
  try {
    const res = await getRandomLinks({ num: 1 });
    if (res.code === 200 && res.data && res.data.length > 0) {
      const randomLink = res.data[0];
      window.open(randomLink.url, "_blank");
    } else {
      console.error("未能获取到随机友链");
    }
  } catch (error) {
    console.error("请求随机友链失败", error);
  } finally {
    isVisitingRandom.value = false;
  }
};

const triggerScrollToApply = () => {
  emit("scrollToApply");
};

const displayLinkList = computed(() => {
  const list = linkList.value;
  const TARGET = 60;
  const n = list.length;

  if (n === 0) return [];
  return Array.from({ length: TARGET }, (_, i) => list[i % n]);
});

const pairedLinkList = computed(() => {
  const pairs = [];
  for (let i = 0; i < displayLinkList.value.length; i += 2) {
    pairs.push(displayLinkList.value.slice(i, i + 2));
  }
  return pairs;
});
</script>

<template>
  <div class="flink_top">
    <div class="banners-title">
      <div class="banners-title-small">友情链接</div>
      <div class="banners-title-big">与数百名博主无限进步</div>
    </div>
    <div class="banner-button-group">
      <button
        class="banner-button secondary"
        rel="external nofollow"
        :disabled="isVisitingRandom"
        @click="handleRandomVisit"
      >
        <i class="anzhiyufont anzhiyu-icon-paper-plane1" />
        <span class="banner-button-text"> 随机访问 </span>
      </button>
      <a
        class="banner-button"
        href="#"
        rel="external nofollow"
        @click.prevent="triggerScrollToApply"
      >
        <i class="anzhiyufont anzhiyu-icon-arrow-circle-right" />
        <span class="banner-button-text">申请友链</span>
      </a>
    </div>
    <div class="tags-group-all">
      <div class="tags-group-wrapper">
        <div
          v-for="(pair, index) in pairedLinkList"
          :key="index"
          class="tags-group-icon-pair"
        >
          <a
            v-for="item in pair"
            :key="item.id"
            class="tags-group-icon"
            :href="item.url"
            rel="external nofollow"
            target="_blank"
            :title="item.name"
          >
            <img :src="item.logo" :title="item.name" />
            <span class="tags-group-title">{{ item.name }}</span>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.banner-button:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.anzhiyufont {
  margin-right: 8px;
  font-size: 1.2em;
}

.flink_top {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  margin-bottom: 0.5rem;
  overflow: hidden;
  background: var(--anzhiyu-card-bg);
  border: var(--style-border-always);
  border-radius: 12px;
  box-shadow: var(--anzhiyu-shadow-border);
  transition: 0.3s;
  will-change: transform;
}

.banners-title {
  position: absolute;
  top: 1.875rem;
  left: 2.5rem;
  display: flex;
  flex-direction: column;
}

.banners-title-small {
  margin-top: 8px;
  margin-bottom: 0.625rem;
  margin-left: 2px;
  font-size: 12px;
  line-height: 1;
  color: var(--anzhiyu-secondtext);
}

.banners-title-big {
  margin-bottom: 8px;
  overflow: hidden;
  font-size: 2rem;
  font-weight: bold;
  font-weight: 700;
  line-height: 1;
  line-clamp: 1;
  background: linear-gradient(90deg, #4285f4, #9b59b6, #e91e63, #f44336);
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.banner-button-group {
  position: absolute;
  top: 2.5rem;
  right: 2.5rem;
  z-index: 1;
  display: flex;
}

.banner-button {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  padding: 10px;
  font-family: inherit;
  font-weight: bold;
  color: var(--anzhiyu-white);
  text-decoration: none;
  background: var(--anzhiyu-fontcolor);
  border: none;
  border-radius: 12px;
  transition: all 0.3s ease;

  &.secondary {
    margin-right: 1rem;
    font-weight: 400;
    color: var(--anzhiyu-lighttext);
    background: var(--anzhiyu-secondbg);
    border: var(--style-border-always);
    box-shadow: var(--anzhiyu-shadow-border);

    &:hover {
      color: var(--anzhiyu-white);
    }
  }

  &:not(:disabled):hover {
    background: var(--anzhiyu-main);
    box-shadow: 0 4px 10px rgb(0 0 0 / 10%);
  }
}

.tags-group-all {
  display: flex;
  padding-bottom: 2.5rem;
  transform: rotate(0deg);

  .tags-group-wrapper {
    display: flex;
    margin-top: 8.75rem;
    animation: 120s linear 0s infinite normal none running rowleft;
  }
}

.tags-group-icon:hover .tags-group-title {
  backdrop-filter: saturate(180%) blur(20px);
  opacity: 1;
}

.tags-group-icon-pair {
  margin-left: 1.25rem;
  user-select: none;
}

.tags-group-icon {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 120px;
  height: 120px;
  font-size: 66px;
  font-weight: 700;
  color: rgb(255 255 255);
  border-radius: 50%;
  box-shadow: var(--anzhiyu-shadow-blackdeep);

  &:nth-child(2n) {
    margin-top: 1rem;
    transform: translate(-60px);

    &:hover {
      background: var(--anzhiyu-main-op);
      transform: translate(-60px) scale(1.05);
    }
  }

  &:hover {
    background: var(--anzhiyu-main-op);
    transform: scale(1.05);
  }

  img {
    width: 60%;
    min-width: 100%;
    min-height: 100%;
    object-fit: cover;
    border-radius: 50%;
  }

  .tags-group-title {
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    font-size: 14px;
    color: var(--anzhiyu-card-bg);
    background: var(--anzhiyu-lighttext);
    border-radius: 120px;
    opacity: 0;
    transition: 0.3s;
  }
}

@media screen and (width >= 1200px) {
  .flink_top {
    animation: slide-in 0.6s 0.2s backwards;
  }
}
</style>
