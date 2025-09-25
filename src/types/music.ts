/**
 * @Description: 音乐播放器相关类型定义
 * @Author: 安知鱼
 * @Date: 2025-09-20 14:55:00
 */

// 歌曲接口
export interface Song {
  id?: string;
  neteaseId?: string; // 网易云音乐歌曲ID，用于新API调用
  name: string;
  artist: string;
  url: string;
  pic: string;
  lrc: string;
}

// 歌词行接口
export interface LyricLine {
  time: number;
  text: string;
}

// 音频状态接口
export interface AudioState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
}

// 歌词状态接口
export interface LyricsState {
  currentIndex: number;
  translateY: number;
  shouldScroll: boolean[];
}

// 颜色缓存接口
export interface ColorCache {
  [key: string]: string;
}

// API响应接口
export interface MusicApiResponse {
  code: number;
  data: any[];
}

// 歌词API响应接口
export interface LyricApiResponse {
  code: number;
  data: {
    lrc: string;
    tlyric?: string; // 翻译歌词（可选）
    romalrc?: string; // 罗马音歌词（可选）
  };
}

// 支持的歌词输入格式类型
export type LyricInput =
  | string // 纯LRC文本
  | LyricApiResponse // 网易云API格式
  | { lrc: string } // 简化对象格式
  | { lyric: string } // 其他可能的格式
  | { data: { lrc: string } }; // 嵌套对象格式

// 高质量音频数据接口
export interface HighQualityMusicData {
  id: string;
  url: string;
  level: string;
  br: number;
  size: number;
  duration: number;
}
