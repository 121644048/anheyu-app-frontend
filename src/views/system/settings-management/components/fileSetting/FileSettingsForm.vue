<!--
 * @Description: 
 * @Author: 安知鱼
 * @Date: 2025-07-24 17:18:23
 * @LastEditTime: 2025-10-12 00:48:25
 * @LastEditors: 安知鱼
-->
<!-- src/components/file-settings/FileSettings.vue -->
<template>
  <FileUploadSettings v-model="formData" />
  <ThumbnailSettings v-model="formData" />
  <MediaExtractorSettings v-model="formData" />
  <TaskQueueSettings v-model="formData" />
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { FileSettingsInfo } from "../../type";
import FileUploadSettings from "./components/FileUploadSettings.vue";
import ThumbnailSettings from "./components/ThumbnailGeneratorSettings.vue";
import MediaExtractorSettings from "./components/MediaExtractorSettings.vue";
import TaskQueueSettings from "./components/TaskQueueSettings.vue";

const props = defineProps<{
  modelValue: FileSettingsInfo;
}>();

const emit = defineEmits(["update:modelValue"]);

// Proxy the v-model for all children
const formData = computed({
  get: () => props.modelValue,
  set: value => {
    emit("update:modelValue", value);
  }
});
</script>
