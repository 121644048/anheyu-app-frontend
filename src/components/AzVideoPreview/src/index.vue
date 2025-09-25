<template>
  <Teleport to="body">
    <Transition name="az-fade">
      <div v-if="visible" class="az-video-preview-overlay" @click.self="close">
        <div class="video-container">
          <!-- 关闭按钮 -->
          <span class="close-btn" @click="close">&times;</span>

          <!-- XGPlayer 播放器的挂载点 -->
          <div id="xgplayer-container" ref="playerContainerRef" />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from "vue";
// 懒加载 xgplayer，避免影响首屏性能
let Player: any = null;

const visible = ref(false);
const playerContainerRef = ref<HTMLElement | null>(null);
let playerInstance: any = null; // 用于存储播放器实例

// 打开预览的方法
const open = async (url: string) => {
  visible.value = true;
  // 等待 DOM 更新完成，确保挂载点元素存在
  await nextTick();
  // 初始化播放器
  await initPlayer(url);
};

// 初始化 XGPlayer
const initPlayer = async (url: string) => {
  // 懒加载 xgplayer
  if (!Player) {
    const xgplayerModule = await import("xgplayer");
    await import("xgplayer/dist/index.min.css");
    Player = xgplayerModule.default;
  }

  if (!playerContainerRef.value) {
    console.error("XGPlayer container not found.");
    return;
  }

  // 如果已有实例，先销毁
  if (playerInstance) {
    playerInstance.destroy();
  }

  // 创建新实例
  playerInstance = new Player({
    id: "xgplayer-container", // 确保 ID 与模板中的 ID 一致
    url: url,
    fluid: true, // 流体布局，自适应容器宽高
    autoplay: true, // 自动播放
    // 更多配置项可以参考 xgplayer 官方文档
    // 例如：https://v2.h5player.bytedance.com/config/
    poster: "", // 视频封面
    playbackRate: [0.5, 0.75, 1, 1.5, 2], // 播放速度
    defaultPlaybackRate: 1 // 默认播放速度
  });
};

// 关闭预览的方法
const close = () => {
  visible.value = false;
  // 销毁播放器实例，释放资源
  if (playerInstance) {
    playerInstance.destroy();
    playerInstance = null;
  }
};

// 监听 visible 变化，控制 body 滚动
watch(visible, newVal => {
  if (newVal) {
    document.body.style.overflow = "hidden";
  } else {
    // 确保在关闭动画完成后再恢复滚动条，避免闪烁
    setTimeout(() => {
      document.body.style.overflow = "";
    }, 300); // 300ms 对应 transition 的时长
  }
});

// 暴露 open 和 close 方法给父组件
defineExpose({ open, close });
</script>

<style scoped lang="scss">
/* 样式与之前版本保持一致，但需要为播放器容器设置一个明确的大小 */
.az-fade-enter-active,
.az-fade-leave-active {
  transition: opacity 0.3s ease;
}

.az-fade-enter-from,
.az-fade-leave-to {
  opacity: 0;
}

.az-video-preview-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgb(0 0 0 / 80%);
  backdrop-filter: blur(10px);
}

.video-container {
  position: relative;
  width: 80vw;
  max-width: 1200px;

  /* 使用 aspect-ratio 来保持视频比例，例如 16:9 */
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background-color: #000;
  border-radius: 8px;
  box-shadow: 0 10px 30px rgb(0 0 0 / 50%);
}

/* 播放器挂载点必须撑满容器 */
#xgplayer-container {
  width: 100%;
  height: 100%;
}

.close-btn {
  position: absolute;
  top: 10px;
  right: 15px;
  z-index: 10;
  font-size: 2rem;
  font-weight: bold;
  color: white;
  text-shadow: 0 0 5px rgb(0 0 0 / 50%);
  cursor: pointer;
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.2);
  }
}
</style>
