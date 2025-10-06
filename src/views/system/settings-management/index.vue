<template>
  <el-card v-loading="siteConfigStore.loading" shadow="never">
    <el-tabs v-model="activeName" class="setting-tabs">
      <el-tab-pane label="站点信息" name="siteConfig">
        <el-form :model="form" label-position="top" class="setting-form">
          <BaseInfoForm v-model="form.site" />
          <IconSettingsForm v-model="form.site" />
        </el-form>
      </el-tab-pane>

      <el-tab-pane label="页面配置" name="pageSetting">
        <el-form :model="form" label-position="top" class="setting-form">
          <PageSittingForm v-model="form.page" />
        </el-form>
      </el-tab-pane>

      <el-tab-pane label="文件配置" name="fileSetting">
        <el-form :model="form" label-position="top" class="setting-form">
          <FileSettings v-model="form.file" />
        </el-form>
      </el-tab-pane>

      <el-tab-pane label="文章配置" name="postSetting">
        <el-form :model="form" label-position="top" class="setting-form">
          <PostSettings v-model="form.post" />
        </el-form>
      </el-tab-pane>

      <el-tab-pane label="前台配置" name="frontDeskSetting">
        <FrontDeskSettings ref="frontDeskRef" v-model="form.frontDesk" />
      </el-tab-pane>

      <el-tab-pane label="页面管理" name="pageManagement">
        <PageManagement />
      </el-tab-pane>
    </el-tabs>

    <div class="save-button-container">
      <el-button type="primary" size="large" @click="handleSave">
        保存设置
      </el-button>
    </div>
  </el-card>
</template>

<script lang="ts" setup>
import { reactive, onMounted, watch, ref } from "vue";
import { ElMessage } from "element-plus";
import { useSiteConfigStore } from "@/store/modules/siteConfig";
import { get, set, isEqual, cloneDeep } from "lodash-es";

// 引入描述符和新的工具函数
import { allSettingDescriptors } from "./settings.descriptor";
import {
  createInitialFormState,
  createDescriptorMap,
  parseBackendValue,
  formatValueForSave,
  validateJsonConfig
} from "./utils";

// 引入所有子组件
import BaseInfoForm from "./components/BaseInfoForm.vue";
import IconSettingsForm from "./components/IconSettingsForm.vue";
import PageSittingForm from "./components/PageSittingForm.vue";
import FileSettings from "./components/fileSetting/FileSettingsForm.vue";
import PostSettings from "./components/postSettings/index.vue";
import FrontDeskSettings from "./components/FrontDeskSettings.vue";
import PageManagement from "../page-management/index.vue";

let activeName = "siteConfig";
const siteConfigStore = useSiteConfigStore();
const frontDeskRef = ref<InstanceType<typeof FrontDeskSettings>>();

// 1. 根据描述符创建 Map，方便查找
const descriptorMap = createDescriptorMap(allSettingDescriptors);
// 2. 根据描述符获取所有需要从后端请求的键
const allBackendKeys = allSettingDescriptors.map(d => d.backendKey);
// 3. 根据描述符自动生成包含所有默认值的、具有正确嵌套结构的 form 对象
const form = reactive(createInitialFormState(allSettingDescriptors));

watch(
  () => siteConfigStore.siteConfig,
  newSettings => {
    if (!newSettings || Object.keys(newSettings).length === 0) return;

    // 通用逻辑：遍历描述符，自动填充表单
    descriptorMap.forEach((desc, frontendPath) => {
      const backendValue = get(newSettings, desc.backendKey);
      if (backendValue !== undefined) {
        const parsedValue = parseBackendValue(
          backendValue,
          desc.type,
          desc.backendKey
        );
        set(form, frontendPath, cloneDeep(parsedValue));
      }
    });
  },
  { deep: true, immediate: true }
);

onMounted(() => {
  siteConfigStore.fetchSystemSettings(allBackendKeys);
});

const handleSave = async () => {
  // 在保存前，先同步友链页 Markdown 编辑器的内容，确保 HTML 字段也被更新
  if (frontDeskRef.value?.syncBeforeSave) {
    await frontDeskRef.value.syncBeforeSave();
  }

  const settingsToUpdate: Record<string, any> = {};
  const originalSettings = siteConfigStore.siteConfig;
  const validationErrors: string[] = [];

  // 通用逻辑：遍历描述符，自动比较差异和验证
  descriptorMap.forEach((desc, frontendPath) => {
    const currentValue = get(form, frontendPath);
    const originalValueRaw = get(originalSettings, desc.backendKey);
    const originalValueParsed = parseBackendValue(
      originalValueRaw,
      desc.type,
      desc.backendKey
    );

    // 使用 lodash.isEqual 进行深度比较，完美处理对象和数组
    if (!isEqual(currentValue, originalValueParsed)) {
      const formattedValue = formatValueForSave(currentValue, desc.type);

      // 对JSON类型进行额外验证
      if (desc.type === "json") {
        const validation = validateJsonConfig(formattedValue, desc.backendKey);
        if (!validation.isValid) {
          validationErrors.push(`${desc.backendKey}: ${validation.error}`);
          return; // 跳过这个无效的配置项
        }
      }

      settingsToUpdate[desc.backendKey] = formattedValue;
    }
  });

  // 如果有验证错误，显示错误信息并停止保存
  if (validationErrors.length > 0) {
    ElMessage.error(`配置验证失败：\n${validationErrors.join("\n")}`);
    return;
  }

  if (Object.keys(settingsToUpdate).length === 0) {
    ElMessage.info("没有检测到任何更改。");
    return;
  }

  console.log("准备保存的设置:", settingsToUpdate);

  try {
    // 传递描述符以启用乐观更新
    await siteConfigStore.saveSystemSettings(
      settingsToUpdate,
      allSettingDescriptors
    );
  } catch (error: any) {
    console.error("保存设置时发生错误:", error);
    ElMessage.error(`保存失败: ${error.message || String(error)}`);
  }
};
</script>

<style scoped lang="scss">
.setting-form {
  max-width: 800px;
}

.save-button-container {
  padding-top: 24px;
  margin-top: 24px;
  border-top: 1px solid var(--el-border-color-lighter);
}
</style>
