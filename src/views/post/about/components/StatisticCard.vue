<!--
 * @Description: 访问统计卡片组件
 * @Author: 安知鱼
 * @Date: 2025-01-27
-->
<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { useStatistics } from "@/composables/useStatistics";

interface Props {
  cover: string;
  link: string;
  text: string;
}

defineProps<Props>();

const { stats, isLoading, error } = useStatistics();

// 动画数字状态
const animatedStats = ref({
  today_visitors: 0,
  today_views: 0,
  yesterday_visitors: 0,
  yesterday_views: 0,
  month_views: 0,
  year_views: 0
});

// 数字动画函数
const animateNumber = (
  element: HTMLElement,
  target: number,
  duration: number = 2000
) => {
  let current = 0;
  const increment = target / (duration / 16); // 16ms per frame for 60fps

  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }
    element.textContent = Math.floor(current).toLocaleString();
  }, 16);
};

// 开始所有数字的动画
const startNumberAnimation = () => {
  if (!stats.value) return;

  // 延迟一点开始动画，让用户看到数据加载完成
  setTimeout(() => {
    const elements = {
      today_visitors: document.getElementById("statistic-today-visitors"),
      today_views: document.getElementById("statistic-today-views"),
      yesterday_visitors: document.getElementById(
        "statistic-yesterday-visitors"
      ),
      yesterday_views: document.getElementById("statistic-yesterday-views"),
      month_views: document.getElementById("statistic-month-views"),
      year_views: document.getElementById("statistic-year-views")
    };

    // 为每个数字元素启动动画
    Object.entries(elements).forEach(([key, element]) => {
      if (
        element &&
        stats.value &&
        stats.value[key as keyof typeof stats.value]
      ) {
        const targetValue = stats.value[
          key as keyof typeof stats.value
        ] as number;
        animateNumber(element, targetValue, 1500 + Math.random() * 1000); // 随机动画时长
      }
    });
  }, 300);
};

// 监听统计数据变化，启动动画
watch(
  stats,
  newStats => {
    if (newStats && !isLoading.value) {
      startNumberAnimation();
    }
  },
  { immediate: true }
);

// 组件挂载后，如果数据已经加载完成，启动动画
onMounted(() => {
  if (stats.value && !isLoading.value) {
    startNumberAnimation();
  }
});
</script>

<template>
  <div
    class="about-statistic author-content-item"
    :style="`background: url(${cover}) top / cover no-repeat;`"
  >
    <div class="card-content">
      <div class="author-content-item-tips">数据</div>
      <span class="author-content-item-title">访问统计</span>

      <!-- 统计数据 -->
      <div v-if="!isLoading && !error" id="statistic">
        <div>
          <span>今日人数</span>
          <span id="statistic-today-visitors">0</span>
        </div>
        <div>
          <span>今日访问</span>
          <span id="statistic-today-views">0</span>
        </div>
        <div>
          <span>昨日人数</span>
          <span id="statistic-yesterday-visitors">0</span>
        </div>
        <div>
          <span>昨日访问</span>
          <span id="statistic-yesterday-views">0</span>
        </div>
        <div>
          <span>本月访问</span>
          <span id="statistic-month-views">0</span>
        </div>
        <div>
          <span>年访问量</span>
          <span id="statistic-year-views">0</span>
        </div>
      </div>

      <div v-else-if="isLoading" class="loading">加载中...</div>

      <div v-else-if="error" class="error">
        {{ error }}
      </div>

      <div class="banner-button-group">
        <a class="banner-button" @click="$router.push(link)">
          <i class="anzhiyufont anzhiyu-icon-arrow-circle-right" />
          <span class="banner-button-text">{{ text }}</span>
        </a>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.about-statistic {
  width: 39%;
  min-height: 380px;
  overflow: hidden;
  color: var(--anzhiyu-white);
  background-size: cover;

  @media screen and (width <= 768px) {
    width: 100% !important;
    min-height: 300px;
  }

  &::after {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    content: "";
    box-shadow: 0 -159px 173px 71px #0c1c2c inset;
  }
}

#statistic {
  display: flex;
  flex-flow: row wrap;
  justify-content: space-between;
  width: 100%;
  margin-top: 1rem;
  margin-bottom: 2rem;
  font-size: 16px;
  color: var(--anzhiyu-white);
  border-radius: 15px;

  div {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    width: 50%;
    margin-bottom: 0.5rem;

    span:first-child {
      font-size: 12px;
      opacity: 0.8;
    }

    span:last-child {
      font-size: 34px;
      font-weight: 700;
      line-height: 1;
      white-space: nowrap;

      @media screen and (width <= 768px) {
        font-size: 28px;
      }
    }
  }
}

.loading {
  margin-top: 1rem;
  color: var(--anzhiyu-white);
  opacity: 0.8;
}

.error {
  margin-top: 1rem;
  font-size: 14px;
  color: #ff6b6b;
  opacity: 0.8;
}

.post-tips {
  position: absolute;
  bottom: 1rem;
  left: 2rem;
  font-size: 14px;
  color: var(--anzhiyu-gray);

  @media screen and (width <= 768px) {
    position: relative;
    bottom: auto;
    left: auto;
    margin-top: 1rem;
  }

  a {
    color: var(--anzhiyu-gray) !important;
    border: none !important;

    &:hover {
      color: var(--anzhiyu-main) !important;
      background: none !important;
    }
  }
}

.banner-button-group {
  position: absolute;
  right: 2rem;
  bottom: 1.5rem;

  @media screen and (width <= 768px) {
    position: relative;
    right: auto;
    bottom: auto;
    margin-top: 1rem;
    text-align: center;
  }

  .banner-button {
    z-index: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 40px;
    padding: 10px;
    color: var(--anzhiyu-white);
    text-decoration: none;
    cursor: pointer;
    background: var(--anzhiyu-white-op);
    backdrop-filter: blur(20px);
    backdrop-filter: saturate(180%) blur(20px);
    border-bottom: 0 !important;
    border-radius: 20px;
    transition: 0.3s;
    transform: translateZ(0);

    @media screen and (width <= 768px) {
      justify-content: center;
      width: 100%;
    }

    i,
    svg {
      display: flex;
      align-items: center;
      justify-content: center;
      max-width: 40px;
      height: 40px;
      margin-right: 0.25rem;
      font-size: 22px;
      border-radius: 50px;
    }

    .banner-button-text {
      margin-left: 4px;
    }

    &:hover {
      color: var(--anzhiyu-white);
      background: var(--anzhiyu-main);
      border-radius: 20px !important;
    }
  }
}
</style>
