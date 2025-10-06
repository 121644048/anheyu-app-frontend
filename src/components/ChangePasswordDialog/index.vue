<script setup lang="ts">
import { ref, reactive, nextTick, watch } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { ElMessage } from "element-plus";
import { gsap } from "gsap";
import { updateUserPassword } from "@/api/user-center";
import { useUserStoreHook } from "@/store/modules/user";

defineOptions({ name: "ChangePasswordDialog" });

const props = defineProps({
  modelValue: { type: Boolean, default: false }
});

const emit = defineEmits(["update:modelValue", "success"]);

const userStore = useUserStoreHook();
const dialogRef = ref<HTMLElement>();
const overlayRef = ref<HTMLElement>();
const formRef = ref<FormInstance>();
const isSubmitting = ref(false);

const form = reactive({
  oldPassword: "",
  newPassword: "",
  confirmPassword: ""
});

const validateNewPassword = (rule: any, value: any, callback: any) => {
  if (value === "") {
    callback(new Error("请输入新密码"));
  } else if (value === form.oldPassword) {
    callback(new Error("新密码不能与旧密码相同"));
  } else if (value.length < 6) {
    callback(new Error("密码长度不能少于 6 位"));
  } else {
    callback();
  }
};

const validateConfirmPassword = (rule: any, value: any, callback: any) => {
  if (value === "") {
    callback(new Error("请再次输入新密码"));
  } else if (value !== form.newPassword) {
    callback(new Error("两次输入的密码不一致"));
  } else {
    callback();
  }
};

const rules = reactive<FormRules>({
  oldPassword: [{ required: true, message: "请输入当前密码", trigger: "blur" }],
  newPassword: [{ validator: validateNewPassword, trigger: "blur" }],
  confirmPassword: [{ validator: validateConfirmPassword, trigger: "blur" }]
});

const handleSubmit = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async valid => {
    if (valid) {
      isSubmitting.value = true;
      try {
        await updateUserPassword({
          oldPassword: form.oldPassword,
          newPassword: form.newPassword
        });

        ElMessage.success("密码修改成功，请重新登录");
        emit("success");
        closeDialog();

        // 延迟退出登录
        setTimeout(() => {
          userStore.logOut();
        }, 1000);
      } catch (error: any) {
        console.error("修改密码失败:", error);
        ElMessage.error(error?.message || "修改密码失败，请稍后再试");
      } finally {
        isSubmitting.value = false;
      }
    }
  });
};

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

  // 动画
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

const onKeyDown = (event: KeyboardEvent) => {
  const { code } = event;
  if (code === "Escape") {
    closeDialog();
    return;
  }
  if (["Enter", "NumpadEnter"].includes(code)) {
    event.preventDefault();
    handleSubmit();
  }
};

watch(
  () => props.modelValue,
  newVal => {
    if (newVal) {
      form.oldPassword = "";
      form.newPassword = "";
      form.confirmPassword = "";
      nextTick(() => {
        openDialog();
        formRef.value?.clearValidate();
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
    <div v-if="modelValue" class="user-dialog-wrapper">
      <div ref="overlayRef" class="dialog-overlay" @click="handleOverlayClick">
        <div ref="dialogRef" class="dialog-container" @click.stop>
          <button class="close-btn" @click="closeDialog">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>

          <div class="dialog-header">
            <IconifyIconOffline icon="ri:lock-2-fill" class="header-icon" />
            <h2>修改密码</h2>
          </div>

          <div class="dialog-content">
            <el-form
              ref="formRef"
              :model="form"
              :rules="rules"
              label-position="top"
            >
              <el-form-item label="当前密码" prop="oldPassword">
                <el-input
                  v-model="form.oldPassword"
                  type="password"
                  placeholder="请输入当前密码"
                  show-password
                />
              </el-form-item>
              <el-form-item label="新密码" prop="newPassword">
                <el-input
                  v-model="form.newPassword"
                  type="password"
                  placeholder="请输入新密码（不少于 6 位）"
                  show-password
                />
              </el-form-item>
              <el-form-item label="确认新密码" prop="confirmPassword">
                <el-input
                  v-model="form.confirmPassword"
                  type="password"
                  placeholder="请再次输入新密码"
                  show-password
                />
              </el-form-item>
            </el-form>

            <div class="password-tips">
              <p class="tip-title">密码安全建议：</p>
              <ul>
                <li>长度至少 6 位字符</li>
                <li>建议包含大小写字母、数字和特殊字符</li>
                <li>避免使用容易被猜到的密码</li>
              </ul>
            </div>
          </div>

          <div class="dialog-footer">
            <button class="btn btn-secondary" @click="closeDialog">取消</button>
            <button
              class="btn btn-primary"
              :disabled="isSubmitting"
              @click="handleSubmit"
            >
              {{ isSubmitting ? "修改中..." : "确认修改" }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style lang="scss" scoped>
.user-dialog-wrapper {
  position: fixed;
  inset: 0;
  z-index: 2000;
}

.dialog-overlay {
  position: absolute;
  inset: 0;
  background: rgb(0 0 0 / 50%);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.dialog-container {
  position: relative;
  width: 90%;
  max-width: 480px;
  background: var(--anzhiyu-card-bg);
  border-radius: 20px;
  box-shadow: 0 20px 60px rgb(0 0 0 / 30%);
  overflow: hidden;
}

.close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  padding: 0;
  color: var(--anzhiyu-secondtext);
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: 50%;
  transition: all 0.3s;

  &:hover {
    color: var(--anzhiyu-fontcolor);
    background: var(--anzhiyu-background);
  }

  svg {
    width: 1.25rem;
    height: 1.25rem;
  }
}

.dialog-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 2rem 2rem 1.5rem;
  border-bottom: 1px solid var(--anzhiyu-card-border);

  .header-icon {
    font-size: 1.75rem;
    color: var(--anzhiyu-main);
  }

  h2 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--anzhiyu-fontcolor);
  }
}

.dialog-content {
  padding: 2rem;

  .password-tips {
    margin-top: 1.5rem;
    padding: 1rem;
    background: var(--anzhiyu-background);
    border-radius: 12px;

    .tip-title {
      margin: 0 0 0.5rem;
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--anzhiyu-fontcolor);
    }

    ul {
      margin: 0;
      padding-left: 1.5rem;

      li {
        margin-bottom: 0.25rem;
        font-size: 0.85rem;
        color: var(--anzhiyu-secondtext);
      }
    }
  }
}

.dialog-footer {
  display: flex;
  gap: 0.75rem;
  padding: 1.5rem 2rem;
  border-top: 1px solid var(--anzhiyu-card-border);
  background: var(--anzhiyu-background);

  .btn {
    flex: 1;
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    border: none;
    border-radius: 12px;
    transition: all 0.3s;

    &.btn-secondary {
      color: var(--anzhiyu-fontcolor);
      background: var(--anzhiyu-secondbg);

      &:hover {
        background: var(--anzhiyu-card-bg);
      }
    }

    &.btn-primary {
      color: var(--anzhiyu-white);
      background: var(--anzhiyu-fontcolor);

      &:hover:not(:disabled) {
        filter: brightness(1.1);
      }

      &:active:not(:disabled) {
        filter: brightness(0.95);
      }

      &:disabled {
        background: var(--anzhiyu-secondbg);
        color: var(--anzhiyu-secondtext);
        cursor: not-allowed;
        opacity: 0.6;
      }
    }
  }
}

@media (max-width: 768px) {
  .dialog-container {
    width: 95%;
  }

  .dialog-header,
  .dialog-content,
  .dialog-footer {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }
}
</style>
