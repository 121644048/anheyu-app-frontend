/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-09-18 16:28:43
 * @LastEditTime: 2025-09-18 16:35:10
 * @LastEditors: 安知鱼
 */
import { http } from "@/utils/http";
import type {
  ThemeListResponse,
  ThemeListParams,
  ThemeUploadResponse,
  ThemeValidationResult,
  Theme
} from "./type";

/**
 * 主题商城 API
 */
export const themeMallApi = {
  /**
   * 获取主题列表（调用本地后端API，后端会获取外部主题商城数据）
   */
  getThemes: (params?: ThemeListParams): Promise<ThemeListResponse> => {
    return http.get("/api/public/theme/market", params);
  },

  /**
   * 检查静态模式状态
   */
  checkStaticMode: (): Promise<{
    code: number;
    message: string;
    data: { is_active: boolean };
  }> => {
    return http.get("/api/public/theme/static-mode");
  },

  /**
   * 获取当前主题信息（需要登录）
   */
  getCurrentTheme: (): Promise<{
    code: number;
    message: string;
    data: Theme;
  }> => {
    return http.get("/api/theme/current");
  },

  /**
   * 获取已安装主题列表（需要登录）
   */
  getInstalledThemes: (): Promise<{
    code: number;
    message: string;
    data: Theme[];
  }> => {
    return http.get("/api/theme/installed");
  },

  /**
   * 安装主题（需要登录）
   */
  installTheme: (data: {
    theme_name: string;
    download_url: string;
    theme_market_id?: number;
  }): Promise<{
    code: number;
    message: string;
    data: any;
  }> => {
    return http.post("/api/theme/install", data);
  },

  /**
   * 切换主题（需要登录）
   */
  switchTheme: (data: {
    theme_name: string;
  }): Promise<{
    code: number;
    message: string;
    data: any;
  }> => {
    return http.post("/api/theme/switch", data);
  },

  /**
   * 切换到官方主题（需要登录）
   */
  switchToOfficial: (): Promise<{
    code: number;
    message: string;
    data: any;
  }> => {
    return http.post("/api/theme/official");
  },

  /**
   * 卸载主题（需要登录）
   */
  uninstallTheme: (data: {
    theme_name: string;
  }): Promise<{
    code: number;
    message: string;
    data: any;
  }> => {
    return http.post("/api/theme/uninstall", data);
  },

  /**
   * 上传主题压缩包（需要登录）
   */
  uploadTheme: (
    file: File,
    forceUpdate: boolean = false
  ): Promise<{
    code: number;
    message: string;
    data: ThemeUploadResponse;
  }> => {
    const formData = new FormData();
    formData.append("file", file);
    if (forceUpdate) {
      formData.append("force_update", "true");
    }

    return http.post("/api/theme/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data"
      } as any
    });
  },

  /**
   * 验证主题压缩包（需要登录）
   */
  validateTheme: (
    file: File
  ): Promise<{
    code: number;
    message: string;
    data: ThemeValidationResult;
  }> => {
    const formData = new FormData();
    formData.append("file", file);

    return http.post("/api/theme/validate", formData, {
      headers: {
        "Content-Type": "multipart/form-data"
      } as any
    });
  }
};
