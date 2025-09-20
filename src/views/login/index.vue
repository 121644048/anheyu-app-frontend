<script setup lang="ts">
import {
  ref,
  reactive,
  nextTick,
  onMounted,
  onBeforeUnmount,
  computed
} from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { useDataThemeChange } from "@/layout/hooks/useDataThemeChange";
import { initRouter, getTopMenu } from "@/router/utils";
import dayIcon from "@/assets/svg/day.svg?component";
import darkIcon from "@/assets/svg/dark.svg?component";
import { message } from "@/utils/message";
import { useUserStoreHook } from "@/store/modules/user";
import { useSiteConfigStore } from "@/store/modules/siteConfig";
import { useRoute, useRouter } from "vue-router";

// 1. 导入所有子组件
import CheckEmailForm from "./components/CheckEmailForm.vue";
import LoginForm from "./components/LoginForm.vue";
import RegisterPrompt from "./components/RegisterPrompt.vue";
import RegisterForm from "./components/RegisterForm.vue";
import ForgotPasswordForm from "./components/ForgotPasswordForm.vue";
import ResetPasswordForm from "./components/ResetPasswordForm.vue";
import ActivatePrompt from "./components/ActivatePrompt.vue";

defineOptions({ name: "Login" });

const siteConfigStore = useSiteConfigStore();
const router = useRouter();
const route = useRoute();
const { dataTheme, dataThemeChange } = useDataThemeChange();

// 让 siteIcon 依赖于 dataTheme，实现日间/夜间 Logo 自动切换
const siteIcon = computed(() => {
  const config = siteConfigStore.getSiteConfig;
  if (!config) return "/static/img/logo-horizontal-day.png"; // 默认 Logo

  // dataTheme.value 为 true 表示暗色模式
  return dataTheme.value
    ? config.LOGO_HORIZONTAL_NIGHT || "/static/img/logo-horizontal-night.png"
    : config.LOGO_HORIZONTAL_DAY || "/static/img/logo-horizontal-day.png";
});

/**
 * 处理 el-switch 的切换事件
 * @param isDark el-switch 传来的新值，true 代表暗色，false 代表浅色
 */
const handleThemeSwitch = (isDark: boolean) => {
  // 调用核心切换函数，传入正确的主题名称
  dataThemeChange(isDark ? "dark" : "light");
};

type Step =
  | "check-email"
  | "login-password"
  | "register-prompt"
  | "register-form"
  | "forgot-password"
  | "reset-password"
  | "activate-prompt";

const step = ref<Step>("check-email");
const loading = ref(false);
const transitionName = ref("slide-next");

// 为每个子组件创建 ref
const checkEmailFormRef = ref();
const loginFormRef = ref();
const registerFormRef = ref();
const forgotPasswordFormRef = ref();
const resetPasswordFormRef = ref();

// 统一的表单状态和验证规则
const formRef = ref<FormInstance>();
const form = reactive({
  email: "",
  password: "",
  confirmPassword: "",
  resetToken: { id: "", secret: "" }
});

const rules = reactive<FormRules>({
  email: [
    { required: true, message: "请输入电子邮箱", trigger: "blur" },
    { type: "email", message: "请输入有效的电子邮箱地址", trigger: "blur" }
  ],
  password: [{ required: true, message: "请输入密码", trigger: "blur" }],
  confirmPassword: [
    { required: true, message: "请再次输入密码", trigger: "blur" },
    {
      validator: (_, value, callback) => {
        value !== form.password
          ? callback(new Error("两次密码不一致"))
          : callback();
      },
      trigger: "blur"
    }
  ]
});

const handleFocus = () => {
  // 通过调用子组件暴露的 focus 方法来实现聚焦
  switch (step.value) {
    case "check-email":
      checkEmailFormRef.value?.focus();
      break;
    case "login-password":
      loginFormRef.value?.focus();
      break;
    case "register-form":
      registerFormRef.value?.focus(form.email);
      break;
    case "forgot-password":
      forgotPasswordFormRef.value?.focus();
      break;
    case "reset-password":
      resetPasswordFormRef.value?.focus();
      break;
  }
};

const switchStep = (targetStep: Step, direction: "next" | "prev" = "next") => {
  transitionName.value = direction === "next" ? "slide-next" : "slide-prev";
  step.value = targetStep;
  if (targetStep !== "check-email") {
    form.password = "";
    form.confirmPassword = "";
  }
  nextTick(() => formRef.value?.clearValidate());
};

// 表单提交总处理器
const handleSubmit = async (
  validateFn: () => Promise<boolean | undefined>,
  submitFn: (...args: any[]) => Promise<void>
) => {
  const valid = await validateFn();
  if (!valid) return;
  loading.value = true;
  try {
    await submitFn();
  } catch (err: any) {
    message(err?.message || "操作失败", { type: "error" });
  } finally {
    loading.value = false;
  }
};

// 所有 API 调用逻辑
const apiHandlers = {
  checkEmailExists: async (email: string) => {
    const res = await useUserStoreHook().checkEmailRegistered(email);
    return res.code === 200 && res.data.exists;
  },
  login: async () => {
    await useUserStoreHook().loginByEmail({
      email: form.email,
      password: form.password
    });

    // 等待路由初始化
    await initRouter();

    // 直接跳转到管理后台首页
    await router.replace("/admin/dashboard");

    message("登录成功", { type: "success" });
  },
  register: async () => {
    const res = await useUserStoreHook().registeredUser({
      email: form.email,
      password: form.password,
      repeat_password: form.confirmPassword
    });
    if (res.code === 200) {
      if (res.data?.activation_required) {
        switchStep("activate-prompt", "next");
        message("注册成功，请查收激活邮件", { type: "success" });
      } else {
        switchStep("login-password", "prev");
        message("注册成功，请登录", { type: "success" });
      }
    } else {
      message(res.message || "注册失败", { type: "error" });
    }
  },
  sendResetEmail: async (payload: { captcha: string; captchaCode: string }) => {
    if (payload.captcha.toLowerCase() !== payload.captchaCode.toLowerCase()) {
      message("验证码不正确", { type: "error" });
      forgotPasswordFormRef.value?.refreshCaptcha();
      return;
    }
    const res = await useUserStoreHook().sendPasswordResetEmail({
      email: form.email
    });
    if (res.code === 200) {
      message(res.message, { type: "success" });
      switchStep("check-email", "prev");
    } else {
      message(res.message || "发送失败", { type: "error" });
    }
  },
  resetPassword: async () => {
    const res = await useUserStoreHook().resetPassword({
      ...form.resetToken,
      password: form.password,
      repeat_password: form.confirmPassword
    });
    if (res.code === 200) {
      message("密码重设成功，请使用新密码登录", { type: "success" });
      await router.replace("/login");
      switchStep("check-email", "prev");
    } else {
      message(res.message || "重设失败", { type: "error" });
    }
  }
};

// 事件处理器
const eventHandlers = {
  onNextStep: () =>
    handleSubmit(
      () => formRef.value?.validateField("email"),
      async () => {
        const exists = await apiHandlers.checkEmailExists(form.email);
        switchStep(exists ? "login-password" : "register-prompt", "next");
      }
    ),
  onLogin: () =>
    handleSubmit(() => formRef.value!.validate(), apiHandlers.login),
  onRegister: () =>
    handleSubmit(() => formRef.value!.validate(), apiHandlers.register),
  onForgotPassword: payload =>
    handleSubmit(
      () => formRef.value!.validateField("email"),
      () => apiHandlers.sendResetEmail(payload)
    ),
  onResetPassword: () =>
    handleSubmit(
      () => formRef.value!.validateField(["password", "confirmPassword"]),
      apiHandlers.resetPassword
    )
};

// 键盘与生命周期
const onkeypress = ({ code }: KeyboardEvent) => {
  if (!["Enter", "NumpadEnter"].includes(code)) return;
  const handlerMap = {
    "check-email": eventHandlers.onNextStep,
    "login-password": eventHandlers.onLogin,
    "register-form": eventHandlers.onRegister,
    "forgot-password": () => forgotPasswordFormRef.value?.triggerSubmit(),
    "reset-password": eventHandlers.onResetPassword
  };
  handlerMap[step.value]?.();
};

onMounted(() => {
  if (route.path === "/login/reset" && route.query.id && route.query.secret) {
    form.resetToken.id = route.query.id as string;
    form.resetToken.secret = route.query.secret as string;
    step.value = "reset-password";
  }
  window.document.addEventListener("keypress", onkeypress);
  handleFocus();
});

onBeforeUnmount(() =>
  window.document.removeEventListener("keypress", onkeypress)
);
</script>

<template>
  <div class="flex items-center justify-center w-full min-h-screen">
    <div
      class="w-full max-w-sm p-8 space-y-6 bg-[--anzhiyu-card-bg] border border-[var(--anzhiyu-border-color)] rounded-xl shadow-sm mx-4"
    >
      <div class="absolute flex-c right-5 top-3">
        <el-switch
          v-model="dataTheme"
          inline-prompt
          :active-icon="darkIcon"
          :inactive-icon="dayIcon"
          @change="handleThemeSwitch"
        />
      </div>
      <div class="flex justify-center h-10 mx-auto">
        <img :src="siteIcon" alt="网站logo" />
      </div>

      <el-form ref="formRef" :model="form" :rules="rules" size="large">
        <div class="relative overflow-hidden">
          <transition
            :name="transitionName"
            mode="out-in"
            @after-enter="handleFocus"
          >
            <div :key="step">
              <CheckEmailForm
                v-if="step === 'check-email'"
                ref="checkEmailFormRef"
                v-model:email="form.email"
                :loading="loading"
                @submit="eventHandlers.onNextStep"
                @go-to-register="switchStep('register-form', 'next')"
              />

              <LoginForm
                v-else-if="step === 'login-password'"
                ref="loginFormRef"
                v-model:password="form.password"
                :loading="loading"
                :email="form.email"
                @submit="eventHandlers.onLogin"
                @go-back="switchStep('check-email', 'prev')"
                @forgot-password="switchStep('forgot-password', 'next')"
              />

              <RegisterPrompt
                v-else-if="step === 'register-prompt'"
                :email="form.email"
                @go-to-register="switchStep('register-form', 'next')"
                @go-back="switchStep('check-email', 'prev')"
              />

              <RegisterForm
                v-else-if="step === 'register-form'"
                ref="registerFormRef"
                v-model:email="form.email"
                v-model:password="form.password"
                v-model:confirmPassword="form.confirmPassword"
                :loading="loading"
                @submit="eventHandlers.onRegister"
                @go-to-login="switchStep('check-email', 'prev')"
              />

              <ActivatePrompt
                v-else-if="step === 'activate-prompt'"
                :email="form.email"
                @go-to-login="switchStep('check-email', 'prev')"
              />

              <ForgotPasswordForm
                v-else-if="step === 'forgot-password'"
                ref="forgotPasswordFormRef"
                v-model:email="form.email"
                :loading="loading"
                @submit="eventHandlers.onForgotPassword"
                @back="switchStep('check-email', 'prev')"
              />

              <ResetPasswordForm
                v-else-if="step === 'reset-password'"
                ref="resetPasswordFormRef"
                v-model:password="form.password"
                v-model:confirmPassword="form.confirmPassword"
                :loading="loading"
                @submit="eventHandlers.onResetPassword"
                @go-to-login="switchStep('check-email', 'prev')"
              />
            </div>
          </transition>
        </div>
      </el-form>
    </div>
  </div>
</template>

<style scoped>
.slide-next-enter-active,
.slide-next-leave-active,
.slide-prev-enter-active,
.slide-prev-leave-active {
  transition: all 0.3s ease-in-out;
}

.slide-next-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.slide-next-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

.slide-prev-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.slide-prev-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
