/**
 * @Description: 音乐API调用逻辑 composable
 * @Author: 安知鱼
 * @Date: 2025-09-20 15:05:00
 */
import { ref, computed } from "vue";
import type {
  Song,
  MusicApiResponse,
  LyricApiResponse,
  HighQualityMusicData
} from "../types/music";
import { useSiteConfigStore } from "../store/modules/siteConfig";

export function useMusicAPI() {
  // 获取站点配置
  const siteConfigStore = useSiteConfigStore();

  // API相关常量和配置
  const HIGH_QUALITY_MUSIC_API = "https://api.toubiec.cn/wyapi/getMusicUrl.php";
  const HIGH_QUALITY_LYRIC_API = "https://api.toubiec.cn/wyapi/getLyric.php";
  const MAX_RETRY_COUNT = 3;
  const RETRY_DELAY = 1000; // 1秒

  // 从后端配置获取播放列表ID，如果没有则使用默认值
  const playlistId = computed(() => {
    return (
      siteConfigStore.getSiteConfig.music?.player?.playlist_id ||
      siteConfigStore.getSiteConfig["music.player.playlist_id"] ||
      siteConfigStore.getSiteConfig["MUSIC_PLAYER_PLAYLIST_ID"] ||
      "8152976493"
    ); // 默认值作为后备
  });

  // 动态构建播放列表API URL
  const PLAYLIST_API = computed(
    () =>
      `https://meting.qjqq.cn/?server=netease&type=playlist&id=${playlistId.value}`
  );

  // 加载状态
  const isLoading = ref(false);

  // 缓存机制：避免重复请求同一资源
  const musicUrlCache = new Map<string, string>();
  const lyricsCache = new Map<string, string>();
  const CACHE_EXPIRE_TIME = 10 * 60 * 1000; // 10分钟缓存过期时间
  const cacheTimestamps = new Map<string, number>();

  // 检查缓存是否过期
  const isCacheValid = (key: string): boolean => {
    const timestamp = cacheTimestamps.get(key);
    if (!timestamp) return false;
    return Date.now() - timestamp < CACHE_EXPIRE_TIME;
  };

  // 设置缓存
  const setCache = (type: "music" | "lyrics", key: string, value: string) => {
    const cache = type === "music" ? musicUrlCache : lyricsCache;
    cache.set(key, value);
    cacheTimestamps.set(`${type}_${key}`, Date.now());
  };

  // 获取缓存
  const getCache = (type: "music" | "lyrics", key: string): string | null => {
    const cacheKey = `${type}_${key}`;
    if (!isCacheValid(cacheKey)) {
      // 清理过期缓存
      const cache = type === "music" ? musicUrlCache : lyricsCache;
      cache.delete(key);
      cacheTimestamps.delete(cacheKey);
      return null;
    }
    const cache = type === "music" ? musicUrlCache : lyricsCache;
    return cache.get(key) || null;
  };

  // 验证歌曲数据
  const isValidSong = (song: any): boolean => {
    return (
      song &&
      typeof song.name === "string" &&
      typeof song.artist === "string" &&
      typeof song.url === "string" &&
      song.url.trim().length > 0
    );
  };

  // 网络请求重试函数
  const fetchWithRetry = async (
    url: string,
    retries = MAX_RETRY_COUNT
  ): Promise<Response> => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response;
    } catch (error) {
      if (retries > 0) {
        console.warn(
          `请求失败，${RETRY_DELAY}ms后重试。剩余重试次数: ${retries}`,
          error
        );
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return fetchWithRetry(url, retries - 1);
      }
      throw error;
    }
  };

  // 获取歌单数据
  const fetchPlaylist = async (): Promise<Song[]> => {
    try {
      isLoading.value = true;
      console.log("🎵 使用播放列表ID:", playlistId.value);
      const response = await fetchWithRetry(
        `${PLAYLIST_API.value}&r=${Math.random()}`
      );
      const data = await response.json();

      if (Array.isArray(data) && data.length > 0) {
        // 调试：打印原始数据结构
        console.log("原始歌单数据示例:", data.slice(0, 2));

        // 验证和过滤有效歌曲
        const validSongs = data.filter(isValidSong);

        if (validSongs.length === 0) {
          throw new Error("没有找到有效的歌曲数据");
        }

        const mappedPlaylist = validSongs.map((song: any, index: number) => {
          // 从URL中提取网易云音乐ID
          let neteaseId = "";
          if (song.url) {
            const urlMatch = song.url.match(/[?&]id=(\d+)/);
            if (urlMatch) {
              neteaseId = urlMatch[1];
            }
          }
          // 如果URL中没有找到，尝试从歌词链接中提取
          if (!neteaseId && song.lrc) {
            const lrcMatch = song.lrc.match(/[?&]id=(\d+)/);
            if (lrcMatch) {
              neteaseId = lrcMatch[1];
            }
          }

          const mappedSong: Song = {
            id: index.toString(),
            neteaseId: neteaseId, // 网易云音乐ID，从URL中提取
            name: song.name || "未知歌曲",
            artist: song.artist || "未知艺术家",
            url: song.url,
            pic: song.pic || "",
            lrc: song.lrc || ""
          };

          // 调试：打印每首歌的网易云ID
          if (index < 3) {
            console.log(`歌曲 ${index + 1} - ${mappedSong.name}:`, {
              原始URL: song.url,
              提取的网易云ID: mappedSong.neteaseId,
              有网易云ID: !!mappedSong.neteaseId
            });
          }

          return mappedSong;
        });

        console.log("歌单加载成功", mappedPlaylist.length, "首歌曲");
        return mappedPlaylist;
      } else {
        console.error("歌单数据为空或格式错误");
        return [];
      }
    } catch (error) {
      console.error("获取歌单失败:", error);
      return [];
    } finally {
      isLoading.value = false;
    }
  };

  // 获取歌词
  const fetchLyrics = async (lrcUrl: string): Promise<string> => {
    try {
      const response = await fetchWithRetry(lrcUrl);
      const lrcText = await response.text();

      if (!lrcText || lrcText.trim().length === 0) {
        console.warn("歌词内容为空");
        return "";
      }

      console.log("歌词加载成功");
      return lrcText;
    } catch (error) {
      console.error("获取歌词失败:", error);
      return "";
    }
  };

  // 获取高质量音频URL
  const fetchHighQualityMusicUrl = async (
    neteaseId: string
  ): Promise<string | null> => {
    try {
      // 检查缓存
      const cachedUrl = getCache("music", neteaseId);
      if (cachedUrl) {
        console.log("🎵 使用缓存的高质量音频URL:", neteaseId);
        return cachedUrl;
      }

      console.log("🎵 请求高质量音频API:", neteaseId);
      const url = `${HIGH_QUALITY_MUSIC_API}?id=${neteaseId}&level=lossless`;
      const response = await fetchWithRetry(url);
      const data: MusicApiResponse = await response.json();

      if (data.code === 200 && data.data && data.data.length > 0) {
        const musicData = data.data[0] as HighQualityMusicData;
        if (musicData.url && musicData.url.trim().length > 0) {
          console.log("高质量音频获取成功:", {
            id: musicData.id,
            level: musicData.level,
            br: musicData.br,
            size: musicData.size,
            duration: musicData.duration
          });

          // 缓存结果
          setCache("music", neteaseId, musicData.url);

          return musicData.url;
        }
      }

      console.warn("高质量音频API返回无效数据:", data);
      return null;
    } catch (error) {
      console.error("获取高质量音频失败:", error);
      return null;
    }
  };

  // 获取高质量歌词
  const fetchHighQualityLyrics = async (
    neteaseId: string
  ): Promise<string | null> => {
    try {
      // 检查缓存
      const cachedLyrics = getCache("lyrics", neteaseId);
      if (cachedLyrics) {
        console.log("🎤 使用缓存的高质量歌词:", neteaseId);
        return cachedLyrics;
      }

      console.log("🎤 请求高质量歌词API:", neteaseId);
      const url = `${HIGH_QUALITY_LYRIC_API}?id=${neteaseId}`;
      const response = await fetchWithRetry(url);
      const data: LyricApiResponse = await response.json();

      if (data.code === 200 && data.data && data.data.lrc) {
        const lrcText = data.data.lrc;
        if (lrcText && lrcText.trim().length > 0) {
          console.log("高质量歌词获取成功");

          // 缓存结果
          setCache("lyrics", neteaseId, lrcText);

          return lrcText;
        }
      }

      console.warn("高质量歌词API返回无效数据:", data);
      return null;
    } catch (error) {
      console.error("获取高质量歌词失败:", error);
      return null;
    }
  };

  // 请求去重：防止同时对同一首歌发起多个相同请求
  const pendingRequests = new Map<
    string,
    Promise<{ audioUrl: string; lyricsText: string; usingHighQuality: boolean }>
  >();

  // 获取歌曲的音频和歌词资源
  const fetchSongResources = async (
    song: Song
  ): Promise<{
    audioUrl: string;
    lyricsText: string;
    usingHighQuality: boolean;
  }> => {
    const requestKey = `${song.neteaseId || song.id}_${song.name}`;

    // 检查是否已有相同的请求正在进行中
    if (pendingRequests.has(requestKey)) {
      console.log("🔄 检测到重复请求，使用正在进行的请求:", song.name);
      return await pendingRequests.get(requestKey)!;
    }

    // 创建新的请求
    const resourcePromise = (async () => {
      try {
        let finalAudioUrl = song.url;
        let finalLyricsText = "";
        let usingHighQuality = false;

        // 首先尝试使用新API获取高质量音频和歌词
        if (song.neteaseId) {
          console.log("✨ 获取高质量资源:", song.name, "ID:", song.neteaseId);

          // 并行获取音频和歌词（而不是串行），提高效率
          const [highQualityUrl, highQualityLyrics] = await Promise.allSettled([
            fetchHighQualityMusicUrl(song.neteaseId),
            fetchHighQualityLyrics(song.neteaseId)
          ]);

          // 处理音频结果
          if (highQualityUrl.status === "fulfilled" && highQualityUrl.value) {
            finalAudioUrl = highQualityUrl.value;
            usingHighQuality = true;
            console.log("✅ 高质量音频获取成功");
          } else {
            console.log("⚠️ 高质量音频获取失败，使用原始URL");
          }

          // 处理歌词结果
          if (
            highQualityLyrics.status === "fulfilled" &&
            highQualityLyrics.value
          ) {
            finalLyricsText = highQualityLyrics.value;
            console.log("✅ 高质量歌词获取成功");
          } else if (song.lrc) {
            console.log("⚠️ 高质量歌词获取失败，使用原始歌词URL");
            finalLyricsText = await fetchLyrics(song.lrc);
          }
        } else {
          console.log("ℹ️ 没有网易云ID，直接使用原始资源");
          if (song.lrc) {
            finalLyricsText = await fetchLyrics(song.lrc);
          }
        }

        return {
          audioUrl: finalAudioUrl,
          lyricsText: finalLyricsText,
          usingHighQuality
        };
      } finally {
        // 请求完成后清理
        pendingRequests.delete(requestKey);
      }
    })();

    // 存储并返回请求
    pendingRequests.set(requestKey, resourcePromise);
    return await resourcePromise;
  };

  return {
    // 状态
    isLoading,

    // 方法
    fetchPlaylist,
    fetchLyrics,
    fetchHighQualityMusicUrl,
    fetchHighQualityLyrics,
    fetchSongResources,

    // 工具函数
    isValidSong,
    fetchWithRetry
  };
}
