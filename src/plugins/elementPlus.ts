// 按需引入 element-plus 组件（配合 unplugin-element-plus 使用）
import type { App } from "vue";
import {
  // 基础组件
  ElButton,
  ElButtonGroup,
  ElIcon,
  ElLink,
  ElDivider,
  ElConfigProvider,

  // 布局组件
  ElAside,
  ElMain,
  ElRow,
  ElCol,
  ElCard,

  // 导航组件
  ElBreadcrumb,
  ElBreadcrumbItem,
  ElMenu,
  ElMenuItem,
  ElSubMenu,
  ElDropdown,
  ElDropdownItem,
  ElDropdownMenu,
  ElPagination,
  ElBacktop,

  // 表单组件
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElInputTag,
  ElSelect,
  ElOption,
  ElRadio,
  ElRadioButton,
  ElRadioGroup,
  ElCheckbox,
  ElCheckboxGroup,
  ElSwitch,
  ElDatePicker,
  ElColorPicker,
  ElUpload,

  // 数据展示
  ElAlert,
  ElAvatar,
  ElBadge,
  ElCollapse,
  ElCollapseItem,
  ElDescriptions,
  ElDescriptionsItem,
  ElEmpty,
  ElImage,
  ElPopconfirm,
  ElPopover,
  ElRate,
  ElResult,
  ElScrollbar,
  ElSlider,
  ElTag,
  ElTooltip,
  ElTable,
  ElTableColumn,
  ElTabs,
  ElTabPane,
  ElTransfer,
  ElTree,
  ElSteps,
  ElStep,
  ElSkeleton,
  ElText,

  // 反馈组件
  ElDialog,
  ElDrawer,
  ElMessage,
  ElMessageBox,
  ElNotification,

  // 其他
  ElLoading,
  ElInfiniteScroll
} from "element-plus";

const components = [
  ElButton,
  ElButtonGroup,
  ElIcon,
  ElLink,
  ElDivider,
  ElConfigProvider,
  ElAside,
  ElMain,
  ElRow,
  ElCol,
  ElCard,
  ElBreadcrumb,
  ElBreadcrumbItem,
  ElMenu,
  ElMenuItem,
  ElSubMenu,
  ElDropdown,
  ElDropdownItem,
  ElDropdownMenu,
  ElPagination,
  ElBacktop,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElInputTag,
  ElSelect,
  ElOption,
  ElRadio,
  ElRadioButton,
  ElRadioGroup,
  ElCheckbox,
  ElCheckboxGroup,
  ElSwitch,
  ElDatePicker,
  ElColorPicker,
  ElUpload,
  ElAlert,
  ElAvatar,
  ElBadge,
  ElCollapse,
  ElCollapseItem,
  ElDescriptions,
  ElDescriptionsItem,
  ElEmpty,
  ElImage,
  ElPopconfirm,
  ElPopover,
  ElRate,
  ElResult,
  ElScrollbar,
  ElSlider,
  ElTag,
  ElTooltip,
  ElTable,
  ElTableColumn,
  ElTabs,
  ElTabPane,
  ElTransfer,
  ElTree,
  ElSteps,
  ElStep,
  ElSkeleton,
  ElText,
  ElDialog,
  ElDrawer
];

const plugins = [
  ElLoading,
  ElInfiniteScroll,
  ElMessage,
  ElMessageBox,
  ElNotification
];

/** 按需引入 Element Plus 组件 */
export function useElementPlus(app: App) {
  // 注册组件
  components.forEach(component => {
    app.component(component.name, component);
  });

  // 注册插件
  plugins.forEach(plugin => {
    app.use(plugin);
  });
}
