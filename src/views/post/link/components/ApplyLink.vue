<!--
 * @Description: 友情链接申请面板
 * @Author: 安知鱼
 * @Date: 2025-08-19 10:19:23
 * @LastEditTime: 2025-10-03 14:55:18
 * @LastEditors: 安知鱼
-->
<script setup lang="ts">
import { ref, computed, reactive, watch, nextTick } from "vue";
import {
  ElCard,
  ElForm,
  ElFormItem,
  ElInput,
  ElButton,
  ElAlert,
  ElMessage,
  type FormInstance,
  type FormRules
} from "element-plus";
import { applyLink } from "@/api/postLink";
import type { ApplyLinkRequest } from "@/api/postLink/type";

defineOptions({
  name: "ApplyLink"
});

const props = defineProps<{
  friendLinkApplyCondition: string[];
  friendLinkApplyCustomCodeHtml?: string; // 渲染后的 HTML 内容
}>();

const checkedStates = ref(
  new Array(props.friendLinkApplyCondition.length).fill(false)
);

const allChecked = computed(() => {
  if (checkedStates.value.length === 0) return false;
  return checkedStates.value.every(state => state === true);
});

const formRef = ref<FormInstance>();
const loading = ref(false);
const form = reactive<ApplyLinkRequest>({
  name: "",
  url: "",
  logo: "",
  description: "",
  siteshot: ""
});
const rules = reactive<FormRules>({
  name: [{ required: true, message: "请输入网站名称", trigger: "blur" }],
  url: [
    { required: true, message: "请输入网站链接", trigger: "blur" },
    { type: "url", message: "请输入有效的网址", trigger: ["blur", "change"] }
  ],
  logo: [
    {
      required: true,
      type: "url",
      message: "请输入有效的LOGO链接",
      trigger: ["blur", "change"]
    }
  ],
  description: [{ required: true, message: "请输入网站简介", trigger: "blur" }],
  siteshot: [
    {
      type: "url",
      message: "请输入有效的网站快照链接",
      trigger: ["blur", "change"]
    }
  ]
});

const handleSubmit = async (formEl: FormInstance | undefined) => {
  if (!formEl) return;
  await formEl.validate(async valid => {
    if (valid) {
      loading.value = true;
      try {
        await applyLink(form);
        ElMessage.success("申请提交成功，请等待博主审核！");
        formEl.resetFields();
      } catch (error) {
        console.error("申请友链失败:", error);
        ElMessage.error("申请失败，请稍后再试或联系博主。");
      } finally {
        loading.value = false;
      }
    } else {
      ElMessage.warning("请检查表单填写是否正确！");
    }
  });
};

const formCardRef = ref<InstanceType<typeof ElCard> | null>(null);
const isInitialLoad = ref(true);

watch(allChecked, isAllChecked => {
  // 忽略初始加载时的自动滚动，只在用户主动勾选时触发
  if (isAllChecked && !isInitialLoad.value) {
    nextTick(() => {
      if (formCardRef.value?.$el) {
        const offset = 80;

        const elementPosition =
          formCardRef.value.$el.getBoundingClientRect().top +
          window.pageYOffset;

        const offsetPosition = elementPosition - offset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth"
        });
      }
    });
  }

  // 首次 watch 触发后，标记初始加载完成
  if (isInitialLoad.value) {
    isInitialLoad.value = false;
  }
});
</script>

<template>
  <div class="apply-link-container">
    <!-- 自定义内容区域 - 展示渲染后的 HTML -->
    <div
      v-if="friendLinkApplyCustomCodeHtml"
      shadow="never"
      class="custom-content-card"
    >
      <div
        class="custom-content-wrapper post-content"
        v-html="friendLinkApplyCustomCodeHtml"
      />
    </div>

    <el-card shadow="never" :class="{ 'mt-20': friendLinkApplyCustomCodeHtml }">
      <template #header>
        <div class="card-header">
          <span>申请条件</span>
        </div>
      </template>
      <p style="margin-top: 0">请<strong>勾选</strong>你符合的所有条件：</p>
      <div id="friendlink_checkboxs">
        <div
          v-for="(condition, index) in friendLinkApplyCondition"
          :key="index"
          style="margin-bottom: 15px"
        >
          <label :for="'checkbox-' + index">
            <input
              :id="'checkbox-' + index"
              v-model="checkedStates[index]"
              type="checkbox"
              style="margin-right: 8px"
            />
            <span v-html="condition" />
          </label>
        </div>
      </div>
    </el-card>

    <el-card ref="formCardRef" shadow="never" class="form-card">
      <template #header>
        <div class="card-header">
          <span>填写友链信息</span>
        </div>
      </template>

      <el-alert
        v-if="!allChecked"
        title="请先勾选所有申请条件"
        type="warning"
        show-icon
        :closable="false"
      />

      <el-form
        v-else
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        @submit.prevent
      >
        <el-form-item label="网站名称" prop="name">
          <el-input v-model="form.name" placeholder="例如：安知鱼" />
        </el-form-item>
        <el-form-item label="网站链接" prop="url">
          <el-input v-model="form.url" placeholder="https://blog.anheyu.com/" />
        </el-form-item>
        <el-form-item label="网站 LOGO" prop="logo">
          <el-input
            v-model="form.logo"
            placeholder="https://npm.elemecdn.com/anzhiyu-blog-static@1.0.4/img/avatar.jpg"
          />
        </el-form-item>
        <el-form-item label="网站描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="生活明朗，万物可爱"
          />
        </el-form-item>
        <el-form-item label="网站快照" prop="siteshot">
          <el-input
            v-model="form.siteshot"
            placeholder="https://example.com/siteshot.png (可选)"
          />
          <div class="form-tip">
            <small>网站快照是您网站的截图，用于在友链页面展示。</small>
          </div>
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            :loading="loading"
            class="submit-btn"
            @click="handleSubmit(formRef)"
          >
            {{ loading ? "正在提交..." : "提交申请" }}
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<style lang="scss">
// 引入文章内容样式，用于渲染自定义 Markdown 内容
@use "@/style/post-content.scss";
@use "@/views/post/post-detail/components/PostContent/editor-code.scss";
</style>

<style lang="scss" scoped>
.apply-link-container {
  width: 100%;
}

.custom-content-card {
  margin-bottom: 20px;
}

.custom-content-wrapper {
  // 应用文章内容样式
  :deep(.post-content) {
    padding: 0;
  }
}

.mt-20 {
  margin-top: 20px;
}

.card-header {
  font-weight: bold;
}

.form-card {
  margin-top: 20px;
}

.form-tip {
  margin-top: 8px;
  font-size: 12px;
  line-height: 1.4;
  color: #909399;
}
</style>
