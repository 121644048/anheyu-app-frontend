<script setup lang="ts">
import { computed } from "vue";
import type { Article, PostTag } from "@/api/post/type/index.ts";

defineOptions({
  name: "PostTools"
});

interface ProcessedMetaItem {
  name: string;
  path: string;
  length?: number;
}

const props = defineProps<{
  article?: Article;
}>();

const processedTags = computed<ProcessedMetaItem[]>(() => {
  if (!props.article?.post_tags) {
    return [];
  }
  return props.article.post_tags.map((tag: PostTag) => ({
    name: tag.name,
    length: tag.count,
    path: `/tags/${encodeURIComponent(tag.name)}/`
  }));
});

const hasTags = computed(() => processedTags.value.length > 0);
</script>

<template>
  <div v-if="hasTags" class="tag_share">
    <div class="post-meta__box">
      <div v-if="hasTags" class="post-meta__box__tag-list">
        <a
          v-for="tag in processedTags"
          :key="tag.name"
          :href="tag.path"
          class="post-meta__box__tags"
        >
          <span class="tags-punctuation">
            <i class="anzhiyufont anzhiyu-icon-tag" />
          </span>
          {{ tag.name }}
          <span v-if="tag.length !== undefined" class="tagsPageCount">
            {{ tag.length }}
          </span>
        </a>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.post-meta__box {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  margin-bottom: 0.5rem;
}

.post-meta__box a {
  display: flex;
  align-items: center;
  justify-content: center;
  width: fit-content;
  height: 40px;
  padding: 4px 12px;
  margin: 0 8px 0 0;
  font-size: 0.85rem;
  color: var(--anzhiyu-white);
  border-radius: 8px;
  transition: all 0.2s ease-in-out;
}

.post-meta__box__tag-list {
  display: flex;
  flex-flow: row wrap;
}

.post-meta__box__tags:nth-child(5n) {
  background-color: #4a4a4a;
}

.post-meta__box__tags:nth-child(5n + 1) {
  background-color: #ff5e5c;
}

.post-meta__box__tags:nth-child(5n + 2) {
  background-color: #ffbb50;
}

.post-meta__box__tags:nth-child(5n + 3) {
  background-color: #1ac756;
}

.post-meta__box__tags:nth-child(5n + 4) {
  background-color: #19b5fe;
}

.post-meta__box__tags:hover {
  color: #fff;
  background-color: var(--anzhiyu-main);
  box-shadow: var(--anzhiyu-shadow-theme);
}

span.tags-punctuation {
  margin-right: 4px;
}

[data-theme="light"] span.tagsPageCount {
  color: #fff;
  background-color: transparent;
}

.tagsPageCount {
  display: inline-block;
  min-width: 22.5px;
  padding: 4px 6px;
  margin-left: 4px;
  font-size: 0.7rem;
  line-height: 0.6rem;
  color: var(--anzhiyu-fontcolor);
  text-align: center;
  background: var(--anzhiyu-secondbg);
  border: var(--style-border-always);
  border-radius: 4px;
}

[data-theme="light"] .post-meta__box__tags span.tagsPageCount {
  color: white;
  background-color: transparent;
}
</style>
