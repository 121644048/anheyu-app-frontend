<template>
  <div ref="thumbnailRef" class="thumbnail-container">
    <img
      v-if="imageUrl"
      :src="imageUrl"
      class="thumbnail-image"
      :style="{ opacity: isLoading ? 0 : 1 }"
      loading="lazy"
      @load="handleImageLoad"
      @error="handleImageError"
    />
    <div v-if="isLoading" class="thumbnail-placeholder is-loading">
      <el-icon><Loading /></el-icon>
    </div>
    <div v-else-if="!imageUrl" class="thumbnail-placeholder">
      <component :is="getFileIcon(file)" class="file-icon-fallback" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from "vue";
import type { PropType } from "vue";
import { FileItem, FileType } from "@/api/sys-file/type";
import { useFileIcons } from "../hooks/useFileIcons";
import { Loading } from "@element-plus/icons-vue";
import { getThumbnailCredentialApi } from "@/api/sys-file/sys-file";
import { baseUrlApi } from "@/utils/http/config";

const props = defineProps({
  file: {
    type: Object as PropType<FileItem>,
    required: true
  }
});

const thumbnailRef = ref<HTMLElement | null>(null);
const { getFileIcon } = useFileIcons();

const isLoading = ref(false);
const imageUrl = ref<string | null>(null);
let timeoutId: number | null = null;
const POLLING_INTERVAL = 5000;

const isPreviewSupported = (): boolean => {
  if (props.file.type === FileType.Dir) return false;
  const supportedExtensions = [
    "jpg",
    "jpeg",
    "png",
    "webp",
    "gif",
    "svg",
    "bmp",
    "ico",
    "heic",
    "heif",
    "tiff",
    "tif",
    "avif",
    "mp4"
  ];
  const fileExt = props.file.name.split(".").pop()?.toLowerCase() ?? "";
  return supportedExtensions.includes(fileExt);
};

const startFetchingPreview = async () => {
  if (!isPreviewSupported()) return;
  isLoading.value = true;
  await fetchPreview();
};

const fetchPreview = async () => {
  try {
    const res = await getThumbnailCredentialApi(props.file.id);

    if (res.code === 200 && res.data?.sign) {
      imageUrl.value = `${baseUrlApi("t")}/${res.data.sign}`;
      if (timeoutId) clearTimeout(timeoutId);
    } else if (res.code === 202 && res.data?.status === "processing") {
      isLoading.value = true;
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = window.setTimeout(fetchPreview, POLLING_INTERVAL);
    } else {
      console.error(`获取预览凭证时发生业务错误:`, res.message);
      handleImageError();
    }
  } catch (error: any) {
    console.error(
      `获取文件 [${props.file.name}] 预览凭证时发生网络或HTTP错误:`,
      error
    );
    handleImageError();
  }
};

const handleImageLoad = () => {
  isLoading.value = false;
};

const handleImageError = () => {
  imageUrl.value = null;
  isLoading.value = false;
};

// 生命周期与观察者
let observer: IntersectionObserver | null = null;

onMounted(() => {
  if (thumbnailRef.value && isPreviewSupported()) {
    observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          startFetchingPreview();
          if (observer && thumbnailRef.value) {
            observer.unobserve(thumbnailRef.value);
          }
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(thumbnailRef.value);
  }
});

onUnmounted(() => {
  if (timeoutId) clearTimeout(timeoutId);
  if (observer && thumbnailRef.value) {
    observer.unobserve(thumbnailRef.value);
  }
  observer = null;
});

watch(
  () => props.file.id,
  (newId, oldId) => {
    if (newId === oldId) return;
    // 重置状态
    imageUrl.value = null;
    isLoading.value = false;
    if (timeoutId) clearTimeout(timeoutId);

    // 重新观察
    if (observer && thumbnailRef.value) {
      observer.unobserve(thumbnailRef.value);
      if (isPreviewSupported()) {
        observer.observe(thumbnailRef.value);
      }
    }
  },
  { flush: "post" }
);
</script>

<style scoped>
.thumbnail-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: 6px;
}

.thumbnail-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition:
    transform 0.2s ease-in-out,
    opacity 0.3s ease-in-out;
}

.thumbnail-image:hover {
  transform: scale(1.1);
}

.thumbnail-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.thumbnail-placeholder.is-loading {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
  background-color: var(--el-fill-color-light);
}

.thumbnail-placeholder.is-loading .el-icon {
  font-size: 32px;
  color: var(--el-color-primary-light-3);
  animation: spin 1.5s linear infinite;
}

.file-icon-fallback {
  width: 50px;
  height: 50px;
  font-size: 50px;
  color: #a8abb2;
}
</style>
