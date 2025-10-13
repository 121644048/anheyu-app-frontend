<!--
 * @Description: 用户通知偏好设置组件
 * @Author: 安知鱼
 * @Date: 2025-10-12
-->
<template>
  <AnDialog
    v-model="dialogVisible"
    title="通知设置"
    width="600px"
    :close-on-click-modal="false"
  >
    <el-alert
      type="info"
      :closable="false"
      style="margin-bottom: 20px"
      show-icon
    >
      <template #title>
        <div style="font-size: 13px; line-height: 1.6">
          这些设置控制您接收各类通知的方式。您可以随时修改这些偏好。
        </div>
      </template>
    </el-alert>

    <el-form
      ref="formRef"
      :model="formData"
      label-width="140px"
      label-position="left"
    >
      <el-divider content-position="left">评论通知</el-divider>

      <el-form-item>
        <template #label>
          <div class="label-with-tip">
            <span>接收评论回复通知</span>
            <el-tooltip
              content="当您的评论被他人回复时，是否接收邮件通知"
              placement="top"
            >
              <i class="anzhiyufont anzhiyu-icon-question-circle" />
            </el-tooltip>
          </div>
        </template>
        <el-switch v-model="formData.allowCommentReplyNotification" />
        <span class="form-tip"> 开启后，当您的评论被回复时会收到邮件通知 </span>
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleSave">
          保存设置
        </el-button>
      </div>
    </template>
  </AnDialog>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { ElMessage } from "element-plus";
import AnDialog from "@/components/AnDialog/index.vue";
import {
  updateUserNotificationSettings,
  getUserNotificationSettings
} from "@/api/user-notification";

interface NotificationSettings {
  allowCommentReplyNotification: boolean;
}

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "success"): void;
}>();

const dialogVisible = ref(false);
const loading = ref(false);
const formRef = ref();

const formData = ref<NotificationSettings>({
  allowCommentReplyNotification: true
});

// 监听 modelValue 变化
watch(
  () => props.modelValue,
  async newVal => {
    dialogVisible.value = newVal;
    if (newVal) {
      await loadSettings();
    }
  }
);

// 监听 dialogVisible 变化，同步到父组件
watch(dialogVisible, newVal => {
  emit("update:modelValue", newVal);
});

// 加载用户通知设置
const loadSettings = async () => {
  try {
    loading.value = true;
    const response = await getUserNotificationSettings();
    if (response) {
      formData.value = {
        ...formData.value,
        ...response
      };
    }
  } catch (error: any) {
    // 如果是404或者还没有设置，使用默认值
    if (error?.response?.status !== 404) {
      ElMessage.error(error?.message || "加载通知设置失败");
    }
  } finally {
    loading.value = false;
  }
};

// 保存设置
const handleSave = async () => {
  try {
    loading.value = true;
    await updateUserNotificationSettings(formData.value);
    ElMessage.success("通知设置已保存");
    dialogVisible.value = false;
    emit("success");
  } catch (error: any) {
    ElMessage.error(error?.message || "保存失败");
  } finally {
    loading.value = false;
  }
};

// 取消
const handleCancel = () => {
  dialogVisible.value = false;
};
</script>

<style scoped lang="scss">
.label-with-tip {
  display: flex;
  gap: 6px;
  align-items: center;

  i {
    font-size: 14px;
    color: var(--anzhiyu-secondtext);
    cursor: help;
    transition: color 0.3s;

    &:hover {
      color: var(--anzhiyu-main);
    }
  }
}

.form-tip {
  display: block;
  margin-left: 12px;
  font-size: 12px;
  color: var(--anzhiyu-secondtext);
  line-height: 1.5;
}

.el-divider {
  margin: 24px 0 20px;
}

.el-form-item {
  margin-bottom: 24px;
}
</style>
