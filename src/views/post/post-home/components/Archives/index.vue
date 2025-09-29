<script setup lang="ts">
import { computed, type PropType } from "vue";
import type { Article } from "@/api/post/type";
import { useRouter } from "vue-router";
import { useArticleStore } from "@/store/modules/articleStore";

const props = defineProps({
  articles: {
    type: Array as PropType<Article[]>,
    required: true
  },
  total: {
    type: Number,
    required: true
  }
});

const router = useRouter();
const articleStore = useArticleStore();

// 将扁平的文章数组按年份分组
const groupedArticles = computed(() => {
  const groups: Record<string, Article[]> = {};
  if (!props.articles) return groups;

  // 创建一个 Set 来记录当前页已经出现过的年份
  const yearsInPage = new Set<string>();

  props.articles.forEach(article => {
    const year = new Date(article.created_at).getFullYear().toString();
    if (!groups[year]) {
      groups[year] = [];
    }
    groups[year].push(article);
  });

  return groups;
});

// 格式化日期，只显示 月-日
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${month}-${day}`;
};

// 跳转到文章详情
const goToPost = (id: string) => {
  router.push(`/posts/${id}`);
};

// 跳转到标签页
const goToTag = (tagName: string) => {
  router.push(`/tags/${tagName}/`);
};
</script>

<template>
  <div class="archive-page">
    <div class="article-sort-title">
      文章<sup>{{ total }}</sup>
    </div>
    <div class="article-sort">
      <template v-for="(articlesInYear, year) in groupedArticles" :key="year">
        <div class="article-sort-item-year">{{ year }}</div>
        <div
          v-for="article in articlesInYear"
          :key="article.id"
          class="article-sort-item"
          @click="goToPost(article.id)"
        >
          <a class="article-sort-item-img">
            <img
              :src="article.cover_url || articleStore.defaultCover"
              :alt="article.title"
            />
          </a>
          <div class="article-sort-item-info">
            <div class="article-sort-item-time">
              <i class="far fa-calendar-alt" />
              <time :datetime="article.created_at">{{
                formatDate(article.created_at)
              }}</time>
            </div>
            <a class="article-sort-item-title">{{ article.title }}</a>
            <div class="article-sort-item-tags">
              <template v-for="tag in article.post_tags" :key="tag.id">
                <a class="article-meta__tags" @click.stop="goToTag(tag.name)">
                  <span class="tags-punctuation">
                    <i anzhiyufont anzhiyu-icon-hashtag />
                    {{ tag.name }}</span
                  >
                </a>
              </template>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.archive-page {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  align-self: flex-start;
  width: 100%;
  padding: 1.25rem 2.5rem;
  background: var(--anzhiyu-card-bg);
  border: var(--style-border);
  border-radius: 12px;
  box-shadow: var(--anzhiyu-shadow-border);
  animation: slide-in 0.6s 0.1s backwards;
}

.article-sort-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--anzhiyu-fontcolor);

  sup {
    top: -0.625rem;
    margin-left: 4px;
    font-size: 16px;
    font-weight: 700;
    opacity: 0.4;
  }
}

.article-sort-item-year {
  position: relative;
  padding-left: 1rem;
  font-size: 1rem;
  font-weight: 700;

  &::before {
    position: absolute;
    top: 50%;
    left: 0;
    width: 6px;
    height: 1.5rem;
    content: "";
    background: var(--anzhiyu-main);
    border-radius: 4px;
    transform: translateY(-50%);
  }
}

.article-sort-item {
  position: relative;
  display: flex;
  align-items: center;
  overflow: hidden;
  border-radius: 12px;
  transition: all 0.2s ease-in-out 0s;
  -webkit-box-align: center;
}

.article-sort {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.article-sort-item-img {
  width: 80px;
  min-width: 151px;
  height: 80px;
  min-height: 80px;
  overflow: hidden;
  background: var(--anzhiyu-secondbg);
  border-radius: 12px;
  mask-image: radial-gradient(center, #fff, #000);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: all 0.6s ease 0s;
  }

  &:hover img {
    transform: scale(1.05);
  }
}

.article-sort-item-info {
  display: flex;
  flex: 1 1 0%;
  flex-direction: column;
  padding: 0 1rem;
  -webkit-box-flex: 1;
}

.article-sort-item-time {
  display: none;
}

.article-sort-item-title {
  order: 0;
  width: fit-content;
  overflow: hidden;
  font-size: 1.1em;
  font-weight: 700;
  line-height: 1.3;
  color: var(--anzhiyu-fontcolor);
  text-overflow: ellipsis;
  -webkit-line-clamp: 1;
  line-clamp: 1;
  transition: all 0.3s ease 0s;

  &:hover {
    color: var(--anzhiyu-main);
  }
}

.article-sort-item-tags {
  display: flex;
  gap: 8px;
  width: 100%;
  margin-top: 8px;
  overflow: hidden;
  font-size: 0.7rem;
  text-overflow: ellipsis;
  white-space: nowrap;

  .article-meta__tags {
    width: fit-content;
    overflow: hidden;
    color: var(--anzhiyu-secondtext);
    text-overflow: ellipsis;
    border-radius: 8px;
    transition: color 0.3s;

    .tags-punctuation {
      margin-right: 1px;
      font-size: 12px;
    }

    &:hover {
      color: var(--anzhiyu-main);
    }
  }

  .article-meta__link {
    color: var(--anzhiyu-secondtext);
    opacity: 0.5;
  }
}
</style>
