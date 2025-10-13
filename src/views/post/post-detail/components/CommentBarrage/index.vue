<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from "vue";
import { useCommentStore } from "@/store/modules/commentStore";
import type { Comment } from "@/api/comment/type";
import { storeToRefs } from "pinia";
import { gsap } from "gsap";

defineOptions({
  name: "CommentBarrage"
});

const props = withDefaults(
  defineProps<{
    gravatarUrl: string;
    defaultGravatarType: string;
    maxBarrage?: number;
    barrageTime?: number;
    observeTargetId?: string;
  }>(),
  {
    maxBarrage: 1,
    barrageTime: 5000,
    observeTargetId: "post-comment"
  }
);

const commentStore = useCommentStore();
const { comments } = storeToRefs(commentStore);

const barrageContainer = ref<HTMLElement | null>(null);
const hoverOnBarrage = ref(false);
const barrageList = ref<Comment[]>([]);
const displayedBarrages = ref<Comment[]>([]);
const commentIndex = ref(0);
let commentInterval: number | null = null;
let observer: IntersectionObserver | null = null;

const customEase = "cubic-bezier(0.42, 0, 0.3, 1.11)";

const onEnter = (el: Element, done: () => void) => {
  gsap.fromTo(
    el,
    {
      opacity: 0,
      y: 30,
      scale: 1,
      rotationZ: 0
    },
    {
      opacity: 1,
      y: 0,
      scale: 1,
      rotationZ: 0,
      duration: 0.4,
      ease: customEase,
      onComplete: done
    }
  );
};

const onLeave = (el: Element, done: () => void) => {
  const htmlEl = el as HTMLElement;
  htmlEl.style.position = "absolute";
  htmlEl.style.width = `${htmlEl.offsetWidth}px`;
  gsap.to(el, {
    opacity: 0,
    y: 30,
    scale: 1,
    duration: 0.4,
    ease: customEase,
    onComplete: done
  });
};

const getCommentReplies = (item: Comment): Comment[] => {
  let list: Comment[] = [];
  if (item.content_html) {
    list.push(item);
  }
  if (item.children && item.children.length > 0) {
    for (const reply of item.children) {
      list.push(...getCommentReplies(reply));
    }
  }
  return list;
};

const flattenComments = (commentTree: Comment[]): Comment[] => {
  const flatList: Comment[] = [];
  for (const item of commentTree) {
    flatList.push(...getCommentReplies(item));
  }
  return flatList.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
};

const popCommentBarrage = () => {
  if (barrageList.value.length === 0) return;
  displayedBarrages.value.push(barrageList.value[commentIndex.value]);
  commentIndex.value = (commentIndex.value + 1) % barrageList.value.length;
  if (displayedBarrages.value.length > props.maxBarrage) {
    displayedBarrages.value.shift();
  }
};

const startBarrage = () => {
  if (commentInterval) clearInterval(commentInterval);
  if (barrageList.value.length > 0) {
    commentInterval = window.setInterval(() => {
      if (!hoverOnBarrage.value) {
        popCommentBarrage();
      }
    }, props.barrageTime);
  }
};

watch(
  comments,
  newComments => {
    if (newComments && newComments.length > 0) {
      barrageList.value = flattenComments(newComments);
      commentIndex.value = 0;
      displayedBarrages.value = [];
      startBarrage();
    } else {
      barrageList.value = [];
      displayedBarrages.value = [];
      if (commentInterval) clearInterval(commentInterval);
    }
  },
  { immediate: true, deep: true }
);

const processCommentHtml = (html: string): string => {
  // 使用正则表达式替换，避免 innerHTML 触发图片加载
  let processed = html;

  // 替换 <pre> 标签为【代码】（不包括其内容）
  processed = processed.replace(/<pre[^>]*>[\s\S]*?<\/pre>/gi, "【代码】");

  // 替换非表情的 <img> 标签为【图片】
  // 保留带有 tk-owo-emotion 类的表情图片
  processed = processed.replace(
    /<img(?![^>]*class=["'][^"']*tk-owo-emotion[^"']*["'])[^>]*>/gi,
    "【图片】"
  );

  return processed;
};

onMounted(() => {
  nextTick(() => {
    const observeTarget = document.getElementById(props.observeTargetId);
    if (observeTarget && barrageContainer.value) {
      const observerCallback = (entries: IntersectionObserverEntry[]) => {
        entries.forEach(entry => {
          if (barrageContainer.value && document.body.clientWidth > 768) {
            barrageContainer.value.style.bottom = entry.isIntersecting
              ? `-100%`
              : "0px";
          }
        });
      };
      observer = new IntersectionObserver(observerCallback, { threshold: 0 });
      observer.observe(observeTarget);
    }
  });
});

onBeforeUnmount(() => {
  if (commentInterval) {
    window.clearInterval(commentInterval);
  }
  if (observer) {
    observer.disconnect();
  }
});
</script>

<template>
  <div
    ref="barrageContainer"
    class="comment-barrage"
    @mouseenter="hoverOnBarrage = true"
    @mouseleave="hoverOnBarrage = false"
  >
    <TransitionGroup tag="div" @enter="onEnter" @leave="onLeave">
      <div
        v-for="item in displayedBarrages"
        :key="item.id"
        class="comment-barrage-item"
      >
        <div class="barrageHead">
          <a
            class="barrageTitle"
            :class="{ barrageBloggerTitle: item.is_admin_comment }"
            href="#post-comment"
          >
            {{ item.is_admin_comment ? "博主" : "热评" }}
          </a>
          <div class="barrageNick">{{ item.nickname }}</div>
          <img
            class="barrageAvatar"
            :src="`${props.gravatarUrl}avatar/${item.email_md5}?d=${props.defaultGravatarType}`"
          />
        </div>
        <a
          class="barrageContent"
          :href="`#comment-${item.id}`"
          v-html="processCommentHtml(item.content_html)"
        />
      </div>
    </TransitionGroup>
  </div>
</template>

<style lang="scss" scoped>
.comment-barrage {
  position: fixed;
  right: 60px;
  bottom: 0;
  z-index: 999;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: end;
  padding: 0 0 20px 10px;
  pointer-events: none;
  transition: bottom 0.3s;
}

@media screen and (width <= 768px) {
  .comment-barrage {
    display: none !important;
  }
}

.comment-barrage-item {
  display: flex;
  flex-direction: column;
  width: fit-content;
  min-width: 300px;
  max-width: 300px;
  min-height: 80px;
  max-height: 150px;
  padding: 8px 14px;
  margin: 4px;
  color: var(--anzhiyu-fontcolor);
  pointer-events: auto;
  background: rgb(255 255 255 / 85%);
  backdrop-filter: blur(20px);
  backdrop-filter: saturate(180%) blur(20px);
  border: var(--style-border);
  border-radius: 8px;
  box-shadow: var(--anzhiyu-shadow-border);
  transition: 0.3s;
  transform: translateZ(0);

  :deep(blockquote) {
    padding: 0.5rem 0.8rem;
    margin: 1rem 0;
    color: var(--anzhiyu-secondtext);
    background-color: var(--anzhiyu-secondbg);
    border: var(--style-border-always);
    border-radius: 8px;
  }

  :deep(p) {
    margin: 0;
  }
}

[data-theme="dark"] .comment-barrage-item {
  background: rgb(30 30 30 / 80%);
}

.comment-barrage-item:hover {
  border: var(--style-border-hover);
  box-shadow: var(--anzhiyu-shadow-main);
}

.barrageContent {
  color: var(--anzhiyu-fontcolor);
  text-decoration: none;
}

.barrageContent:hover {
  color: var(--anzhiyu-main);
}

.comment-barrage-item .comment-barrage-close {
  padding: 4px;
  line-height: 1;
  color: var(--anzhiyu-secondtext);
  cursor: pointer;
}

.comment-barrage-item .comment-barrage-close:hover {
  color: var(--anzhiyu-main);
}

.comment-barrage-item .barrageHead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 30px;
  padding: 0;
  padding-bottom: 6px;
  font-size: 12px;
  font-weight: 700;
  line-height: 30px;
  border-bottom: var(--style-border);
}

.comment-barrage-item .barrageHead .barrageTitle {
  padding: 4px;
  margin-right: 8px;
  line-height: 1;
  color: var(--anzhiyu-card-bg);
  text-decoration: none;
  background: var(--anzhiyu-fontcolor);
  border-radius: 4px;
}

.comment-barrage-item .barrageHead .barrageTitle.barrageBloggerTitle {
  background: var(--anzhiyu-orange);
}

.comment-barrage-item .barrageAvatar {
  width: 16px;
  height: 16px;
  margin: 0;
  margin-right: 8px;
  margin-left: auto;
  background: var(--anzhiyu-secondbg);
  border-radius: 50%;
}

.comment-barrage-item .barrageContent {
  height: calc(100% - 30px);
  margin-top: 6px;
  overflow: scroll;
  font-size: 14px !important;
  font-weight: 400 !important;
  cursor: pointer;
}

.comment-barrage-item .barrageContent::-webkit-scrollbar {
  width: 4px;
  height: 0;
}

.comment-barrage-item .barrageContent::-webkit-scrollbar-button {
  display: none;
}

.comment-barrage-item .barrageContent :deep(p) {
  display: -webkit-box;
  padding: 0;
  margin: 0;
  overflow: hidden;
  line-height: 1.3;
  text-overflow: ellipsis;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
}

.comment-barrage-item .barrageContent :deep(blockquote p) {
  margin: 0;
}

.comment-barrage-item .barrageContent :deep(h1),
.comment-barrage-item .barrageContent :deep(h2),
.comment-barrage-item .barrageContent :deep(h3),
.comment-barrage-item .barrageContent :deep(h4) {
  margin: 8px 0 !important;
  font-size: 14px !important;
  font-weight: 400 !important;
}
</style>
