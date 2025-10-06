<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useSiteConfigStore } from "@/store/modules/siteConfig";
import { useArticleStore } from "@/store/modules/articleStore";

defineOptions({
  name: "HomeTop"
});

const siteConfigStore = useSiteConfigStore();
const articleStore = useArticleStore();

const siteConfig = computed(() => siteConfigStore.getSiteConfig);
const homeTopConfig = computed(() => siteConfig.value?.HOME_TOP);
const creativityConfig = computed(() => siteConfig.value?.CREATIVITY);

const recommendedArticles = computed(() => articleStore.homeArticles);

const isTopGroupExpanded = ref(false);
const hasRecommendedArticles = computed(
  () => recommendedArticles.value && recommendedArticles.value.length > 0
);

const handleMoreClick = (event: MouseEvent) => {
  if (hasRecommendedArticles.value) {
    event.preventDefault();
    event.stopPropagation();
    expandTopGroup();
  }
};

const expandTopGroup = () => {
  isTopGroupExpanded.value = true;
};
const collapseTopGroup = () => {
  isTopGroupExpanded.value = false;
};

onMounted(() => {
  articleStore.fetchHomeArticles();
});

const creativityList = computed(() => {
  if (!creativityConfig.value?.creativity_list) return [];
  const list = creativityConfig.value.creativity_list;
  return [...list, ...list];
});

const creativityPairs = computed(() => {
  const pairs = [];
  const list = creativityList.value;
  for (let i = 0; i < list.length; i += 2) {
    if (list[i + 1]) {
      pairs.push([list[i], list[i + 1]]);
    }
  }
  return pairs;
});
</script>

<template>
  <div v-if="homeTopConfig && creativityConfig" class="home-top-container">
    <div class="left-section">
      <div id="random-banner">
        <div class="banners-title">
          <div class="banners-title-big">{{ homeTopConfig.title }}</div>
          <div class="banners-title-big">{{ homeTopConfig.subTitle }}</div>
          <div class="banners-title-small">{{ homeTopConfig.siteText }}</div>
        </div>

        <div id="skills-tags-group-all">
          <div class="tags-group-wrapper">
            <div
              v-for="(pair, index) in creativityPairs"
              :key="index"
              class="tags-group-icon-pair"
            >
              <div
                class="tags-group-icon"
                :style="{ background: pair[0].color }"
              >
                <img
                  :title="pair[0].name"
                  :src="pair[0].icon"
                  :alt="pair[0].name"
                />
              </div>
              <div
                class="tags-group-icon"
                :style="{ background: pair[1].color }"
              >
                <img
                  :title="pair[1].name"
                  :src="pair[1].icon"
                  :alt="pair[1].name"
                />
              </div>
            </div>
          </div>
        </div>

        <a
          id="random-hover"
          rel="external nofollow noreferrer"
          :class="{ 'is-loading': articleStore.isRandomArticleLoading }"
          @click.prevent="articleStore.navigateToRandomArticle()"
        >
          <i class="anzhiyufont anzhiyu-icon-paper-plane" />
          <div class="bannerText">
            随便逛逛
            <i class="anzhiyufont anzhiyu-icon-arrow-right" />
          </div>
        </a>
      </div>

      <div class="category-group">
        <div
          v-for="item in homeTopConfig.category"
          :key="item.name"
          class="category-item"
        >
          <router-link
            class="category-button"
            :style="{ background: item.background }"
            :to="item.path"
          >
            <span class="category-button-text">{{ item.name }}</span>
            <i :class="['anzhiyufont', item.icon]" />
          </router-link>
        </div>
      </div>
    </div>

    <div class="right-section">
      <div
        class="topGroup"
        @mouseleave="hasRecommendedArticles ? collapseTopGroup() : null"
      >
        <router-link
          v-for="article in recommendedArticles"
          :key="article.id"
          class="recent-post-item"
          :to="`/posts/${article.id}`"
          :title="article.title"
        >
          <div class="post_cover">
            <span class="recent-post-top-text">荐</span>
            <img
              v-if="article.cover_url"
              class="post_bg"
              :src="article.cover_url"
              :alt="article.title"
            />
            <img
              v-else
              class="post_bg"
              :src="articleStore.defaultCover"
              :alt="article.title"
            />
          </div>
          <div class="recent-post-info">
            <div class="article-title">{{ article.title }}</div>
          </div>
        </router-link>

        <a
          v-if="homeTopConfig.banner"
          id="todayCard"
          class="todayCard"
          :class="{ hide: isTopGroupExpanded }"
          :href="homeTopConfig.banner.link"
          target="_blank"
          rel="noopener external nofollow noreferrer"
        >
          <div class="todayCard-info">
            <div class="todayCard-tips">{{ homeTopConfig.banner.tips }}</div>
            <div class="todayCard-title">{{ homeTopConfig.banner.title }}</div>
          </div>
          <img
            class="todayCard-cover"
            :src="homeTopConfig.banner.image"
            alt="封面"
          />
          <div class="banner-button-group">
            <div class="banner-button" @click="handleMoreClick">
              <i class="anzhiyufont anzhiyu-icon-arrow-circle-right" />
              <span class="banner-button-text">更多推荐</span>
            </div>
          </div>
        </a>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
/* 增加旋转动画和加载中样式 */
@keyframes rotating {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
.anzhiyu-rotate {
  animation: rotating 2s linear infinite;
}
#random-hover.is-loading {
  pointer-events: none;
  cursor: wait;
}

.home-top-container {
  display: flex;
  gap: 0.5rem;
  width: 100%;
  margin: 0.5rem auto 0;
}
.left-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  height: 340px;
}
.right-section {
  flex: 1;
  min-width: 0;
  height: 340px;
}
#random-banner {
  display: flex;
  width: 100%;
  height: 76%;
  background: var(--anzhiyu-card-bg);
  border: var(--style-border);
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  box-shadow: var(--anzhiyu-shadow-border);
  flex-direction: column;
  transition: 0.3s;
  will-change: transform;
}
#random-banner:hover #random-hover {
  opacity: 1;
  padding-left: 2rem;
  background: var(--anzhiyu-theme-op-deep);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
}
#random-banner .banners-title {
  position: absolute;
  top: 2.9rem;
  left: 3rem;
  z-index: 2;
  animation: slide-in 0.6s 0.3s backwards;
  margin-bottom: 0.5rem;
}
#random-banner .banners-title .banners-title-big {
  font-size: 2.25rem;
  line-height: 1;
  font-weight: 700;
  margin-bottom: 0.5rem;
}
#random-banner .banners-title .banners-title-small {
  font-size: 12px;
  line-height: 1;
  color: var(--anzhiyu-secondtext);
  margin-top: 1rem;
  margin-bottom: 0.5rem;
}
#skills-tags-group-all {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  transform: rotate(-30deg) scale(1);
  margin-top: 7rem;
  z-index: 1;
  display: flex;
  transition: 0.3s;
}
#skills-tags-group-all .tags-group-wrapper {
  display: flex;
  flex-wrap: nowrap;
  animation: rowup 60s linear infinite;
}
#skills-tags-group-all .tags-group-icon-pair {
  margin-left: 1rem;
  flex-shrink: 0;
}
#skills-tags-group-all .tags-group-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 66px;
  font-weight: 700;
  box-shadow: var(--anzhiyu-shadow-blackdeep);
  width: 120px;
  height: 120px;
  border-radius: 30px;
}
#skills-tags-group-all .tags-group-icon img {
  width: 60px;
  height: 60px;
  object-fit: contain;
}
#skills-tags-group-all .tags-group-icon-pair .tags-group-icon:nth-child(even) {
  margin-top: 1rem;
  transform: translateX(-60px);
}
#random-hover {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  color: var(--anzhiyu-white);
  padding-left: 0.5rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  opacity: 0;
  transition: all 0.5s cubic-bezier(0.71, 0.15, 0.16, 1.15);
  font-size: 60px;
  z-index: 3;
  cursor: pointer;
}
#random-hover .bannerText {
  display: flex;
  align-items: center;
  font-size: 3.5rem;
  font-weight: bold;
}
#random-hover i {
  font-size: 4.5rem;
  margin-right: 1rem;
  line-height: 1;
}
#random-hover .bannerText > i {
  font-size: 4.5rem;
  margin-left: 1rem;
}
.category-group {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}
.category-group .category-item {
  flex: 1;
  position: relative;
  transition: all 0.8s cubic-bezier(0.65, 0.15, 0.37, 1.19);
  &:hover {
    flex: 2;
    .category-button i {
      opacity: 0.8;
      transition: 0.8s;
      transition-delay: 0.15s;
      transform: scale(1.03);
      font-size: 2.5rem;
      filter: blur(0);
    }
  }
}
.category-group .category-item .category-button {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 1.2rem;
  border-radius: 12px;
  color: white;
  text-decoration: none;
  transition: all 0.3s;
  background-size: 200% !important;
}
.category-group .category-item .category-button .category-button-text {
  font-size: 1.2rem;
  font-weight: bold;
}
.category-group .category-item .category-button i {
  font-size: 5rem;
  opacity: 0.2;
  position: absolute;
  right: 0;
  transition: 0.3s;
  width: 100px;
  text-align: center;
  filter: blur(2px);
  transform: scale(1) rotate(15deg);
}

/* 右侧区域交互样式 */
.todayCard-title,
.todayCard-tips,
.topGroup .banner-button {
  color: #ffffff;
}

.topGroup {
  height: 340px;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  position: relative;
  align-content: space-between;
  gap: 0.5rem;
}

.topGroup .todayCard {
  position: absolute;
  width: 100%;
  height: 100%;
  z-index: 10;
  top: 0;
  left: 0;
  background: var(--anzhiyu-card-bg);
  border-radius: 12px;
  overflow: hidden;
  transition: opacity 0.3s ease-in-out;
  display: flex;
  cursor: pointer;
  pointer-events: all;
}

.topGroup .todayCard .todayCard-info {
  position: absolute;
  bottom: 2rem;
  left: 2rem;
  z-index: 2;
  color: var(--anzhiyu-white);
  max-width: 60%;
  transition: 0.3s;
}

.topGroup .todayCard .todayCard-info .todayCard-tips {
  opacity: 0.8;
  font-size: 12px;
}

.topGroup .todayCard .todayCard-info .todayCard-title {
  font-size: 28px;
  font-weight: bold;
  line-height: 36px;
}

.topGroup .todayCard .todayCard-cover {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  object-fit: cover;
  z-index: -1;
  transition: transform 0.3s ease-in-out;
}

.topGroup .banner-button-group {
  position: absolute;
  right: 2rem;
  bottom: 2rem;
  display: flex;
  transition: 0.3s;
  z-index: 5;
}

.topGroup .todayCard.hide .todayCard-cover {
  transform: scale(1.2);
}

.topGroup .banner-button {
  background: var(--anzhiyu-white-op);
  border-radius: 20px;
  color: var(--anzhiyu-white);
  display: flex;
  align-items: center;
  transition: 0.3s;
  cursor: pointer;
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: blur(20px);
  transform: translateZ(0);
  height: 40px;
  width: 125px;
  justify-content: center;
}

.topGroup .banner-button:hover {
  background: var(--anzhiyu-theme);
  color: var(--anzhiyu-white);
}

.topGroup .banner-button-group .banner-button .banner-button-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.topGroup .banner-button i,
.topGroup .banner-button svg {
  margin-right: 8px;
  font-size: 22px;
}
.topGroup .todayCard::after {
  position: absolute;
  content: "";
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  box-shadow: 0 -109px 133px -9px #000000 inset;
  z-index: 1;
}

.topGroup .todayCard.hide {
  opacity: 0;
  pointer-events: none;
}

.topGroup .recent-post-item {
  width: calc(33.333% - 0.5rem * 2 / 3);
  flex-direction: column;
  align-items: flex-start;
  background: var(--anzhiyu-card-bg);
  border-radius: 12px;
  overflow: hidden;
  height: calc(50% - 0.25rem);
  border: var(--style-border-always);
  transition: 0.3s;
  position: relative;
  box-shadow: var(--anzhiyu-shadow-border);
  cursor: pointer;
  display: flex;
  text-decoration: none;
  color: var(--anzhiyu-fontcolor);
}

.topGroup .recent-post-item:hover .recent-post-info .article-title {
  color: var(--anzhiyu-main);
}
.topGroup .recent-post-item .post_cover {
  width: 100%;
  height: 60%;
  position: relative;
  overflow: hidden;
}

.topGroup span.recent-post-top-text {
  position: absolute;
  top: 0;
  left: -40px;
  display: flex;
  z-index: 2;
  background: var(--anzhiyu-theme);
  color: var(--anzhiyu-white);
  padding: 2px 8px;
  font-size: 12px;
  border-radius: 0 0 12px 0;
  transition: left 0.3s;
  cursor: pointer;
}

.topGroup .recent-post-item:hover .recent-post-top-text {
  left: 0;
}

.topGroup .recent-post-item .post_cover .post_bg {
  object-fit: cover;
  width: 100%;
  height: 100%;
  background: var(--anzhiyu-secondbg);
  border-radius: 0;
}

.topGroup .recent-post-item .recent-post-info {
  padding: 0.5rem 0.8rem;
  transition: 0.3s;
  flex-grow: 1;
  display: flex;
  align-items: center;
  width: 100%;
}

.topGroup .recent-post-item .recent-post-info .article-title {
  line-clamp: 2;
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  line-height: 1.4;
  font-weight: bold;
  font-size: 0.9rem;
}

@media (max-width: 992px) {
  .home-top-container {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    flex-wrap: nowrap;
    width: 100%;
    overflow-x: scroll;
    ::-webkit-scrollbar {
      width: 4px;
      height: 4px;
    }
    .banners-title {
      left: 2rem !important;
    }

    .left-section {
      height: calc(328px + 0.625rem);
      position: relative;
      #random-banner {
        height: calc(328px + 0.625rem);
      }
      .category-group {
        position: absolute;
        bottom: 2.9rem;
        left: 2rem;
        .category-item:nth-child(3) {
          display: none;
        }
        .category-button {
          flex-direction: row-reverse;
          padding: 8px 18px 8px 14px;
          border-radius: 60px;
          color: var(--anzhiyu-white);
          width: max-content;
          position: relative;
          gap: 0.3rem;
          i {
            font-size: 1.375rem;
            position: static;
            filter: none;
            transform: none;
            opacity: 1;
            width: auto;
          }
        }
      }
    }
    .right-section {
      display: flex;
      width: auto;
      height: auto;
      overflow: overlay;
      .topGroup {
        display: flex;
        flex-wrap: nowrap;
        width: auto;
        .recent-post-item {
          width: 200px;
          height: 168px;
          .post_cover {
            height: 60%;
          }
          .recent-post-info {
            height: 40%;
          }
        }
      }
    }
  }
  .right-section,
  .topGroup {
    height: auto;
  }
  .topGroup {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
  }
  .topGroup .todayCard {
    display: none;
  }
}

@media (max-width: 768px) {
  #skills-tags-group-all {
    opacity: 0.1;
    filter: blur(8px);
  }
}
</style>
