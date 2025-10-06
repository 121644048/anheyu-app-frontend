<!--
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-07-26 15:01:42
 * @LastEditTime: 2025-09-03 10:30:39
 * @LastEditors: 安知鱼
-->
<template>
  <el-tabs v-model="activeSubTab">
    <el-tab-pane label="首页配置" name="homePage">
      <el-form :model="model" label-position="top" class="setting-form">
        <HomePageForm v-model="model.home" />
      </el-form>
    </el-tab-pane>
    <el-tab-pane label="侧边栏配置" name="sidebarPage">
      <el-form :model="model" label-position="top" class="setting-form">
        <SidebarPageForm v-model="model.sidebar" />
      </el-form>
    </el-tab-pane>
    <el-tab-pane label="评论配置" name="commentPage">
      <el-form :model="model" label-position="top" class="setting-form">
        <CommentSettingsForm v-model="model.comment" />
      </el-form>
    </el-tab-pane>
    <el-tab-pane label="邮件配置" name="emailPage">
      <el-form :model="model" label-position="top" class="setting-form">
        <EmailSettingsForm v-model="model.email" />
      </el-form>
    </el-tab-pane>
    <el-tab-pane label="友链页配置" name="fLinkPage">
      <el-form :model="model" label-position="top" class="setting-form">
        <FLinkPageSettingsForm ref="fLinkFormRef" v-model="model.fLink" />
      </el-form>
    </el-tab-pane>
    <el-tab-pane label="装备页配置" name="equipmentPage">
      <el-form :model="model" label-position="top" class="setting-form">
        <EquipmentPageForm v-model="model.equipment" />
      </el-form>
    </el-tab-pane>
    <el-tab-pane label="关于页配置" name="aboutPage">
      <el-form :model="model" label-position="top" class="setting-form">
        <AboutPageForm v-model="model.about" />
      </el-form>
    </el-tab-pane>
    <el-tab-pane label="最近评论页配置" name="recentCommentsPage">
      <el-form :model="model" label-position="top" class="setting-form">
        <RecentCommentsPageForm v-model="model.recentComments" />
      </el-form>
    </el-tab-pane>
  </el-tabs>
</template>

<script setup lang="ts">
import { ref } from "vue";
import type { FrontDeskSettings } from "../type";
import HomePageForm from "./frontDesk/HomePageForm/index.vue";
import SidebarPageForm from "./frontDesk/SidebarPageForm/index.vue";
import CommentSettingsForm from "./frontDesk/CommentSettingsForm/index.vue";
import EmailSettingsForm from "./frontDesk/EmailSettingsForm/index.vue";
import FLinkPageSettingsForm from "./frontDesk/FLinkPageSettingsForm/index.vue";
import EquipmentPageForm from "./frontDesk/EquipmentPageForm/index.vue";
import AboutPageForm from "./frontDesk/AboutPageForm/index.vue";
import RecentCommentsPageForm from "./frontDesk/RecentCommentsPageForm/index.vue";

const activeSubTab = ref("homePage");
const fLinkFormRef = ref<InstanceType<typeof FLinkPageSettingsForm>>();

// 使用 defineModel 接收来自父组件(index.vue)的 v-model
const model = defineModel<FrontDeskSettings>({ required: true });

// 在表单提交前同步友链页的编辑器内容
const syncBeforeSave = async () => {
  if (fLinkFormRef.value?.syncEditorContent) {
    await fLinkFormRef.value.syncEditorContent();
  }
};

// 暴露方法给父组件调用
defineExpose({
  syncBeforeSave
});
</script>

<style scoped>
.setting-form {
  max-width: 800px;
  padding-top: 16px;
}
</style>
