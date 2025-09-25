/**
 * @Description: 音频播放器逻辑 composable
 * @Author: 安知鱼
 * @Date: 2025-09-20 14:50:00
 */
import { ref, reactive, computed, watch, type Ref } from "vue";
import type { Song, AudioState } from "../types/music";
import { useMusicAPI } from "./useMusicAPI";

export function useAudioPlayer(playlist: Ref<Song[]>) {
  // 音频引用
  const audioRef = ref<HTMLAudioElement>();

  // 音乐API实例
  const musicAPI = useMusicAPI();

  // 当前播放索引
  const currentSongIndex = ref(0);

  // 当前歌词文本
  const currentLyricsText = ref<string>("");

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
  const currentSong = computed(() => {
    const song = playlist.value[currentSongIndex.value];
    return song;
  });
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

  // 当前加载状态标记，防止同时加载多个歌曲
  let isLoadingSong = false;

  // 是否已加载音频
  const isAudioLoaded = ref(false);

  // 标记当前歌曲是否已获取过资源（避免重复请求）
  const resourcesLoadedSongs = new Set<string>();

  // 加载音频资源
  const loadAudio = async (song: Song): Promise<boolean> => {
    if (!audioRef.value || !song.url) {
      return false;
    }

    try {
      // 强制停止所有音频播放，防止多个音频同时播放
      audioRef.value.pause();
      audioRef.value.currentTime = 0;

      // 清空当前源，防止后台继续加载
      audioRef.value.src = "";
      audioRef.value.load();

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

        // 监听元数据加载事件
        const onLoadedMetadata = () => {
          if (audio) {
            audioState.duration = audio.duration || 0;
          }
        };

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
          audio.removeEventListener("loadedmetadata", onLoadedMetadata);
          audio.removeEventListener("canplay", onCanPlay);
          audio.removeEventListener("error", onError);
        };

        // 添加事件监听器
        audio.addEventListener("loadedmetadata", onLoadedMetadata);
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
        isAudioLoaded.value = true;
        consecutiveFailures = 0; // 重置失败计数器
        return true;
      }

      return false;
    } catch {
      return false;
    }
  };

  // 只加载音频元数据（获取时长等信息）但不完全加载音频
  const loadAudioMetadata = async (song: Song): Promise<boolean> => {
    if (!audioRef.value || !song.url) {
      return false;
    }

    try {
      // 暂停当前播放但不清空源
      audioRef.value.pause();
      audioRef.value.currentTime = 0;

      // 如果是同一个源，不需要重新加载
      if (audioRef.value.src === song.url && audioState.duration > 0) {
        console.log("🎵 [元数据加载] 音频源未变化且已有时长，跳过加载");
        return true;
      }

      // 创建Promise来监听元数据加载
      const metadataLoadPromise = new Promise<boolean>((resolve, reject) => {
        const audio = audioRef.value;
        if (!audio) {
          reject(new Error("音频元素未初始化"));
          return;
        }

        // 设置超时时间（5秒，只需要元数据）
        const timeout = setTimeout(() => {
          reject(new Error("音频元数据加载超时"));
        }, 5000);

        // 监听元数据加载事件
        const onLoadedMetadata = () => {
          if (audio) {
            audioState.duration = audio.duration || 0;
            console.log(
              "🎵 [元数据加载] 音频元数据加载完成，时长:",
              formatTime(audio.duration || 0)
            );
          }
          clearTimeout(timeout);
          cleanup();
          resolve(true);
        };

        // 监听错误事件
        const onError = () => {
          console.warn("🎵 [元数据加载] 音频元数据加载失败");
          clearTimeout(timeout);
          cleanup();
          reject(new Error("音频元数据加载失败"));
        };

        const cleanup = () => {
          audio.removeEventListener("loadedmetadata", onLoadedMetadata);
          audio.removeEventListener("error", onError);
        };

        // 添加事件监听器
        audio.addEventListener("loadedmetadata", onLoadedMetadata);
        audio.addEventListener("error", onError);

        // 开始加载音频
        audio.src = song.url;
        audio.preload = "metadata"; // 只预加载元数据
        safeSetVolume(audioState.volume);
        audio.load();
      });

      // 等待元数据加载完成
      return await metadataLoadPromise;
    } catch (error) {
      console.warn("🎵 [元数据加载] 加载失败:", error);
      return false;
    }
  };

  // 格式化时间显示
  const formatTime = (seconds: number): string => {
    if (!seconds || seconds === 0) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // 智能加载歌曲资源 - 优先高质量，失败时降级到基础资源
  const loadSongWithResources = async (
    song: Song,
    loadFullAudio: boolean = false,
    forceReload: boolean = false
  ): Promise<{
    success: boolean;
    usingHighQuality: boolean;
    lyricsText?: string;
  }> => {
    if (!song) {
      console.error("🎵 [智能加载] 歌曲对象为空");
      return { success: false, usingHighQuality: false };
    }

    // 检查是否已经获取过资源（除非强制重新加载）
    const songKey = `${song.neteaseId || song.id}`;
    if (!forceReload && resourcesLoadedSongs.has(songKey)) {
      console.log(
        "🎵 [智能加载] 歌曲资源已存在，跳过重复获取 - 歌曲:",
        song.name
      );
      return { success: true, usingHighQuality: true }; // 假设已缓存的是高质量资源
    }

    let finalAudioUrl = "";
    let finalLyricsText = "";
    let usingHighQuality = false;

    // 第一步：尝试获取高质量资源（带超时机制）
    if (song.neteaseId) {
      console.log(
        "🎵 [智能加载] 尝试获取高质量资源 - 网易云ID:",
        song.neteaseId
      );
      try {
        // 设置8秒超时，音质优先但不让用户等待太久
        const timeout = 8000;
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("高质量资源获取超时")), timeout)
        );

        console.log(`🎵 [智能加载] 设置${timeout / 1000}秒超时机制`);

        const highQualityResources = await Promise.race([
          musicAPI.fetchSongResources(song),
          timeoutPromise
        ]);

        if (highQualityResources.audioUrl) {
          finalAudioUrl = highQualityResources.audioUrl;
          finalLyricsText = highQualityResources.lyricsText || "";
          usingHighQuality = true;
          console.log("🎵 [智能加载] ✅ 成功获取高质量资源:", {
            hasAudio: !!finalAudioUrl,
            hasLyrics: !!finalLyricsText,
            timeoutUsed: false
          });
        }
      } catch (error) {
        const isTimeout =
          error instanceof Error && error.message.includes("超时");
        console.warn(
          `🎵 [智能加载] ⚠️ 高质量资源获取${isTimeout ? "超时" : "失败"}:`,
          error
        );
        if (isTimeout) {
          console.log("🎵 [智能加载] 网络较慢，自动降级到基础资源");
        }
      }
    } else {
      console.log("🎵 [智能加载] 跳过高质量资源获取（无网易云ID）");
    }

    // 第二步：如果高质量资源失败，使用基础资源（meting数据）
    if (!finalAudioUrl && song.url) {
      console.log("🎵 [智能加载] 降级使用基础资源 - 音频URL:", song.url);
      finalAudioUrl = song.url;
      usingHighQuality = false;

      // 处理基础歌词：检查是否为URL格式
      if (song.lrc) {
        if (song.lrc.startsWith("http")) {
          console.log(
            "🎵 [智能加载] 检测到歌词URL，尝试获取歌词内容:",
            song.lrc
          );
          try {
            // 为基础歌词获取设置5秒超时
            const lyricsTimeout = 5000;
            const timeoutPromise = new Promise<never>((_, reject) =>
              setTimeout(
                () => reject(new Error("基础歌词获取超时")),
                lyricsTimeout
              )
            );

            console.log(
              `🎵 [智能加载] 基础歌词请求设置${lyricsTimeout / 1000}秒超时`
            );

            const lyricsResponse = await Promise.race([
              fetch(song.lrc),
              timeoutPromise
            ]);

            if (lyricsResponse.ok) {
              finalLyricsText = await lyricsResponse.text();
              console.log(
                "🎵 [智能加载] ✅ 成功获取基础歌词，长度:",
                finalLyricsText.length
              );
            } else {
              console.warn(
                "🎵 [智能加载] ⚠️ 基础歌词URL请求失败:",
                lyricsResponse.status
              );
              finalLyricsText = "";
            }
          } catch (error) {
            const isTimeout =
              error instanceof Error && error.message.includes("超时");
            console.warn(
              `🎵 [智能加载] ⚠️ 获取基础歌词${isTimeout ? "超时" : "失败"}:`,
              error
            );
            finalLyricsText = "";
          }
        } else {
          // 直接是歌词内容
          finalLyricsText = song.lrc;
          console.log(
            "🎵 [智能加载] 使用基础歌词内容，长度:",
            finalLyricsText.length
          );
        }
      } else {
        finalLyricsText = "";
        console.log("🎵 [智能加载] 无基础歌词数据");
      }
    }

    // 第三步：检查是否有可用资源
    if (!finalAudioUrl) {
      console.error("🎵 [智能加载] ❌ 无任何可用音频资源 - 歌曲:", song.name);
      return { success: false, usingHighQuality: false };
    }

    // 第四步：加载音频
    console.log("🎵 [智能加载] 开始加载音频:", {
      audioUrl: finalAudioUrl,
      quality: usingHighQuality ? "高质量" : "基础",
      loadFullAudio
    });

    const songWithResources: Song = {
      ...song,
      url: finalAudioUrl
    };

    let success = false;
    if (loadFullAudio) {
      success = await loadAudio(songWithResources);
    } else {
      success = await loadAudioMetadata(songWithResources);
    }

    // 第五步：更新状态和缓存
    if (success) {
      // 更新播放列表中的URL（如果使用的是高质量资源）
      if (usingHighQuality) {
        const songIndex = playlist.value.findIndex(
          s => s.neteaseId === song.neteaseId || s.id === song.id
        );
        if (songIndex !== -1) {
          playlist.value[songIndex].url = finalAudioUrl;
          console.log("🎵 [智能加载] 已更新播放列表中的高质量音频URL");
        }
      }

      // 更新当前歌词
      currentLyricsText.value = finalLyricsText;
      console.log("🎵 [智能加载] 歌词更新:", {
        hasLyrics: !!finalLyricsText,
        length: finalLyricsText.length,
        quality: usingHighQuality ? "高质量" : "基础"
      });

      // 标记该歌曲资源已获取
      resourcesLoadedSongs.add(songKey);
      console.log("🎵 [智能加载] ✅ 资源加载完成:", {
        song: song.name,
        quality: usingHighQuality ? "高质量" : "基础",
        hasLyrics: !!finalLyricsText
      });
    }

    return {
      success,
      usingHighQuality,
      lyricsText: finalLyricsText || undefined
    };
  };

  // 播放指定歌曲
  const playSong = async (
    index: number,
    shouldLoadAudio: boolean = false
  ): Promise<boolean> => {
    if (index < 0 || index >= playlist.value.length) {
      return false;
    }

    // 防止同时加载多个歌曲
    if (isLoadingSong) {
      return false;
    }

    try {
      currentSongIndex.value = index;
      const song = currentSong.value;

      if (!song.neteaseId) {
        console.warn("🎵 [播放歌曲] 歌曲缺少网易云ID，无法播放");
        return false;
      }

      if (audioRef.value) {
        audioRef.value.pause();
        audioRef.value.currentTime = 0;
      }
      audioState.currentTime = 0;
      audioState.duration = 0;
      console.log("🎵 [切换歌曲] 播放进度已重置到 0:00");

      if (shouldLoadAudio) {
        isLoadingSong = true;
        const success = await loadAudio(song);
        if (!success) {
          return false;
        }
      } else {
        // 只是切换歌曲，不加载音频
        isAudioLoaded.value = false;
      }

      return true;
    } catch {
      return false;
    } finally {
      isLoadingSong = false; // 无论成功还是失败，都要重置加载状态
    }
  };

  // 播放控制
  const togglePlay = async () => {
    if (!audioRef.value || !currentSong.value) return;

    if (audioState.isPlaying) {
      audioRef.value.pause();
    } else {
      try {
        // 懒加载：如果音频还未加载，先获取高质量资源再加载播放
        if (!isAudioLoaded.value) {
          console.log("🎵 [播放控制] 懒加载模式，先获取高质量资源再加载音频");
          isLoadingSong = true;
          const result = await loadSongWithResources(
            currentSong.value,
            true,
            true
          );
          isLoadingSong = false;

          if (!result.success) {
            // 加载失败，尝试播放下一首
            setTimeout(() => {
              nextSong(true);
            }, 500);
            return;
          }
        }

        await audioRef.value.play();
      } catch (error) {
        // 处理不支持的音频格式或其他播放错误，自动切换到下一首
        if (error instanceof DOMException) {
          if (
            error.name === "NotSupportedError" ||
            error.name === "NotAllowedError" ||
            error.name === "AbortError"
          ) {
            setTimeout(() => {
              nextSong(true); // 强制播放下一首
            }, 500);
          }
        }
      }
    }
  };

  // 上一首
  const previousSong = async () => {
    if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
      return;
    }

    const wasPlaying = audioState.isPlaying;
    let prevIndex = currentSongIndex.value - 1;
    if (prevIndex < 0) {
      prevIndex = playlist.value.length - 1;
    }

    // 切换到上一首歌曲
    currentSongIndex.value = prevIndex;
    const newSong = currentSong.value;

    if (!newSong?.url) {
      console.warn("🎵 [上一首] 歌曲没有有效的URL");
      return;
    }

    // 重置状态
    if (audioRef.value) {
      audioRef.value.pause();
      audioRef.value.currentTime = 0;
    }
    audioState.currentTime = 0;
    audioState.duration = 0;

    try {
      let success = false;

      if (wasPlaying) {
        // 如果正在播放，先获取高质量资源再完全加载音频
        console.log("🎵 [上一首] 正在播放状态，先获取高质量资源再完全加载音频");
        const result = await loadSongWithResources(newSong, true, true);
        success = result.success;

        if (success && audioRef.value) {
          try {
            await audioRef.value.play();
          } catch {
            console.warn("🎵 [上一首] 自动播放失败");
          }
        }
      } else {
        // 如果暂停状态，先获取高质量资源再只加载元数据
        console.log("🎵 [上一首] 暂停状态，先获取高质量资源再加载元数据");
        const result = await loadSongWithResources(newSong, false, true);
        success = result.success;
        isAudioLoaded.value = false;
      }

      if (!success) {
        consecutiveFailures++;
        if (consecutiveFailures < MAX_CONSECUTIVE_FAILURES) {
          setTimeout(() => previousSong(), 1000);
        }
      } else {
        consecutiveFailures = 0;
      }
    } catch (error) {
      console.error("🎵 [上一首] 处理失败:", error);
    }
  };

  // 下一首
  const nextSong = async (forcePlay: boolean = false) => {
    if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
      return;
    }

    const wasPlaying = audioState.isPlaying || forcePlay;
    let nextIndex = currentSongIndex.value + 1;
    if (nextIndex >= playlist.value.length) {
      nextIndex = 0;
    }

    // 切换到下一首歌曲
    currentSongIndex.value = nextIndex;
    const newSong = currentSong.value;

    if (!newSong?.url) {
      console.warn("🎵 [下一首] 歌曲没有有效的URL");
      return;
    }

    // 重置状态
    if (audioRef.value) {
      audioRef.value.pause();
      audioRef.value.currentTime = 0;
    }
    audioState.currentTime = 0;
    audioState.duration = 0;

    try {
      let success = false;

      if (wasPlaying) {
        // 如果正在播放或强制播放，先获取高质量资源再完全加载音频
        console.log("🎵 [下一首] 正在播放状态，先获取高质量资源再完全加载音频");
        const result = await loadSongWithResources(newSong, true, true);
        success = result.success;

        if (success && audioRef.value) {
          try {
            await audioRef.value.play();
          } catch {
            console.warn("🎵 [下一首] 自动播放失败");
          }
        }
      } else {
        // 如果暂停状态，先获取高质量资源再只加载元数据
        console.log("🎵 [下一首] 暂停状态，先获取高质量资源再加载元数据");
        const result = await loadSongWithResources(newSong, false, true);
        success = result.success;
        isAudioLoaded.value = false;
      }

      if (!success) {
        consecutiveFailures++;
        if (consecutiveFailures < MAX_CONSECUTIVE_FAILURES) {
          setTimeout(() => nextSong(forcePlay), 1000);
        }
      } else {
        consecutiveFailures = 0;
      }
    } catch (error) {
      console.error("🎵 [下一首] 处理失败:", error);
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
  const seek = (time: number) => {
    if (!audioRef.value || !audioState.duration) return;

    // 确保时间在有效范围内
    const targetTime = Math.max(0, Math.min(time, audioState.duration));
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
      // 切换到新歌曲，总是先切换索引
      currentSongIndex.value = index;
      const newSong = currentSong.value;

      if (!newSong?.url) {
        console.warn("🎵 [歌曲切换] 歌曲没有有效的URL");
        return;
      }

      // 重置状态
      if (audioRef.value) {
        audioRef.value.pause();
        audioRef.value.currentTime = 0;
      }
      audioState.currentTime = 0;
      audioState.duration = 0;
      console.log("🎵 [歌曲切换] 播放进度已重置到 0:00");

      // 根据播放状态加载歌曲资源
      if (wasPlaying) {
        console.log(
          "🎵 [歌曲切换] 正在播放状态，先获取高质量资源再完全加载音频"
        );
        isLoadingSong = true;
        const result = await loadSongWithResources(newSong, true, true);
        isLoadingSong = false;

        if (result.success && audioRef.value) {
          try {
            await audioRef.value.play();
          } catch {
            console.warn("🎵 [歌曲切换] 自动播放失败");
          }
        } else {
          console.warn("🎵 [歌曲切换] 音频加载失败，尝试下一首");
          // 如果失败，尝试播放下一首可用的歌曲
          await tryNextAvailableSong(index, wasPlaying);
        }
      } else {
        // 如果当前没有播放，先获取高质量资源再只加载元数据
        console.log("🎵 [歌曲切换] 暂停状态，先获取高质量资源再加载元数据");
        const result = await loadSongWithResources(newSong, false, true);
        if (!result.success) {
          console.warn("🎵 [歌曲切换] 元数据加载失败");
          // 即使元数据加载失败，也不强制切换到下一首，让用户决定
        }
        isAudioLoaded.value = false; // 标记为未完全加载
      }
    } catch (error) {
      console.error("🎵 [歌曲切换] 处理失败:", error);
    } finally {
      loadingPlaylistItem.value = -1;
    }
  };

  // 尝试加载下一首可用歌曲的辅助方法
  const tryNextAvailableSong = async (
    startIndex: number,
    shouldPlay: boolean
  ) => {
    let fallbackIndex = startIndex + 1;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts && fallbackIndex < playlist.value.length) {
      loadingPlaylistItem.value = fallbackIndex;
      currentSongIndex.value = fallbackIndex;
      const fallbackSong = currentSong.value;

      if (fallbackSong?.neteaseId) {
        const result = await loadSongWithResources(
          fallbackSong,
          shouldPlay,
          true
        );

        if (result.success) {
          if (shouldPlay && audioRef.value) {
            try {
              await audioRef.value.play();
            } catch {
              console.warn("🎵 [备选歌曲] 自动播放失败");
            }
          }
          console.log(`🎵 [歌曲切换] 成功加载备选歌曲，索引: ${fallbackIndex}`);
          return;
        }
      }

      fallbackIndex++;
      attempts++;
    }

    if (attempts >= maxAttempts) {
      console.warn("🎵 [歌曲切换] 所有备选歌曲都无法播放");
    }
  };

  // 音频事件处理
  const onLoadStart = () => {
    // 开始加载音频
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
    // 歌曲结束时强制播放下一首，不依赖当前播放状态
    nextSong(true);
  };

  const onError = (_error: Event) => {
    audioState.isPlaying = false;

    // 错误处理：尝试播放下一首歌曲
    setTimeout(() => {
      if (playlist.value.length > 1) {
        nextSong(true); // 强制播放下一首
      }
    }, 1000);
  };

  // 存储事件监听器引用，用于清理
  let playListener: (() => void) | null = null;
  let pauseListener: (() => void) | null = null;

  // 监听当前歌曲变化，自动获取资源
  watch(
    currentSong,
    async (newSong, oldSong) => {
      // 避免重复处理同一首歌曲
      if (!newSong || (oldSong && newSong.id === oldSong.id)) {
        return;
      }

      console.log("🎵 [音频播放器] 检测到歌曲变化，获取资源:", {
        from: oldSong?.name || "无",
        to: newSong.name,
        neteaseId: newSong.neteaseId
      });

      // 如果有网易云ID，获取资源但不加载音频（只获取歌词）
      if (newSong.neteaseId) {
        try {
          const result = await loadSongWithResources(newSong, false);
          if (result.success) {
            console.log("🎵 [音频播放器] 歌曲资源获取成功");
          } else {
            console.warn("🎵 [音频播放器] 歌曲资源获取失败");
          }
        } catch (error) {
          console.error("🎵 [音频播放器] 歌曲资源获取异常:", error);
        }
      } else {
        console.warn("🎵 [音频播放器] 歌曲缺少网易云ID，无法获取资源");
        // 清空歌词
        currentLyricsText.value = "";
      }
    },
    { immediate: true }
  );

  // 监听播放状态
  watch(
    () => audioRef.value,
    (audio, oldAudio) => {
      // 清理旧的事件监听器
      if (oldAudio && playListener && pauseListener) {
        oldAudio.removeEventListener("play", playListener);
        oldAudio.removeEventListener("pause", pauseListener);
      }

      if (audio) {
        // 创建新的事件监听器
        playListener = () => {
          audioState.isPlaying = true;
        };

        pauseListener = () => {
          audioState.isPlaying = false;
        };

        audio.addEventListener("play", playListener);
        audio.addEventListener("pause", pauseListener);
      }
    },
    { immediate: true }
  );

  // 清理函数
  const cleanup = () => {
    if (audioRef.value && playListener && pauseListener) {
      audioRef.value.removeEventListener("play", playListener);
      audioRef.value.removeEventListener("pause", pauseListener);
    }
  };

  return {
    // 状态
    audioRef,
    currentSongIndex,
    currentLyricsText,
    audioState,
    loadedPercentage,
    loadingPlaylistItem,
    isAudioLoaded,

    // 计算属性
    currentSong,
    playedPercentage,

    // 方法
    playSong,
    loadAudio,
    loadAudioMetadata,
    loadSongWithResources,
    togglePlay,
    previousSong,
    nextSong,
    toggleMute,
    setVolume,
    seek,
    handlePlaylistItemClick,
    formatTime,

    // 事件处理
    onLoadStart,
    onLoadedMetadata,
    onTimeUpdate,
    onEnded,
    onError,

    // 清理方法
    cleanup
  };
}
