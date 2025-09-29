<script setup lang="ts">
import { ref, watch, inject, onMounted, onUnmounted, nextTick } from "vue";
import type { Ref } from "vue";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

defineOptions({
  name: "CardToc"
});

const allSpyIds = inject<Ref<string[]>>("allSpyIds", ref([]));
const updateHeadingTocItems = inject<(items: TocItem[]) => void>(
  "updateHeadingTocItems"
);

const tocRef = ref<HTMLElement | null>(null);
const indicatorRef = ref<HTMLElement | null>(null);

const articleContentHtml =
  inject<Ref<string | undefined>>("articleContentHtml");
const tocItems = ref<TocItem[]>([]);
const activeTocId = ref<string | null>(null);

const isClickScrolling = ref(false);
let scrollTimer: number | null = null;

const scrollToHeading = (event: MouseEvent, id: string) => {
  event.preventDefault();
  activeTocId.value = id;

  history.replaceState(history.state, "", `#${id}`);

  isClickScrolling.value = true;

  const headingElement = document.getElementById(id);
  if (headingElement) {
    const rect = headingElement.getBoundingClientRect();
    const absoluteTop = rect.top + window.scrollY;
    const top = absoluteTop - 80;
    window.scrollTo({
      top: top,
      behavior: "smooth"
    });
  }
};

const parseHeadings = () => {
  if (!articleContentHtml?.value || typeof document === "undefined") {
    tocItems.value = [];
    return;
  }
  const parser = new DOMParser();
  const doc = parser.parseFromString(articleContentHtml.value, "text/html");
  const headings = doc.querySelectorAll("h1, h2, h3, h4, h5, h6");
  const newTocItems: TocItem[] = [];
  headings.forEach(heading => {
    if (heading.id) {
      newTocItems.push({
        id: heading.id,
        text: heading.textContent || "",
        level: parseInt(heading.tagName.substring(1), 10)
      });
    }
  });
  tocItems.value = newTocItems;
  if (updateHeadingTocItems) {
    updateHeadingTocItems(newTocItems);
  }
};

const onScroll = () => {
  if (isClickScrolling.value) {
    return;
  }

  const fixedHeaderHeight = 80;
  let newActiveId: string | null = null;

  for (let i = allSpyIds.value.length - 1; i >= 0; i--) {
    const id = allSpyIds.value[i];
    const element = document.getElementById(id);
    if (element) {
      if (element.getBoundingClientRect().top <= fixedHeaderHeight) {
        newActiveId = id;
        break;
      }
    }
  }

  if (activeTocId.value !== newActiveId) {
    activeTocId.value = newActiveId;
    if (newActiveId) {
      history.replaceState(history.state, "", `#${newActiveId}`);
    } else {
      history.replaceState(
        history.state,
        "",
        window.location.pathname + window.location.search
      );
    }
  }
};

const updateIndicator = () => {
  if (!tocRef.value || !indicatorRef.value) return;
  const activeLink = tocRef.value.querySelector("a.active") as HTMLElement;
  if (activeLink) {
    indicatorRef.value.style.top = `${activeLink.offsetTop}px`;
    indicatorRef.value.style.height = `${activeLink.offsetHeight / 2}px`;
    indicatorRef.value.style.opacity = "1";
  } else {
    indicatorRef.value.style.opacity = "0";
  }
};

watch(
  articleContentHtml,
  () => {
    nextTick(() => {
      parseHeadings();
    });
  },
  { immediate: true, deep: true }
);

watch(activeTocId, () => {
  nextTick(updateIndicator);
});

let scrollEndHandler: () => void;

onMounted(() => {
  scrollEndHandler = () => {
    if (scrollTimer) {
      clearTimeout(scrollTimer);
    }
    scrollTimer = window.setTimeout(() => {
      isClickScrolling.value = false;
    }, 150);
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("scroll", scrollEndHandler);

  nextTick(updateIndicator);
});

onUnmounted(() => {
  window.removeEventListener("scroll", onScroll);
  if (scrollEndHandler) {
    window.removeEventListener("scroll", scrollEndHandler);
  }
});

defineExpose({
  scrollToHeading
});
</script>

<template>
  <div v-if="tocItems.length > 0" id="card-toc" class="card-widget">
    <div class="item-headline">
      <i class="anzhiyufont anzhiyu-icon-bars" />
      <span>目录</span>
    </div>
    <div class="toc-content">
      <ol ref="tocRef" class="toc">
        <li
          v-for="item in tocItems"
          :key="item.id"
          class="toc-item"
          :class="`toc-level-${item.level}`"
        >
          <a
            :href="`#${item.id}`"
            class="toc-link"
            :class="{ active: activeTocId === item.id }"
            @click="scrollToHeading($event, item.id)"
          >
            <span class="toc-text">{{ item.text }}</span>
          </a>
        </li>
        <div ref="indicatorRef" class="toc-indicator" />
      </ol>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.card-widget {
  padding: 1rem;
  background: var(--anzhiyu-card-bg);
  border: var(--style-border);
  border-radius: 12px;
}

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
    font-size: 1.2rem;
  }
}

.toc-content {
  max-height: calc(100vh - 200px);
  overflow: auto;

  &::-webkit-scrollbar {
    width: 10px;
    height: 6px;
    border-radius: 8px;
  }

  &:hover {
    .toc-link {
      filter: blur(0);
      opacity: 1;
    }
  }
}

.toc {
  position: relative;
  z-index: 1;
  padding: 0;
  margin: 0;
  list-style: none;
}

.toc-link {
  position: relative;
  display: flex;
  align-items: center;
  padding: 8px 8px 8px 12px;
  overflow: hidden;
  line-height: 1.5;
  color: var(--anzhiyu-secondtext);
  border-radius: 8px;
  transition:
    color 0.2s ease-out,
    background-color 0.2s ease-out,
    font-size 0.2s ease-out,
    filter 0.2s ease-out,
    opacity 0.2s ease-out;

  &:not(.active) {
    width: 100%;
    cursor: pointer;
    filter: blur(1px);
    opacity: 0.6;
  }

  .toc-text {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    transition: transform 0.2s ease-out;
  }

  &:hover {
    color: var(--anzhiyu-lighttext);
    background-color: var(--anzhiyu-main-op-light);
  }

  &.active {
    font-weight: 600;
    color: var(--anzhiyu-lighttext);
    background-color: var(--anzhiyu-main-op-light);
  }
}

.toc-indicator {
  position: absolute;
  top: 50%;
  left: 0;
  z-index: 2;
  width: 4px;
  background-color: var(--anzhiyu-main);
  border-radius: 4px;
  opacity: 0;
  transition:
    top 0.2s cubic-bezier(0, 1, 0.5, 1),
    height 0.2s cubic-bezier(0, 1, 0.5, 1),
    opacity 0.2s ease-in-out;
  transform: translateY(50%);
}

@for $i from 1 through 6 {
  .toc-level-#{$i} {
    .toc-link {
      padding-left: ($i) * 0.8rem;
      font-size: #{0.95 - ($i - 1) * 0.05}rem;

      &.active {
        font-size: #{1.1 - ($i - 1) * 0.05}rem;
      }
    }
  }
}
</style>
