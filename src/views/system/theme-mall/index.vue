<!--
 * @Description: 主题商城
 * @Author: 安知鱼
 * @Date: 2025-09-18 14:31:11
 * @LastEditTime: 2025-09-19 11:34:25
 * @LastEditors: 安知鱼
-->
<template>
  <div class="theme-mall">
    <!-- 页面标题 -->
    <div class="header-section">
      <h1 class="page-title">主题商城</h1>
      <p class="page-description">发现并下载精美的主题</p>

      <!-- 操作按钮区域 -->
      <div class="header-actions">
        <el-button
          type="primary"
          :icon="Upload"
          @click="showUploadDialog = true"
        >
          上传主题
        </el-button>
        <el-button :icon="Refresh" @click="refreshThemes"> 刷新 </el-button>
      </div>
    </div>

    <!-- 标签页切换 -->
    <div class="tabs-section">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="主题商城" name="market">
          <template #label>
            <span class="tab-label">
              <el-icon><Shop /></el-icon>
              主题商城
            </span>
          </template>
        </el-tab-pane>
        <el-tab-pane label="已安装主题" name="installed">
          <template #label>
            <span class="tab-label">
              <el-icon><Collection /></el-icon>
              已安装主题
            </span>
          </template>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 主题列表 -->
    <div class="theme-list-section">
      <div v-loading="loading" class="loading-container">
        <!-- 空状态 -->
        <el-empty
          v-if="
            !loading && (!currentThemeList || currentThemeList.length === 0)
          "
          :description="
            activeTab === 'installed'
              ? '暂无已安装主题'
              : searchParams.search
                ? '没有找到匹配的主题'
                : '暂无主题数据'
          "
          :image-size="200"
        >
          <el-button type="primary" @click="refreshThemes">重新加载</el-button>
        </el-empty>

        <!-- 主题网格 -->
        <div v-else class="theme-grid">
          <div
            v-for="theme in currentThemeList"
            :key="theme.id || theme.name"
            class="theme-card"
            :class="{ 'current-theme': theme.is_current }"
          >
            <!-- 主题预览图 -->
            <div class="theme-preview">
              <img
                v-if="theme.previewUrl"
                :src="theme.previewUrl"
                :alt="theme.name"
                class="preview-image"
                @error="handleImageError"
              />
              <div v-else class="preview-placeholder">
                <el-icon class="placeholder-icon"><Picture /></el-icon>
              </div>

              <!-- 标识层 -->
              <div class="badge-layer">
                <!-- 官方标识 -->
                <div v-if="theme.isOfficial" class="official-badge">
                  <el-icon class="badge-icon"><TrophyBase /></el-icon>
                  <span>官方认证</span>
                </div>
                <!-- 主题类型标识 -->
                <div
                  class="theme-type-badge"
                  :class="`type-${theme.themeType}`"
                >
                  <span v-if="theme.themeType === 'pro'">专业版</span>
                </div>
              </div>
            </div>

            <!-- 主题信息 -->
            <div class="theme-info">
              <div class="theme-header">
                <h3 class="theme-title">{{ theme.name }}</h3>
                <p class="theme-author">by {{ theme.author }}</p>
              </div>

              <p class="theme-description">
                {{ theme.description || "暂无描述" }}
              </p>

              <!-- 标签 -->
              <div
                v-if="theme.tags && theme.tags.length > 0"
                class="theme-tags"
              >
                <el-tag
                  v-for="tag in (theme.tags || []).slice(0, 3)"
                  :key="tag"
                  size="small"
                  type="info"
                  effect="plain"
                  class="tag-item"
                >
                  {{ tag }}
                </el-tag>
                <span v-if="(theme.tags || []).length > 3" class="more-tags">
                  +{{ (theme.tags || []).length - 3 }}
                </span>
              </div>

              <!-- 统计信息 -->
              <div class="theme-stats">
                <span class="stat-item">
                  <el-icon><Download /></el-icon>
                  {{ formatNumber(theme.downloadCount) }}
                </span>
                <span v-if="theme.rating > 0" class="stat-item">
                  <el-rate
                    v-model="theme.rating"
                    disabled
                    show-score
                    text-color="var(--el-text-color-secondary)"
                    size="small"
                  />
                </span>
                <span class="stat-item version"> @{{ theme.version }} </span>
              </div>

              <!-- 价格信息 -->
              <div
                v-if="theme.themeType === 'pro' && theme.price"
                class="theme-price"
              >
                <span class="price-label">价格：</span>
                <span class="price-value">¥{{ formatPrice(theme.price) }}</span>
              </div>

              <!-- 操作按钮 -->
              <div class="theme-actions">
                <!-- 已安装主题的操作按钮 -->
                <template v-if="activeTab === 'installed'">
                  <!-- 当前主题 -->
                  <template v-if="theme.is_current">
                    <el-button
                      type="success"
                      class="action-main current-btn"
                      disabled
                    >
                      <el-icon><Check /></el-icon>
                      当前主题
                    </el-button>
                  </template>
                  <!-- 其他已安装主题 -->
                  <template v-else>
                    <el-button
                      type="primary"
                      class="action-main"
                      :loading="switchingTheme === theme.name"
                      :disabled="switchingTheme !== null"
                      @click="switchToTheme(theme)"
                    >
                      <el-icon v-if="switchingTheme !== theme.name"
                        ><Star
                      /></el-icon>
                      {{
                        switchingTheme === theme.name ? "启用中..." : "启用主题"
                      }}
                    </el-button>
                    <el-button
                      type="danger"
                      class="action-secondary"
                      @click="confirmUninstallTheme(theme)"
                    >
                      <el-icon><Delete /></el-icon>
                    </el-button>
                  </template>

                  <!-- 通用演示按钮 -->
                  <el-button
                    v-if="theme.demoUrl"
                    class="action-secondary"
                    @click="openDemo(theme.demoUrl)"
                  >
                    <el-icon><View /></el-icon>
                  </el-button>
                </template>

                <!-- 主题商城的操作按钮 -->
                <template v-else>
                  <!-- 社区版按钮 -->
                  <template v-if="theme.themeType === 'community'">
                    <el-button
                      v-if="theme.downloadUrl"
                      type="primary"
                      class="action-main"
                      @click="installTheme(theme)"
                    >
                      <el-icon><Download /></el-icon>
                      安装主题
                    </el-button>
                    <el-button
                      v-else-if="theme.repoUrl"
                      type="primary"
                      class="action-main"
                      @click="openRepo(theme.repoUrl)"
                    >
                      <el-icon><Link /></el-icon>
                      查看源码
                    </el-button>
                  </template>

                  <!-- 专业版按钮 -->
                  <template v-else-if="theme.themeType === 'pro'">
                    <el-button
                      type="primary"
                      class="action-main pro-action"
                      @click="buyTheme(theme)"
                    >
                      <el-icon><Money /></el-icon>
                      购买主题
                    </el-button>
                    <el-button
                      v-if="theme.instructionUrl"
                      class="action-secondary"
                      @click="viewInstructions(theme.instructionUrl)"
                    >
                      <el-icon><ArrowRight /></el-icon>
                    </el-button>
                  </template>

                  <!-- 通用演示按钮 -->
                  <el-button
                    v-if="theme.demoUrl"
                    class="action-secondary"
                    @click="openDemo(theme.demoUrl)"
                  >
                    <el-icon><View /></el-icon>
                  </el-button>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <div
      v-if="themeData?.total && themeData.total > searchParams.limit!"
      class="pagination-section"
    >
      <el-pagination
        v-model:current-page="searchParams.page"
        v-model:page-size="searchParams.limit"
        :total="themeData.total"
        :page-sizes="[10, 20, 30, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        class="pagination"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 主题上传对话框 -->
    <el-dialog
      v-model="showUploadDialog"
      title="上传主题"
      width="600px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <div class="upload-dialog-content">
        <!-- 上传说明 -->
        <div class="upload-instructions">
          <h3>上传要求</h3>
          <ul>
            <li>文件格式：ZIP压缩包</li>
            <li>文件大小：不超过50MB</li>
            <li>必须包含：theme.json、index.html、static/目录</li>
            <li>主题名称必须以"theme-"开头</li>
          </ul>
        </div>

        <!-- 文件上传区域 -->
        <div class="upload-area">
          <el-upload
            ref="uploadRef"
            :show-file-list="false"
            :auto-upload="false"
            :on-change="handleFileChange"
            :before-upload="beforeUpload"
            accept=".zip"
            drag
          >
            <div class="upload-dragger-content">
              <el-icon class="upload-icon"><UploadFilled /></el-icon>
              <div class="upload-text">
                <p>点击或拖拽ZIP文件到此处上传</p>
                <p class="upload-hint">支持ZIP格式，最大50MB</p>
              </div>
            </div>
          </el-upload>
        </div>

        <!-- 选中的文件信息 -->
        <div v-if="selectedFile" class="selected-file-info">
          <div class="file-card">
            <div class="file-icon">
              <el-icon><Document /></el-icon>
            </div>
            <div class="file-details">
              <div class="file-name">{{ selectedFile.name }}</div>
              <div class="file-size">
                {{ formatFileSize(selectedFile.size) }}
              </div>
            </div>
            <div class="file-actions">
              <el-button
                type="danger"
                size="small"
                :icon="Delete"
                @click="removeSelectedFile"
              />
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="closeUploadDialog">取消</el-button>
          <el-button
            v-if="selectedFile"
            type="primary"
            :loading="uploading"
            @click="uploadTheme"
          >
            上传主题
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, computed } from "vue";
import {
  ElMessage,
  ElMessageBox,
  ElCard,
  ElInput,
  ElButton,
  ElEmpty,
  ElTag,
  ElRate,
  ElPagination,
  ElIcon,
  ElSelect,
  ElOption
} from "element-plus";
import {
  Search,
  TrophyBase,
  Refresh,
  Collection,
  Star,
  Picture,
  View,
  Download,
  User,
  Clock,
  Shop,
  Money,
  Promotion,
  Link,
  ArrowRight,
  Upload,
  UploadFilled,
  Document,
  Delete,
  Check,
  Close,
  Warning
} from "@element-plus/icons-vue";
import { themeMallApi } from "@/api/theme-mall";
import type {
  ThemeListParams,
  ThemeListData,
  Theme,
  ThemeUploadResponse,
  ThemeValidationResult
} from "@/api/theme-mall/type";
import { useDebounceFn } from "@vueuse/core";
import { getToken } from "@/utils/auth";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/zh-cn";

// 配置 dayjs
dayjs.extend(relativeTime);
dayjs.locale("zh-cn");

defineOptions({
  name: "ThemeMall"
});

// 响应式数据
const loading = ref(false);
const themeData = ref<ThemeListData | null>(null);
const installedThemes = ref<Theme[]>([]);
const activeTab = ref("market");

// 上传相关状态
const showUploadDialog = ref(false);
const selectedFile = ref<File | null>(null);
const uploading = ref(false);
const uploadRef = ref();

// 主题切换状态
const switchingTheme = ref<string | null>(null);

// 搜索参数
const searchParams = ref<ThemeListParams & { themeType: string }>({
  page: 1,
  limit: 12,
  search: "",
  tags: "",
  themeType: ""
});

// 计算属性
const officialThemeCount = computed(() => {
  if (!themeData.value?.list) return 0;
  return themeData.value.list.filter(theme => theme.isOfficial).length;
});

// 当前显示的主题列表
const currentThemeList = computed(() => {
  if (activeTab.value === "installed") {
    return installedThemes.value;
  } else {
    return themeData.value?.list || [];
  }
});

// 防抖搜索
const handleSearch = useDebounceFn(() => {
  searchParams.value.page = 1;
  loadThemes();
}, 500);

// 处理主题类型变化
const handleTypeChange = () => {
  searchParams.value.page = 1;
  loadThemes();
};

// 获取主题列表
const loadThemes = async () => {
  loading.value = true;
  try {
    const params = { ...searchParams.value };
    // 移除空值参数
    Object.keys(params).forEach(key => {
      const value = params[key as keyof ThemeListParams];
      if (value === "") {
        delete params[key as keyof ThemeListParams];
      }
    });

    const response = await themeMallApi.getThemes(params);

    if (response.code === 200 && response.data) {
      // 确保list存在且是数组，然后进行排序：官方主题在前，非官方主题在后
      const list = response.data.list || [];
      const sortedList = list.sort((a, b) => {
        if (a.isOfficial && !b.isOfficial) return -1;
        if (!a.isOfficial && b.isOfficial) return 1;
        return 0;
      });

      themeData.value = {
        ...response.data,
        list: sortedList
      };
    } else {
      throw new Error(response.message || "获取主题列表失败");
    }
  } catch (error: any) {
    console.error("加载主题失败:", error);
    ElMessage.error(error.message || "加载主题失败，请稍后重试");
    themeData.value = null;
  } finally {
    loading.value = false;
  }
};

// 刷新主题
const refreshThemes = () => {
  if (activeTab.value === "installed") {
    loadInstalledThemes();
  } else {
    loadThemes();
  }
};

// 获取已安装主题列表
const loadInstalledThemes = async () => {
  loading.value = true;
  try {
    const response = await themeMallApi.getInstalledThemes();

    if (response.code === 200 && response.data) {
      installedThemes.value = response.data;
    } else {
      throw new Error(response.message || "获取已安装主题失败");
    }
  } catch (error: any) {
    console.error("加载已安装主题失败:", error);
    ElMessage.error(error.message || "加载已安装主题失败，请稍后重试");
    installedThemes.value = [];
  } finally {
    loading.value = false;
  }
};

// 标签页切换处理
const handleTabChange = (tabName: string) => {
  if (tabName === "installed") {
    loadInstalledThemes();
  } else {
    loadThemes();
  }
};

// 分页处理
const handleSizeChange = (size: number) => {
  searchParams.value.limit = size;
  searchParams.value.page = 1;
  loadThemes();
};

const handleCurrentChange = (page: number) => {
  searchParams.value.page = page;
  loadThemes();
};

// 打开演示
const openDemo = (url: string) => {
  window.open(url, "_blank");
};

// 打开仓库
const openRepo = (url: string) => {
  window.open(url, "_blank");
};

// 下载主题
const downloadTheme = (url: string) => {
  window.open(url, "_blank");
};

// 安装主题
const installTheme = async (theme: Theme) => {
  if (!theme.downloadUrl) {
    ElMessage.error("该主题没有提供下载链接");
    return;
  }

  try {
    const confirmResult = await ElMessageBox.confirm(
      `确定要安装主题 "${theme.name}" 吗？`,
      "安装确认",
      {
        confirmButtonText: "确认安装",
        cancelButtonText: "取消",
        type: "info"
      }
    );

    // 调用后端安装API
    const response = await themeMallApi.installTheme({
      theme_name: theme.name,
      download_url: theme.downloadUrl,
      theme_market_id: theme.id
    });

    if (response.code === 200) {
      ElMessage.success("主题安装成功！");
      // 刷新已安装主题列表
      loadInstalledThemes();
    } else {
      throw new Error(response.message || "安装失败");
    }
  } catch (error: any) {
    if (error !== "cancel") {
      console.error("安装主题失败:", error);
      ElMessage.error(error.message || "安装主题失败，请稍后重试");
    }
  }
};

// 启用主题
const switchToTheme = async (theme: Theme) => {
  try {
    const confirmResult = await ElMessageBox.confirm(
      `确定要启用主题 "${theme.name}" 吗？主题切换成功后页面将自动刷新。`,
      "启用确认",
      {
        confirmButtonText: "确认启用",
        cancelButtonText: "取消",
        type: "info"
      }
    );

    // 设置loading状态
    switchingTheme.value = theme.name;

    const response = await themeMallApi.switchTheme({
      theme_name: theme.name
    });

    if (response.code === 200) {
      ElMessage.success("主题启用成功！正在刷新页面...");

      // 短暂延迟后刷新页面，添加时间戳参数强制刷新缓存
      setTimeout(() => {
        const url = new URL(window.location.href);
        url.searchParams.set("t", Date.now().toString());
        window.location.href = url.toString();
      }, 1500);
    } else {
      throw new Error(response.message || "启用失败");
    }
  } catch (error: any) {
    // 清除loading状态
    switchingTheme.value = null;

    if (error !== "cancel") {
      console.error("启用主题失败:", error);
      ElMessage.error(error.message || "启用主题失败，请稍后重试");
    }
  }
};

// 确认卸载主题
const confirmUninstallTheme = async (theme: Theme) => {
  try {
    const confirmResult = await ElMessageBox.confirm(
      `确定要卸载主题 "${theme.name}" 吗？此操作不可撤销。`,
      "卸载确认",
      {
        confirmButtonText: "确认卸载",
        cancelButtonText: "取消",
        type: "warning"
      }
    );

    const response = await themeMallApi.uninstallTheme({
      theme_name: theme.name
    });

    if (response.code === 200) {
      ElMessage.success("主题卸载成功！");
      // 刷新已安装主题列表
      loadInstalledThemes();
    } else {
      throw new Error(response.message || "卸载失败");
    }
  } catch (error: any) {
    if (error !== "cancel") {
      console.error("卸载主题失败:", error);
      ElMessage.error(error.message || "卸载主题失败，请稍后重试");
    }
  }
};

// 购买主题
const buyTheme = (theme: Theme) => {
  ElMessageBox.confirm(
    `确定要购买主题 "${theme.name}" 吗？价格：¥${formatPrice(theme.price || 0)}`,
    "购买确认",
    {
      confirmButtonText: "确认购买",
      cancelButtonText: "取消",
      type: "warning"
    }
  )
    .then(() => {
      ElMessage.success("购买功能开发中...");
    })
    .catch(() => {
      // 用户取消购买
    });
};

// 查看说明
const viewInstructions = (url: string) => {
  window.open(url, "_blank");
};

// 图片错误处理
const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  img.style.display = "none";
  const placeholder = img.parentElement?.querySelector(".preview-placeholder");
  if (placeholder) {
    (placeholder as HTMLElement).style.display = "flex";
  }
};

// 格式化数字
const formatNumber = (num: number | undefined | null) => {
  // 处理 undefined、null 或非数字值
  if (num == null || isNaN(Number(num))) {
    return "0";
  }

  const numValue = Number(num);
  if (numValue >= 1000) {
    return (numValue / 1000).toFixed(1) + "k";
  }
  return numValue.toString();
};

// 格式化价格（分转元）
const formatPrice = (priceInCents: number | undefined | null) => {
  // 处理 undefined、null 或非数字值
  if (priceInCents == null || isNaN(Number(priceInCents))) {
    return "0.00";
  }

  const price = Number(priceInCents);
  return (price / 100).toFixed(2);
};

// 格式化时间
const formatTime = (time: string) => {
  return dayjs(time).fromNow();
};

// 检查静态模式状态
const checkStaticMode = async () => {
  try {
    const response = await themeMallApi.checkStaticMode();
    if (response.code === 200) {
      console.log("静态模式状态:", response.data.is_active);
    }
  } catch (error) {
    console.error("检查静态模式状态失败:", error);
  }
};

// 上传相关方法
const handleFileChange = (file: any) => {
  selectedFile.value = file.raw;
};

const beforeUpload = (file: File) => {
  // 验证文件类型
  const isZip =
    file.type === "application/zip" || file.name.toLowerCase().endsWith(".zip");
  if (!isZip) {
    ElMessage.error("只能上传ZIP格式的文件");
    return false;
  }

  // 验证文件大小
  const isLt50M = file.size / 1024 / 1024 < 50;
  if (!isLt50M) {
    ElMessage.error("文件大小不能超过50MB");
    return false;
  }

  return false; // 阻止自动上传
};

const removeSelectedFile = () => {
  selectedFile.value = null;
  uploadRef.value?.clearFiles();
};

const uploadTheme = async () => {
  if (!selectedFile.value) {
    ElMessage.error("请先选择文件");
    return;
  }

  uploading.value = true;
  try {
    // 第一步：验证主题
    ElMessage.info("正在验证主题...");
    const validateResponse = await themeMallApi.validateTheme(
      selectedFile.value
    );

    console.log("验证响应:", validateResponse);

    if (validateResponse.code !== 200) {
      throw new Error(validateResponse.message || "验证失败");
    }

    if (!validateResponse.data.is_valid) {
      const errorMsg =
        validateResponse.data.errors?.join(", ") || "主题验证失败";
      throw new Error(errorMsg);
    }

    console.log("主题元信息:", validateResponse.data.metadata);
    console.log("现有主题信息:", validateResponse.data.existing_theme);

    // 检查是否存在重复主题且需要更新
    if (validateResponse.data.existing_theme) {
      const existingTheme = validateResponse.data.existing_theme;
      const newVersion = validateResponse.data.metadata?.version;
      const existingVersion =
        existingTheme.installed_version || existingTheme.version;

      // 版本比较函数
      const compareVersions = (v1: string, v2: string): number => {
        const parts1 = v1.split(".").map(Number);
        const parts2 = v2.split(".").map(Number);

        for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
          const part1 = parts1[i] || 0;
          const part2 = parts2[i] || 0;

          if (part1 > part2) return 1;
          if (part1 < part2) return -1;
        }
        return 0;
      };

      const versionComparison = compareVersions(
        newVersion || "0.0.0",
        existingVersion || "0.0.0"
      );

      if (versionComparison > 0) {
        // 新版本更高，询问是否更新
        try {
          await ElMessageBox.confirm(
            `检测到已安装主题 "${existingTheme.name}" 的新版本。\n\n` +
              `当前版本：${existingVersion}\n` +
              `新版本：${newVersion}\n\n` +
              `是否要更新到新版本？更新后将覆盖当前主题文件。`,
            "主题版本更新",
            {
              confirmButtonText: "确认更新",
              cancelButtonText: "取消",
              type: "info",
              dangerouslyUseHTMLString: false
            }
          );

          // 用户确认更新，使用强制更新模式
          ElMessage.info("正在更新主题...");
          await performThemeUpload(true);
        } catch (error) {
          if (error === "cancel") {
            ElMessage.info("取消更新");
            return;
          }
          throw error;
        }
      } else if (versionComparison === 0) {
        // 相同版本，询问是否重新安装
        try {
          await ElMessageBox.confirm(
            `主题 "${existingTheme.name}" (版本 ${existingVersion}) 已经安装。\n\n` +
              `是否要重新安装？这将覆盖当前的主题文件。`,
            "重新安装主题",
            {
              confirmButtonText: "重新安装",
              cancelButtonText: "取消",
              type: "warning"
            }
          );

          // 用户确认重新安装
          ElMessage.info("正在重新安装主题...");
          await performThemeUpload(true);
        } catch (error) {
          if (error === "cancel") {
            ElMessage.info("取消安装");
            return;
          }
          throw error;
        }
      } else {
        // 版本更低，警告用户
        ElMessage.warning(
          `当前上传的版本 (${newVersion}) 低于已安装的版本 (${existingVersion})，建议使用更高版本。`
        );
        return;
      }
    } else {
      // 没有重复主题，正常安装
      await performThemeUpload(false);
    }
  } catch (error: any) {
    console.error("上传主题失败:", error);
    ElMessage.error(error.message || "上传主题失败，请稍后重试");
  } finally {
    uploading.value = false;
  }
};

// 执行主题上传的辅助函数
const performThemeUpload = async (forceUpdate: boolean = false) => {
  const uploadResponse = await themeMallApi.uploadTheme(
    selectedFile.value!,
    forceUpdate
  );

  if (uploadResponse.code === 200) {
    ElMessage.success(forceUpdate ? "主题更新成功" : "主题上传成功");
    closeUploadDialog();
    // 切换到已安装主题标签页并刷新
    activeTab.value = "installed";
    loadInstalledThemes();
  } else {
    throw new Error(uploadResponse.message || "上传失败");
  }
};

const closeUploadDialog = () => {
  showUploadDialog.value = false;
  selectedFile.value = null;
  uploadRef.value?.clearFiles();
};

const formatFileSize = (size: number) => {
  if (size < 1024) {
    return size + " B";
  } else if (size < 1024 * 1024) {
    return (size / 1024).toFixed(2) + " KB";
  } else {
    return (size / 1024 / 1024).toFixed(2) + " MB";
  }
};

const getAuthorName = (author: any) => {
  if (typeof author === "string") {
    // 如果是 "Name <email>" 格式
    if (author.includes("<")) {
      return author.split("<")[0].trim();
    }
    return author;
  } else if (typeof author === "object" && author?.name) {
    return author.name;
  }
  return "Unknown";
};

// 检查登录状态
const checkLoginStatus = () => {
  const tokenData = getToken();

  if (!tokenData || !tokenData.accessToken) {
    return false;
  }

  if (tokenData.expires && Date.now() > tokenData.expires * 1000) {
    return false;
  }

  return true;
};

// 页面加载时获取数据
onMounted(() => {
  checkLoginStatus();
  loadThemes();
  checkStaticMode();
});
</script>

<style scoped lang="scss">
.theme-mall {
  .header-section {
    padding: 20px 0;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    flex-wrap: wrap;
    gap: 16px;

    .header-content {
      flex: 1;
    }

    .page-title {
      font-size: 28px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      margin: 0 0 8px 0;
      line-height: 1.3;
    }

    .page-description {
      color: var(--el-text-color-regular);
      font-size: 16px;
      margin: 0;
      font-weight: 400;
    }

    .header-actions {
      display: flex;
      gap: 12px;
      align-items: center;
    }
  }

  .tabs-section {
    margin-bottom: 24px;

    :deep(.el-tabs) {
      .el-tabs__header {
        margin-bottom: 0;
        border-bottom: 1px solid var(--el-border-color-light);
      }

      .el-tabs__nav-wrap {
        padding: 0;
      }

      .el-tabs__item {
        padding: 16px 24px;
        font-weight: 500;
        color: var(--el-text-color-regular);
        border: none;

        .tab-label {
          display: flex;
          align-items: center;
          gap: 8px;

          .el-icon {
            font-size: 16px;
          }
        }

        &.is-active {
          color: var(--el-color-primary);
          background: var(--el-color-primary-light-9);
        }

        &:hover {
          color: var(--el-color-primary);
        }
      }

      .el-tabs__active-bar {
        background-color: var(--el-color-primary);
        height: 3px;
      }
    }
  }

  .search-section {
    margin-bottom: 32px;

    .search-wrapper {
      display: flex;
      gap: 16px;
      align-items: center;
      flex-wrap: wrap;

      .el-input {
        flex: 1;
        min-width: 280px;
        max-width: 400px;
      }
    }
  }

  .stats-section {
    margin-bottom: 24px;

    .stats-text {
      color: var(--el-text-color-regular);
      font-size: 14px;
      font-weight: 500;
    }
  }

  .theme-list-section {
    margin-bottom: 32px;

    .loading-container {
      display: flex;
      align-items: center;
      justify-content: center;
      justify-content: flex-start;
    }

    .theme-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 24px;
      width: 100%;

      @media (max-width: 768px) {
        grid-template-columns: 1fr;
        gap: 16px;
      }
    }

    .theme-card {
      background: var(--el-bg-color);
      border: 1px solid var(--el-border-color-light);
      border-radius: 12px;
      overflow: hidden;
      transition: all 0.2s ease;
      display: flex;
      flex-direction: column;
      height: 100%;

      &:hover {
        border-color: var(--el-border-color);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      }

      &.current-theme {
        border-color: var(--el-color-success);
        background: var(--el-color-success-light-9);
        position: relative;

        &::before {
          content: "当前使用";
          position: absolute;
          top: 12px;
          right: 12px;
          background: var(--el-color-success);
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          z-index: 2;
        }
      }

      .theme-preview {
        position: relative;
        height: 176px;
        overflow: hidden;
        background: var(--el-fill-color-light);

        .preview-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .preview-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--el-text-color-placeholder);

          .placeholder-icon {
            font-size: 48px;
            opacity: 0.3;
          }
        }

        .badge-layer {
          position: absolute;
          top: 12px;
          left: 12px;
          right: 12px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;

          .official-badge {
            display: flex;
            align-items: center;
            gap: 4px;
            background: #163bf3;
            color: white;
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 500;
            border: 1px solid rgba(22, 59, 243, 0.3);

            .badge-icon {
              font-size: 12px;
            }
          }

          .theme-type-badge {
            padding: 4px 8px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 500;

            &.type-pro {
              background: linear-gradient(45deg, #f59e0b, #f97316);
              color: white;
            }
          }
        }
      }

      .theme-info {
        padding: 20px;
        display: flex;
        flex-direction: column;
        height: 100%;

        .theme-header {
          margin-bottom: 12px;

          .theme-title {
            font-size: 18px;
            font-weight: 600;
            color: var(--el-text-color-primary);
            margin: 0 0 4px 0;
            line-height: 1.3;
          }

          .theme-author {
            font-size: 14px;
            color: var(--el-text-color-secondary);
            margin: 0;
          }
        }

        .theme-description {
          color: var(--el-text-color-regular);
          font-size: 14px;
          line-height: 1.5;
          margin: 0 0 16px 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          min-height: 42px;
        }

        .theme-tags {
          display: flex;
          gap: 8px;
          align-items: center;
          margin-bottom: 16px;
          flex-wrap: wrap;

          .tag-item {
            font-size: 12px;
            border-radius: 4px;
          }

          .more-tags {
            font-size: 12px;
            color: var(--el-text-color-secondary);
            font-weight: 500;
          }
        }

        .theme-stats {
          display: flex;
          gap: 16px;
          margin-bottom: 16px;
          flex-wrap: wrap;

          .stat-item {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 14px;
            color: var(--el-text-color-secondary);

            .el-icon {
              font-size: 16px;
            }

            &.version {
              background: var(--el-fill-color-light);
              padding: 2px 8px;
              border-radius: 4px;
              font-size: 12px;
              font-weight: 500;
            }

            .el-rate {
              --el-rate-font-size: 14px;
              margin-right: 4px;
            }
          }
        }

        .theme-price {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
          padding: 8px 12px;
          background: linear-gradient(135deg, #fef3c7, #fbbf24);
          border-radius: 8px;
          border: 1px solid #f59e0b;

          .price-label {
            font-size: 14px;
            color: #92400e;
            font-weight: 500;
          }

          .price-value {
            font-size: 18px;
            font-weight: 600;
            color: #92400e;
          }
        }

        .theme-actions {
          display: flex;
          gap: 8px;
          margin-top: auto;
          padding-top: 16px;

          .action-main {
            flex: 1;
            border-radius: 8px;
            font-weight: 500;

            .el-icon {
              margin-right: 4px;
            }

            &.pro-action {
              background: linear-gradient(45deg, #f59e0b, #f97316);
              border-color: #f59e0b;
              color: white;

              &:hover {
                background: linear-gradient(45deg, #d97706, #ea580c);
                border-color: #d97706;
              }

              &:active {
                background: linear-gradient(45deg, #b45309, #dc2626);
              }
            }

            &.current-btn {
              background: var(--el-color-success);
              border-color: var(--el-color-success);
              color: white;
              cursor: not-allowed;

              &:hover {
                background: var(--el-color-success);
                border-color: var(--el-color-success);
              }
            }
          }

          .action-secondary {
            width: 40px;
            border-radius: 8px;
            border: 1px solid var(--el-border-color);
            color: var(--el-text-color-regular);
            &.el-button--danger {
              color: var(--anzhiyu-white);
            }

            &:hover {
              background: var(--el-fill-color-light);
            }

            .el-icon {
              font-size: 16px;
            }
          }
        }
      }
    }
  }

  .pagination-section {
    display: flex;
    justify-content: center;
    margin-top: 40px;
    padding: 20px;

    .pagination {
      :deep(.el-pagination__total),
      :deep(.el-pagination__jump) {
        color: var(--el-text-color-regular);
        font-weight: 500;
      }

      :deep(.el-pager li) {
        border-radius: 8px;
        margin: 0 2px;
        font-weight: 500;
      }

      :deep(.btn-prev),
      :deep(.btn-next) {
        border-radius: 8px;
        font-weight: 500;
      }

      :deep(.el-pagination__sizes .el-select .el-input .el-input__wrapper) {
        border-radius: 8px;
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .theme-mall {
    padding: 16px;

    .header-section {
      margin-bottom: 24px;
      padding: 0;

      .page-title {
        font-size: 24px;
      }

      .page-description {
        font-size: 14px;
      }
    }

    .search-section {
      .search-wrapper {
        flex-direction: column;
        align-items: stretch;

        .el-input {
          min-width: auto;
        }

        .filter-actions {
          justify-content: flex-start;
        }
      }
    }

    .theme-grid {
      gap: 16px;
      width: 100%;
    }

    .pagination-section {
      margin-top: 24px;
      padding: 0;
    }
  }
}
</style>
