<template>
  <Teleport to="body">
    <Transition name="az-fade">
      <div v-if="visible" class="az-text-preview-overlay" @click.self="close">
        <div
          ref="modalRef"
          class="editor-modal"
          :class="{ 'light-theme': currentTheme === 'vs' }"
        >
          <div v-if="!isLoading" class="editor-header">
            <div class="header-left">
              <!-- 保存按钮 -->
              <el-button
                type="primary"
                size="small"
                :loading="isSaving"
                :disabled="!isDirty"
                @click="handleSave"
              >
                <span :class="{ 'is-dirty': isDirty }">保存</span>
              </el-button>

              <!-- 设置按钮 -->
              <el-button
                size="small"
                :icon="Setting"
                circle
                @click="toggleSettingsMenu"
              />
            </div>

            <div class="header-center">
              <div class="file-info">
                <component :is="fileIcon" class="file-icon" />
                <span class="file-name">{{ currentFile?.name }}</span>
              </div>
            </div>

            <div class="header-right">
              <el-tooltip content="全屏" placement="bottom" :show-arrow="false">
                <span class="action-btn" @click="toggleFullScreen">
                  <IconifyIconOnline icon="ant-design:fullscreen-outlined" />
                </span>
              </el-tooltip>
              <el-tooltip content="关闭" placement="bottom" :show-arrow="false">
                <span class="action-btn" @click="close">
                  <IconifyIconOnline icon="ant-design:close-outlined" />
                </span>
              </el-tooltip>
            </div>
          </div>

          <div class="editor-content-wrapper">
            <div v-if="isLoading" class="loading-container">
              <div class="loading-spinner" />
              <span v-if="isMonacoLoading" class="loading-text"
                >编辑器首次加载中...</span
              >
            </div>
            <div ref="editorContainerRef" class="editor-container" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- 手动控制的设置菜单 -->
  <Teleport to="body">
    <Transition name="context-menu-fade-scale">
      <div
        v-if="isSettingsMenuVisible"
        ref="settingsMenuRef"
        class="editor-settings-popper"
        :style="{
          top: settingsMenuPosition.y + 'px',
          left: settingsMenuPosition.x + 'px'
        }"
      >
        <el-menu
          class="editor-settings-menu"
          :teleported="false"
          @select="handleMenuSelect"
        >
          <el-sub-menu index="language" :teleported="false">
            <template #title><span>文本类型</span></template>
            <el-scrollbar max-height="300px">
              <el-menu-item
                v-for="lang in supportedLanguages"
                :key="lang.id"
                :index="`language:${lang.id}`"
              >
                {{ lang.label }}
              </el-menu-item>
            </el-scrollbar>
          </el-sub-menu>
          <el-menu-item index="toggle-word-wrap">
            <div class="menu-item-content">
              <el-icon v-if="wordWrap" :size="16"><Check /></el-icon>
              <span v-else class="icon-placeholder" />
              <span>自动换行</span>
            </div>
          </el-menu-item>
        </el-menu>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onUnmounted, watch, nextTick, computed } from "vue";
import { onClickOutside } from "@vueuse/core";
import type * as Monaco from "monaco-editor";
import { useFileIcons } from "@/views/system/file-management/hooks/useFileIcons";
import { type FileItem, FileType } from "@/api/sys-file/type";
import { fetchBlobFromUrl } from "@/api/sys-file/sys-file";
import { ElMessage } from "element-plus";
import { Setting, Check } from "@element-plus/icons-vue";
import { useMonacoTheme } from "../hooks/useMonacoTheme";

// Monaco 相关
let monaco: typeof Monaco | null = null;
let editorInstance: Monaco.editor.IStandaloneCodeEditor | null = null;
const editorContainerRef = ref<HTMLElement | null>(null);
const modalRef = ref<HTMLElement | null>(null);
const isMonacoLoading = ref(false);

// 组件状态
const visible = ref(false);
const isLoading = ref(true);
const isSaving = ref(false);
const isDirty = ref(false);
const currentFile = ref<FileItem | null>(null);
const currentEtag = ref<string | undefined>(undefined);
const onSaveCallback = ref<
  | ((file: FileItem, content: string) => Promise<boolean | Partial<FileItem>>)
  | null
>(null);

// 编辑器设置状态
const wordWrap = ref(true);
const currentLanguage = ref("plaintext");
const settingsMenuRef = ref(null);
const isSettingsMenuVisible = ref(false);
const settingsMenuPosition = ref({ x: 0, y: 0 });

// 主题管理
const { monacoTheme } = useMonacoTheme();
const currentTheme = computed<"vs" | "vs-dark">(() =>
  monacoTheme.value === "light" ? "vs" : "vs-dark"
);

// 静态数据
const supportedLanguages = ref([
  { id: "plaintext", label: "Plain Text" },
  { id: "python", label: "Python" },
  { id: "javascript", label: "JavaScript" },
  { id: "typescript", label: "TypeScript" },
  { id: "html", label: "HTML" },
  { id: "css", label: "CSS" },
  { id: "json", label: "JSON" },
  { id: "markdown", label: "Markdown" },
  { id: "java", label: "Java" },
  { id: "go", label: "Go" },
  { id: "c", label: "C" },
  { id: "cpp", label: "C++" },
  { id: "csharp", label: "C#" },
  { id: "shell", label: "Shell" },
  { id: "ruby", label: "Ruby" },
  { id: "rust", label: "Rust" },
  { id: "vue", label: "Vue" }
]);

const { getFileIcon, getLanguageByExtension } = useFileIcons();

const fileIcon = computed(() => {
  if (currentFile.value) return getFileIcon(currentFile.value);
  const fallbackFile: FileItem = {
    id: "",
    name: "unknown",
    type: FileType.File,
    size: 0,
    created_at: "",
    updated_at: "",
    path: "",
    owned: false,
    shared: false,
    permission: null,
    capability: "",
    primary_entity_public_id: ""
  };
  return getFileIcon(fallbackFile);
});

const loadMonaco = async () => {
  if (monaco) return;
  isMonacoLoading.value = true;
  try {
    monaco = await import("monaco-editor");
  } catch (error) {
    console.error("Failed to load Monaco Editor:", error);
    ElMessage.error("编辑器核心组件加载失败！");
    throw error;
  } finally {
    isMonacoLoading.value = false;
  }
};

const open = async (file: FileItem, url: string, onSave?: any) => {
  visible.value = true;
  isLoading.value = true;

  currentFile.value = file;
  currentEtag.value = file.etag;
  isDirty.value = false;
  onSaveCallback.value = onSave || null;

  try {
    const [_, content] = await Promise.all([
      loadMonaco(),
      fetchBlobFromUrl(url).then(b => b.text())
    ]);

    isLoading.value = false;
    await nextTick();

    if (visible.value) {
      initEditor(content);
    }
  } catch (error) {
    console.error("Failed to open or load content:", error);
    ElMessage.error("打开文件失败。");
    close();
  }
};

const initEditor = (content: string) => {
  if (!editorContainerRef.value || !currentFile.value || !monaco) return;
  const languageFromFile = getLanguageByExtension(
    currentFile.value.name.split(".").pop() || ""
  );
  currentLanguage.value = languageFromFile;

  if (editorInstance) editorInstance.dispose();

  editorInstance = monaco.editor.create(editorContainerRef.value, {
    value: content,
    language: currentLanguage.value,
    theme: currentTheme.value,
    readOnly: !onSaveCallback.value,
    automaticLayout: true,
    minimap: { enabled: true },
    wordWrap: wordWrap.value ? "on" : "off",
    scrollBeyondLastLine: false,
    fontSize: 14
  });

  editorInstance.onDidChangeModelContent(() => {
    isDirty.value = true;
  });
  editorInstance.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
    handleSave();
  });
};

const handleSave = async () => {
  if (
    !isDirty.value ||
    isSaving.value ||
    !editorInstance ||
    !onSaveCallback.value ||
    !currentFile.value
  )
    return;
  isSaving.value = true;
  try {
    const newContent = editorInstance.getValue();
    const result = await onSaveCallback.value(currentFile.value, newContent);

    if (result) {
      isDirty.value = false;

      if (typeof result === "object" && currentFile.value) {
        currentFile.value.size = result.size ?? currentFile.value.size;
        currentFile.value.updated_at =
          (result as any).updated ?? currentFile.value.updated_at;
      }

      ElMessage.success("保存成功！");
    }
  } catch (error) {
    console.error("Save process failed in component:", error);
  } finally {
    isSaving.value = false;
  }
};

const setTheme = (theme: "light" | "dark") => {
  if (!monaco || !editorInstance) return;
  const newMonacoTheme = theme === "light" ? "vs" : "vs-dark";
  monaco.editor.setTheme(newMonacoTheme);
};

const close = () => {
  if (isDirty.value) {
    if (!confirm("您有未保存的更改，确定要关闭吗？")) return;
  }
  visible.value = false;
};

const toggleFullScreen = () => {
  const modal = modalRef.value;
  if (!modal) return;
  if (!document.fullscreenEnabled)
    return ElMessage.warning("您的浏览器不支持全屏功能。");
  if (!document.fullscreenElement) {
    modal.requestFullscreen().catch(err => {
      console.error(`进入全屏失败: ${err.message} (${err.name})`);
      ElMessage.error("无法进入全屏模式。");
    });
  } else {
    if (document.exitFullscreen) document.exitFullscreen();
  }
};

const toggleSettingsMenu = (event: MouseEvent) => {
  if (isSettingsMenuVisible.value) {
    isSettingsMenuVisible.value = false;
    return;
  }
  const btn = event.currentTarget as HTMLElement;
  const rect = btn.getBoundingClientRect();
  settingsMenuPosition.value = {
    x: rect.left,
    y: rect.bottom + 4
  };
  isSettingsMenuVisible.value = true;
};

onClickOutside(settingsMenuRef, () => {
  isSettingsMenuVisible.value = false;
});

const handleMenuSelect = (index: string) => {
  if (index === "toggle-word-wrap") toggleWordWrap();
  else if (index.startsWith("language:")) changeLanguage(index.split(":")[1]);
  isSettingsMenuVisible.value = false;
};

const toggleWordWrap = () => {
  wordWrap.value = !wordWrap.value;
  if (editorInstance)
    editorInstance.updateOptions({ wordWrap: wordWrap.value ? "on" : "off" });
};

const changeLanguage = (language: string) => {
  if (!monaco || !editorInstance) return;
  currentLanguage.value = language;
  monaco.editor.setModelLanguage(editorInstance.getModel()!, language);
};

watch(monacoTheme, newTheme => {
  if (editorInstance) setTheme(newTheme);
});

watch(visible, newVal => {
  if (!newVal) {
    if (editorInstance) {
      editorInstance.dispose();
      editorInstance = null;
    }
    currentFile.value = null;
    isSettingsMenuVisible.value = false;
  }
});

onUnmounted(() => {
  if (editorInstance) editorInstance.dispose();
});

defineExpose({ open });
</script>

<style lang="scss">
.editor-settings-popper {
  position: fixed;
  z-index: 2001;
  padding: 6px;
  background-color: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  box-shadow: var(--el-box-shadow-light);
}

.context-menu-fade-scale-enter-active {
  transition:
    opacity 0.25s,
    transform 0.25s;
  transition-timing-function: cubic-bezier(0.18, 0.89, 0.32, 1.28);
}

.context-menu-fade-scale-leave-active {
  transition:
    opacity 0.2s,
    transform 0.2s;
  transition-timing-function: ease-in;
}

.context-menu-fade-scale-enter-from,
.context-menu-fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.8);
}
</style>

<style scoped lang="scss">
.az-fade-enter-active,
.az-fade-leave-active {
  transition: opacity 0.3s ease;
}

.az-fade-enter-from,
.az-fade-leave-to {
  opacity: 0;
}

.az-text-preview-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgb(0 0 0 / 50%);
  backdrop-filter: blur(5px);
}

.editor-modal {
  display: flex;
  flex-direction: column;
  width: 80vw;
  max-width: 1400px;
  height: 85vh;
  overflow: hidden;
  background-color: #1e1e1e;
  border-radius: 8px;
  box-shadow: 0 10px 30px rgb(0 0 0 / 50%);
  transition:
    width 0.3s,
    height 0.3s,
    background-color 0.3s;
}

.editor-modal:fullscreen {
  width: 100vw;
  height: 100vh;
  border-radius: 0;
}

.editor-modal.light-theme {
  background-color: #fff;
  border: 1px solid #e0e0e0;
}

.editor-modal.light-theme .editor-header {
  color: #303133;
  background-color: #f5f7fa;
  border-bottom: 1px solid #e0e0e0;
}

.editor-modal.light-theme .action-btn {
  color: #606266;

  &:hover {
    color: #303133;
  }
}

.editor-modal.light-theme .loading-container {
  background-color: #fff;
}

.editor-modal.light-theme .loading-spinner {
  border-color: rgb(0 0 0 / 10%);
  border-top-color: #409eff;
}

.editor-modal.light-theme .loading-text {
  color: #606266;
}

.editor-header {
  display: grid;
  flex-shrink: 0;
  grid-template-columns: auto 1fr auto;
  gap: 16px;
  align-items: center;
  padding: 8px 16px;
  color: #ccc;
  user-select: none;
  background-color: #333;
  transition:
    background-color 0.3s,
    color 0.3s;
}

.header-left,
.header-right {
  display: flex;
  gap: 12px;
  align-items: center;
}

.header-right {
  justify-content: flex-end;
}

.header-center {
  display: flex;
  justify-content: center;
  overflow: hidden;
}

.file-info {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 14px;
}

.file-icon {
  width: 18px;
  height: 18px;
}

.file-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:deep(.el-button.is-dirty)::after {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 6px;
  height: 6px;
  content: "";
  background-color: #e6a23c;
  border-radius: 50%;
}

.action-btn {
  font-size: 16px;
  color: #ccc;
  cursor: pointer;
  transition: color 0.2s;

  &:hover {
    color: #fff;
  }
}

.editor-content-wrapper {
  position: relative;
  flex-grow: 1;
  width: 100%;
  height: 100%;
}

.loading-container {
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
  justify-content: center;
  background-color: #1e1e1e;
  transition: background-color 0.3s;
}

.loading-text {
  font-size: 14px;
  color: #ccc;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgb(255 255 255 / 20%);
  border-top-color: #fff;
  border-radius: 50%;
  transition: border-color 0.3s;
  animation: spin 1s linear infinite;
}

.editor-container {
  width: 100%;
  height: 100%;
}

.editor-settings-menu {
  --el-menu-bg-color: transparent;
  --el-menu-hover-bg-color: var(--el-color-primary-light-9);

  width: 200px;
  border: none;

  .el-menu-item,
  :deep(.el-sub-menu__title) {
    height: 36px;
    margin: 2px 0;
    font-size: 14px;
    line-height: 36px;
    border-radius: 4px;
  }
}

.menu-item-content {
  display: flex;
  align-items: center;
  width: 100%;
}

.icon-placeholder {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  margin-right: 8px;
}
</style>
