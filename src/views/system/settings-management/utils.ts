/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-08-04 14:16:51
 * @LastEditTime: 2025-09-18 10:17:15
 * @LastEditors: 安知鱼
 */
// src/views/system/settings-management/utils.ts
import { set } from "lodash-es";
import type { SettingDescriptor } from "./settings.descriptor";

/**
 * 菜单数据标准化函数：确保菜单数据有正确的 type 字段
 */
export function normalizeMenuData(menuData: any[]): any[] {
  if (!Array.isArray(menuData)) return [];

  return menuData.map(menuItem => {
    // 如果已经有 type 字段，直接返回
    if (menuItem.type) {
      return menuItem;
    }

    // 根据数据结构推断菜单类型
    // 如果有 items 字段且不为空，判断为下拉菜单
    if (
      menuItem.items &&
      Array.isArray(menuItem.items) &&
      menuItem.items.length > 0
    ) {
      return {
        title: menuItem.title,
        type: "dropdown",
        items: menuItem.items
      };
    }

    // 如果有 path 或 icon 字段，判断为直接链接
    if (menuItem.path || menuItem.icon) {
      return {
        title: menuItem.title,
        type: "direct",
        path: menuItem.path || "#",
        icon: menuItem.icon || "anzhiyu-icon-link",
        isExternal: menuItem.isExternal || false
      };
    }

    // 默认情况下创建直接链接类型
    return {
      title: menuItem.title,
      type: "direct",
      path: "#",
      icon: "anzhiyu-icon-link",
      isExternal: false
    };
  });
}

/**
 * 根据描述符列表创建响应式的表单初始状态
 */
export function createInitialFormState(
  descriptors: SettingDescriptor[]
): Record<string, any> {
  const state = {};
  for (const desc of descriptors) {
    // 使用 lodash.set 安全地创建嵌套对象
    set(state, desc.frontendPath, desc.defaultValue);
  }
  return state;
}

/**
 * 根据描述符列表创建一个从 frontendPath 到完整描述符的 Map，方便快速查找
 */
export function createDescriptorMap(
  descriptors: SettingDescriptor[]
): Map<string, SettingDescriptor> {
  const map = new Map<string, SettingDescriptor>();
  for (const desc of descriptors) {
    map.set(desc.frontendPath, desc);
  }
  return map;
}

/**
 * 将从后端获取的值解析为前端表单所需类型
 */
export function parseBackendValue(
  value: any,
  type: SettingDescriptor["type"],
  backendKey?: string
) {
  if (value === null || value === undefined) {
    return value;
  }

  switch (type) {
    case "boolean":
      return value === "true" || value === true;
    case "number":
      return Number(value);
    case "json":
      if (typeof value === "object") {
        return processJsonValueForBackend(value, backendKey);
      }
      try {
        const parsed = JSON.parse(value);
        return processJsonValueForBackend(parsed, backendKey);
      } catch {
        // 解析失败时，返回合适的默认值
        return getDefaultValueForBackendKey(backendKey);
      }
    case "string":
    default:
      return String(value);
  }
}

/**
 * 检查配置键是否为需要标准化的主菜单类型
 * @param backendKey 后端配置键名
 * @param descriptors 可选的描述符列表，用于更精确的判断
 * @returns 是否为需要标准化的主菜单配置
 */
function isMainMenuConfig(
  backendKey?: string,
  descriptors?: SettingDescriptor[]
): boolean {
  if (!backendKey) return false;

  // 只有主菜单需要标准化处理，navMenuItems 不需要
  const mainMenuKeys = ["header.menu"];

  if (descriptors) {
    const descriptor = descriptors.find(desc => desc.backendKey === backendKey);
    if (descriptor) {
      // 精确匹配：只有主菜单配置需要标准化
      return mainMenuKeys.includes(descriptor.backendKey);
    }
  }

  // 后备方案：只处理主菜单
  return mainMenuKeys.includes(backendKey);
}

/**
 * 检查配置键是否为菜单类型（用于默认值判断）
 * @param backendKey 后端配置键名
 * @param descriptors 可选的描述符列表
 * @returns 是否为菜单配置
 */
function isAnyMenuConfig(
  backendKey?: string,
  descriptors?: SettingDescriptor[]
): boolean {
  if (!backendKey) return false;

  if (descriptors) {
    const descriptor = descriptors.find(desc => desc.backendKey === backendKey);
    if (descriptor) {
      return (
        descriptor.frontendPath.includes("menu") ||
        descriptor.frontendPath.includes("Menu")
      );
    }
  }

  return backendKey.includes("menu") || backendKey.includes("Menu");
}

/**
 * 从描述符列表中获取所有菜单类型的配置键
 * @param descriptors 描述符列表
 * @returns 菜单配置键的集合
 */
export function getMenuConfigKeys(
  descriptors: SettingDescriptor[]
): Set<string> {
  return new Set(
    descriptors
      .filter(
        desc =>
          desc.type === "json" &&
          (desc.frontendPath.includes("menu") ||
            desc.frontendPath.includes("Menu"))
      )
      .map(desc => desc.backendKey)
  );
}

/**
 * 处理从后端获取的JSON值
 * @param value 已解析的JSON值
 * @param backendKey 后端配置键名
 * @returns 处理后的值
 */
function processJsonValueForBackend(value: any, backendKey?: string): any {
  // 只有主菜单需要标准化处理，navMenuItems 等其他菜单配置不需要
  if (isMainMenuConfig(backendKey) && Array.isArray(value)) {
    return normalizeMenuData(value);
  }
  return value;
}

/**
 * 获取后端键对应的默认值
 * @param backendKey 后端配置键名
 * @returns 默认值
 */
function getDefaultValueForBackendKey(backendKey?: string): any {
  if (isAnyMenuConfig(backendKey)) {
    return [];
  }
  return {};
}

/**
 * 将前端表单中的值格式化为待保存的字符串
 */
export function formatValueForSave(
  value: any,
  type: SettingDescriptor["type"]
): string {
  if (value === null || value === undefined) {
    return "";
  }
  if (type === "json") {
    return JSON.stringify(value);
  }
  return String(value);
}

/**
 * 从描述符列表中获取所有JSON类型的配置键
 */
export function getJsonConfigKeys(
  descriptors: SettingDescriptor[]
): Set<string> {
  return new Set(
    descriptors
      .filter(desc => desc.type === "json")
      .map(desc => desc.backendKey)
  );
}

/**
 * 创建乐观更新的配置对象
 * @param settingsToUpdate 要更新的设置
 * @param descriptors 所有配置描述符
 * @returns 用于乐观更新的状态对象
 */
export function createOptimisticUpdate(
  settingsToUpdate: Record<string, any>,
  descriptors: SettingDescriptor[]
): Record<string, any> {
  const jsonConfigKeys = getJsonConfigKeys(descriptors);
  const optimisticState: Record<string, any> = {};

  for (const [key, value] of Object.entries(settingsToUpdate)) {
    if (typeof value === "string" && jsonConfigKeys.has(key)) {
      try {
        const parsed = JSON.parse(value);
        optimisticState[key] = processJsonValue(parsed, key, descriptors);
      } catch {
        // 解析失败时的处理
        optimisticState[key] = getDefaultValueForFailedJson(key, descriptors);
      }
    } else {
      optimisticState[key] = value;
    }
  }

  return optimisticState;
}

/**
 * 处理解析后的JSON值
 * @param parsed 解析后的值
 * @param key 配置键名
 * @param descriptors 可选的描述符列表
 * @returns 处理后的值
 */
function processJsonValue(
  parsed: any,
  key: string,
  descriptors?: SettingDescriptor[]
): any {
  // 只有主菜单需要标准化处理
  if (isMainMenuConfig(key, descriptors) && Array.isArray(parsed)) {
    return normalizeMenuData(parsed);
  }
  return parsed;
}

/**
 * 获取JSON解析失败时的默认值
 * @param key 配置键名
 * @param descriptors 可选的描述符列表
 * @returns 默认值
 */
function getDefaultValueForFailedJson(
  key: string,
  descriptors?: SettingDescriptor[]
): any {
  if (isAnyMenuConfig(key, descriptors)) {
    return [];
  }
  // 其他JSON配置解析失败时返回空对象或空数组
  return {};
}

/**
 * 验证JSON配置的有效性
 * @param value 要验证的值
 * @param backendKey 配置键名
 * @returns 验证结果
 */
export function validateJsonConfig(
  value: string,
  backendKey: string
): {
  isValid: boolean;
  error?: string;
  parsedValue?: any;
} {
  if (!value || typeof value !== "string") {
    return { isValid: true, parsedValue: null };
  }

  try {
    const parsed = JSON.parse(value);

    // 菜单配置的额外验证
    if (isAnyMenuConfig(backendKey) && !Array.isArray(parsed)) {
      return {
        isValid: false,
        error: "菜单配置必须是数组格式"
      };
    }

    return { isValid: true, parsedValue: parsed };
  } catch (error) {
    return {
      isValid: false,
      error: `JSON格式无效: ${error instanceof Error ? error.message : "未知错误"}`
    };
  }
}
