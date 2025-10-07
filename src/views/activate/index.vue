<template>
  <div class="activate-container">
    <div class="activate-card">
      <div v-if="loading" class="loading-state">
        <el-icon class="loading-icon" :size="48">
          <Loading />
        </el-icon>
        <p class="loading-text">正在激活账号...</p>
      </div>

      <div v-else-if="success" class="success-state">
        <el-icon class="success-icon" :size="64" color="#67c23a">
          <CircleCheck />
        </el-icon>
        <h2 class="success-title">账号激活成功！</h2>
        <p class="success-text">您的账号已成功激活，即将返回并打开登录窗口</p>
        <el-button type="primary" size="large" @click="goToReturnUrl">
          立即登录
        </el-button>
      </div>

      <div v-else class="error-state">
        <el-icon class="error-icon" :size="64" color="#f56c6c">
          <CircleClose />
        </el-icon>
        <h2 class="error-title">激活失败</h2>
        <p class="error-text">{{ errorMessage }}</p>
        <el-button type="primary" size="large" @click="goToReturnUrl">
          返回
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { activateUser } from "@/api/user";
import { ElMessage } from "element-plus";
import { Loading, CircleCheck, CircleClose } from "@element-plus/icons-vue";

defineOptions({
  name: "ActivateAccount"
});

const route = useRoute();
const router = useRouter();

const loading = ref(true);
const success = ref(false);
const errorMessage = ref("");

const goToReturnUrl = () => {
  // 从localStorage获取注册时的页面URL
  const returnUrl = localStorage.getItem("activation_return_url");

  if (returnUrl) {
    // 清除已使用的URL
    localStorage.removeItem("activation_return_url");

    // 解析URL，添加打开登录弹窗的参数
    const url = new URL(returnUrl);
    url.searchParams.set("openLogin", "1");

    // 跳转到原页面
    window.location.href = url.toString();
  } else {
    // 如果没有保存的URL，跳转到首页并打开登录弹窗
    router.push("/?openLogin=1");
  }
};

const activate = async () => {
  const id = route.query.id as string;
  const sign = route.query.sign as string;

  if (!id || !sign) {
    loading.value = false;
    errorMessage.value = "激活链接无效，请检查邮件中的链接是否完整";
    return;
  }

  try {
    await activateUser(id, sign);
    success.value = true;

    // 3秒后自动跳转到原页面并打开登录弹窗
    setTimeout(() => {
      goToReturnUrl();
    }, 3000);
  } catch (error: any) {
    success.value = false;
    errorMessage.value =
      error.response?.data?.message || "激活失败，请稍后重试或联系管理员";
    ElMessage.error(errorMessage.value);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  activate();
});
</script>

<style lang="scss" scoped>
.activate-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
}

.activate-card {
  width: 100%;
  max-width: 480px;
  padding: 3rem 2rem;
  text-align: center;
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.loading-state,
.success-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.loading-icon {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  font-size: 1.125rem;
  color: #606266;
  margin: 0;
}

.success-icon,
.error-icon {
  animation: scaleIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

@keyframes scaleIn {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.success-title,
.error-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  color: #303133;
}

.success-text,
.error-text {
  font-size: 1rem;
  color: #606266;
  margin: 0;
  line-height: 1.6;
}

.el-button {
  margin-top: 1rem;
  min-width: 140px;
}

@media (max-width: 768px) {
  .activate-card {
    padding: 2rem 1.5rem;
  }

  .success-title,
  .error-title {
    font-size: 1.25rem;
  }

  .success-text,
  .error-text {
    font-size: 0.875rem;
  }
}
</style>
