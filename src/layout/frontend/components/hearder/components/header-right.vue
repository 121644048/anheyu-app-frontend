<template>
  <div class="header-right">
    <el-tooltip
      v-if="navConfig?.travelling"
      content="随机前往一个开往项目网站"
      placement="top"
      :show-arrow="false"
      :offset="8"
    >
      <a class="nav-button" @click="handleTravelClick">
        <i class="anzhiyufont anzhiyu-icon-train" />
      </a>
    </el-tooltip>
    <el-tooltip
      content="随机前往一个文章"
      placement="top"
      :show-arrow="false"
      :offset="8"
    >
      <div
        class="nav-button"
        @click.prevent="articleStore.navigateToRandomArticle()"
      >
        <i class="anzhiyufont anzhiyu-icon-dice" />
      </div>
    </el-tooltip>
    <el-tooltip content="搜索" placement="top" :show-arrow="false" :offset="8">
      <a class="nav-button" @click="handleSearchClick">
        <i class="anzhiyufont anzhiyu-icon-magnifying-glass" />
      </a>
    </el-tooltip>

    <input
      id="center-console"
      type="checkbox"
      :checked="isConsoleOpen"
      @change="appStore.toggleConsole()"
    />
    <label class="widget" for="center-console" title="中控台">
      <i class="left" />
      <i class="widget center" />
      <i class="widget right" />
    </label>

    <Console />

    <div
      class="nav-button nav-totop"
      :class="{ 'is-visible': showToTopButton, long: isFooterVisible }"
      @click="scrollToTop"
    >
      <div class="totopbtn">
        <i class="anzhiyufont anzhiyu-icon-arrow-up" />
        <span class="percent">{{ toTopText }}</span>
      </div>
    </div>

    <div id="toggle-menu" @click="toggleMobileMenu">
      <div class="site-page">
        <i class="anzhiyufont anzhiyu-icon-bars" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, type PropType } from "vue";
import { storeToRefs } from "pinia";
import { useSnackbar } from "@/composables/useSnackbar";
import { useArticleStore } from "@/store/modules/articleStore";
import { useAppStore } from "@/store/modules/app";
import Console from "./console.vue";

defineOptions({
  name: "HeaderRight"
});

const props = defineProps({
  navConfig: {
    type: Object as PropType<any>,
    required: false
  },
  isTransparent: {
    type: Boolean,
    default: true
  },
  scrollPercent: {
    type: Number,
    default: 0
  },
  isFooterVisible: {
    type: Boolean,
    default: false
  }
});

const articleStore = useArticleStore();
const appStore = useAppStore();
const { isConsoleOpen } = storeToRefs(appStore);
const { showSnackbar } = useSnackbar();

let travellingsTimer: ReturnType<typeof setTimeout> | null = null;
const handleTravelClick = () => {
  if (travellingsTimer) {
    clearTimeout(travellingsTimer);
  }
  const cancelAction = () => {
    if (travellingsTimer) {
      clearTimeout(travellingsTimer);
      showSnackbar("跳转已取消");
    }
  };
  showSnackbar(
    "即将跳转到「开往」项目的成员博客，不保证跳转网站的安全性和可用性",
    cancelAction,
    5000,
    "取消"
  );
  travellingsTimer = setTimeout(() => {
    window.open("https://www.travellings.cn/go.html", "_blank");
  }, 5000);
};

const showToTopButton = computed(() => !props.isTransparent);
const toTopText = computed(() => {
  if (props.isFooterVisible) {
    return "返回顶部";
  }
  return `${props.scrollPercent}`;
});
const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
};

const handleSearchClick = () => {
  // 触发自定义事件来打开搜索框
  window.dispatchEvent(new CustomEvent("frontend-open-search"));
};

// 移动端菜单控制
const toggleMobileMenu = () => {
  // 触发自定义事件来切换移动端菜单
  window.dispatchEvent(new CustomEvent("toggle-mobile-menu"));
};
</script>

<style scoped lang="scss">
[data-theme="dark"]
  .header-right
  #center-console:checked
  + label:is(.widget, #center-console:checked + label.widget:hover)
  i {
  background: var(--anzhiyu-black) !important;
}

[data-theme="dark"] #center-console + label i {
  background: var(--anzhiyu-white) !important;
}
.header-right {
  position: absolute;
  right: 0;
  z-index: 102;
  display: flex;
  flex-direction: row;
  align-items: center;
  height: 100%;
  padding-right: 1.5rem;

  --animation-on: cubic-bezier(0.6, 0.1, 0, 1);
  --animation-in: cubic-bezier(0.6, 0.2, 0.25, 1);
  --animation-ot: opacity 0.5s var(--animation-in) backwards,
    transform 1s var(--animation-in) backwards;
  --animation-otf: opacity 0.5s var(--animation-in) backwards,
    transform 1s var(--animation-in) backwards,
    filter 0.7s var(--animation-in) backwards;

  #center-console {
    display: none;
  }

  #center-console + label {
    --icon-size: 1.375rem;
    position: relative;
    right: 0;
    top: 0;
    bottom: 0;
    height: var(--icon-size);
    width: var(--icon-size);
    cursor: pointer;
    transition: 1s;
    margin-left: 1rem;
  }

  #center-console + label:hover i.left {
    width: calc(var(--icon-size) / 2.5);
  }

  #center-console + label:hover i.center {
    opacity: 0.5;
    -ms-filter: "progid:DXImageTransform.Microsoft.Alpha(Opacity=50)";
    filter: alpha(opacity=50);
    width: calc(var(--icon-size) / 2.5);
  }

  #center-console + label:hover i.right {
    width: calc(var(--icon-size) / 2.5);
    height: calc(var(--icon-size) / 1.15);
    transform: none;
  }

  #center-console + label i {
    background: var(--light-grey);
    position: absolute;
    border-radius: calc(var(--icon-size) * 0.15);
    transition: 0.5s var(--animation-on);
    inset: 0;
    margin: auto;
    right: auto;
    width: calc(var(--icon-size) / 3);
    height: calc(var(--icon-size) / 3);
    transform: translateY(calc(var(--icon-size) / 4));
  }

  #center-console + label i.left {
    width: 100%;
    transform: translateY(calc(var(--icon-size) / -4));
  }

  #center-console + label i.right {
    left: auto;
    right: 0;
    width: calc(var(--icon-size) / 2);
  }

  #center-console:checked + label {
    right: 0;
    top: 0.5rem;
    z-index: 99999;
  }

  #center-console:checked + label:hover::after {
    background: var(--anzhiyu-main) !important;
  }

  #center-console:checked + label::after {
    content: "";
    width: 35px;
    height: 35px;
    display: block;
    position: absolute;
    z-index: -1;
    top: -6px;
    left: -6.3px;
    background: var(--anzhiyu-fontcolor) !important;
    border-radius: 50px;
  }

  #center-console:checked
    + label:is(.widget, #center-console:checked + label.widget:hover)
    i {
    height: calc(var(--icon-size) / 4.5);
    background: var(--anzhiyu-white) !important;
  }

  #center-console:checked + label i.left {
    width: 100% !important;
    transform: rotate(-45deg) !important;
  }

  #center-console:checked + label i.center {
    width: 0 !important;
  }

  #center-console:checked + label i.right {
    width: 100% !important;
    transform: rotate(45deg) !important;
  }
  #center-console + label i {
    background: var(--font-color);
  }

  .nav-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 35px;
    height: 35px;
    padding: 0;
    margin-left: 1rem;
    cursor: pointer;
    border-radius: 50px;
    transition: 0.3s;

    i {
      font-size: 1.2rem;
      font-weight: 700;
      transition: color 0.3s;
    }

    &:not(.nav-totop):hover {
      color: var(--anzhiyu-white);
      background: var(--anzhiyu-lighttext);
    }
  }
  #toggle-menu {
    margin-left: 1rem;
    display: none;
    .site-page {
      i {
        font-size: 1.35rem;
      }
    }
  }

  .nav-totop {
    width: 0;
    margin-left: 0;
    transition: all 0.3s ease-in-out;
    transform: scale(0);
    transform-origin: right center;

    &.is-visible {
      width: 25px;
      margin-left: 1.5rem;
      opacity: 1;
      transform: scale(1);
    }

    &.is-visible.long {
      width: 80px;
      margin-left: 1rem;

      .totopbtn {
        width: 70px;
      }
    }

    .totopbtn {
      position: absolute;
      top: 5px;
      right: 5px;
      width: 25px;
      height: 25px;
      color: var(--anzhiyu-card-bg);
      background: var(--anzhiyu-fontcolor);
      border-radius: 40px;
      transition: 0.3s;

      i,
      .percent {
        position: absolute;
        top: 50%;
        left: 50%;
        transition: all 0.3s;
        transform: translate(-50%, -50%);
      }

      i {
        opacity: 0;
      }

      .percent {
        font-size: 13px;
        font-weight: 700;
        white-space: nowrap;
        opacity: 1;
      }
    }

    &:not(.long):hover {
      .totopbtn {
        top: 0;
        right: 0;
        width: 35px;
        height: 35px;
        background: var(--anzhiyu-lighttext);

        i {
          color: var(--anzhiyu-card-bg);
          opacity: 1;
          transition: 0.3s;
        }
      }

      .totopbtn .percent {
        opacity: 0;
      }
    }

    &.long:hover {
      transform: scale(1);

      .totopbtn {
        background: var(--anzhiyu-lighttext);
      }

      .totopbtn i {
        opacity: 1;
      }

      .totopbtn .percent {
        opacity: 0;
        transform: translate(-50%, -50%) scale(1.5);
      }
    }
  }
}

@media (width <= 768px) {
  .header-right {
    padding: 0 1.2rem;
  }
  #center-console,
  #center-console + label {
    display: none;
  }
  .header-right #toggle-menu {
    display: block;
  }
}
</style>
