<script setup lang="ts">
import { ref, reactive, nextTick, watch, computed } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { ElMessage } from "element-plus";
import { gsap } from "gsap";
import { updateUserProfile } from "@/api/user-center";

defineOptions({ name: "UserProfileDialog" });

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  userInfo: {
    type: Object as () => { nickname: string; email: string; website: string },
    required: true
  }
});

const emit = defineEmits(["update:modelValue", "success"]);

const dialogRef = ref<HTMLElement>();
const overlayRef = ref<HTMLElement>();
const formRef = ref<FormInstance>();
const isSubmitting = ref(false);

const form = reactive({
  nickname: "",
  email: "",
  website: ""
});

const rules = reactive<FormRules>({
  nickname: [
    { required: true, message: "请输入昵称", trigger: "blur" },
    { min: 2, max: 50, message: "昵称长度在 2 到 50 个字符", trigger: "blur" }
  ],
  email: [
    { required: true, message: "请输入邮箱", trigger: "blur" },
    { type: "email", message: "请输入有效的邮箱地址", trigger: "blur" }
  ],
  website: [{ type: "url", message: "请输入有效的网址", trigger: "blur" }]
});

// 检查表单是否可以提交
const isFormValid = computed(() => {
  // 昵称必填且长度在 2-50 之间
  const trimmedNickname = form.nickname?.trim() || "";
  const isNicknameValid =
    trimmedNickname.length >= 2 && trimmedNickname.length <= 50;

  // 邮箱字段是禁用的，不需要验证
  return isNicknameValid;
});

const handleSubmit = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async valid => {
    if (valid) {
      isSubmitting.value = true;
      try {
        await updateUserProfile({
          nickname: form.nickname,
          website: form.website || undefined
        });

        ElMessage.success("保存成功");
        emit("success");
        closeDialog();
      } catch (error: any) {
        console.error("保存失败:", error);
        ElMessage.error(error?.message || "保存失败，请稍后再试");
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
      // 检查昵称是否是默认的邮箱前缀
      const emailPrefix = props.userInfo.email.split("@")[0] || "";
      const isDefaultNickname = props.userInfo.nickname === emailPrefix;

      // 如果昵称是默认的，清空昵称字段，提示用户需要填写
      form.nickname = isDefaultNickname ? "" : props.userInfo.nickname;
      form.email = props.userInfo.email;
      form.website = props.userInfo.website;

      nextTick(() => {
        openDialog();
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
            <IconifyIconOffline icon="ri:edit-fill" class="header-icon" />
            <h2>编辑资料</h2>
          </div>

          <div class="dialog-content">
            <el-form
              ref="formRef"
              :model="form"
              :rules="rules"
              label-position="top"
            >
              <el-form-item label="昵称" prop="nickname">
                <el-input
                  v-model="form.nickname"
                  placeholder="请设置一个个性化的昵称"
                  maxlength="50"
                  show-word-limit
                />
              </el-form-item>
              <el-form-item label="邮箱" prop="email">
                <el-input
                  v-model="form.email"
                  placeholder="请输入邮箱"
                  type="email"
                  disabled
                />
                <span class="form-tip">邮箱暂不支持修改</span>
              </el-form-item>
              <el-form-item label="个人网站" prop="website">
                <el-input
                  v-model="form.website"
                  placeholder="请输入个人网站地址（选填）"
                />
              </el-form-item>
            </el-form>
          </div>

          <div class="dialog-footer">
            <button class="btn btn-secondary" @click="closeDialog">取消</button>
            <button
              class="btn btn-primary"
              :disabled="isSubmitting || !isFormValid"
              @click="handleSubmit"
            >
              {{ isSubmitting ? "保存中..." : "保存" }}
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

  .form-tip {
    display: block;
    margin-top: 0.5rem;
    font-size: 0.85rem;
    color: var(--anzhiyu-secondtext);
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
