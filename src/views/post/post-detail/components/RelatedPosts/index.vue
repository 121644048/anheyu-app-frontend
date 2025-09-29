<script setup lang="ts">
import { type PropType } from "vue";
import type { ArticleLink } from "@/api/post/type";

import { useArticleStore } from "@/store/modules/articleStore";

defineOptions({
  name: "RelatedPosts"
});

const props = defineProps({
  posts: {
    type: Array as PropType<ArticleLink[]>,
    default: () => []
  }
});

const articleStore = useArticleStore();

const toRandomPost = () => {
  articleStore.navigateToRandomArticle();
};

// 默认封面图
const defaultCover = articleStore.defaultCover;
</script>

<template>
  <div v-if="posts && posts.length > 0" class="relatedPosts">
    <div class="headline">
      <i class="anzhiyufont anzhiyu-icon-thumbs-up fa-fw" />
      <span>喜欢这篇文章的人也看了</span>
      <div class="relatedPosts-link">
        <a
          href="javascript:void(0);"
          rel="external nofollow"
          @click.prevent="toRandomPost"
          >随便逛逛</a
        >
      </div>
    </div>
    <div class="relatedPosts-list">
      <div v-for="post in posts" :key="post.id">
        <router-link
          :to="`/posts/${post.abbrlink || post.id}`"
          :title="post.title"
        >
          <img
            class="cover"
            alt="cover"
            :src="post.cover_url || defaultCover"
          />
          <div class="content is-center">
            <div class="title">{{ post.title }}</div>
          </div>
        </router-link>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.relatedPosts {
  margin-top: 1.25rem;
  user-select: none;
}

.headline {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
  font-size: 1.25rem;
  font-weight: 700;

  i {
    font-size: 22px;
    line-height: 1;
  }

  span {
    margin-right: auto;
    margin-left: 8px;
  }
}

.relatedPosts-link {
  display: block;
  margin-left: 8px;
  font-size: 0.8125rem;

  a {
    font-weight: 400;
  }
}

.relatedPosts-list {
  display: flex;
  flex-flow: column wrap;
  justify-content: space-between;

  & > div {
    position: relative;
    display: inline-block;
    width: 100%;
    height: 200px;
    margin-bottom: 8px;
    overflow: hidden;
    vertical-align: bottom;
    cursor: pointer;
    background: var(--anzhiyu-secondbg);
    border: var(--style-border);
    border-radius: 12px;
    mask-image: radial-gradient(center, #fff, #000);
    transition: 0.3s;

    &:hover {
      background: var(--anzhiyu-main);

      a .title {
        color: var(--anzhiyu-white);
      }
    }
  }
}

.relatedPosts-list a {
  display: flex;
  width: 100%;
  height: 100%;

  .cover {
    width: 360px;
    min-width: 45%;
    max-width: 45%;
    height: 100%;
    object-fit: cover;
    border-radius: 0;
    transition: all 0.6s ease 0s;
  }

  .content {
    width: 100%;
    padding: 0 1rem;

    &.is-center {
      display: flex;
      flex-flow: row wrap;
      align-items: center;
      justify-content: center;
      text-align: center;
    }
  }

  .title {
    margin-right: auto;
    overflow: hidden;
    font-size: 1.125rem;
    font-weight: 700;
    line-height: 1.5;
    color: var(--anzhiyu-fontcolor);
    text-align: left;
    -webkit-line-clamp: 4;
    line-clamp: 4;
  }
}
</style>
