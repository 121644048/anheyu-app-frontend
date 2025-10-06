<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";

defineOptions({
  name: "AirConditioner"
});

declare global {
  interface Window {
    anzhiyu_air_conditioner?: {
      init: () => void;
      destroy: () => void;
    };
  }
}

const cssVariablesToManage = [
  "--el-color-primary",
  "--el-color-primary-dark-1",
  "--el-color-primary-dark-2",
  "--el-color-primary-light-1",
  "--el-color-primary-light-2",
  "--el-color-primary-light-3",
  "--el-color-primary-light-4",
  "--el-color-primary-light-5",
  "--el-color-primary-light-6",
  "--el-color-primary-light-7",
  "--el-color-primary-light-8",
  "--el-color-primary-light-9",
  "--anzhiyu-main",
  "--anzhiyu-main-op-deep",
  "--anzhiyu-main-op-light"
];

let originalCSSValues: { [key: string]: string } = {};

const SCRIPT_ID = "air-conditioner-script-tag";
const SCRIPT_URL =
  "https://npm.elemecdn.com/anzhiyu-air-conditioner@1.0.1/index.3f125bc6.js";

onMounted(() => {
  const rootElement = document.documentElement;
  const computedStyle = window.getComputedStyle(rootElement);

  cssVariablesToManage.forEach(variableName => {
    // 读取当前值并去除前后空格
    const value = computedStyle.getPropertyValue(variableName).trim();
    if (value) {
      originalCSSValues[variableName] = value;
    }
  });

  // 加载外部脚本（此脚本加载后会覆盖我们刚刚保存的那些CSS变量）
  const script = document.createElement("script");
  script.id = SCRIPT_ID;
  script.src = SCRIPT_URL;
  script.defer = true;
  document.body.appendChild(script);
});

onUnmounted(() => {
  // 销毁外部脚本创建的实例和标签
  if (
    window.anzhiyu_air_conditioner &&
    typeof window.anzhiyu_air_conditioner.destroy === "function"
  ) {
    window.anzhiyu_air_conditioner.destroy();
  }
  // @ts-ignore
  delete window.anzhiyu_air_conditioner;
  const scriptTag = document.getElementById(SCRIPT_ID);
  if (scriptTag) {
    scriptTag.remove();
  }

  const rootElement = document.documentElement;
  for (const variableName in originalCSSValues) {
    const value = originalCSSValues[variableName];
    rootElement.style.setProperty(variableName, value);
  }
  originalCSSValues = {};
});
</script>

<template>
  <div class="air-conditioner-container">
    <div class="air-conditioner-content">
      <div id="air-conditioner-vue" />
    </div>
  </div>
</template>

<style lang="scss">
.air-conditioner-container {
  max-width: 1400px;
  padding: 0 1.5rem 1.5rem 1.5rem;
  margin: 0 auto;

  .air-conditioner-content {
    width: 100%;
    background: var(--anzhiyu-card-bg);
    border: var(--style-border);
    border-radius: 12px;
  }
}

.copyright-box a {
  padding: 0 !important;
  border-bottom: none !important;
}
</style>
