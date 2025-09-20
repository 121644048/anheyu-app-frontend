/**
 * 主题类型枚举
 */
export type ThemeType = "community" | "pro";

/**
 * 主题对象类型定义（与后端ThemeInfo结构匹配）
 */
export interface Theme {
  /** 主题唯一标识符 */
  id: number;
  /** 主题名称 */
  name: string;
  /** 主题作者 */
  author: string;
  /** 主题描述 */
  description: string;
  /** 主题类型 */
  themeType: ThemeType;
  /** GitHub仓库地址（社区版） */
  repoUrl: string;
  /** 说明地址（PRO版） */
  instructionUrl: string;
  /** 价格分（PRO版） */
  price: number;
  /** 下载链接（社区版显示，PRO版隐藏） */
  downloadUrl: string;
  /** 主题标签数组 */
  tags: string[];
  /** 预览图片URL */
  previewUrl: string;
  /** 在线演示地址 */
  demoUrl: string;
  /** 版本号 */
  version: string;
  /** 下载次数 */
  downloadCount: number;
  /** 评分 (0-5) */
  rating: number;
  /** 是否为官方主题 */
  isOfficial: boolean;
  /** 是否已激活 */
  isActive: boolean;
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;

  // 本地状态字段（已安装主题特有）
  /** 是否为当前使用的主题 */
  is_current?: boolean;
  /** 是否已安装 */
  is_installed?: boolean;
  /** 安装时间 */
  install_time?: string;
  /** 用户自定义配置 */
  user_config?: Record<string, any>;
  /** 已安装版本 */
  installed_version?: string;
}

/**
 * 主题安装请求参数
 */
export interface ThemeInstallRequest {
  /** 主题名称 */
  theme_name: string;
  /** 下载链接 */
  download_url: string;
  /** 主题商城ID（可选） */
  theme_market_id?: number;
}

/**
 * 主题切换请求参数
 */
export interface ThemeSwitchRequest {
  /** 主题名称 */
  theme_name: string;
}

/**
 * 主题卸载请求参数
 */
export interface ThemeUninstallRequest {
  /** 主题名称 */
  theme_name: string;
}

/**
 * 主题上传响应数据
 */
export interface ThemeUploadResponse {
  /** 主题名称 */
  theme_name: string;
  /** 主题详细信息 */
  theme_info: Theme;
  /** 是否安装成功 */
  installed: boolean;
  /** 响应消息 */
  message: string;
}

/**
 * 主题验证结果
 */
export interface ThemeValidationResult {
  /** 是否验证通过 */
  is_valid: boolean;
  /** 错误信息列表 */
  errors: string[];
  /** 警告信息列表 */
  warnings: string[];
  /** 主题元信息 */
  metadata?: any;
  /** 文件列表 */
  file_list: string[];
  /** 文件总大小 */
  total_size: number;
  /** 已存在的主题信息（如果有重复主题） */
  existing_theme?: Theme;
}

/**
 * 主题列表请求参数
 */
export interface ThemeListParams {
  /** 页码，从1开始 */
  page?: number;
  /** 每页数量 */
  limit?: number;
  /** 搜索关键词（支持主题名称、作者、描述模糊匹配） */
  search?: string;
  /** 标签过滤 */
  tags?: string;
  /** 主题类型过滤 */
  themeType?: ThemeType | string;
}

/**
 * 主题列表响应数据
 */
export interface ThemeListData {
  /** 主题数组 */
  list: Theme[];
  /** 总数量 */
  total: number;
}

/**
 * API 响应格式
 */
export interface ThemeListResponse {
  /** 响应状态码 */
  code: number;
  /** 响应消息 */
  message: string;
  /** 响应数据 */
  data: ThemeListData | null;
}
