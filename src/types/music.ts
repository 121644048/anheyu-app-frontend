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

export interface LyricApiResponse {
  code: number;
  data: {
    lrc: string;
  };
}

// 高质量音频数据接口
export interface HighQualityMusicData {
  id: string;
  url: string;
  level: string;
  br: number;
  size: number;
  duration: number;
}
