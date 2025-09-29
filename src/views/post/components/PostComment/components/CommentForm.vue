<script setup lang="ts">
import {
  ref,
  reactive,
  onMounted,
  computed,
  nextTick,
  watch,
  onUnmounted
} from "vue";
import { useCommentStore } from "@/store/modules/commentStore";
import type { CreateCommentPayload } from "@/api/comment/type";
import { useSiteConfigStore } from "@/store/modules/siteConfig";
import {
  ElForm,
  ElFormItem,
  ElInput,
  ElButton,
  ElAlert,
  ElMessage
} from "element-plus";
import type { FormInstance, FormRules } from "element-plus";

import IconEmoji from "../icon/IconEmoji.vue";
import IconImage from "../icon/IconImage.vue";
import { gsap } from "gsap";
import { uploadCommentImage } from "@/api/comment";

interface EmojiPackage {
  name: string;
  type: string;
  icon: string;
  items: { icon: string; text: string }[];
}

const vLazy = {
  mounted: (el: HTMLImageElement, binding: { value: { url: string } }) => {
    el.src =
      "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          el.src = binding.value.url;
          observer.unobserve(el);
        }
      },
      { root: el.closest(".OwO-items") }
    );

    requestAnimationFrame(() => {
      observer.observe(el);
    });

    (el as any)._imageObserver = observer;
  },
  beforeUnmount: (el: HTMLElement) => {
    const observer = (el as any)._imageObserver;
    if (observer) {
      observer.disconnect();
    }
  }
};

defineOptions({ name: "CommentForm" });

const props = defineProps({
  targetPath: { type: String, required: true },
  parentId: { type: String, default: null },
  placeholder: { type: String, default: "欢迎留下宝贵的建议啦～" },
  showCancelButton: { type: Boolean, default: false },
  quoteText: { type: String, default: "" }
});

const emit = defineEmits(["submitted", "cancel", "cancel-quote"]);

const siteConfigStore = useSiteConfigStore();
const commentStore = useCommentStore();
const formRef = ref<FormInstance>();
const textareaRef = ref();
const owoContainerRef = ref<HTMLElement | null>(null);
const emojiPreviewRef = ref<HTMLElement | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);
const isUploading = ref(false);

const showEmojiPicker = ref(false);
const isPreviewVisible = ref(false);
const previewEmojiUrl = ref("");
const emojiData = ref<EmojiPackage[] | null>(null);
const activeEmojiPackageIndex = ref(0);
const isEmailValid = ref(true);

const commentInfoConfig = computed(() => {
  const config = siteConfigStore.getSiteConfig.comment;
  return {
    emoji_cdn: config.emoji_cdn,
    limit_length: config.limit_length,
    login_required: config.login_required
  };
});

const form = reactive<
  Omit<CreateCommentPayload, "target_path" | "parent_id" | "target_title">
>({
  nickname: "",
  email: "",
  website: "",
  content: ""
});

const isQQNumber = (val: string) => /^[1-9]\d{4,10}$/.test((val || "").trim());

const formRules = reactive<FormRules>({
  email: [
    {
      type: "email",
      message: "请输入有效的邮箱地址",
      trigger: ["blur", "change"]
    }
  ],
  website: [{ type: "url", message: "请输入有效的网址", trigger: "blur" }]
});

const isSubmitDisabled = computed(() => {
  if (commentInfoConfig.value.login_required) {
    return !form.content.trim();
  }
  return (
    !form.nickname.trim() ||
    !form.content.trim() ||
    !form.email.trim() ||
    !isEmailValid.value
  );
});

const handleValidate = (prop: string, isValid: boolean) => {
  if (prop === "email") isEmailValid.value = isValid;
};

const submitForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return;
  await formEl.validate(async valid => {
    if (valid) {
      const { nickname, email, content, website } = form;

      let finalContent = content;
      if (props.quoteText && props.quoteText.trim()) {
        finalContent = `> ${props.quoteText}\n\n${content}`;
      }

      const payload: CreateCommentPayload = {
        nickname,
        email,
        content: finalContent,
        target_path: props.targetPath,
        target_title: document.title,
        parent_id: props.parentId
      };
      if (website && website.trim() !== "") payload.website = website;

      try {
        await commentStore.postComment(payload);

        localStorage.setItem(
          "comment-user-info",
          JSON.stringify({ nickname, email, website })
        );
        emit("submitted");
        form.content = "";
      } catch (error) {
        console.error("评论发布失败:", error);
        ElMessage.error("评论发布失败，请稍后再试。");
      }
    }
  });
};

const fetchEmojis = async () => {
  if (!commentInfoConfig.value.emoji_cdn) return;
  try {
    const response = await fetch(commentInfoConfig.value.emoji_cdn);
    if (!response.ok) throw new Error("Network response was not ok");
    const data = await response.json();
    const packages = Object.keys(data).map(key => {
      const packageData = data[key];
      const items = packageData.container.map((item: any) => ({
        icon: item.icon.match(/src="([^"]+)"/)?.[1] || "",
        text: `:${item.text}:`
      }));
      return {
        name: key.match(/title="([^"]+)"/)?.[1] || "Emojis",
        type: packageData.type,
        icon: key,
        items
      };
    });
    emojiData.value = packages;
  } catch (error) {
    console.error("Failed to fetch emojis:", error);
  }
};

const insertTextAtCursor = (text: string) => {
  const textarea = textareaRef.value?.textarea as HTMLTextAreaElement;
  if (textarea) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const oldContent = form.content;
    form.content =
      oldContent.substring(0, start) + text + oldContent.substring(end);
    const newPos = start + text.length;
    textarea.focus();
    nextTick(() => textarea.setSelectionRange(newPos, newPos));
  } else {
    form.content += text;
  }
};

const addEmoji = (emojiText: string) => {
  const newText = ` ${emojiText} `;
  insertTextAtCursor(newText);
};

const handleImageUploadClick = () => {
  if (isUploading.value) return;
  fileInputRef.value?.click();
};

const handleFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (!file) return;
  if (!file.type.startsWith("image/")) {
    ElMessage.error("请选择有效的图片文件");
    target.value = "";
    return;
  }

  isUploading.value = true;
  try {
    const res = await uploadCommentImage(file);
    const fileId = res?.data?.id;

    if (!fileId) {
      throw new Error("服务器未返回有效的文件ID");
    }

    const internalURI = `anzhiyu://file/${fileId}`;
    const markdownImage = `![${file.name}](${internalURI})`;
    insertTextAtCursor(markdownImage);
    ElMessage.success("图片已添加，提交后即可显示");
  } catch (error: any) {
    console.error("图片上传失败:", error);
    ElMessage.error(error.message || "图片上传失败，请稍后再试。");
  } finally {
    isUploading.value = false;
    target.value = "";
  }
};

const handleEmojiEnter = async (event: MouseEvent, emoji: { icon: string }) => {
  const target = event.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();
  previewEmojiUrl.value = emoji.icon;
  isPreviewVisible.value = true;
  await nextTick();
  const previewEl = emojiPreviewRef.value;
  if (previewEl) {
    const left = rect.left + rect.width / 2 - previewEl.offsetWidth / 2;
    const top = rect.top - previewEl.offsetHeight + 3;
    previewEl.style.left = `${left}px`;
    previewEl.style.top = `${top}px`;
  }
};
const handleEmojiLeave = () => {
  isPreviewVisible.value = false;
};

const onEmojiEnter = (el: Element, done: () => void) => {
  const items = el.querySelectorAll(".OwO-item");
  const tl = gsap.timeline({ onComplete: done });
  tl.to(el, { opacity: 1, y: -5, duration: 0.2, ease: "power2.out" });
  if (items.length > 0) {
    tl.to(
      items,
      { opacity: 1, y: 0, duration: 0.3, ease: "power2.out", stagger: 0.02 },
      "-=0.1"
    );
  }
};
const onEmojiLeave = (el: Element, done: () => void) => {
  gsap.to(el, {
    opacity: 0,
    y: 15,
    duration: 0.2,
    ease: "power2.in",
    onComplete: done
  });
};

const handleClickOutside = (event: MouseEvent) => {
  if (
    owoContainerRef.value &&
    !owoContainerRef.value.contains(event.target as Node)
  ) {
    showEmojiPicker.value = false;
  }
};

watch(showEmojiPicker, isShown => {
  nextTick(() => {
    if (isShown) document.addEventListener("click", handleClickOutside);
    else document.removeEventListener("click", handleClickOutside);
  });
});

watch(
  () => form.nickname,
  val => {
    const v = (val || "").trim();
    if (isQQNumber(v)) {
      form.email = `${v}@qq.com`;
      nextTick(() => formRef.value?.validateField("email"));
    }
  }
);

watch(
  () => props.quoteText,
  newQuoteText => {
    if (newQuoteText) {
      nextTick(() => {
        textareaRef.value?.focus();
      });
    }
  },
  { immediate: true }
);

// 方案二：采用你的 watch 逻辑，但只负责动画，不再手动加载图片
watch(activeEmojiPackageIndex, () => {
  if (showEmojiPicker.value) {
    nextTick(() => {
      const items = owoContainerRef.value?.querySelectorAll(".OwO-item");
      if (items && items.length > 0) {
        // 重置状态到初始动画状态 (由CSS定义)
        gsap.set(items, { opacity: 0, y: 20 });
        // 重新应用进入动画
        gsap.to(items, {
          opacity: 1,
          y: 0,
          duration: 0.3,
          ease: "power2.out",
          stagger: 0.02
        });
      }
    });
  }
});

onMounted(() => {
  fetchEmojis();
  const userInfo = localStorage.getItem("comment-user-info");
  if (userInfo) {
    const { nickname, email, website } = JSON.parse(userInfo);
    form.nickname = nickname;
    form.email = email;
    form.website = website;
  }
  nextTick(() => {
    if (props.showCancelButton) {
      textareaRef.value?.focus();
    }
  });
});

onUnmounted(() => document.removeEventListener("click", handleClickOutside));
</script>

<template>
  <div class="comment-form">
    <div v-if="props.quoteText && props.quoteText.trim()" class="quote-preview">
      <div class="quote-preview-header">
        <i class="anzhiyufont anzhiyu-icon-quote" />
        <span class="quote-preview-title">正在引用</span>
        <button
          class="quote-preview-close"
          type="button"
          title="取消引用"
          @click="$emit('cancel-quote')"
        >
          <i class="anzhiyufont anzhiyu-icon-xmark" />
        </button>
      </div>
      <div class="quote-preview-content">
        {{ props.quoteText }}
      </div>
    </div>
    <el-form
      ref="formRef"
      :model="form"
      :rules="formRules"
      @validate="handleValidate"
    >
      <div class="textarea-container">
        <el-form-item prop="content">
          <div class="textarea-wrapper">
            <el-input
              ref="textareaRef"
              v-model="form.content"
              type="textarea"
              :rows="5"
              :placeholder="props.placeholder"
              show-word-limit
              :maxlength="commentInfoConfig.limit_length"
            />
            <div class="textarea-actions">
              <div
                v-if="emojiData"
                ref="owoContainerRef"
                :class="['action-icon', 'OwO', { 'OwO-open': showEmojiPicker }]"
                @click.stop="showEmojiPicker = !showEmojiPicker"
              >
                <div class="OwO-logo"><IconEmoji /></div>
                <transition
                  :css="false"
                  @enter="onEmojiEnter"
                  @leave="onEmojiLeave"
                >
                  <div v-if="showEmojiPicker" class="OwO-body">
                    <ul class="OwO-items">
                      <li
                        v-for="emoji in emojiData[activeEmojiPackageIndex]
                          .items"
                        :key="emoji.text"
                        class="OwO-item"
                        :title="emoji.text"
                        @click.stop="addEmoji(emoji.text)"
                        @mouseenter="handleEmojiEnter($event, emoji)"
                        @mouseleave="handleEmojiLeave"
                      >
                        <img v-lazy="{ url: emoji.icon }" :alt="emoji.text" />
                      </li>
                    </ul>
                    <div class="OwO-bar">
                      <ul class="OwO-packages">
                        <li
                          v-for="(pkg, index) in emojiData"
                          :key="pkg.name"
                          :class="{
                            'OwO-package-active':
                              activeEmojiPackageIndex === index
                          }"
                          @click.stop="activeEmojiPackageIndex = index"
                        >
                          <div v-html="pkg.icon" />
                        </li>
                      </ul>
                    </div>
                  </div>
                </transition>
              </div>
              <button
                class="action-icon"
                type="button"
                :disabled="isUploading"
                :title="isUploading ? '上传中...' : '上传图片'"
                @click="handleImageUploadClick"
              >
                <IconImage />
              </button>
              <input
                ref="fileInputRef"
                type="file"
                style="display: none"
                accept="image/*"
                @change="handleFileChange"
              />
            </div>
          </div>
        </el-form-item>
      </div>
      <div v-if="!commentInfoConfig.login_required">
        <div
          :class="['form-meta-actions', { 'is-reply': props.showCancelButton }]"
        >
          <div class="meta-inputs">
            <el-form-item prop="nickname">
              <el-input v-model="form.nickname" placeholder="必填">
                <template #prepend>昵称</template>
              </el-input>
            </el-form-item>
            <el-form-item prop="email">
              <el-input v-model="form.email" placeholder="必填">
                <template #prepend>邮箱</template>
              </el-input>
            </el-form-item>
            <el-form-item prop="website">
              <el-input v-model="form.website" placeholder="选填">
                <template #prepend>网址</template>
              </el-input>
            </el-form-item>
          </div>
          <div class="buttons-wrapper">
            <el-button
              v-if="props.showCancelButton"
              class="cancel-button"
              @click="$emit('cancel')"
            >
              取消
            </el-button>
            <el-button
              type="primary"
              class="submit-button"
              :disabled="isSubmitDisabled"
              @click="submitForm(formRef)"
            >
              发送
            </el-button>
          </div>
        </div>
      </div>
      <div v-else>
        <el-alert
          title="需要登录后才能发表评论"
          type="info"
          show-icon
          :closable="false"
        />
      </div>
    </el-form>
    <div v-if="isPreviewVisible" ref="emojiPreviewRef" class="emoji-preview">
      <img :src="previewEmojiUrl" alt="emoji-preview" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
@keyframes owoIn {
  from {
    opacity: 0;
    transform: translateY(0) scale(0.8);
  }

  to {
    opacity: 1;
    transform: translateY(-10px) scale(1);
  }
}

.emoji-preview {
  position: fixed;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  pointer-events: none;
  background-color: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgb(0 0 0 / 10%);
  transform: translateY(-10px);
  animation: owoIn 0.2s cubic-bezier(0.42, 0, 0.3, 1.11);

  img {
    display: block;
    width: 64px;
    height: 64px;
  }
}

.comment-form {
  border-radius: 8px;
}

.quote-preview {
  position: relative;
  padding: 1rem;
  margin-bottom: 1rem;
  background: var(--anzhiyu-secondbg);
  border: var(--style-border-always);
  border-radius: 8px;

  .quote-preview-header {
    display: flex;
    align-items: center;
    margin-bottom: 0.5rem;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--anzhiyu-main);

    i {
      font-size: 1rem;
    }

    .quote-preview-title {
      flex: 1;
    }

    .quote-preview-close {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 1rem;
      height: 1rem;
      padding: 2px;
      color: var(--anzhiyu-secondtext);
      cursor: pointer;
      background: none;
      border: none;
      border-radius: 4px;
      transition: all 0.3s;

      &:hover {
        color: var(--anzhiyu-main);
        background: var(--anzhiyu-gray-op);
      }

      i {
        font-size: 0.8rem;
      }
    }
  }

  .quote-preview-content {
    position: relative;
    padding: 8px 12px;
    font-size: 0.9rem;
    line-height: 1.5;
    color: var(--anzhiyu-secondtext);
    background: var(--anzhiyu-background);

    &::before {
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      width: 4px;
      content: "";
      background: var(--anzhiyu-main);
      border-radius: 2px;
    }
  }
}

.textarea-container {
  margin-bottom: 0.5rem;

  & > .el-form-item {
    margin-bottom: 0;
  }
}

.textarea-wrapper {
  position: relative;
  width: 100%;
  padding: 16px;
  background-color: var(--anzhiyu-secondbg);
  border: var(--style-border-always);
  border-radius: 12px;
  transition: border 0.2s;

  &:focus-within {
    border: var(--style-border-hover-always);
  }

  .textarea-actions {
    z-index: 2;
    display: flex;
    gap: 8px;

    .OwO {
      position: relative;

      &.OwO-open .OwO-body {
        display: block;
      }

      .OwO-logo {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 1.25em;
        height: 1.25em;
      }

      .OwO-body {
        position: absolute;
        top: 2rem;
        left: 0;
        z-index: 1000;
        min-width: 31.25rem;
        max-width: 500px;
        overflow: hidden;
        cursor: auto;
        background-color: var(--anzhiyu-card-bg);
        backdrop-filter: saturate(180%) blur(10px);
        border: var(--style-border-always);
        border-radius: 8px;
        opacity: 0;
        transform: translateZ(0);

        .OwO-items {
          max-height: 200px;
          padding: 10px;
          overflow-y: auto;

          .OwO-item {
            box-sizing: border-box;
            display: inline-block;
            width: 14%;
            padding: 5px 10px;
            font-size: 12px;
            line-height: 14px;
            text-align: center;
            list-style-type: none;
            cursor: pointer;
            border-radius: 5px;
            opacity: 0;
            transition: background-color 0.3s;
            transform: translateY(20px);

            &:hover {
              background-color: rgb(144 147 153 / 13%);
            }

            img {
              width: 2.25rem;
              max-width: 100%;
              height: 2.25rem;
              object-fit: contain;
            }
          }
        }
      }

      .OwO-bar {
        width: 100%;
        border-top: 1px solid rgb(144 147 153 / 31%);
        border-radius: 0 0 4px 4px;

        .OwO-packages {
          height: 48px;
          padding: 0;
          margin: 0;
          font-size: 0;
          background: var(--anzhiyu-background);

          .OwO-package-active {
            background: var(--anzhiyu-card-bg);
          }

          li:nth-child(1) {
            border-radius: 0 0 0 3px;
          }

          li {
            display: inline-block;
            width: 50px;
            padding: 0 10px;
            font-size: 28px;
            line-height: 48px;
            list-style-type: none;
            cursor: pointer;
            transition: 0.3s;
          }
        }
      }
    }

    .action-icon {
      display: inline-block;
      flex-shrink: 0;
      align-self: center;
      width: 1.25em;
      margin-right: 10px;
      line-height: 0;
      color: var(--anzhiyu-fontcolor);
      cursor: pointer;
      user-select: none;
      background: var(--anzhiyu-secondbg);
      border-radius: 50%;
      transition: background-color 0.2s;

      &:hover {
        background-color: var(--anzhiyu-post-blockquote-bg);
      }

      &[disabled] {
        cursor: not-allowed;
        opacity: 0.5;
      }
    }
  }

  :deep(.el-textarea__inner) {
    padding: 0;
    color: var(--anzhiyu-fontcolor);
    background-color: transparent;
    border: none;
    border-radius: 0;
    box-shadow: none;

    &:focus {
      box-shadow: none;
    }

    &:hover {
      box-shadow: none;
    }
  }

  :deep(.el-input__count) {
    bottom: -25px;
    color: var(--anzhiyu-secondtext);
    user-select: none;
    background: transparent;
  }
}

.form-meta-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: flex-start;

  .meta-inputs {
    display: grid;
    flex-grow: 1;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;

    :deep(.el-form-item) {
      &:nth-child(1) .el-input-group--prepend {
        &::before {
          content: "输入QQ号会自动获取昵称和头像";
        }

        &::after {
          content: "";
        }
      }

      &:nth-child(2) .el-input-group--prepend {
        &::before {
          content: "收到回复将会发送到你的邮箱";
        }

        &::after {
          content: "";
        }
      }
    }

    :deep(.el-input-group--prepend) {
      &::before {
        position: absolute;
        top: -50px;
        left: 50%;
        z-index: 100;
        display: none;
        padding: 4px 18px;
        color: var(--anzhiyu-white);
        white-space: nowrap;
        background: var(--anzhiyu-main-op-deep);
        backdrop-filter: blur(10px);
        border-radius: 10px;
        transform: translate(-50%);
      }

      &:focus-within::before {
        z-index: 2;
        display: block;
        animation: commonTipsIn 0.3s;
      }

      &::after {
        position: absolute;
        left: 50%;
        display: none;
        border: 8px solid transparent;
        border-top-color: var(--anzhiyu-main-op-deep);
        transform: translate(-50%, -10px);
      }

      &:focus-within::after {
        display: block;
        animation: commonTriangleIn 0.3s;
      }
    }

    :deep(.el-input-group__prepend) {
      font-weight: 600;
      color: var(--anzhiyu-fontcolor);
      background-color: var(--anzhiyu-secondbg);
    }

    :deep(.el-input__inner) {
      border-top-left-radius: 0;
      border-bottom-left-radius: 0;
    }
  }

  .buttons-wrapper {
    display: flex;
    gap: 0.5rem;

    .submit-button {
      padding: 0 2rem;
      font-weight: 600;
      color: var(--anzhiyu-background);
      background-color: var(--anzhiyu-fontcolor);
      border: 0 solid var(--anzhiyu-main);

      &.is-disabled {
        opacity: 0.2;
      }
    }

    .cancel-button {
      color: var(--anzhiyu-fontcolor);
      background: var(--anzhiyu-secondbg);
      border: 0 solid var(--anzhiyu-main);
      border-radius: 12px;

      &:hover {
        color: var(--anzhiyu-white);
        background: var(--anzhiyu-lighttext);
      }
    }
  }

  &.is-reply {
    flex-direction: column;
    gap: 0;

    .meta-inputs {
      grid-template-columns: repeat(3, 1fr);
      width: 100%;
    }

    .buttons-wrapper {
      align-self: flex-end;
      margin-top: 0.5rem;
    }
  }
}

@media (width <= 768px) {
  .form-meta-actions:not(.is-reply) {
    flex-direction: column;

    .meta-inputs {
      grid-template-columns: 1fr;
      width: 100%;
    }

    .buttons-wrapper {
      width: 100%;

      .submit-button {
        width: 100%;
      }
    }
  }

  .OwO-body {
    width: calc(100vw - 2rem - 32px);
    min-width: auto !important;

    .OwO-items .OwO-item {
      width: 25% !important;
    }
  }

  .form-meta-actions {
    gap: 0;
    margin-top: 1rem;

    .meta-inputs {
      gap: 0;
    }
  }
}
</style>
