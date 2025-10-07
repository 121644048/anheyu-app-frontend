<script setup lang="ts">
import { ref, reactive, nextTick, onMounted, watch, computed } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { useDataThemeChange } from "@/layout/hooks/useDataThemeChange";
import { initRouter } from "@/router/utils";
import dayIcon from "@/assets/svg/day.svg?component";
import darkIcon from "@/assets/svg/dark.svg?component";
import { message } from "@/utils/message";
import { useUserStoreHook } from "@/store/modules/user";
import { useSiteConfigStore } from "@/store/modules/siteConfig";
import { gsap } from "gsap";

// 导入子组件
import CheckEmailForm from "@/views/login/components/CheckEmailForm.vue";
import LoginForm from "@/views/login/components/LoginForm.vue";
import RegisterPrompt from "@/views/login/components/RegisterPrompt.vue";
import RegisterForm from "@/views/login/components/RegisterForm.vue";
import ForgotPasswordForm from "@/views/login/components/ForgotPasswordForm.vue";
import ResetPasswordForm from "@/views/login/components/ResetPasswordForm.vue";
import ActivatePrompt from "@/views/login/components/ActivatePrompt.vue";

defineOptions({ name: "LoginDialog" });

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  initialStep: { type: String, default: "check-email" }, // 'check-email' | 'register-form'
  hideThemeSwitch: { type: Boolean, default: false } // 是否隐藏主题切换
});

const emit = defineEmits(["update:modelValue", "login-success"]);

const siteConfigStore = useSiteConfigStore();
const { dataTheme, dataThemeChange } = useDataThemeChange();

// Logo
const siteIcon = computed(() => {
  const config = siteConfigStore.getSiteConfig;
  if (!config) return "/static/img/logo-horizontal-day.png";
  return dataTheme.value
    ? config.LOGO_HORIZONTAL_NIGHT || "/static/img/logo-horizontal-night.png"
    : config.LOGO_HORIZONTAL_DAY || "/static/img/logo-horizontal-day.png";
});

const handleThemeSwitch = (isDark: boolean) => {
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

const dialogRef = ref<HTMLElement>();
const overlayRef = ref<HTMLElement>();
const step = ref<Step>("check-email");
const loading = ref(false);
const transitionName = ref("slide-next");

// 子组件 ref
const checkEmailFormRef = ref();
const loginFormRef = ref();
const registerFormRef = ref();
const forgotPasswordFormRef = ref();
const resetPasswordFormRef = ref();

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
    // 初始化路由（仅供管理员使用，普通用户不需要）
    await initRouter();
    // 获取最新的用户信息
    await useUserStoreHook().fetchUserInfo();
    message("登录成功", { type: "success" });
    emit("login-success");
    closeDialog();
  },
  register: async () => {
    try {
      const res = await useUserStoreHook().registeredUser({
        email: form.email,
        password: form.password,
        repeat_password: form.confirmPassword
      });
      if (res.code === 200) {
        if (res.data?.activation_required) {
          // 保存当前页面URL到localStorage，供激活后返回
          const currentUrl = window.location.href;
          localStorage.setItem("activation_return_url", currentUrl);
          switchStep("activate-prompt", "next");
          message("注册成功，请查收激活邮件", { type: "success" });
        } else {
          switchStep("login-password", "prev");
          message("注册成功，请登录", { type: "success" });
        }
      } else {
        // 抛出错误以便被 handleSubmit 捕获并重置 loading
        throw new Error(res.message || "注册失败");
      }
    } catch (error: any) {
      // 重新抛出错误，让 handleSubmit 处理
      throw error;
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
      switchStep("check-email", "prev");
    } else {
      message(res.message || "重设失败", { type: "error" });
    }
  }
};

const eventHandlers = {
  onNextStep: async () => {
    try {
      await formRef.value?.validateField("email");
      loading.value = true;
      const exists = await apiHandlers.checkEmailExists(form.email);
      switchStep(exists ? "login-password" : "register-prompt", "next");
    } catch (err: any) {
      console.log("验证失败", err);
    } finally {
      loading.value = false;
    }
  },
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

// GSAP 动画
const openDialog = () => {
  if (!dialogRef.value || !overlayRef.value) return;

  const dialog = dialogRef.value;
  const overlay = overlayRef.value;

  // 初始状态
  gsap.set(overlay, { opacity: 0 });
  gsap.set(dialog, {
    scale: 0.95,
    y: 10,
    opacity: 0,
    force3D: true
  });

  // 动画时间线
  const tl = gsap.timeline();

  tl.to(overlay, {
    opacity: 1,
    duration: 0.2,
    ease: "power2.out"
  }).to(
    dialog,
    {
      scale: 1,
      y: 0,
      opacity: 1,
      duration: 0.25,
      ease: "power2.out",
      force3D: true
    },
    "-=0.1"
  );
};

const closeDialog = () => {
  if (!dialogRef.value || !overlayRef.value) return;

  const dialog = dialogRef.value;
  const overlay = overlayRef.value;

  const tl = gsap.timeline({
    onComplete: () => {
      emit("update:modelValue", false);
    }
  });

  tl.to(dialog, {
    scale: 0.95,
    y: 10,
    opacity: 0,
    duration: 0.2,
    ease: "power2.in",
    force3D: true
  }).to(
    overlay,
    {
      opacity: 0,
      duration: 0.15,
      ease: "power2.in"
    },
    "-=0.1"
  );
};

const handleOverlayClick = (event: MouseEvent) => {
  if (event.target === overlayRef.value) {
    closeDialog();
  }
};

// 键盘事件
const onKeyDown = (event: KeyboardEvent) => {
  const { code } = event;
  if (code === "Escape") {
    closeDialog();
    return;
  }
  if (!["Enter", "NumpadEnter"].includes(code)) return;

  event.preventDefault();

  const handlerMap = {
    "check-email": eventHandlers.onNextStep,
    "login-password": eventHandlers.onLogin,
    "register-form": eventHandlers.onRegister,
    "forgot-password": () => forgotPasswordFormRef.value?.triggerSubmit(),
    "reset-password": eventHandlers.onResetPassword
  };
  handlerMap[step.value]?.();
};

// 监听弹窗状态
watch(
  () => props.modelValue,
  newVal => {
    if (newVal) {
      step.value = props.initialStep as Step;
      nextTick(() => {
        openDialog();
        handleFocus();
      });
      window.document.addEventListener("keydown", onKeyDown);
    } else {
      window.document.removeEventListener("keydown", onKeyDown);
    }
  }
);
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue" class="login-dialog-wrapper">
      <div ref="overlayRef" class="dialog-overlay" @click="handleOverlayClick">
        <div ref="dialogRef" class="dialog-container" @click.stop>
          <button class="close-btn" @click="closeDialog">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          <div class="dialog-content">
            <div v-if="!hideThemeSwitch" class="theme-switch">
              <el-switch
                v-model="dataTheme"
                inline-prompt
                :active-icon="darkIcon"
                :inactive-icon="dayIcon"
                @change="handleThemeSwitch"
              />
            </div>

            <div class="logo-wrapper">
              <img :src="siteIcon" alt="网站logo" />
            </div>

            <el-form ref="formRef" :model="form" :rules="rules" size="large">
              <div class="form-wrapper">
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
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
.login-dialog-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2000;
}

.dialog-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.dialog-container {
  position: relative;
  width: 100%;
  max-width: 28rem;
  background: var(--anzhiyu-card-bg);
  border: 1px solid var(--anzhiyu-border-color);
  border-radius: 1rem;
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
  padding: 2rem;
}

.close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 0.5rem;
  color: var(--anzhiyu-fontcolor);
  cursor: pointer;
  transition: all 0.2s;
  z-index: 10;

  &:hover {
    background: var(--anzhiyu-theme-op);
    color: var(--anzhiyu-main);
  }
}

.theme-switch {
  position: absolute;
  top: 1rem;
  left: 1rem;
  z-index: 10;
}

.dialog-content {
  position: relative;
  padding-top: 1rem;
}

.logo-wrapper {
  display: flex;
  justify-content: center;
  height: 2.5rem;
  margin-bottom: 1.5rem;

  img {
    height: 100%;
    object-fit: contain;
  }
}

.form-wrapper {
  position: relative;
  overflow: hidden;
}

// 过渡动画
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
