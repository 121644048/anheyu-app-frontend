<script setup lang="ts">
import { computed, inject, ref } from "vue";
import type { Ref } from "vue";
import type { ArticleLink } from "@/api/post/type";
import { useArticleStore } from "@/store/modules/articleStore";

defineOptions({
  name: "CardRecentPost"
});

const articleStore = useArticleStore();
const defaultCover = articleStore.defaultCover;

const articles = inject<Ref<ArticleLink[]>>("recentArticles", ref([]));

const displayPosts = computed(() => articles.value.slice(0, 5));

const formatDate = (dateString: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
};
</script>
<template>
  <div v-if="displayPosts.length > 0" class="card-widget card-recent-post">
    <div class="item-headline">
      <i class="anzhiyufont anzhiyu-icon-history" />
      <span>最近发布</span>
    </div>
    <div class="aside-list">
      <router-link
        v-for="post in displayPosts"
        :key="post.id"
        class="aside-list-item"
        :to="`/posts/${post.id}`"
        :title="post.title"
      >
        <div class="thumbnail">
          <img :src="post.cover_url || defaultCover" :alt="post.title" />
        </div>
        <div class="content">
          <div class="title">
            {{ post.title }}
          </div>
          <time
            :datetime="post.created_at"
            :title="`发表于 ${post.created_at}`"
          >
            {{ formatDate(post.created_at) }}
          </time>
        </div>
      </router-link>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.item-headline {
  display: flex;
  align-items: center;
  padding-left: 0.25rem;
  margin-bottom: 0.5rem;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--anzhiyu-fontcolor);

  i {
    margin-right: 0.5rem;
    font-size: 1rem;
  }
}

.aside-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.aside-list-item {
  display: flex;
  gap: 0.75rem;
  color: inherit;
  text-decoration: none;
  &:hover .title {
    color: var(--anzhiyu-main);
  }
}

.thumbnail {
  flex-shrink: 0;
  width: 4rem;
  height: 4rem;
  overflow: hidden;
  border-radius: 8px;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease-out;
  }

  &:hover img {
    transform: scale(1.1);
  }
}

.content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  justify-content: center;
  min-width: 0;

  .title {
    display: -webkit-box;
    overflow: hidden;
    font-size: 0.9rem;
    font-weight: 700;
    color: var(--anzhiyu-fontcolor);
    text-overflow: ellipsis;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    transition: color 0.2s;
    -webkit-box-orient: vertical;
  }

  time {
    font-size: 0.75rem;
    color: var(--anzhiyu-fontcolor-grey);
  }
}
</style>
