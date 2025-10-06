/**
 * @Description: 音频播放器逻辑 composable
 * @Author: 安知鱼
 * @Date: 2025-09-20 14:50:00
 */
import { ref, reactive, computed, watch, type Ref } from "vue";
import type { Song, AudioState } from "../types/music";
import { useMusicAPI } from "./useMusicAPI";

// 播放模式类型
type PlayMode = "sequence" | "shuffle" | "repeat";

export function useAudioPlayer(
  playlist: Ref<Song[]>,
  playMode?: Ref<PlayMode>
) {
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

  // 随机播放历史记录，避免重复播放相同歌曲
  const shuffleHistory = ref<number[]>([]);
  const MAX_SHUFFLE_HISTORY = 10; // 记录最近播放的10首歌

  // 生成随机索引（排除最近播放的歌曲）
  const generateRandomIndex = (currentIndex: number): number => {
    const playlistLength = playlist.value.length;
    if (playlistLength <= 1) return 0;

    // 获取可选择的索引（排除当前索引和最近播放的歌曲）
    const availableIndexes = Array.from(
      { length: playlistLength },
      (_, i) => i
    ).filter(index => {
      if (index === currentIndex) return false;
      if (playlistLength <= 5) return true; // 如果歌曲太少，不限制历史
      return !shuffleHistory.value.includes(index);
    });

    if (availableIndexes.length === 0) {
      // 如果没有可选择的，清空历史记录重新开始
      shuffleHistory.value = [];
      return (
        Array.from({ length: playlistLength }, (_, i) => i).filter(
          i => i !== currentIndex
        )[0] || 0
      );
    }

    const randomIndex = Math.floor(Math.random() * availableIndexes.length);
    return availableIndexes[randomIndex];
  };

  // 更新随机播放历史
  const updateShuffleHistory = (index: number) => {
    if (!playMode?.value || playMode.value !== "shuffle") return;

    shuffleHistory.value.push(index);
    if (shuffleHistory.value.length > MAX_SHUFFLE_HISTORY) {
      shuffleHistory.value.shift(); // 移除最旧的记录
    }
  };

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

  // 自动播放标记（用于歌曲切换后继续播放）
  const shouldAutoPlay = ref(false);

  // 标记当前歌曲是否已获取过资源（避免重复请求）
  const resourcesLoadedSongs = new Set<string>();

  // 正在进行的加载请求映射，防止重复请求
  const pendingRequests = new Map<string, Promise<any>>();

  // 音频加载状态
  const audioLoadingState = ref<{
    isLoading: boolean;
    loadingType: "metadata" | "full" | "idle";
    progress: number;
  }>({
    isLoading: false,
    loadingType: "idle",
    progress: 0
  });

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

    const songKey = `${song.neteaseId || song.id}`;

    // 检查是否已经获取过资源（除非强制重新加载）
    if (!forceReload && resourcesLoadedSongs.has(songKey)) {
      console.log(
        "🎵 [智能加载] 歌曲资源已存在，跳过重复获取 - 歌曲:",
        song.name
      );
      // 如果需要完整加载音频但当前音频未加载，则进行音频加载
      if (loadFullAudio && !isAudioLoaded.value) {
        audioLoadingState.value = {
          isLoading: true,
          loadingType: "full",
          progress: 0
        };
        const audioSuccess = await loadAudio(song);
        audioLoadingState.value = {
          isLoading: false,
          loadingType: "idle",
          progress: audioSuccess ? 100 : 0
        };
        return { success: audioSuccess, usingHighQuality: true };
      }
      return { success: true, usingHighQuality: true };
    }

    // 防止重复请求 - 检查是否已有相同的请求在进行中
    const requestKey = `${songKey}-${loadFullAudio ? "full" : "metadata"}-${forceReload}`;
    if (pendingRequests.has(requestKey)) {
      console.log("🎵 [智能加载] 相同请求正在进行中，等待结果...");
      return await pendingRequests.get(requestKey)!;
    }

    // 创建请求Promise并存储，防止重复请求
    const loadingPromise = (async () => {
      // 更新加载状态
      audioLoadingState.value = {
        isLoading: true,
        loadingType: loadFullAudio ? "full" : "metadata",
        progress: 0
      };

      let finalAudioUrl = "";
      let finalLyricsText = "";
      let usingHighQuality = false;

      try {
        // 第一步：尝试获取高质量资源（带超时机制）
        if (song.neteaseId) {
          console.log(
            "🎵 [智能加载] 尝试获取高质量资源 - 网易云ID:",
            song.neteaseId
          );

          // 更新进度：开始获取资源
          audioLoadingState.value.progress = 10;

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

              // 更新进度：资源获取成功
              audioLoadingState.value.progress = 50;

              console.log("🎵 [智能加载] ✅ 成功获取高质量资源:", {
                hasAudio: !!finalAudioUrl,
                hasLyrics: !!finalLyricsText,
                timeoutUsed: false
              });
            } else {
              // 静默降级 - 继续使用基础资源，用户无感知
              console.log("🎵 [智能加载] 降级到基础资源");

              // 如果有歌词数据，仍然使用
              if (highQualityResources.lyricsText) {
                finalLyricsText = highQualityResources.lyricsText;
              }
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

            // 更新进度：高质量资源获取失败，准备降级
            audioLoadingState.value.progress = 25;
          }
        } else {
          console.log("🎵 [智能加载] 跳过高质量资源获取（无网易云ID）");
          audioLoadingState.value.progress = 25;
        }

        // 第二步：如果高质量资源失败，使用基础资源（meting数据）
        if (!finalAudioUrl && song.url) {
          console.log("🎵 [智能加载] 降级使用基础资源 - 音频URL:", song.url);
          finalAudioUrl = song.url;
          usingHighQuality = false;

          // 更新进度：使用基础资源
          audioLoadingState.value.progress = 40;

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
          console.error(
            "🎵 [智能加载] ❌ 无任何可用音频资源 - 歌曲:",
            song.name
          );
          throw new Error("无任何可用音频资源");
        }

        // 第四步：加载音频
        audioLoadingState.value.progress = 60;
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
          audioLoadingState.value.progress = 80;
          success = await loadAudio(songWithResources);
        } else {
          audioLoadingState.value.progress = 90;
          success = await loadAudioMetadata(songWithResources);
        }

        if (!success) {
          throw new Error("音频加载失败");
        }

        // 第五步：更新状态和缓存
        audioLoadingState.value.progress = 95;

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

        // 更新最终进度
        audioLoadingState.value.progress = 100;

        return {
          success: true,
          usingHighQuality,
          lyricsText: finalLyricsText || undefined
        };
      } catch (error) {
        console.error("🎵 [智能加载] 加载过程中发生错误:", error);
        return {
          success: false,
          usingHighQuality: false,
          lyricsText: undefined
        };
      } finally {
        // 清理加载状态
        audioLoadingState.value = {
          isLoading: false,
          loadingType: "idle",
          progress: 0
        };
      }
    })();

    // 存储Promise以防止重复请求
    pendingRequests.set(requestKey, loadingPromise);

    try {
      const result = await loadingPromise;
      return result;
    } finally {
      // 清理pending request
      pendingRequests.delete(requestKey);
    }
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
      // 暂停播放
      audioRef.value.pause();
    } else {
      try {
        // 智能懒加载：只在用户主动播放时才加载完整音频
        if (!isAudioLoaded.value) {
          console.log("🎵 [播放控制] 用户主动播放，开始懒加载完整音频");

          // 检查是否有有效的音频URL
          if (!currentSong.value.url && !currentSong.value.neteaseId) {
            console.warn("🎵 [播放控制] 当前歌曲缺少播放资源，跳到下一首");
            setTimeout(() => {
              nextSong(true);
            }, 500);
            return;
          }

          isLoadingSong = true;
          const result = await loadSongWithResources(
            currentSong.value,
            true, // 加载完整音频
            false // 不强制重新加载，使用已缓存的资源
          );
          isLoadingSong = false;

          if (!result.success) {
            console.warn("🎵 [播放控制] 音频加载失败，尝试播放下一首");
            setTimeout(() => {
              nextSong(true);
            }, 500);
            return;
          }
        }

        // 尝试播放音频
        await audioRef.value.play();
        console.log("🎵 [播放控制] 音频播放成功");
      } catch (error) {
        console.error("🎵 [播放控制] 播放失败:", error);
        // 处理不支持的音频格式或其他播放错误，自动切换到下一首
        if (error instanceof DOMException) {
          if (
            error.name === "NotSupportedError" ||
            error.name === "NotAllowedError" ||
            error.name === "AbortError"
          ) {
            console.warn("🎵 [播放控制] 播放被阻止或格式不支持，跳到下一首");
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
    const wasPlaying = audioState.isPlaying;
    let prevIndex: number;

    // 根据播放模式决定上一首歌曲
    if (playMode?.value === "shuffle") {
      // 随机模式：随机选择一首歌
      prevIndex = generateRandomIndex(currentSongIndex.value);
      console.log("🔀 [随机模式] 上一首随机选择:", prevIndex);
    } else if (playMode?.value === "repeat") {
      // 单曲循环：保持当前歌曲
      prevIndex = currentSongIndex.value;
      console.log("🔁 [单曲循环] 重复当前歌曲:", prevIndex);
    } else {
      // 顺序播放模式
      prevIndex = currentSongIndex.value - 1;
      if (prevIndex < 0) {
        prevIndex = playlist.value.length - 1;
      }
      console.log("📋 [顺序播放] 上一首:", prevIndex);
    }

    // 切换到上一首歌曲
    currentSongIndex.value = prevIndex;
    const newSong = currentSong.value;

    // 更新随机播放历史
    updateShuffleHistory(prevIndex);

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

      // 如果失败，不做额外处理，让用户手动重试
    } catch (error) {
      console.error("🎵 [上一首] 处理失败:", error);
    }
  };

  // 下一首
  const nextSong = async (forcePlay: boolean = false) => {
    const wasPlaying = audioState.isPlaying || forcePlay;
    let nextIndex: number;

    // 根据播放模式决定下一首歌曲
    if (playMode?.value === "shuffle") {
      // 随机模式：随机选择一首歌
      nextIndex = generateRandomIndex(currentSongIndex.value);
      console.log("🔀 [随机模式] 下一首随机选择:", nextIndex);
    } else if (playMode?.value === "repeat") {
      // 单曲循环：保持当前歌曲
      nextIndex = currentSongIndex.value;
      console.log("🔁 [单曲循环] 重复当前歌曲:", nextIndex);
    } else {
      // 顺序播放模式
      nextIndex = currentSongIndex.value + 1;
      if (nextIndex >= playlist.value.length) {
        nextIndex = 0;
      }
      console.log("📋 [顺序播放] 下一首:", nextIndex);
    }

    // 切换到下一首歌曲
    currentSongIndex.value = nextIndex;
    const newSong = currentSong.value;

    // 更新随机播放历史
    updateShuffleHistory(nextIndex);

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

    // 设置自动播放标记，让 watch 在资源准备好后处理播放
    shouldAutoPlay.value = wasPlaying;

    if (wasPlaying) {
      console.log(
        "🎵 [下一首] 正在播放状态，设置自动播放标记，等待资源准备完成后自动播放"
      );
    } else {
      console.log("🎵 [下一首] 暂停状态，资源由 watch 自动获取");
      isAudioLoaded.value = false;
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

      // 智能加载策略：根据播放状态决定加载深度
      if (wasPlaying) {
        console.log("🎵 [歌曲切换] 正在播放状态，加载完整音频并自动播放");
        isLoadingSong = true;
        const result = await loadSongWithResources(
          newSong,
          true, // 加载完整音频
          false // 使用缓存的资源，不强制重新加载
        );
        isLoadingSong = false;

        if (result.success && audioRef.value) {
          try {
            await audioRef.value.play();
            console.log("🎵 [歌曲切换] 自动播放成功");
          } catch (error) {
            console.warn("🎵 [歌曲切换] 自动播放失败:", error);
          }
        } else {
          console.warn("🎵 [歌曲切换] 音频加载失败，尝试下一首");
          // 如果失败，尝试播放下一首可用的歌曲
          await tryNextAvailableSong(index, wasPlaying);
        }
      } else {
        // 暂停状态：只获取元数据和歌词，不加载完整音频
        console.log("🎵 [歌曲切换] 暂停状态，只获取元数据和歌词");

        // 先尝试快速获取元数据
        const result = await loadSongWithResources(
          newSong,
          false, // 只获取元数据
          false // 使用缓存的资源
        );

        if (!result.success) {
          console.warn("🎵 [歌曲切换] 元数据获取失败，使用基础数据");
          // 降级使用基础歌词
          if (newSong.lrc && !newSong.lrc.startsWith("http")) {
            currentLyricsText.value = newSong.lrc;
          }
        }

        // 标记为未完全加载，等待用户点击播放
        isAudioLoaded.value = false;
        console.log("🎵 [歌曲切换] 元数据准备完成，等待用户播放");
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
    console.log("🎵 [歌曲结束] 当前播放模式:", playMode?.value || "sequence");

    // 根据播放模式处理歌曲结束
    if (playMode?.value === "repeat") {
      // 单曲循环：重播当前歌曲
      console.log("🔁 [单曲循环] 歌曲结束，重播当前歌曲");
      if (audioRef.value) {
        audioRef.value.currentTime = 0;
        audioRef.value.play().catch(() => {
          console.warn("🎵 [单曲循环] 重播失败");
        });
      }
    } else {
      // 顺序播放或随机播放：播放下一首
      console.log("🎵 [歌曲结束] 播放下一首");
      nextSong(true);
    }
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

  // 监听当前歌曲变化，智能获取资源
  watch(
    currentSong,
    async (newSong, oldSong) => {
      // 避免重复处理同一首歌曲
      if (!newSong || (oldSong && newSong.id === oldSong.id)) {
        return;
      }

      console.log("🎵 [音频播放器] 检测到歌曲变化，智能获取资源:", {
        from: oldSong?.name || "无",
        to: newSong.name,
        neteaseId: newSong.neteaseId,
        hasBasicUrl: !!newSong.url
      });

      // 重置音频加载状态
      isAudioLoaded.value = false;

      // 智能资源获取策略：
      // 1. 如果有网易云ID，获取元数据和歌词（不加载完整音频）
      // 2. 如果只有基础URL，直接加载元数据
      // 3. 完整音频只在用户点击播放时才加载

      if (newSong.neteaseId) {
        try {
          // 根据是否需要自动播放决定加载策略
          const needAutoPlay = shouldAutoPlay.value;
          console.log(
            `🎵 [音频播放器] 获取歌曲资源，${needAutoPlay ? "完全加载（自动播放）" : "元数据加载"}`
          );

          const result = await loadSongWithResources(
            newSong,
            needAutoPlay, // 如果需要自动播放，则完全加载音频
            false // 不强制重新加载
          );

          if (result.success) {
            console.log("🎵 [音频播放器] 歌曲资源获取成功");

            // 如果需要自动播放且资源加载成功
            if (needAutoPlay && audioRef.value) {
              shouldAutoPlay.value = false; // 重置标记
              try {
                await audioRef.value.play();
                console.log("🎵 [音频播放器] 自动播放成功");
              } catch (error) {
                console.warn("🎵 [音频播放器] 自动播放失败:", error);
              }
            }
          } else {
            console.warn("🎵 [音频播放器] 歌曲资源获取失败，使用基础数据");
            shouldAutoPlay.value = false; // 重置标记
            // 使用基础歌词数据
            if (newSong.lrc && !newSong.lrc.startsWith("http")) {
              currentLyricsText.value = newSong.lrc;
            }
          }
        } catch (error) {
          console.error("🎵 [音频播放器] 歌曲资源获取异常:", error);
          shouldAutoPlay.value = false; // 重置标记
          // 降级使用基础歌词
          if (newSong.lrc && !newSong.lrc.startsWith("http")) {
            currentLyricsText.value = newSong.lrc;
          }
        }
      } else if (newSong.url) {
        // 只有基础URL的情况，直接加载元数据
        const needAutoPlay = shouldAutoPlay.value;
        console.log(
          `🎵 [音频播放器] 使用基础URL加载元数据${needAutoPlay ? "（自动播放）" : ""}`
        );
        try {
          const success = await loadAudioMetadata(newSong);
          if (success) {
            console.log("🎵 [音频播放器] 基础音频元数据加载成功");

            // 如果需要自动播放
            if (needAutoPlay && audioRef.value) {
              shouldAutoPlay.value = false; // 重置标记
              try {
                await audioRef.value.play();
                console.log("🎵 [音频播放器] 基础URL自动播放成功");
              } catch (error) {
                console.warn("🎵 [音频播放器] 基础URL自动播放失败:", error);
              }
            }
          } else {
            shouldAutoPlay.value = false; // 重置标记
          }
        } catch (error) {
          console.warn("🎵 [音频播放器] 基础音频元数据加载失败:", error);
          shouldAutoPlay.value = false; // 重置标记
        }

        // 处理基础歌词
        if (newSong.lrc && !newSong.lrc.startsWith("http")) {
          currentLyricsText.value = newSong.lrc;
        } else {
          currentLyricsText.value = "";
        }
      } else {
        console.warn("🎵 [音频播放器] 歌曲缺少播放资源，清空状态");
        shouldAutoPlay.value = false; // 重置标记
        // 清空相关状态
        currentLyricsText.value = "";
        audioState.duration = 0;
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
    audioLoadingState,

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
