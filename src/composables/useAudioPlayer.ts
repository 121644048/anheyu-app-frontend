/**
 * @Description: 音频播放器逻辑 composable
 * @Author: 安知鱼
 * @Date: 2025-09-20 14:50:00
 */
import { ref, reactive, computed, watch, type Ref } from "vue";
import type { Song, AudioState } from "../types/music";

export function useAudioPlayer(playlist: Ref<Song[]>) {
  // 音频引用
  const audioRef = ref<HTMLAudioElement>();

  // 当前播放索引
  const currentSongIndex = ref(0);

  // 音频状态
  const audioState = reactive<AudioState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.7,
    isMuted: false
  });

  // 加载相关状态
  const loadedPercentage = ref(0);
  const loadingPlaylistItem = ref(-1);

  // 播放失败重试计数器
  let consecutiveFailures = 0;
  const MAX_CONSECUTIVE_FAILURES = 3;

  // 计算属性
  const currentSong = computed(() => playlist.value[currentSongIndex.value]);
  const playedPercentage = computed(() => {
    return audioState.duration > 0
      ? (audioState.currentTime / audioState.duration) * 100
      : 0;
  });

  // 安全设置音量
  const safeSetVolume = (volume: number): void => {
    if (audioRef.value) {
      const clampedVolume = Math.max(0, Math.min(1, volume));
      audioRef.value.volume = audioState.isMuted ? 0 : clampedVolume;
    }
  };

  // 播放指定歌曲
  const playSong = async (index: number): Promise<boolean> => {
    if (index < 0 || index >= playlist.value.length) {
      console.error("歌曲索引超出范围:", index);
      return false;
    }

    currentSongIndex.value = index;
    const song = currentSong.value;

    if (!song.url) {
      console.error("无法获取歌曲播放链接:", song);
      return false;
    }

    try {
      console.log("开始加载歌曲:", song.name, "by", song.artist);

      if (audioRef.value) {
        // 先停止当前播放
        audioRef.value.pause();
        audioRef.value.currentTime = 0;

        // 创建Promise来监听音频加载结果
        const audioLoadPromise = new Promise<boolean>((resolve, reject) => {
          const audio = audioRef.value;
          if (!audio) {
            reject(new Error("音频元素未初始化"));
            return;
          }

          // 设置超时时间（10秒）
          const timeout = setTimeout(() => {
            reject(new Error("音频加载超时"));
          }, 10000);

          // 监听成功事件
          const onCanPlay = () => {
            clearTimeout(timeout);
            cleanup();
            resolve(true);
          };

          // 监听错误事件
          const onError = (event: Event) => {
            clearTimeout(timeout);
            cleanup();
            const error = (event.target as HTMLAudioElement)?.error;
            let errorMessage = "音频加载失败";

            if (error) {
              switch (error.code) {
                case MediaError.MEDIA_ERR_ABORTED:
                  errorMessage = "音频加载被中止";
                  break;
                case MediaError.MEDIA_ERR_NETWORK:
                  errorMessage = "网络错误导致音频加载失败";
                  break;
                case MediaError.MEDIA_ERR_DECODE:
                  errorMessage = "音频解码失败";
                  break;
                case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
                  errorMessage = "不支持的音频格式或源";
                  break;
                default:
                  errorMessage = `音频加载失败 (错误代码: ${error.code})`;
              }
            }

            reject(new Error(errorMessage));
          };

          // 清理事件监听器
          const cleanup = () => {
            audio.removeEventListener("canplay", onCanPlay);
            audio.removeEventListener("error", onError);
          };

          // 添加事件监听器
          audio.addEventListener("canplay", onCanPlay);
          audio.addEventListener("error", onError);

          // 开始加载音频
          audio.src = song.url;
          safeSetVolume(audioState.volume);
          audio.load();
        });

        // 等待音频加载完成
        const success = await audioLoadPromise;
        if (success) {
          consecutiveFailures = 0; // 重置失败计数器
          console.log("歌曲加载完成:", song.name);
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error("播放歌曲失败:", error);
      return false;
    }
  };

  // 播放控制
  const togglePlay = async () => {
    if (!audioRef.value || !currentSong.value) return;

    if (audioState.isPlaying) {
      audioRef.value.pause();
    } else {
      try {
        await audioRef.value.play();
      } catch (error) {
        console.error("播放失败:", error);

        // 处理不支持的音频格式或其他播放错误，自动切换到下一首
        if (error instanceof DOMException) {
          if (
            error.name === "NotSupportedError" ||
            error.name === "NotAllowedError" ||
            error.name === "AbortError"
          ) {
            console.log("检测到不支持的音频源或播放被阻止，自动切换到下一首");
            setTimeout(() => {
              nextSong();
            }, 500);
          }
        }
      }
    }
  };

  // 上一首
  const previousSong = async () => {
    if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
      console.error("连续播放失败次数过多，停止自动切换");
      return;
    }

    const wasPlaying = audioState.isPlaying;
    let nextIndex = currentSongIndex.value - 1;
    if (nextIndex < 0) {
      nextIndex = playlist.value.length - 1;
    }

    const success = await playSong(nextIndex);
    if (!success) {
      consecutiveFailures++;
      console.error(
        `播放上一首歌曲失败 (连续失败: ${consecutiveFailures}/${MAX_CONSECUTIVE_FAILURES})`
      );

      if (consecutiveFailures < MAX_CONSECUTIVE_FAILURES) {
        setTimeout(() => previousSong(), 1000);
      }
    } else {
      consecutiveFailures = 0;

      if (wasPlaying && audioRef.value) {
        try {
          await audioRef.value.play();
          console.log("自动开始播放上一首歌曲");
        } catch (error) {
          console.error("自动播放失败:", error);
        }
      }
    }
  };

  // 下一首
  const nextSong = async () => {
    if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
      console.error("连续播放失败次数过多，停止自动切换");
      return;
    }

    const wasPlaying = audioState.isPlaying;
    let nextIndex = currentSongIndex.value + 1;
    if (nextIndex >= playlist.value.length) {
      nextIndex = 0;
    }

    const success = await playSong(nextIndex);
    if (!success) {
      consecutiveFailures++;
      console.error(
        `播放下一首歌曲失败 (连续失败: ${consecutiveFailures}/${MAX_CONSECUTIVE_FAILURES})`
      );

      if (consecutiveFailures < MAX_CONSECUTIVE_FAILURES) {
        setTimeout(() => nextSong(), 1000);
      }
    } else {
      consecutiveFailures = 0;

      if (wasPlaying && audioRef.value) {
        try {
          await audioRef.value.play();
          console.log("自动开始播放下一首歌曲");
        } catch (error) {
          console.error("自动播放失败:", error);
        }
      }
    }
  };

  // 切换静音
  const toggleMute = () => {
    audioState.isMuted = !audioState.isMuted;
    safeSetVolume(audioState.volume);
  };

  // 设置音量
  const setVolume = (volume: number) => {
    audioState.volume = Math.max(0, Math.min(1, volume));
    audioState.isMuted = false;
    safeSetVolume(audioState.volume);
  };

  // 进度控制
  const seek = (percentage: number) => {
    if (!audioRef.value || !audioState.duration) return;

    const targetTime = percentage * audioState.duration;
    audioRef.value.currentTime = targetTime;
    audioState.currentTime = targetTime;
  };

  // 播放列表项点击
  const handlePlaylistItemClick = async (index: number) => {
    if (loadingPlaylistItem.value !== -1) {
      return;
    }

    if (index === currentSongIndex.value) {
      togglePlay();
      return;
    }

    loadingPlaylistItem.value = index;
    const wasPlaying = audioState.isPlaying;

    try {
      console.log(
        `用户选择播放第${index + 1}首歌曲: ${playlist.value[index]?.name}`
      );

      const success = await playSong(index);
      if (success) {
        if (wasPlaying && audioRef.value) {
          try {
            await audioRef.value.play();
            console.log("自动开始播放选中的歌曲");
          } catch (error) {
            console.error("自动播放失败:", error);
          }
        }
        console.log(`成功切换到: ${playlist.value[index]?.name}`);
      } else {
        console.error("播放选中歌曲失败:", playlist.value[index]?.name);
        // 如果失败，尝试播放下一首可用的歌曲
        let fallbackIndex = index + 1;
        let attempts = 0;
        const maxAttempts = 3;

        while (
          attempts < maxAttempts &&
          fallbackIndex < playlist.value.length
        ) {
          console.log(
            `尝试播放备选歌曲 ${fallbackIndex + 1}: ${playlist.value[fallbackIndex]?.name}`
          );

          loadingPlaylistItem.value = fallbackIndex;
          const fallbackSuccess = await playSong(fallbackIndex);

          if (fallbackSuccess) {
            console.log(
              `成功播放备选歌曲: ${playlist.value[fallbackIndex]?.name}`
            );
            if (wasPlaying && audioRef.value) {
              try {
                await audioRef.value.play();
              } catch (error) {
                console.error("备选歌曲自动播放失败:", error);
              }
            }
            break;
          }

          fallbackIndex++;
          attempts++;
        }

        if (attempts >= maxAttempts) {
          console.error("所有备选歌曲都无法播放");
        }
      }
    } catch (error) {
      console.error("播放列表点击处理失败:", error);
    } finally {
      loadingPlaylistItem.value = -1;
    }
  };

  // 音频事件处理
  const onLoadStart = () => {
    console.log("开始加载音频");
  };

  const onLoadedMetadata = () => {
    if (audioRef.value) {
      audioState.duration = audioRef.value.duration || 0;
    }
  };

  const onTimeUpdate = () => {
    if (audioRef.value) {
      audioState.currentTime = audioRef.value.currentTime;

      // 更新加载进度
      if (audioRef.value.buffered.length > 0) {
        const bufferedEnd = audioRef.value.buffered.end(
          audioRef.value.buffered.length - 1
        );
        loadedPercentage.value =
          audioState.duration > 0
            ? (bufferedEnd / audioState.duration) * 100
            : 0;
      }
    }
  };

  const onEnded = () => {
    nextSong();
  };

  const onError = (error: Event) => {
    console.error("音频播放错误:", error);
    audioState.isPlaying = false;

    // 错误处理：尝试播放下一首歌曲
    setTimeout(() => {
      if (playlist.value.length > 1) {
        console.log("由于播放错误，自动切换到下一首");
        nextSong();
      }
    }, 1000);
  };

  // 监听播放状态
  watch(
    () => audioRef.value,
    audio => {
      if (audio) {
        audio.addEventListener("play", () => {
          audioState.isPlaying = true;
        });

        audio.addEventListener("pause", () => {
          audioState.isPlaying = false;
        });
      }
    },
    { immediate: true }
  );

  return {
    // 状态
    audioRef,
    currentSongIndex,
    audioState,
    loadedPercentage,
    loadingPlaylistItem,

    // 计算属性
    currentSong,
    playedPercentage,

    // 方法
    playSong,
    togglePlay,
    previousSong,
    nextSong,
    toggleMute,
    setVolume,
    seek,
    handlePlaylistItemClick,

    // 事件处理
    onLoadStart,
    onLoadedMetadata,
    onTimeUpdate,
    onEnded,
    onError
  };
}
