<template>
  <div class="header-right">
    <el-tooltip
      v-if="navConfig?.travelling && isHomePage"
      content="随机前往一个开往项目网站"
      placement="top"
      :show-arrow="false"
      :offset="8"
    >
      <a class="nav-button" @click="handleTravelClick">
        <i class="anzhiyufont anzhiyu-icon-train" />
      </a>
    </el-tooltip>
    <!-- 用户中心/登录注册 -->
    <div
      v-if="!isLoggedIn && !isHomePage"
      class="user-dropdown-wrapper"
      @mouseenter="showUserDropdown = true"
      @mouseleave="showUserDropdown = false"
    >
      <div class="!ml-0 nav-button">
        <IconifyIconOffline icon="ri:user-fill" class="w-[1.4rem] h-[1.4rem]" />
      </div>
      <!-- 桥接区域，填补按钮和下拉菜单之间的空隙 -->
      <div v-if="showUserDropdown" class="dropdown-bridge" />
      <Transition name="dropdown-fade">
        <div v-show="showUserDropdown" class="user-dropdown-menu">
          <div
            class="dropdown-item"
            @click="handleDropdownItemClick('check-email')"
          >
            <i class="anzhiyufont anzhiyu-icon-sign-in-alt" />
            <span>登录</span>
          </div>
          <div
            class="dropdown-item"
            @click="handleDropdownItemClick('register-form')"
          >
            <i class="anzhiyufont anzhiyu-icon-user-plus" />
            <span>注册</span>
          </div>
        </div>
      </Transition>
    </div>
    <el-tooltip
      v-else-if="isLoggedIn && !isHomePage"
      content="用户中心"
      placement="top"
      :show-arrow="false"
      :offset="8"
    >
      <a class="nav-button" @click="goToUserCenter">
        <IconifyIconOffline icon="ri:user-fill" class="w-[1.4rem] h-[1.4rem]" />
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

    <!-- 登录弹窗 -->
    <LoginDialog
      v-model="showLoginDialog"
      :initial-step="loginDialogInitialStep"
      :hide-theme-switch="true"
      @login-success="handleLoginSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, nextTick, onMounted, type PropType } from "vue";
import { storeToRefs } from "pinia";
import { useRoute, useRouter } from "vue-router";
import { useSnackbar } from "@/composables/useSnackbar";
import { useArticleStore } from "@/store/modules/articleStore";
import { useAppStore } from "@/store/modules/app";
import { useUserStoreHook } from "@/store/modules/user";
import Console from "./console.vue";
import LoginDialog from "@/components/LoginDialog/index.vue";

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

const route = useRoute();
const router = useRouter();
const articleStore = useArticleStore();
const appStore = useAppStore();
const userStore = useUserStoreHook();
const { isConsoleOpen } = storeToRefs(appStore);
const { showSnackbar } = useSnackbar();

// 登录弹窗控制
const showLoginDialog = ref(false);
const loginDialogInitialStep = ref<"check-email" | "register-form">(
  "check-email"
);

// 用户下拉菜单控制
const showUserDropdown = ref(false);

// 判断是否在首页
const isHomePage = computed(() => route.path === "/");

// 检查用户是否已登录
const isLoggedIn = computed(() => {
  return !!userStore.username && userStore.roles.length > 0;
});

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

// 打开登录弹窗
const openLoginDialog = (
  step: "check-email" | "register-form" = "check-email"
) => {
  loginDialogInitialStep.value = step;
  showLoginDialog.value = true;
};

// 处理下拉菜单项点击
const handleDropdownItemClick = (step: "check-email" | "register-form") => {
  showUserDropdown.value = false;
  openLoginDialog(step);
};

// 登录成功后的处理
const handleLoginSuccess = async () => {
  showLoginDialog.value = false;
  // 不再刷新整个页面，用户状态已经在 LoginDialog 中更新
  // 只需要等待一小段时间让状态传播，然后 UI 会自动响应
  await nextTick();
};

// 跳转到用户中心
const goToUserCenter = () => {
  router.push("/user-center");
};

// 移动端菜单控制
const toggleMobileMenu = () => {
  // 触发自定义事件来切换移动端菜单
  window.dispatchEvent(new CustomEvent("toggle-mobile-menu"));
};

// 检查URL参数，激活成功后自动打开登录弹窗
onMounted(() => {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("openLogin") === "1") {
    // 移除URL参数，避免刷新时重复打开
    urlParams.delete("openLogin");
    const newUrl =
      window.location.pathname +
      (urlParams.toString() ? "?" + urlParams.toString() : "");
    window.history.replaceState({}, "", newUrl);

    // 打开登录弹窗
    nextTick(() => {
      openLoginDialog("check-email");
    });
  }
});
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
  --animation-on: cubic-bezier(0.6, 0.1, 0, 1);
  --animation-in: cubic-bezier(0.6, 0.2, 0.25, 1);
  --animation-ot: opacity 0.5s var(--animation-in) backwards,
    transform 1s var(--animation-in) backwards;
  --animation-otf: opacity 0.5s var(--animation-in) backwards,
    transform 1s var(--animation-in) backwards,
    filter 0.7s var(--animation-in) backwards;

  position: absolute;
  right: 0;
  z-index: 102;
  display: flex;
  flex-direction: row;
  align-items: center;
  height: 100%;
  padding-right: 1.5rem;

  #center-console {
    display: none;
  }

  #center-console + label {
    --icon-size: 1.375rem;

    position: relative;
    top: 0;
    right: 0;
    bottom: 0;
    width: var(--icon-size);
    height: var(--icon-size);
    margin-left: 1rem;
    cursor: pointer;
    transition: 1s;
  }

  #center-console + label:hover i.left {
    width: calc(var(--icon-size) / 2.5);
  }

  #center-console + label:hover i.center {
    width: calc(var(--icon-size) / 2.5);
    filter: "progid:DXImageTransform.Microsoft.Alpha(Opacity=50)";
    filter: alpha(opacity=50);
    opacity: 0.5;
  }

  #center-console + label:hover i.right {
    width: calc(var(--icon-size) / 2.5);
    height: calc(var(--icon-size) / 1.15);
    transform: none;
  }

  #center-console + label i {
    position: absolute;
    inset: 0;
    right: auto;
    width: calc(var(--icon-size) / 3);
    height: calc(var(--icon-size) / 3);
    margin: auto;
    background: var(--light-grey);
    border-radius: calc(var(--icon-size) * 0.15);
    transition: 0.5s var(--animation-on);
    transform: translateY(calc(var(--icon-size) / 4));
  }

  #center-console + label i.left {
    width: 100%;
    transform: translateY(calc(var(--icon-size) / -4));
  }

  #center-console + label i.right {
    right: 0;
    left: auto;
    width: calc(var(--icon-size) / 2);
  }

  #center-console:checked + label {
    top: 0.5rem;
    right: 0;
    z-index: 99999;
  }

  #center-console:checked + label:hover::after {
    background: var(--anzhiyu-main) !important;
  }

  #center-console:checked + label::after {
    position: absolute;
    top: -6px;
    left: -6.3px;
    z-index: -1;
    display: block;
    width: 35px;
    height: 35px;
    content: "";
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
    display: none;
    margin-left: 1rem;

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

// 用户下拉菜单
.user-dropdown-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

// 桥接区域，填补按钮和下拉菜单之间的空隙
.dropdown-bridge {
  position: absolute;
  top: 100%;
  width: 140px;
  height: 8px;
  pointer-events: auto;
}

.user-dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  z-index: 1000;
  min-width: 140px;
  background: var(--anzhiyu-card-bg);
  backdrop-filter: saturate(180%) blur(20px);
  border: var(--style-border-always);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgb(0 0 0 / 12%);

  .dropdown-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 18px;
    font-size: 14px;
    color: var(--anzhiyu-fontcolor);
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    i {
      font-size: 16px;
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    span {
      font-weight: 500;
    }

    &:hover {
      color: var(--anzhiyu-white);
      background: var(--anzhiyu-main);

      i {
        transform: scale(1.1);
      }
    }

    &:not(:last-child) {
      border-bottom: 1px solid var(--anzhiyu-card-border, rgb(0 0 0 / 5%));
    }

    &:first-child {
      border-top-left-radius: 12px;
      border-top-right-radius: 12px;
    }

    &:last-child {
      border-bottom-left-radius: 12px;
      border-bottom-right-radius: 12px;
    }
  }
}

// 下拉菜单动画
.dropdown-fade-enter-active {
  animation: dropdown-in 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.dropdown-fade-leave-active {
  animation: dropdown-out 0.2s cubic-bezier(0.4, 0, 1, 1);
}

@keyframes dropdown-in {
  0% {
    opacity: 0;
    transform: translateY(-12px) scale(0.9);
  }

  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes dropdown-out {
  0% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }

  100% {
    opacity: 0;
    transform: translateY(-8px) scale(0.95);
  }
}
</style>
