<!--
 * @Description: 专辑封面组件
 * @Author: 安知鱼
 * @Date: 2025-09-20 15:15:00
-->
<template>
  <div
    class="album-cover"
    :style="{
      backgroundImage: imageUrl ? `url('${imageUrl}')` : 'none'
    }"
    :class="{ playing: isPlaying }"
  />
</template>

<script setup lang="ts">
interface Props {
  imageUrl?: string;
  isPlaying?: boolean;
}

withDefaults(defineProps<Props>(), {
  imageUrl: "",
  isPlaying: false
});
</script>

<style scoped lang="scss">
.album-cover {
  position: absolute;
  left: 5px;
  top: 5px;
  width: 30px;
  height: 30px;
  border-radius: 15px;
  background-size: cover;
  background-position: center;
  background-color: rgba(255, 255, 255, 0.1);
  border: var(--style-border-always);
  border-color: transparent;
  flex-shrink: 0;
  transition: all 0.4s ease;
  z-index: 2;
  cursor: pointer;
  animation: coverRotate 8s linear infinite paused;

  // 播放状态的封面动画
  &.playing {
    box-shadow: rgba(255, 255, 255, 0.46) 0px 0px 5.67781px 0px;
    animation-play-state: running;
  }
}

// 封面旋转动画
@keyframes coverRotate {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
