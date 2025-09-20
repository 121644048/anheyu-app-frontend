<template>
  <div v-if="model.homeTop">
    <el-form-item label="网站拥有者名称">
      <el-input
        :model-value="model.siteOwnerName"
        placeholder="例如：安知鱼"
        clearable
        @update:model-value="updateSiteOwnerName"
      />
    </el-form-item>
    <el-form-item label="网站拥有者邮箱">
      <el-input
        :model-value="model.siteOwnerEmail"
        placeholder="例如：anzhiyu-c@qq.com"
        clearable
        @update:model-value="updateSiteOwnerEmail"
      />
    </el-form-item>

    <el-divider content-position="left">首页顶部配置</el-divider>
    <template v-if="model.homeTop">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="主标题">
            <el-input
              :model-value="model.homeTop.title"
              placeholder="例如：生活明朗"
              @update:model-value="updateHomeTopField('title', $event)"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="副标题">
            <el-input
              :model-value="model.homeTop.subTitle"
              placeholder="例如：万物可爱。"
              @update:model-value="updateHomeTopField('subTitle', $event)"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="站点标语">
        <el-input
          :model-value="model.homeTop.siteText"
          placeholder="例如：ANHEYU.COM"
          @update:model-value="updateHomeTopField('siteText', $event)"
        />
      </el-form-item>

      <el-divider content-position="left" style="margin-top: 20px"
        >横幅设置</el-divider
      >
      <div v-if="model.homeTop.banner">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="横幅标题">
              <el-input
                :model-value="model.homeTop.banner.title"
                @update:model-value="updateHomeTopBannerField('title', $event)"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="横幅提示">
              <el-input
                :model-value="model.homeTop.banner.tips"
                @update:model-value="updateHomeTopBannerField('tips', $event)"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="横幅图片 URL">
              <el-input
                :model-value="model.homeTop.banner.image"
                @update:model-value="updateHomeTopBannerField('image', $event)"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="横幅链接">
              <el-input
                :model-value="model.homeTop.banner.link"
                @update:model-value="updateHomeTopBannerField('link', $event)"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="新窗口打开横幅链接">
          <el-switch
            :model-value="model.homeTop.banner.isExternal"
            @update:model-value="updateHomeTopBannerField('isExternal', $event)"
          />
        </el-form-item>
      </div>

      <el-divider content-position="left" style="margin-top: 20px"
        >分类设置 (必须为3项)</el-divider
      >
      <el-table
        v-if="model.homeTop.category"
        :data="model.homeTop.category"
        border
        style="width: 100%"
      >
        <el-table-column label="名称" prop="name">
          <template #default="{ row, $index }">
            <el-input
              :model-value="row.name"
              placeholder="分类名称"
              @update:model-value="updateCategoryField($index, 'name', $event)"
            />
          </template>
        </el-table-column>
        <el-table-column label="路径" prop="path">
          <template #default="{ row, $index }">
            <el-input
              :model-value="row.path"
              placeholder="例如：/categories/前端/"
              @update:model-value="updateCategoryField($index, 'path', $event)"
              @blur="handleCategoryPathBlur($index, $event)"
            />
          </template>
        </el-table-column>
        <el-table-column label="图标" prop="icon">
          <template #default="{ row, $index }">
            <el-input
              :model-value="row.icon"
              placeholder="例如：anzhiyu-icon-dove"
              @update:model-value="updateCategoryField($index, 'icon', $event)"
            />
          </template>
        </el-table-column>
        <el-table-column label="背景" prop="background">
          <template #default="{ row, $index }">
            <el-input
              :model-value="row.background"
              placeholder="例如：linear-gradient(...)"
              @update:model-value="
                updateCategoryField($index, 'background', $event)
              "
            />
          </template>
        </el-table-column>
      </el-table>
    </template>
  </div>
  <el-divider content-position="left">页眉配置</el-divider>
  <el-row :gutter="20">
    <el-col :span="8">
      <el-form-item label="启用开往模块">
        <el-switch
          :model-value="model.navTravel"
          @update:model-value="updateNavTravel"
        />
      </el-form-item>
    </el-col>
    <el-col :span="8">
      <el-form-item label="启用轻提醒模块弹窗">
        <el-switch
          :model-value="model.navClock"
          @update:model-value="updateNavClock"
        />
      </el-form-item>
    </el-col>
  </el-row>

  <!-- 简洁菜单管理 -->
  <div class="menu-manager">
    <div class="manager-header">
      <div class="header-info">
        <h3>导航菜单</h3>
        <p>管理网站导航菜单结构</p>
      </div>
      <div class="header-actions">
        <el-button @click="validateAndShowResults">
          <el-icon><DCaret /></el-icon>
          检查配置
        </el-button>
        <el-button type="primary" @click="addMenuItem">
          <el-icon><Plus /></el-icon>
          添加菜单
        </el-button>
      </div>
    </div>

    <!-- 菜单列表 -->
    <div class="menu-list">
      <!-- 空状态 -->
      <el-empty
        v-if="!model.menu || model.menu.length === 0"
        description="暂无菜单项"
        :image-size="80"
      >
        <el-button type="primary" @click="addMenuItem">
          <el-icon><Plus /></el-icon>
          创建第一个菜单
        </el-button>
      </el-empty>

      <!-- 菜单项列表 -->
      <div v-else class="menu-items">
        <div
          v-for="(menuItem, index) in model.menu"
          :key="`menu-${index}`"
          class="menu-item-row"
        >
          <div class="item-main">
            <div class="item-info">
              <div class="item-title">
                <el-icon
                  class="type-icon"
                  :class="
                    getMenuItemType(menuItem) === 'direct'
                      ? 'direct'
                      : 'dropdown'
                  "
                >
                  <Link v-if="getMenuItemType(menuItem) === 'direct'" />
                  <ArrowDown v-else />
                </el-icon>
                <span class="title">{{ menuItem.title || "未命名菜单" }}</span>
                <el-tag
                  size="small"
                  :type="
                    getMenuItemType(menuItem) === 'direct'
                      ? 'primary'
                      : 'success'
                  "
                >
                  {{
                    getMenuItemType(menuItem) === "direct"
                      ? "直接链接"
                      : "下拉菜单"
                  }}
                </el-tag>
                <!-- 校验状态指示器 -->
                <el-tooltip
                  v-if="validateMenuItem(menuItem).length > 0"
                  :show-arrow="false"
                  :content="
                    '配置问题：' + validateMenuItem(menuItem).join('，')
                  "
                  placement="top"
                >
                  <el-icon class="validation-error">
                    <Warning />
                  </el-icon>
                </el-tooltip>
                <el-tooltip
                  v-else
                  :show-arrow="false"
                  content="配置正确"
                  placement="top"
                >
                  <el-icon class="validation-success">
                    <CircleCheck />
                  </el-icon>
                </el-tooltip>
              </div>
              <div class="item-meta">
                <span
                  v-if="getMenuItemType(menuItem) === 'direct'"
                  class="meta-text"
                >
                  {{ menuItem.path || "未设置链接" }}
                </span>
                <span v-else class="meta-text">
                  {{ menuItem.items?.length || 0 }} 个子菜单项
                </span>
              </div>
            </div>
            <div class="item-actions">
              <el-button size="small" @click="showMenuSettings(index)">
                编辑
              </el-button>
              <el-button
                size="small"
                type="danger"
                plain
                @click="removeMenuItem(index)"
              >
                删除
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 现代化设置面板 -->
    <el-drawer
      v-model="settingsDrawerVisible"
      :title="currentEditingMenu?.title || '菜单设置'"
      direction="rtl"
      size="420px"
      class="settings-drawer"
    >
      <div v-if="currentEditingMenu" class="settings-content">
        <!-- 基本信息 -->
        <div class="settings-group">
          <div class="group-header">
            <h4>基本信息</h4>
          </div>
          <div class="form-content">
            <el-form-item label="菜单标题">
              <el-input
                :model-value="currentEditingMenu.title"
                placeholder="例如：文章、关于我们"
                :class="{
                  'validation-error':
                    !currentEditingMenu.title ||
                    currentEditingMenu.title.trim() === ''
                }"
                @update:model-value="updateCurrentMenuField('title', $event)"
              />
              <div
                v-if="
                  !currentEditingMenu.title ||
                  currentEditingMenu.title.trim() === ''
                "
                class="hint-text error-hint"
              >
                菜单标题不能为空（必填）
              </div>
            </el-form-item>

            <el-form-item label="菜单类型">
              <div class="type-selector">
                <div
                  class="type-option"
                  :class="{
                    active: getMenuItemType(currentEditingMenu) === 'direct'
                  }"
                  @click="updateMenuItemType(currentEditingMenu, 'direct')"
                >
                  <el-icon><Link /></el-icon>
                  <div class="option-info">
                    <span class="option-title">直接链接</span>
                    <span class="option-desc">点击跳转到指定页面</span>
                  </div>
                </div>
                <div
                  class="type-option"
                  :class="{
                    active: getMenuItemType(currentEditingMenu) === 'dropdown'
                  }"
                  @click="updateMenuItemType(currentEditingMenu, 'dropdown')"
                >
                  <el-icon><ArrowDown /></el-icon>
                  <div class="option-info">
                    <span class="option-title">下拉菜单</span>
                    <span class="option-desc">
                      包含多个子菜单项（至少需要1个）
                    </span>
                  </div>
                </div>
              </div>
            </el-form-item>
          </div>
        </div>

        <!-- 直接链接设置 -->
        <div
          v-if="getMenuItemType(currentEditingMenu) === 'direct'"
          class="settings-group direct-group"
        >
          <div class="group-header">
            <h4>
              <el-icon><Link /></el-icon>
              链接设置
            </h4>
          </div>
          <div class="form-content">
            <el-form-item label="链接地址">
              <el-input
                :model-value="currentEditingMenu.path || ''"
                placeholder="/about 或 https://example.com"
                @update:model-value="updateCurrentMenuField('path', $event)"
              >
                <template #prefix>
                  <el-icon><Link /></el-icon>
                </template>
              </el-input>
              <div class="hint-text">支持相对路径和完整URL</div>
            </el-form-item>

            <el-form-item label="图标样式">
              <el-input
                :model-value="currentEditingMenu.icon || ''"
                placeholder="anzhiyu-icon-home"
                @update:model-value="updateCurrentMenuField('icon', $event)"
              >
                <template #prefix>
                  <el-icon><DCaret /></el-icon>
                </template>
              </el-input>
              <div class="hint-text">图标CSS类名，可选填</div>
            </el-form-item>

            <el-form-item label="打开方式">
              <el-radio-group
                :model-value="
                  currentEditingMenu.isExternal ? 'external' : 'internal'
                "
                @update:model-value="
                  updateCurrentMenuField('isExternal', $event === 'external')
                "
              >
                <el-radio value="internal">当前页面</el-radio>
                <el-radio value="external">新窗口打开</el-radio>
              </el-radio-group>
            </el-form-item>
          </div>
        </div>

        <!-- 下拉菜单设置 -->
        <div
          v-else-if="getMenuItemType(currentEditingMenu) === 'dropdown'"
          class="settings-group dropdown-group"
        >
          <div class="group-header">
            <h4>
              <el-icon><ArrowDown /></el-icon>
              子菜单管理
            </h4>
            <el-button
              type="primary"
              class="manage-btn"
              size="small"
              @click="openSubMenuEditor(currentEditingMenu)"
            >
              管理子菜单
            </el-button>
          </div>

          <div class="submenu-overview">
            <div class="overview-stats">
              <div class="stat-item">
                <span class="stat-number">{{
                  currentEditingMenu.items?.length || 0
                }}</span>
                <span class="stat-label">个子菜单</span>
              </div>
            </div>

            <div v-if="currentEditingMenu.items?.length" class="submenu-list">
              <div
                v-for="(subItem, subIndex) in currentEditingMenu.items.slice(
                  0,
                  5
                )"
                :key="subIndex"
                class="submenu-item"
              >
                <el-icon><Document /></el-icon>
                <span class="item-title">{{
                  subItem.title || "未命名子菜单"
                }}</span>
                <el-button
                  text
                  type="danger"
                  size="small"
                  class="remove-btn"
                  :disabled="currentEditingMenu.items?.length <= 1"
                  @click="removeSubMenuItem(subIndex)"
                >
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>

              <div
                v-if="currentEditingMenu.items.length > 5"
                class="more-items"
              >
                还有 {{ currentEditingMenu.items.length - 5 }} 个子菜单...
              </div>
            </div>

            <div v-else class="empty-submenu">
              <el-icon><Document /></el-icon>
              <p>下拉菜单需要至少一个子菜单项</p>
              <el-button
                type="primary"
                size="small"
                @click="addSubMenuItem(currentEditingMenuIndex)"
              >
                立即添加子菜单
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </el-drawer>
  </div>

  <JsonEditorTable
    :model-value="JSON.stringify(model.navMenuItems)"
    title="页眉下拉菜单列表"
    :columns="navMenuItemsColumns"
    :new-item-template="{ title: '', items: [] }"
    @update:model-value="updateNavMenuItems(JSON.parse($event || '[]'))"
  >
    <template #col-items="{ scope }">
      <el-button @click="openNavMenuItemsEditor(scope.row)">
        编辑链接 ({{ scope.row.items?.length || 0 }} 项)
      </el-button>
    </template>
  </JsonEditorTable>

  <el-divider content-position="left">页脚配置</el-divider>

  <el-form-item label="页脚版权所有者">
    <el-input
      :model-value="model.footerOwnerName"
      placeholder="例如：安知鱼"
      clearable
      @update:model-value="updateFooterOwnerName"
    />
  </el-form-item>
  <el-form-item label="页脚版权起始年份">
    <el-input
      :model-value="model.footerOwnerSince"
      placeholder="例如：2020"
      clearable
      @update:model-value="updateFooterOwnerSince"
    />
  </el-form-item>

  <el-divider content-position="left">网站运行时间</el-divider>
  <el-form-item label="启用页脚运行时间模块">
    <el-switch
      :model-value="model.footerRuntimeEnable"
      @update:model-value="updateFooterRuntimeEnable"
    />
  </el-form-item>
  <el-form-item label="网站上线时间(控制侧边栏建站天数以及页脚运行时间)">
    <el-date-picker
      :model-value="model.footerRuntimeLaunchTime"
      type="datetime"
      placeholder="选择日期和时间"
      format="MM/DD/YYYY HH:mm:ss"
      value-format="MM/DD/YYYY HH:mm:ss"
      style="width: 100%"
      @update:model-value="updateFooterRuntimeLaunchTime"
    />
  </el-form-item>

  <el-divider content-position="left">链接配置</el-divider>
  <el-form-item label="页脚列表随机友链数量">
    <el-input
      :model-value="model.footerListRandomFriends"
      placeholder="例如：3"
      clearable
      @update:model-value="updateFooterListRandomFriends"
    />
  </el-form-item>

  <el-divider content-position="left">音乐播放器配置</el-divider>
  <el-form-item label="播放列表ID">
    <el-input
      :model-value="model.music?.player?.playlist_id"
      placeholder="例如：8152976493"
      clearable
      @update:model-value="updateMusicPlayerPlaylistId"
    />
    <div
      style="
        font-size: 12px;
        color: var(--el-text-color-secondary);
        margin-top: 8px;
      "
    >
      网易云音乐歌单ID，用于前端音乐播放器获取歌曲列表
    </div>
  </el-form-item>
  <el-form-item label="底部栏作者链接">
    <el-input
      :model-value="model.footerBarAuthorLink"
      placeholder="/about"
      clearable
      @update:model-value="updateFooterBarAuthorLink"
    />
  </el-form-item>
  <el-form-item label="底部栏CC协议链接">
    <el-input
      :model-value="model.footerBarCCLink"
      placeholder="/copyright"
      clearable
      @update:model-value="updateFooterBarCCLink"
    />
  </el-form-item>

  <el-divider content-position="left">图片配置</el-divider>
  <el-form-item label="社交链接栏中间图片 URL">
    <el-input
      :model-value="model.footerSocialBarCenterImg"
      placeholder="图片 URL"
      clearable
      @update:model-value="updateFooterSocialBarCenterImg"
    />
  </el-form-item>

  <JsonEditorTable
    :model-value="JSON.stringify(model.footerBadges)"
    title="徽标列表"
    :columns="badgeColumns"
    :new-item-template="{ link: '', shields: '', message: '' }"
    @update:model-value="updateFooterBadges(JSON.parse($event || '[]'))"
  />

  <JsonEditorTable
    :model-value="JSON.stringify(model.footerSocialBarLeft)"
    title="社交链接栏左侧列表"
    :columns="socialLinkColumns"
    :new-item-template="{ title: '', link: '', icon: '' }"
    @update:model-value="updateFooterSocialBarLeft(JSON.parse($event || '[]'))"
    @item-deleted="syncDeleteRight"
  />

  <JsonEditorTable
    :model-value="JSON.stringify(model.footerSocialBarRight)"
    title="社交链接栏右侧列表"
    :columns="socialLinkColumns"
    :new-item-template="{ title: '', link: '', icon: '' }"
    @update:model-value="updateFooterSocialBarRight(JSON.parse($event || '[]'))"
    @item-deleted="syncDeleteLeft"
  />

  <el-button
    style="width: 100%; margin-top: -12px; margin-bottom: 24px"
    type="primary"
    plain
    @click="addSocialLinkPair"
  >
    <el-icon><Plus /></el-icon>
    <span>同步添加左右社交链接</span>
  </el-button>

  <JsonEditorTable
    :model-value="JSON.stringify(model.footerBarLinkList)"
    title="底部栏链接列表"
    :columns="footerBarLinkColumns"
    :new-item-template="{ text: '', link: '' }"
    @update:model-value="updateFooterBarLinkList(JSON.parse($event || '[]'))"
  />

  <el-divider content-position="left">页脚多栏链接列表</el-divider>
  <FooterLinkListEditor
    :model-value="JSON.stringify(model.footerList)"
    @update:model-value="updateFooterList(JSON.parse($event || '[]'))"
  />

  <SubMenuEditor
    v-if="currentEditingMainMenu"
    v-model:visible="isSubMenuEditorVisible"
    v-model:items="currentEditingMainMenu.items"
  />
  <NavMenuItemsEditor
    v-if="currentEditingNavMenuGroup"
    v-model:visible="isNavMenuEditorVisible"
    v-model:items="currentEditingNavMenuGroup.items"
  />
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Plus,
  Delete,
  DCaret,
  Link,
  ArrowDown,
  Document,
  Menu,
  Setting,
  Warning,
  CircleCheck
} from "@element-plus/icons-vue";
import type {
  HomePageSettingsInfo,
  JsonEditorTableColumn,
  SubMenuItem,
  NavMenuItem,
  HomeTopInfo,
  HomeTopCategoryItem
} from "../../../type";
import JsonEditorTable from "../components/JsonEditorTable.vue";
import FooterLinkListEditor from "./FooterLinkListEditor.vue";
import SubMenuEditor from "./SubMenuEditor.vue";
import NavMenuItemsEditor from "./NavMenuItemsEditor.vue";

const model = defineModel<HomePageSettingsInfo>({
  required: true
});

// --- Helper functions to update nested state immutably ---
const updateHomeTopField = (key: keyof HomeTopInfo, value: any) => {
  model.value = {
    ...model.value,
    homeTop: {
      ...model.value.homeTop,
      [key]: value
    }
  };
};

const updateHomeTopBannerField = (
  key: keyof HomeTopInfo["banner"],
  value: any
) => {
  model.value = {
    ...model.value,
    homeTop: {
      ...model.value.homeTop,
      banner: {
        ...model.value.homeTop.banner,
        [key]: value
      }
    }
  };
};

const updateCategoryField = (
  index: number,
  key: keyof HomeTopCategoryItem,
  value: any
) => {
  const newCategory = [...model.value.homeTop.category];
  newCategory[index] = { ...newCategory[index], [key]: value };
  updateHomeTopField("category", newCategory);
};

// 处理路径字段失焦时自动添加尾随斜杠
const handleCategoryPathBlur = (index: number, event: Event) => {
  const input = event.target as HTMLInputElement;
  const value = input.value.trim();

  if (value !== "" && !value.endsWith("/")) {
    updateCategoryField(index, "path", value + "/");
  }
};

// --- Watcher for category array validation ---
watch(
  () => model.value.homeTop?.category,
  newCategory => {
    if (!newCategory) return;

    let isChanged = false;
    let processedCategory = [...newCategory];

    // 1. Remove the automatic path sanitization to avoid interfering with user input

    // 2. Enforce array length of 3
    if (processedCategory.length !== 3) {
      isChanged = true;
      const categoryTemplate = {
        name: "",
        path: "",
        icon: "",
        background: "",
        isExternal: false
      };
      if (processedCategory.length > 3) {
        processedCategory = processedCategory.slice(0, 3);
      } else {
        const needed = 3 - processedCategory.length;
        for (let i = 0; i < needed; i++) {
          processedCategory.push({ ...categoryTemplate });
        }
      }
    }

    if (isChanged) {
      updateHomeTopField("category", processedCategory);
    }
  },
  { deep: true, immediate: true }
);

// --- Table column definitions ---
const menuColumns = ref<JsonEditorTableColumn[]>([
  { prop: "title", label: "菜单标题", width: "150px" },
  { prop: "type", label: "菜单类型", slot: "col-type", width: "120px" },
  { prop: "path", label: "链接", slot: "col-path", width: "180px" },
  { prop: "icon", label: "图标", slot: "col-icon", width: "140px" },
  {
    prop: "isExternal",
    label: "新窗口",
    slot: "col-isExternal",
    width: "80px"
  },
  { prop: "items", label: "子菜单", slot: "col-items", width: "180px" }
]);

const navMenuItemsColumns = ref<JsonEditorTableColumn[]>([
  { prop: "title", label: "分组标题" },
  { prop: "items", label: "链接列表", slot: "col-items", width: "200px" }
]);

const badgeColumns = ref<JsonEditorTableColumn[]>([
  { prop: "link", label: "链接" },
  { prop: "shields", label: "徽标图片URL" },
  { prop: "message", label: "悬浮提示" }
]);

const socialLinkColumns = ref<JsonEditorTableColumn[]>([
  { prop: "title", label: "标题" },
  { prop: "link", label: "链接" },
  { prop: "icon", label: "图标类名" }
]);

const footerBarLinkColumns = ref<JsonEditorTableColumn[]>([
  { prop: "text", label: "显示文本" },
  { prop: "link", label: "链接" }
]);

// --- Modal/Editor visibility and data logic ---
const isSubMenuEditorVisible = ref(false);
interface MainMenuRow {
  title: string;
  type: "direct" | "dropdown";
  path?: string;
  icon?: string;
  isExternal?: boolean;
  items?: SubMenuItem[];
}
const currentEditingMainMenu = ref<MainMenuRow | null>(null);
const openSubMenuEditor = (row: MainMenuRow) => {
  // 为旧数据设置默认type
  if (!row.type) {
    row.type = row.items && row.items.length > 0 ? "dropdown" : "direct";
  }
  // 确保二级菜单有items数组
  if (row.type === "dropdown" && !row.items) {
    row.items = [];
  }
  currentEditingMainMenu.value = row;
  isSubMenuEditorVisible.value = true;
};

const isNavMenuEditorVisible = ref(false);
interface NavMenuGroupRow {
  title: string;
  items: NavMenuItem[];
}
const currentEditingNavMenuGroup = ref<NavMenuGroupRow | null>(null);
const openNavMenuItemsEditor = (row: NavMenuGroupRow) => {
  currentEditingNavMenuGroup.value = row;
  isNavMenuEditorVisible.value = true;
};

// --- Social Links Sync Logic ---
const isListIncomplete = (list: any[]): boolean => {
  if (list.length === 0) return false;
  const lastItem = list[list.length - 1];
  return Object.values(lastItem).some(
    v => v === "" || v === null || v === undefined
  );
};

const addSocialLinkPair = () => {
  if (isListIncomplete(model.value.footerSocialBarLeft)) {
    ElMessage.warning("请先填写完左侧列表的当前项！");
    return;
  }
  if (isListIncomplete(model.value.footerSocialBarRight)) {
    ElMessage.warning("请先填写完右侧列表的当前项！");
    return;
  }

  const newItem = { title: "", link: "", icon: "" };
  const newLeft = [...model.value.footerSocialBarLeft, { ...newItem }];
  const newRight = [...model.value.footerSocialBarRight, { ...newItem }];

  model.value = {
    ...model.value,
    footerSocialBarLeft: newLeft,
    footerSocialBarRight: newRight
  };
};

const syncDeleteRight = (index: number) => {
  if (index < model.value.footerSocialBarRight.length) {
    const newRight = [...model.value.footerSocialBarRight];
    newRight.splice(index, 1);
    model.value = { ...model.value, footerSocialBarRight: newRight };
  }
};

const syncDeleteLeft = (index: number) => {
  if (index < model.value.footerSocialBarLeft.length) {
    const newLeft = [...model.value.footerSocialBarLeft];
    newLeft.splice(index, 1);
    model.value = { ...model.value, footerSocialBarLeft: newLeft };
  }
};

// --- Footer Badges Update Logic ---
const updateFooterBadges = (newBadges: any[]) => {
  model.value = {
    ...model.value,
    footerBadges: newBadges
  };
};

// --- Footer Social Bar Left Update Logic ---
const updateFooterSocialBarLeft = (newLeft: any[]) => {
  model.value = {
    ...model.value,
    footerSocialBarLeft: newLeft
  };
};

// --- Footer Social Bar Right Update Logic ---
const updateFooterSocialBarRight = (newRight: any[]) => {
  model.value = {
    ...model.value,
    footerSocialBarRight: newRight
  };
};

// --- Footer Bar Link List Update Logic ---
const updateFooterBarLinkList = (newList: any[]) => {
  model.value = {
    ...model.value,
    footerBarLinkList: newList
  };
};

// --- Footer List Update Logic ---
const updateFooterList = (newList: any[]) => {
  model.value = {
    ...model.value,
    footerList: newList
  };
};

// --- Menu Update Logic ---
const updateMenu = (newMenu: any[]) => {
  model.value = {
    ...model.value,
    menu: newMenu
  };
};

// --- 可视化菜单编辑器方法 ---
const getMenuItemType = (menuItem: any) => {
  return (
    menuItem.type ||
    (menuItem.items && menuItem.items.length > 0 ? "dropdown" : "direct")
  );
};

// --- 菜单校验方法 ---
const validateMenuItem = (menuItem: any) => {
  const errors = [];

  // 检查标题
  if (!menuItem.title || menuItem.title.trim() === "") {
    errors.push("菜单标题不能为空");
  }

  const itemType = getMenuItemType(menuItem);

  if (itemType === "direct") {
    // 直接链接校验
    if (!menuItem.path || menuItem.path.trim() === "") {
      errors.push("直接链接必须设置链接地址");
    } else {
      // 简单的URL格式校验
      const path = menuItem.path.trim();
      if (!path.startsWith("/") && !path.match(/^https?:\/\//)) {
        errors.push("链接地址格式不正确，应该以 / 开头或是完整的 URL");
      }
    }
  } else if (itemType === "dropdown") {
    // 下拉菜单校验
    if (!menuItem.items || menuItem.items.length === 0) {
      errors.push("下拉菜单必须包含至少一个子菜单项");
    } else {
      // 校验子菜单项
      menuItem.items.forEach((subItem, index) => {
        if (!subItem.title || subItem.title.trim() === "") {
          errors.push(`第 ${index + 1} 个子菜单标题不能为空`);
        }
        if (!subItem.path || subItem.path.trim() === "") {
          errors.push(`第 ${index + 1} 个子菜单必须设置链接地址`);
        } else {
          const subPath = subItem.path.trim();
          if (!subPath.startsWith("/") && !subPath.match(/^https?:\/\//)) {
            errors.push(`第 ${index + 1} 个子菜单链接地址格式不正确`);
          }
        }
      });
    }
  }

  return errors;
};

const validateAllMenus = () => {
  const allErrors = [];
  if (model.value.menu && Array.isArray(model.value.menu)) {
    model.value.menu.forEach((menuItem, index) => {
      const errors = validateMenuItem(menuItem);
      if (errors.length > 0) {
        allErrors.push({
          menuIndex: index,
          menuTitle: menuItem.title || `菜单 ${index + 1}`,
          errors
        });
      }
    });
  }
  return allErrors;
};

const showValidationErrors = errors => {
  let message = "菜单配置存在以下问题：\n\n";
  errors.forEach(({ menuTitle, errors: menuErrors }) => {
    message += `【${menuTitle}】\n`;
    menuErrors.forEach(error => {
      message += `  • ${error}\n`;
    });
    message += "\n";
  });

  ElMessageBox.alert(message, "配置检查", {
    type: "warning",
    customStyle: { "white-space": "pre-line" }
  });
};

const validateAndShowResults = () => {
  const errors = validateAllMenus();
  if (errors.length === 0) {
    ElMessage.success("所有菜单配置正确！");
  } else {
    showValidationErrors(errors);
  }
};

// 内联编辑状态
const editingMenuIndex = ref(-1);
const editingMenuTitle = ref("");

// 设置面板状态
const settingsDrawerVisible = ref(false);
const currentEditingMenu = ref(null);
const currentEditingMenuIndex = ref(-1);

// 菜单操作方法
const addMenuItem = () => {
  const newItem = {
    title: "新菜单",
    type: "direct" as const,
    path: "",
    icon: "",
    isExternal: false
  };
  const currentMenu = [...(model.value.menu || [])];
  currentMenu.push(newItem);
  updateMenu(currentMenu);

  // 自动进入编辑模式
  setTimeout(() => {
    startEditMenu(currentMenu.length - 1);
  }, 100);
};

const removeMenuItem = (index: number) => {
  const menuToDelete = model.value.menu?.[index];
  if (!menuToDelete) return;

  // 检查被删除菜单的配置状态
  const errors = validateMenuItem(menuToDelete);
  let confirmMessage = `确定要删除菜单"${menuToDelete.title || "未命名菜单"}"吗？`;

  if (errors.length > 0) {
    confirmMessage +=
      "\n\n注意：该菜单存在配置问题：\n" +
      errors.map(error => `• ${error}`).join("\n");
  }

  ElMessageBox.confirm(confirmMessage, "确认删除", {
    type: "warning",
    customStyle: { "white-space": "pre-line" }
  })
    .then(() => {
      const currentMenu = [...(model.value.menu || [])];
      currentMenu.splice(index, 1);
      updateMenu(currentMenu);
      ElMessage.success("菜单项已删除");
    })
    .catch(() => {});
};

// 内联编辑方法
const startEditMenu = (index: number) => {
  const menuItem = model.value.menu?.[index];
  if (!menuItem) return;

  editingMenuIndex.value = index;
  editingMenuTitle.value = menuItem.title || "";

  // 聚焦到输入框
  setTimeout(() => {
    const input = document.querySelector(
      ".inline-title-input"
    ) as HTMLInputElement;
    if (input) {
      input.focus();
      input.select();
    }
  }, 50);
};

const finishEditMenu = () => {
  if (editingMenuIndex.value >= 0) {
    const menuItem = model.value.menu?.[editingMenuIndex.value];
    if (menuItem) {
      updateMenuItemField(menuItem, "title", editingMenuTitle.value);
    }
  }
  editingMenuIndex.value = -1;
  editingMenuTitle.value = "";
};

const cancelEditMenu = () => {
  editingMenuIndex.value = -1;
  editingMenuTitle.value = "";
};

// 设置面板方法
const showMenuSettings = (index: number) => {
  const menuItem = model.value.menu?.[index];
  if (!menuItem) return;

  currentEditingMenu.value = menuItem;
  currentEditingMenuIndex.value = index;
  settingsDrawerVisible.value = true;
};

const updateCurrentMenuField = (field: string, value: any) => {
  if (currentEditingMenu.value) {
    updateMenuItemField(currentEditingMenu.value, field, value);
  }
};

// 子菜单快捷操作
const addSubMenuItem = (menuIndex: number) => {
  const menuItem = model.value.menu?.[menuIndex];
  if (!menuItem) return;

  if (!menuItem.items) menuItem.items = [];
  menuItem.items.push({
    title: "新子菜单",
    path: "",
    icon: "",
    isExternal: false
  });

  // 如果菜单不是dropdown类型，自动切换
  if (getMenuItemType(menuItem) !== "dropdown") {
    updateMenuItemType(menuItem, "dropdown");
  }

  // 触发响应式更新
  const currentMenu = [...(model.value.menu || [])];
  updateMenu(currentMenu);
};

const editSubMenuItem = (menuIndex: number, subIndex: number) => {
  const menuItem = model.value.menu?.[menuIndex];
  if (!menuItem) return;

  // 打开子菜单编辑器
  openSubMenuEditor(menuItem);
};

const removeSubMenuItem = (subIndex: number) => {
  if (currentEditingMenu.value && currentEditingMenu.value.items) {
    // 检查是否是最后一个子菜单项
    if (currentEditingMenu.value.items.length <= 1) {
      ElMessage.warning("下拉菜单至少需要保留一个子菜单项");
      return;
    }
    currentEditingMenu.value.items.splice(subIndex, 1);

    // 触发响应式更新
    const currentMenu = [...(model.value.menu || [])];
    updateMenu(currentMenu);
  }
};

// --- Menu Item Field Update Logic ---
const updateMenuItemField = (
  menuItem: MainMenuRow,
  field: string,
  value: any
) => {
  (menuItem as any)[field] = value;

  // 触发响应式更新
  const currentMenu = [...(model.value.menu || [])];
  updateMenu(currentMenu);
};

const updateMenuItemType = (
  menuItem: MainMenuRow,
  newType: "direct" | "dropdown"
) => {
  const oldType = getMenuItemType(menuItem);
  if (oldType === newType) return;

  // 如果从直接链接切换到下拉菜单，检查是否有必要的信息
  if (oldType === "direct" && newType === "dropdown") {
    if (!menuItem.title || menuItem.title.trim() === "") {
      ElMessage.warning("请先设置菜单标题再切换类型");
      return;
    }
  }

  menuItem.type = newType;

  if (newType === "direct") {
    // 切换到直接链接：保留所有数据，只是不显示/使用items
    // 确保有必要的直接链接字段，保留items数据
    if (!menuItem.path) menuItem.path = "";
    if (!menuItem.icon) menuItem.icon = "";
    if (menuItem.isExternal === undefined) menuItem.isExternal = false;
  } else if (newType === "dropdown") {
    // 切换到下拉菜单：保留所有数据，确保有子菜单项
    if (!menuItem.items || menuItem.items.length === 0) {
      menuItem.items = [
        {
          title: "子菜单项",
          path: "",
          icon: "",
          isExternal: false
        }
      ];
    }
  }

  // 触发响应式更新
  const currentMenu = [...(model.value.menu || [])];
  updateMenu(currentMenu);

  // 校验当前菜单项
  setTimeout(() => {
    const errors = validateMenuItem(menuItem);
    if (errors.length > 0) {
      ElMessage.warning(`切换后请完善配置：${errors.join("，")}`);
    }
  }, 100);
};

// --- Nav Menu Items Update Logic ---
const updateNavMenuItems = (newItems: any[]) => {
  model.value = {
    ...model.value,
    navMenuItems: newItems
  };
};

// --- Site Owner Update Logic ---
const updateSiteOwnerName = (newName: string) => {
  model.value = {
    ...model.value,
    siteOwnerName: newName
  };
};

const updateSiteOwnerEmail = (newEmail: string) => {
  model.value = {
    ...model.value,
    siteOwnerEmail: newEmail
  };
};

// --- Navigation Update Logic ---
const updateNavTravel = (newValue: boolean) => {
  model.value = {
    ...model.value,
    navTravel: !!newValue
  };
};

const updateNavClock = (newValue: boolean) => {
  model.value = {
    ...model.value,
    navClock: !!newValue
  };
};

// --- Footer Update Logic ---
const updateFooterOwnerName = (newName: string) => {
  model.value = {
    ...model.value,
    footerOwnerName: newName
  };
};

const updateFooterOwnerSince = (newYear: string) => {
  model.value = {
    ...model.value,
    footerOwnerSince: newYear
  };
};

const updateFooterRuntimeEnable = (newValue: boolean) => {
  model.value = {
    ...model.value,
    footerRuntimeEnable: !!newValue
  };
};

const updateFooterRuntimeLaunchTime = (newTime: string) => {
  model.value = {
    ...model.value,
    footerRuntimeLaunchTime: newTime
  };
};

const updateFooterListRandomFriends = (newCount: string) => {
  model.value = {
    ...model.value,
    footerListRandomFriends: newCount
  };
};

const updateFooterBarAuthorLink = (newLink: string) => {
  model.value = {
    ...model.value,
    footerBarAuthorLink: newLink
  };
};

const updateFooterBarCCLink = (newLink: string) => {
  model.value = {
    ...model.value,
    footerBarCCLink: newLink
  };
};

const updateFooterSocialBarCenterImg = (newImg: string) => {
  model.value = {
    ...model.value,
    footerSocialBarCenterImg: newImg
  };
};

const updateMusicPlayerPlaylistId = (newId: string) => {
  model.value = {
    ...model.value,
    music: {
      ...model.value.music,
      player: {
        ...model.value.music?.player,
        playlist_id: newId
      }
    }
  };
};
</script>

<style scoped lang="scss">
/* 简洁菜单管理器样式 */
.menu-manager {
  background: var(--el-bg-color);
  border-radius: 8px;
  border: 1px solid var(--el-border-color-light);

  .manager-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    border-bottom: 1px solid var(--el-border-color-lighter);

    .header-info {
      h3 {
        margin: 0 0 4px 0;
        font-size: 18px;
        font-weight: 600;
        color: var(--el-text-color-primary);
      }

      p {
        margin: 0;
        font-size: 14px;
        color: var(--el-text-color-secondary);
      }
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }
  }

  .menu-list {
    .menu-items {
      padding: 16px 0;

      .menu-item-row {
        padding: 0 24px 16px;

        .item-main {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          background: var(--el-fill-color-light);
          border: 1px solid var(--el-border-color-lighter);
          border-radius: 8px;
          transition: all 0.2s;

          &:hover {
            border-color: var(--el-color-primary);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
          }

          .item-info {
            flex: 1;

            .item-title {
              display: flex;
              align-items: center;
              gap: 12px;
              margin-bottom: 8px;

              .type-icon {
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 4px;

                &.direct {
                  background: rgba(64, 158, 255, 0.1);
                  color: var(--el-color-primary);
                }

                &.dropdown {
                  background: rgba(103, 194, 58, 0.1);
                  color: var(--el-color-success);
                }
              }

              .title {
                font-size: 16px;
                font-weight: 500;
                color: var(--el-text-color-primary);
              }

              .validation-error {
                color: var(--el-color-danger);
                font-size: 16px;
                margin-left: 8px;
              }

              .validation-success {
                color: var(--el-color-success);
                font-size: 16px;
                margin-left: 8px;
                opacity: 0.6;
              }
            }

            .item-meta {
              .meta-text {
                font-size: 14px;
                color: var(--el-text-color-secondary);
              }
            }
          }

          .item-actions {
            display: flex;
            gap: 8px;
          }
        }
      }
    }
  }
}

/* 设置面板样式 */
.settings-content {
  .settings-group {
    margin-bottom: 32px;

    &:last-child {
      margin-bottom: 0;
    }

    .group-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;

      h4 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: var(--el-text-color-primary);
        display: flex;
        align-items: center;
        gap: 8px;

        .el-icon {
          font-size: 16px;
        }
      }

      .manage-btn {
        border-radius: 6px;
      }
    }

    .form-content {
      .el-form-item {
        margin-bottom: 20px;
      }
    }

    &.direct-group {
      .group-header h4 {
        color: var(--el-color-primary);

        .el-icon {
          color: var(--el-color-primary);
        }
      }
    }

    &.dropdown-group {
      .group-header h4 {
        color: var(--el-color-success);

        .el-icon {
          color: var(--el-color-success);
        }
      }
    }
  }

  .type-selector {
    display: flex;
    flex-direction: column;
    gap: 12px;

    .type-option {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      border: 1px solid var(--el-border-color);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        border-color: var(--el-color-primary);
        background: var(--el-fill-color-light);
      }

      &.active {
        border-color: var(--el-color-primary);
        background: rgba(64, 158, 255, 0.04);
      }

      .el-icon {
        font-size: 18px;
        color: var(--el-text-color-secondary);
      }

      .option-info {
        flex: 1;

        .option-title {
          display: block;
          font-weight: 500;
          font-size: 14px;
          color: var(--el-text-color-primary);
          margin-bottom: 4px;
        }

        .option-desc {
          font-size: 12px;
          color: var(--el-text-color-secondary);
        }
      }
    }
  }

  .hint-text {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-top: 8px;

    &.error-hint {
      color: var(--el-color-danger);
      font-weight: 500;
    }
  }

  .validation-error {
    --el-input-border-color: var(--el-color-danger) !important;
    --el-input-focus-border-color: var(--el-color-danger) !important;

    :deep(.el-input__wrapper) {
      box-shadow: 0 0 0 1px var(--el-color-danger) inset;

      &.is-focus {
        box-shadow: 0 0 0 1px var(--el-color-danger) inset;
      }
    }
  }

  .submenu-overview {
    .overview-stats {
      margin-bottom: 20px;

      .stat-item {
        display: flex;
        align-items: baseline;
        gap: 6px;

        .stat-number {
          font-size: 24px;
          font-weight: 600;
          color: var(--el-color-success);
        }

        .stat-label {
          font-size: 14px;
          color: var(--el-text-color-secondary);
        }
      }
    }

    .submenu-list {
      .submenu-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        background: var(--el-fill-color-light);
        border-radius: 6px;
        margin-bottom: 8px;

        .el-icon {
          color: var(--el-text-color-secondary);
        }

        .item-title {
          flex: 1;
          font-size: 14px;
        }

        .remove-btn {
          opacity: 0.6;

          &:hover {
            opacity: 1;
          }
        }
      }

      .more-items {
        text-align: center;
        padding: 8px;
        font-size: 13px;
        color: var(--el-text-color-secondary);
      }
    }

    .empty-submenu {
      text-align: center;
      padding: 32px 16px;

      .el-icon {
        font-size: 32px;
        color: var(--el-text-color-placeholder);
        margin-bottom: 12px;
      }

      p {
        margin: 0 0 16px 0;
        color: var(--el-text-color-secondary);
        font-size: 14px;
      }
    }
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .menu-manager {
    .manager-header {
      flex-direction: column;
      align-items: stretch;
      gap: 16px;

      .header-info {
        text-align: center;
      }
    }

    .menu-list {
      .menu-items {
        .menu-item-row {
          padding: 0 16px 16px;

          .item-main {
            flex-direction: column;
            align-items: stretch;
            gap: 16px;

            .item-actions {
              justify-content: center;
            }
          }
        }
      }
    }
  }

  .settings-content {
    .settings-group {
      .group-header {
        flex-direction: column;
        align-items: stretch;
        gap: 12px;

        .manage-btn {
          width: 100%;
        }
      }
    }

    .type-selector {
      .type-option {
        padding: 12px;
      }
    }
  }
}
</style>
