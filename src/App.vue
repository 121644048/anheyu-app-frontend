<!--
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-06-15 11:31:00
 * @LastEditTime: 2025-08-07 18:48:23
 * @LastEditors: 安知鱼
-->
<template>
  <el-config-provider :locale="currentLocale">
    <router-view />
    <ReDialog />
    <GlobalLoading />
  </el-config-provider>
</template>

<script lang="ts">
import { defineComponent, onMounted } from "vue";
import { ElConfigProvider } from "element-plus";
import { ReDialog } from "@/components/ReDialog";
import zhCn from "element-plus/es/locale/lang/zh-cn";
import GlobalLoading from "@/components/GlobalLoading/index.vue";
import { useGlobalStatistics } from "@/composables/useGlobalStatistics";
import { useCustomCode } from "@/composables/useCustomCode";
import { printConsoleWelcome } from "@/utils/consolePrinter";

export default defineComponent({
  name: "app",
  components: {
    [ElConfigProvider.name]: ElConfigProvider,
    ReDialog,
    GlobalLoading
  },
  setup() {
    // 初始化全局访问统计（处理页面生命周期事件）
    useGlobalStatistics();

    // 初始化自定义代码加载（在站点配置加载完成后自动插入）
    useCustomCode();

    // 在组件挂载后显示控制台欢迎信息
    onMounted(() => {
      // 延迟一点时间执行，确保所有配置都已加载完成
      setTimeout(async () => {
        await printConsoleWelcome();
      }, 1000);
    });

    return {};
  },
  computed: {
    currentLocale() {
      return zhCn;
    }
  }
});
</script>
