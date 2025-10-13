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
import { useUserStoreHook } from "@/store/modules/user";
import {
  ElForm,
  ElFormItem,
  ElInput,
  ElButton,
  ElMessage,
  ElTooltip
} from "element-plus";
import type { FormInstance, FormRules } from "element-plus";

import IconEmoji from "../icon/IconEmoji.vue";
import IconImage from "../icon/IconImage.vue";
import LoginDialog from "@/components/LoginDialog/index.vue";
import UserProfileDialog from "@/components/UserProfileDialog/index.vue";
import AnonymousConfirmDialog from "@/components/AnonymousConfirmDialog/index.vue";
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

const emit = defineEmits([
  "submitted",
  "cancel",
  "cancel-quote",
  "anonymous-state-change"
]);

const siteConfigStore = useSiteConfigStore();
const commentStore = useCommentStore();
const userStore = useUserStoreHook();
const formRef = ref<FormInstance>();
const textareaRef = ref();
const owoContainerRef = ref<HTMLElement | null>(null);
const emojiPreviewRef = ref<HTMLElement | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);
const isUploading = ref(false);
const isSubmitting = ref(false);
const isAnonymous = ref(false);

const showEmojiPicker = ref(false);
const isPreviewVisible = ref(false);
const previewEmojiUrl = ref("");
const emojiData = ref<EmojiPackage[] | null>(null);
const activeEmojiPackageIndex = ref(0);
const isEmailValid = ref(true);
const showLoginDialog = ref(false);
const loginDialogInitialStep = ref<"check-email" | "register-form">(
  "check-email"
);
const showAnonymousConfirmDialog = ref(false);
const showProfileDialog = ref(false);

const commentInfoConfig = computed(() => {
  const config = siteConfigStore.getSiteConfig.comment;
  return {
    emoji_cdn: config.emoji_cdn,
    limit_length: config.limit_length,
    login_required: config.login_required,
    anonymous_email: config.anonymous_email || ""
  };
});

// 获取匿名评论使用的邮箱
const getAnonymousEmail = computed(() => {
  const anonymousEmail = commentInfoConfig.value.anonymous_email;
  if (anonymousEmail && anonymousEmail.trim()) {
    return anonymousEmail;
  }
  // 如果为空，使用前台网站拥有者邮箱
  return siteConfigStore.getSiteConfig.frontDesk?.siteOwner?.email || "";
});

// 检查用户是否已登录
const isLoggedIn = computed(() => {
  return !!userStore.username && userStore.roles.length > 0;
});

// 获取用户信息
const userInfo = computed(() => ({
  nickname: userStore.nickname || userStore.username || "",
  email: userStore.email || "",
  website: userStore.website || ""
}));

// 是否显示评论表单（输入框等）
const shouldShowCommentForm = computed(() => {
  return !commentInfoConfig.value.login_required || isLoggedIn.value;
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
  if (isSubmitting.value) return true;
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

const openLoginDialog = (
  step: "check-email" | "register-form" = "check-email"
) => {
  loginDialogInitialStep.value = step;
  showLoginDialog.value = true;
};

const handleLoginSuccess = () => {
  // 登录成功后，检查并填充用户信息
  fillUserInfoFromStore();
  // 刷新页面重新加载评论
  window.location.reload();
};

const handleProfileUpdateSuccess = () => {
  // 用户资料更新成功后，重新加载用户信息
  userStore.fetchUserInfo();
  ElMessage.success("个人信息已更新，现在可以发表评论了");
};

// 生成随机名称
const generateRandomName = () => {
  const adjectives = [
    "快乐的",
    "勇敢的",
    "聪明的",
    "可爱的",
    "温柔的",
    "活泼的",
    "安静的",
    "神秘的"
  ];
  const nouns = [
    "小熊",
    "小兔",
    "小鸟",
    "小鱼",
    "小猫",
    "小狗",
    "小鹿",
    "小狐"
  ];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 999) + 1;
  return `${adj}${noun}${num}`;
};

// 显示匿名确认弹窗或关闭匿名模式
const showAnonymousDialog = () => {
  if (!isAnonymous.value) {
    // 未开启匿名，显示确认弹窗
    showAnonymousConfirmDialog.value = true;
    return false; // 返回当前状态（未开启）
  } else {
    // 已开启匿名，直接关闭匿名模式
    isAnonymous.value = false;
    loadUserInfo();
    emit("anonymous-state-change", false);
    ElMessage.success({
      message: "已关闭匿名评论模式",
      duration: 2000
    });
    return false; // 返回新状态（已关闭）
  }
};

// 处理匿名评论切换
const handleAnonymousToggle = () => {
  if (!isAnonymous.value) {
    isAnonymous.value = true;
    // 生成随机名称和使用匿名邮箱
    form.nickname = generateRandomName();
    form.email = getAnonymousEmail.value;
    showAnonymousConfirmDialog.value = false;
    emit("anonymous-state-change", true);
    ElMessage.success({
      message: "已开启匿名评论模式",
      duration: 2000
    });
  } else {
    // 关闭匿名评论，恢复之前的信息
    isAnonymous.value = false;
    loadUserInfo();
    emit("anonymous-state-change", false);
  }
};

// 检查用户信息是否需要完善
const checkUserProfileComplete = (): boolean => {
  if (!isLoggedIn.value) return true; // 未登录用户不需要检查
  if (isAnonymous.value) return true; // 匿名评论不需要检查

  const nickname = userStore.nickname || userStore.username || "";
  const email = userStore.email || "";
  const website = userStore.website || "";

  // 提取邮箱前缀（@ 之前的部分）
  const emailPrefix = email.split("@")[0] || "";

  // 条件1：没有填写过个人网站
  const hasNoWebsite = !website || website.trim() === "";

  // 条件2：昵称是邮箱的前缀
  const isDefaultNickname = nickname === emailPrefix;

  // 两个条件同时满足才需要完善信息
  return !(hasNoWebsite && isDefaultNickname);
};

const submitForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return;

  // 检查是否需要完善用户信息
  if (!checkUserProfileComplete()) {
    ElMessage.warning("请先完善您的个人信息");
    showProfileDialog.value = true;
    return;
  }

  await formEl.validate(async valid => {
    if (valid) {
      isSubmitting.value = true;

      // 如果用户已登录，使用 userStore 中的信息
      let nickname, email, website;
      if (isLoggedIn.value) {
        nickname = userStore.nickname || userStore.username || "";
        email = userStore.email || "";
        website = form.website || ""; // 登录用户仍然可以填写网址（如果有的话）
      } else {
        nickname = form.nickname;
        email = form.email;
        website = form.website;
      }

      let finalContent = form.content;
      if (props.quoteText && props.quoteText.trim()) {
        finalContent = `> ${props.quoteText}\n\n${form.content}`;
      }

      const payload: CreateCommentPayload = {
        nickname,
        email,
        content: finalContent,
        target_path: props.targetPath,
        target_title: document.title,
        parent_id: props.parentId,
        is_anonymous: isAnonymous.value // 明确告诉后端这是匿名评论
      };
      if (website && website.trim() !== "") payload.website = website;

      try {
        await commentStore.postComment(payload);

        // 仅在未登录时保存用户信息到 localStorage
        if (!isLoggedIn.value) {
          localStorage.setItem(
            "comment-user-info",
            JSON.stringify({ nickname, email, website })
          );
        }
        emit("submitted");
        form.content = "";
      } catch (error) {
        console.error("评论发布失败:", error);
        ElMessage.error("评论发布失败，请稍后再试。");
      } finally {
        isSubmitting.value = false;
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

// 检测是否为移动设备
const isMobileDevice = () => {
  return (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    ) || window.innerWidth <= 768
  );
};

const handleEmojiEnter = async (event: MouseEvent, emoji: { icon: string }) => {
  // 移动端不显示表情预览，避免影响点击
  if (isMobileDevice()) return;

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

// 实时保存用户信息到 localStorage
watch(
  [() => form.nickname, () => form.email, () => form.website],
  ([nickname, email, website]) => {
    // 如果至少有一个字段有值，就保存
    if (nickname || email || website) {
      const userInfo = {
        nickname: nickname || "",
        email: email || "",
        website: website || ""
      };
      localStorage.setItem("comment-user-info", JSON.stringify(userInfo));
    }
  },
  { deep: false }
);

const loadUserInfo = () => {
  const userInfo = localStorage.getItem("comment-user-info");
  if (userInfo) {
    try {
      const { nickname, email, website } = JSON.parse(userInfo);
      if (nickname) form.nickname = nickname;
      if (email) form.email = email;
      if (website) form.website = website;
    } catch (error) {
      console.error("Failed to parse user info from localStorage:", error);
    }
  }
};

// 从 userStore 中填充用户信息（用于登录后自动填充）
const fillUserInfoFromStore = () => {
  // 如果用户已登录，检查表单字段是否为空
  if (isLoggedIn.value) {
    // 如果昵称为空，使用 userStore 中的昵称或用户名
    if (!form.nickname.trim()) {
      form.nickname = userStore.nickname || userStore.username || "";
    }
    // 如果邮箱为空，使用 userStore 中的邮箱
    if (!form.email.trim()) {
      form.email = userStore.email || "";
    }
  }
};

watch(
  () => props.showCancelButton,
  newValue => {
    if (newValue) {
      // 当打开回复框时，自动填充用户信息
      loadUserInfo();
      nextTick(() => {
        textareaRef.value?.focus();
      });
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
  loadUserInfo();
  // 如果用户已登录且表单为空，使用用户信息填充
  fillUserInfoFromStore();
  nextTick(() => {
    if (props.showCancelButton) {
      textareaRef.value?.focus();
    }
  });
});

onUnmounted(() => document.removeEventListener("click", handleClickOutside));

defineExpose({
  showAnonymousDialog
});
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
      <div v-if="shouldShowCommentForm" class="textarea-container">
        <el-form-item prop="content">
          <div :class="['textarea-wrapper', { 'is-logged-in': isLoggedIn }]">
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
            <!-- 登录后显示的发送按钮 -->
            <div v-if="isLoggedIn" class="logged-in-submit-wrapper">
              <el-button
                v-if="props.showCancelButton"
                class="cancel-button"
                size="small"
                @click="$emit('cancel')"
              >
                取消
              </el-button>
              <el-button
                type="primary"
                class="logged-in-submit-button"
                size="small"
                :loading="isSubmitting"
                :disabled="isSubmitDisabled"
                @click="submitForm(formRef)"
              >
                发送
              </el-button>
            </div>
          </div>
        </el-form-item>
      </div>
      <div v-if="shouldShowCommentForm && !isLoggedIn">
        <div
          :class="['form-meta-actions', { 'is-reply': props.showCancelButton }]"
        >
          <div class="meta-inputs">
            <el-form-item prop="nickname">
              <el-input
                v-model="form.nickname"
                placeholder="必填"
                :disabled="isAnonymous"
              >
                <template #prepend>昵称</template>
              </el-input>
            </el-form-item>
            <el-form-item prop="email">
              <el-input
                v-model="form.email"
                placeholder="必填"
                :disabled="isAnonymous"
              >
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
              :loading="isSubmitting"
              :disabled="isSubmitDisabled"
              @click="submitForm(formRef)"
            >
              发送
            </el-button>
          </div>
        </div>
      </div>
      <div v-else-if="!shouldShowCommentForm">
        <div class="login-required-wrapper">
          <div class="login-required-content">
            <svg
              class="login-icon"
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
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <h3 class="login-title">请登录后发表评论</h3>
            <div class="login-actions">
              <el-button
                type="primary"
                size="large"
                class="login-button"
                @click="openLoginDialog('check-email')"
              >
                登录
              </el-button>
              <el-button
                size="large"
                class="register-button"
                @click="openLoginDialog('register-form')"
              >
                注册
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </el-form>
    <div v-if="isPreviewVisible" ref="emojiPreviewRef" class="emoji-preview">
      <img :src="previewEmojiUrl" alt="emoji-preview" />
    </div>

    <!-- 登录弹窗 -->
    <LoginDialog
      v-model="showLoginDialog"
      :initial-step="loginDialogInitialStep"
      :hide-theme-switch="true"
      @login-success="handleLoginSuccess"
    />

    <!-- 用户资料编辑弹窗 -->
    <UserProfileDialog
      v-model="showProfileDialog"
      :user-info="userInfo"
      @success="handleProfileUpdateSuccess"
    />

    <!-- 匿名评论确认弹窗 -->
    <AnonymousConfirmDialog
      v-model="showAnonymousConfirmDialog"
      @confirm="handleAnonymousToggle"
    />
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
    margin-top: 0.875rem;

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

  // 登录后隐藏字符计数
  &.is-logged-in {
    :deep(.el-input__count) {
      display: none;
    }
  }

  // 登录后的发送按钮容器
  .logged-in-submit-wrapper {
    position: absolute;
    right: 16px;
    bottom: 16px;
    z-index: 3;
    display: flex;
    gap: 8px;
    align-items: center;

    .logged-in-submit-button {
      min-width: 80px;
      font-weight: 600;
      color: var(--anzhiyu-background);
      background-color: var(--anzhiyu-fontcolor);
      border: 0 solid var(--anzhiyu-main);
      transition: all 0.3s;

      &:hover {
        opacity: 0.85;
      }

      &.is-disabled {
        opacity: 0.2;
      }
    }

    .cancel-button {
      color: var(--anzhiyu-fontcolor);
      background: var(--anzhiyu-secondbg);
      border: 1px solid var(--anzhiyu-card-border);

      &:hover {
        color: var(--anzhiyu-white);
        background: var(--anzhiyu-lighttext);
      }
    }
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
    align-items: center;

    .submit-button {
      min-width: 112px;
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

.login-required-wrapper {
  position: relative;
  padding: 2rem;
  background: var(--anzhiyu-secondbg);
  border: var(--style-border-always);
  border-radius: 1.25rem;
  overflow: hidden;
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes rotateGradient {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.login-required-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  position: relative;
  z-index: 1;
  gap: 0.25rem;
}

.login-icon {
  filter: drop-shadow(0 4px 12px var(--anzhiyu-theme-op));
  animation: iconFloat 3.5s ease-in-out infinite;
  transition: all 0.3s ease;

  .login-required-wrapper:hover & {
    transform: scale(1.08) translateY(-2px);
  }
}

@keyframes iconFloat {
  0%,
  100% {
    transform: translateY(0) rotate(0deg);
  }
  25% {
    transform: translateY(-8px) rotate(-2deg);
  }
  75% {
    transform: translateY(-8px) rotate(2deg);
  }
}

.login-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
  letter-spacing: -0.02em;
}

.login-actions {
  display: flex;
  gap: 0.875rem;
  width: 100%;
  max-width: 22rem;

  .el-button {
    flex: 1;
    height: 3rem;
    font-size: 1rem;
    border: var(--style-border-always);
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
  }

  .login-button {
    background: var(--anzhiyu-fontcolor);
  }

  .register-button {
    background: var(--anzhiyu-card-bg);
    margin: 0;
  }
}

// 移动端适配
@media (max-width: 768px) {
  .login-required-wrapper {
    padding: 2.5rem 1.5rem;
    border-radius: 1rem;

    &:hover {
      transform: translateY(-2px);
    }
  }

  .login-icon {
    width: 44px;
    height: 44px;
    margin-bottom: 1rem;
  }

  .login-title {
    font-size: 1.25rem;
    margin-bottom: 0.5rem;
  }

  .login-actions {
    flex-direction: column;
    gap: 0.75rem;
    max-width: 100%;

    .el-button {
      width: 100%;
      height: 2.75rem;
      font-size: 0.9375rem;

      &:hover {
        transform: translateY(-2px) scale(1.01);
      }
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

  .form-meta-actions.is-reply {
    .meta-inputs {
      grid-template-columns: 1fr;
      gap: 0.75rem;
    }

    .buttons-wrapper {
      width: 100%;

      .cancel-button,
      .submit-button {
        flex: 1;
        width: auto;
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
    margin-top: 1rem;

    .meta-inputs {
      gap: 0.75rem;

      :deep(.el-form-item) {
        margin-bottom: 0;
      }
    }
  }
}
</style>
