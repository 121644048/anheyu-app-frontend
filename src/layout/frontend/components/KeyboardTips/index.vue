<template>
  <div
    v-if="!isMobile"
    class="shortcut-guide-wrapper"
    :class="{ show: visible }"
  >
    <div class="keyboard-header">
      <div class="keyboardTitle">
        <i class="anzhiyufont anzhiyu-icon-keyboard" />
        博客快捷键
      </div>
      <div class="keyboard-subtitle">按住 Shift 键查看可用快捷键</div>
    </div>
    <div class="keybordList">
      <div
        v-for="(shortcut, index) in shortcuts"
        :key="index"
        class="keybordItem"
      >
        <div class="keyGroup">
          <kbd v-for="key in shortcut.keys" :key="key" class="key">
            {{ key }}
          </kbd>
        </div>
        <div class="keyContent">
          <div class="content">{{ shortcut.description }}</div>
        </div>
      </div>
    </div>
    <div class="keyboard-footer">
      <div class="footer-text">松开 Shift 键或点击外部区域关闭</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { deviceDetection } from "@pureadmin/utils";

defineOptions({
  name: "ShortcutGuide"
});

interface Shortcut {
  keys: string[];
  description: string;
}

interface Props {
  visible: boolean;
  shortcuts: Shortcut[];
}

const props = defineProps<Props>();

// 检测是否为移动端
const isMobile = deviceDetection();
</script>

<style lang="scss" scoped>
.shortcut-guide-wrapper {
  position: fixed;
  top: 80px;
  left: 20px;
  z-index: 9999;
  background: var(--anzhiyu-maskbgdeep);
  border-radius: 16px;
  border: var(--style-border);
  padding: 24px;
  display: flex;
  flex-direction: column;
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: blur(20px);
  transform: translateZ(0);
  box-shadow: var(--anzhiyu-shadow-border);
  opacity: 0;
  visibility: hidden;
  transform: translateY(-10px) scale(0.95);
  transition:
    opacity 0.15s ease,
    visibility 0.15s ease,
    transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
  pointer-events: none;
  min-width: 320px;
  max-width: 400px;

  &.show {
    opacity: 1;
    visibility: visible;
    transform: translateY(0) scale(1);
    pointer-events: all;
  }
}

.keyboard-header {
  margin-bottom: 16px;
}

.keyboardTitle {
  font-size: 16px;
  font-weight: 600;
  color: var(--anzhiyu-fontcolor);
  line-height: 1.2;
  margin-bottom: 4px;
}

.keyboard-subtitle {
  font-size: 12px;
  color: var(--anzhiyu-secondtext);
  line-height: 1.2;
  opacity: 0.8;
}

.keybordList {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.keybordItem {
  display: flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(0, 0, 0, 0.05);

    .keyContent .content {
      color: var(--anzhiyu-lighttext);
      cursor: auto;
    }

    .key {
      background: var(--anzhiyu-lighttext);
      color: var(--anzhiyu-card-bg);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      cursor: auto;
    }
  }
}

.keyContent .content {
  cursor: pointer;
  line-height: 1.3;
  transition: color 0.2s ease;
  font-size: 14px;
  color: var(--anzhiyu-fontcolor);
}

.keyGroup {
  display: flex;
  align-items: center;
  width: 150px;
  flex-shrink: 0;
  transform: translateY(1px);
}

.key {
  padding: 6px 10px;
  font-family: "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas,
    "Courier New", monospace;
  background-color: var(--anzhiyu-card-bg);
  color: var(--anzhiyu-fontcolor);
  border: 1px solid var(--anzhiyu-secondtext);
  border-bottom: 2px solid var(--anzhiyu-secondtext);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border-radius: 6px;
  font-weight: 500;
  font-size: 12px;
  margin-right: 6px;
  line-height: 1;
  height: 28px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;

  &:last-child {
    margin-right: 0;
  }
}

.keyboard-footer {
  border-top: 1px solid var(--style-border);
  padding-top: 16px;
  text-align: center;
}

.footer-text {
  font-size: 11px;
  color: var(--anzhiyu-secondtext);
  opacity: 0.7;
  line-height: 1.2;
}

// 响应式设计
@media (max-width: 768px) {
  .shortcut-guide-wrapper {
    left: 10px;
    right: 10px;
    min-width: auto;
    max-width: none;
  }

  .keyGroup {
    width: 80px;
  }

  .key {
    padding: 4px 8px;
    font-size: 11px;
    height: 24px;
  }
}
</style>
