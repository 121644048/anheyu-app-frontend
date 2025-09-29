<script setup lang="ts">
import { ref, onMounted } from "vue";
import { getTagList } from "@/api/post";
import type { PostTag } from "@/api/post/type";
import { useRouter } from "vue-router";

defineOptions({
  name: "PostTagsAll"
});

const tags = ref<PostTag[]>([]);
const loading = ref(true);
const router = useRouter();

// 获取标签列表
const fetchTags = async () => {
  loading.value = true;
  try {
    const { data } = await getTagList("count");
    tags.value = data;
  } catch (error) {
    console.error("获取标签列表失败:", error);
  } finally {
    loading.value = false;
  }
};

// 跳转到标签详情页
const goToTag = (tagName: string) => {
  router.push({ path: `/tags/${tagName}/` });
};

onMounted(() => {
  fetchTags();
});
</script>

<template>
  <div v-loading="loading" class="tag-cloud-amount">
    <h1 class="page-title">标签</h1>
    <div class="tag-cloud-list">
      <a
        v-for="tag in tags"
        :key="tag.id"
        class="tag-item"
        @click="goToTag(tag.name)"
      >
        <i class="anzhiyufont anzhiyu-icon-hashtag tags-punctuation" />
        {{ tag.name }}
        <span class="tags-page-count">{{ tag.count }}</span>
      </a>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.tag-cloud-amount {
  max-width: 1400px;
  min-height: 400px;
  margin: 0 auto;
  margin-top: 0.5rem;
  color: var(--anzhiyu-fontcolor);
}

.page-title {
  margin: 0.4rem 0 1rem 1rem;
  font-size: 2em;
  font-weight: 700;
  text-align: center;
}

.tag-cloud-list {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  text-align: center;
  animation: slide-in 0.6s 0.2s backwards;
}

.tag-item {
  display: flex;
  align-items: center;
  width: fit-content;
  padding: 0.6rem 0.7rem;
  margin: 0.7rem;
  font-size: 1.4rem;
  color: var(--anzhiyu-fontcolor);
  background: var(--anzhiyu-card-bg);
  border: var(--style-border-always);
  border-radius: 12px;
  box-shadow: var(--anzhiyu-shadow-border);
  backface-visibility: hidden;
  transform-style: preserve-3d;

  &:hover {
    color: var(--anzhiyu-white);
    background: var(--anzhiyu-main);
    border: var(--style-border-hover);
    box-shadow: var(--anzhiyu-shadow-blue);
  }
}

.tags-punctuation {
  margin-right: 0.25rem;
  font-size: 1.2rem;
  opacity: 0.4;
}

.tags-page-count {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  padding: 2px 4px;
  margin-left: 8px;
  font-size: 16px;
  line-height: 1;
  color: var(--anzhiyu-fontcolor);
  background: var(--anzhiyu-secondbg);
  border-radius: 8px;
  transition: 0.2s;
}
</style>
