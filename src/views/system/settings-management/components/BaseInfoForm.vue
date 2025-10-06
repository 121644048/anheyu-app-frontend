<template>
  <h1>基本信息</h1>

  <el-form-item label="站点名称">
    <el-input v-model="formData.siteName" placeholder="请输入站点名称" />
    <div class="form-item-help">站点的名称。</div>
  </el-form-item>

  <el-form-item label="站点副标题">
    <el-input v-model="formData.subTitle" placeholder="请输入站点副标题" />
    <div class="form-item-help">站点的名称。</div>
  </el-form-item>

  <el-form-item label="站点描述">
    <el-input
      v-model="formData.siteDescription"
      type="textarea"
      :rows="3"
      placeholder="请输入站点描述"
    />
    <div class="form-item-help">站点描述信息，可能会在分享页面摘要内展示。</div>
  </el-form-item>

  <el-form-item ref="primaryUrlFormItemRef">
    <template #label>
      <span>站点 URL</span>
      <div class="form-item-help" style="margin-top: 0">
        主要站点 URL 用于与外部服务通信和接受回调，请使用能被公网访问的
        URL，一般填写网站部署的域名即可。
      </div>
    </template>
    <el-input
      ref="primaryUrlInputRef"
      v-model="formData.primaryUrl"
      placeholder="例如：https://album.anheyu.com"
    />
  </el-form-item>

  <el-form-item label="站点公告">
    <el-input
      v-model="formData.announcement"
      type="textarea"
      :rows="3"
      placeholder="请输入站点公告"
    />
    <div class="form-item-help">
      展示给全体用户（包括匿名用户）的公告，留空不展示。当此项内容更改时，所有用户会重新看到公告。
    </div>
  </el-form-item>

  <el-form-item label="ICP备案号">
    <el-input
      v-model="formData.icpNumber"
      placeholder="例如：京ICP备12345678号"
    />
    <div class="form-item-help">网站的ICP备案号，用于页脚显示。</div>
  </el-form-item>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, nextTick } from "vue";
import { useRoute } from "vue-router";
import type { SiteInfo } from "../type";
import type { ElInput, FormItemInstance } from "element-plus";
// [NEW] 引入 store 和 ElMessageBox
import { useSiteConfigStore } from "@/store/modules/siteConfig";
import { ElMessageBox } from "element-plus";

const props = defineProps<{ modelValue: SiteInfo }>();
const emit = defineEmits(["update:modelValue"]);

const formData = computed({
  get: () => props.modelValue,
  set: value => emit("update:modelValue", value)
});

const route = useRoute();
const primaryUrlInputRef = ref<InstanceType<typeof ElInput>>();
const primaryUrlFormItemRef = ref<FormItemInstance>();

function checkAndFocusUrl() {
  const siteConfigStore = useSiteConfigStore();
  const backendSiteUrl = siteConfigStore.getSiteUrl;
  const currentOrigin = window.location.origin;

  // 定义一个聚焦和高亮的辅助函数
  const focusAndHighlight = () => {
    nextTick(() => {
      primaryUrlInputRef.value?.focus();
      if (primaryUrlFormItemRef.value?.$el) {
        primaryUrlFormItemRef.value.$el.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });
        primaryUrlFormItemRef.value.$el.classList.add("highlight-focus");
        setTimeout(() => {
          primaryUrlFormItemRef.value?.$el.classList.remove("highlight-focus");
        }, 3000);
      }
    });
  };

  // 检查是否是从其他页面通过 query 参数跳转过来的
  if (route.query.focus === "primaryUrl") {
    focusAndHighlight();
    return; // 如果是，直接聚焦并退出，避免重复弹窗
  }

  // 检查 sessionStorage，如果用户已经忽略过，则不再提示
  if (sessionStorage.getItem("ignoreSiteUrlMismatch")) {
    return;
  }

  // 如果后端配置了 URL，但与当前访问的 URL 不一致
  if (backendSiteUrl && backendSiteUrl.trim() !== currentOrigin) {
    ElMessageBox.confirm(
      `系统检测到您当前访问的地址 (<code>${currentOrigin}</code>) 与后端配置的站点 URL (<code>${backendSiteUrl}</code>) 不一致。这可能会导致 OAuth 授权等功能无法正常工作。`,
      "站点 URL 配置不匹配",
      {
        confirmButtonText: "好的，我去修改",
        cancelButtonText: "忽略",
        type: "warning",
        dangerouslyUseHTMLString: true
      }
    )
      .then(() => {
        // 用户点击确认，执行聚焦和高亮
        focusAndHighlight();
      })
      .catch(() => {
        // 用户点击“忽略”或关闭弹窗
        sessionStorage.setItem("ignoreSiteUrlMismatch", "true");
        console.warn("用户已忽略站点 URL 不匹配的警告。");
      });
  }
}

onMounted(() => {
  // 当组件挂载时，执行检查
  checkAndFocusUrl();
});
</script>

<style scoped lang="scss">
.el-form-item {
  margin-bottom: 24px;
  transition: background-color 0.5s ease;
}

.highlight-focus {
  background-color: var(--el-color-warning-light-9);
  border-radius: 8px;
}

.form-item-help {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.5;
  color: #909399;
}
</style>
