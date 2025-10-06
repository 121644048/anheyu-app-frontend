<script setup lang="ts">
import { ref, nextTick, watch } from "vue";
import { gsap } from "gsap";

defineOptions({ name: "AnonymousConfirmDialog" });

const props = defineProps({
  modelValue: { type: Boolean, default: false }
});

const emit = defineEmits(["update:modelValue", "confirm"]);

const dialogRef = ref<HTMLElement>();
const overlayRef = ref<HTMLElement>();

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

const handleConfirm = () => {
  emit("confirm");
  closeDialog();
};

const onKeyDown = (event: KeyboardEvent) => {
  const { code } = event;
  if (code === "Escape") {
    closeDialog();
    return;
  }
  if (["Enter", "NumpadEnter"].includes(code)) {
    event.preventDefault();
    handleConfirm();
  }
};

watch(
  () => props.modelValue,
  newVal => {
    if (newVal) {
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
    <div v-if="modelValue" class="anonymous-dialog-wrapper">
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
            <svg
              class="header-icon"
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path
                d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
              />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
            <h2>开启匿名评论</h2>
          </div>

          <div class="dialog-content">
            <p class="description">
              开启匿名评论后，任何人将无法回复你的评论（包括博主）
            </p>
          </div>

          <div class="dialog-footer">
            <button class="btn btn-secondary" @click="closeDialog">取消</button>
            <button class="btn btn-primary" @click="handleConfirm">
              确认开启
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style lang="scss" scoped>
.anonymous-dialog-wrapper {
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
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 2.5rem 2rem 1.5rem;
  text-align: center;
  border-bottom: 1px solid var(--anzhiyu-card-border);

  .header-icon {
    color: var(--anzhiyu-main);
    filter: drop-shadow(0 4px 12px var(--anzhiyu-theme-op));
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
  text-align: center;

  .description {
    margin: 0;
    font-size: 0.95rem;
    line-height: 1.6;
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

      &:hover {
        filter: brightness(1.1);
      }

      &:active {
        filter: brightness(0.95);
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

  .dialog-header {
    padding-top: 2rem;

    .header-icon {
      width: 44px;
      height: 44px;
    }

    h2 {
      font-size: 1.25rem;
    }
  }

  .dialog-content {
    .description {
      font-size: 0.9rem;
    }
  }
}
</style>
