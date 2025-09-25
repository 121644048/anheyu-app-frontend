<template>
  <div
    ref="fileManagerContainerRef"
    class="file-management-container"
    @dragenter="dragHandlers.onDragEnter"
    @dragover="dragHandlers.onDragOver"
    @dragleave="dragHandlers.onDragLeave"
    @drop="dragHandlers.onDrop"
    @contextmenu.prevent="handleContextMenuTrigger($event)"
    @click="handleContainerClick"
  >
    <FileHeard
      class="mb-2"
      :has-selection="hasSelection"
      :is-single-selection="isSingleSelection"
      :selection-count-label="selectionCountLabel"
      @open-new-menu="openBlankMenu"
      @trigger-search="openSearchFromElement"
      @clear-selection="clearSelection"
      @rename="onActionRename"
      @delete="onActionDelete"
      @download="onActionDownload"
      @share="onActionShare"
      @copy="onActionCopy"
      @move="onActionMove"
    />

    <div class="flex w-full">
      <FileBreadcrumb
        class="flex-1 mb-2"
        :path="path"
        :parent-info="parentInfo"
        :show-dropdown="true"
        @navigate="handleNavigate"
        @show-details="handleShowDetailsForId"
        @download-folder="handleDownloadFolder"
      />
      <FileToolbar
        ref="fileToolbarRef"
        class="mb-2 ml-2"
        :view-mode="viewMode"
        :sort-key="sortKey"
        :page-size="pageSize"
        :has-selection="hasSelection"
        :is-simplified="false"
        :columns="columns"
        @refresh="handleRefresh"
        @select-all="selectAll"
        @clear-selection="clearSelection"
        @invert-selection="invertSelection"
        @set-view-mode="handleSetViewMode"
        @set-page-size="handleSetPageSize"
        @set-sort-key="handleSetSortKey"
        @set-columns="handleSetColumns"
        @regenerate-thumbnails="onActionRegenerateDirectoryThumbnails"
      />
    </div>

    <div class="overflow-hidden file-management-main rounded-2xl">
      <transition name="loading-fade">
        <div v-if="loading && !sortedFiles.length" class="loading-overlay">
          <div class="loading-spinner" />
        </div>
      </transition>

      <div class="file-content-area">
        <component
          :is="activeViewComponent"
          :files="sortedFiles"
          :loading="loading"
          :selected-file-ids="selectedFiles"
          :is-more-loading="isMoreLoading"
          :has-more="hasMore"
          :columns="columns"
          :sort-key="sortKey"
          @select-single="selectSingle"
          @select-range="selectRange"
          @toggle-selection="toggleSelection"
          @select-all="selectAll"
          @navigate-to="handleNavigate"
          @scroll-to-load="handleLoadMore"
          @set-sort-key="handleSetSortKey"
          @open-column-settings="handleOpenColumnSettings"
          @set-columns="handleSetColumns"
          @preview-file="handlePreviewFile"
          @contextmenu.stop.prevent="handleContextMenuTrigger"
        />
      </div>
    </div>

    <div v-if="isDragging" class="drag-overlay">
      <div class="drag-content">
        <el-icon><UploadFilled /></el-icon>
        <span>松开鼠标开始上传</span>
        <p>将文件或目录拖拽至此</p>
      </div>
    </div>

    <MoveModal
      v-model="isDestinationModalVisible"
      :items-for-action="itemsForAction"
      :mode="destinationModalMode"
      @success="handleActionSuccess"
    />
    <FileDetailsPanel :fileInfo="detailsPanelFile" @close="closeDetailsPanel" />
    <SearchOverlay
      :visible="isSearchVisible"
      :origin="searchOrigin"
      @close="isSearchVisible = false"
    />
    <ContextMenu
      :trigger="contextMenuTrigger"
      :selected-file-ids="selectedFiles"
      @request-select-single="selectSingle"
      @select="onMenuSelect"
      @closed="handleContextMenuClosed"
    />
    <UploadProgress
      :visible="isPanelVisible"
      :is-collapsed="isPanelCollapsed"
      :queue="uploadQueue"
      :speed-mode="speedDisplayMode"
      :is-global-overwrite="globalOverwrite"
      @close="handlePanelClose"
      @toggle-collapse="isPanelCollapsed = !isPanelCollapsed"
      @retry-item="retryItem"
      @remove-item="removeItem"
      @resolve-conflict="resolveConflict"
      @global-command="handleUploadGlobalCommand"
      @add-files="() => handleUploadFile()"
    />

    <AzImagePreview ref="imagePreviewRef" page="sys-file" />
    <AzVideoPreview ref="videoPreviewRef" />
    <AzTextPreview ref="textPreviewRef" />
  </div>
</template>

<script lang="ts" setup>
import { defineAsyncComponent } from "vue";
import { UploadFilled } from "@element-plus/icons-vue";
import { useFileManager } from "./hooks/useFileManager";

// 子组件导入
// 使用 defineAsyncComponent 可以在需要时再加载视图，轻微提升初始性能
const FileListView = defineAsyncComponent(
  () => import("./components/FileListView.vue")
);
const FileGridView = defineAsyncComponent(
  () => import("./components/FileGridView.vue")
);

// 其他组件可以根据需要决定是否异步
import FileToolbar from "./components/FileToolbar.vue";
import FileHeard from "./components/FileHeard.vue";
import FileBreadcrumb from "./components/FileBreadcrumb.vue";
import UploadProgress from "./components/UploadProgress.vue";
import ContextMenu from "./components/ContextMenu.vue";
import SearchOverlay from "./components/SearchOverlay.vue";
import FileDetailsPanel from "./components/FileDetailsPanel.vue";
import MoveModal from "./components/MoveModal.vue";
import AzImagePreview from "@/components/AzImagePreview";
import AzTextPreview from "@/components/AzTextPreview";
// 懒加载视频预览组件，避免影响首屏性能
const AzVideoPreview = defineAsyncComponent(
  () => import("@/components/AzVideoPreview")
);

// 只需要调用一个 Hook，它会返回所有需要的数据和方法
// 这个 Hook 就像页面的“大脑”，而这个 .vue 文件只是“骨架”
const {
  // Refs for template
  fileManagerContainerRef,
  imagePreviewRef,
  videoPreviewRef,
  textPreviewRef,
  fileToolbarRef,
  // Store state for template
  path,
  parentInfo,
  sortedFiles,
  loading,
  isMoreLoading,
  hasMore,
  viewMode,
  sortKey,
  pageSize,
  columns,
  // Selection state for template
  selectedFiles,
  selectSingle,
  selectRange,
  toggleSelection,
  selectAll,
  clearSelection,
  invertSelection,
  hasSelection,
  isSingleSelection,
  selectionCountLabel,
  // Component state for template
  activeViewComponent,
  // Modals, panels, overlays state
  isDragging,
  isDestinationModalVisible,
  itemsForAction,
  destinationModalMode,
  detailsPanelFile,
  isSearchVisible,
  searchOrigin,
  contextMenuTrigger,
  isPanelVisible,
  isPanelCollapsed,
  uploadQueue,
  speedDisplayMode,
  globalOverwrite,
  // Event handlers for template
  handleNavigate,
  handleLoadMore,
  handlePreviewFile,
  handleRefresh,
  handleSetViewMode,
  handleSetPageSize,
  handleSetColumns,
  handleSetSortKey,
  handleOpenColumnSettings,
  handleContainerClick,
  handleContextMenuTrigger,
  onMenuSelect,
  handleContextMenuClosed,
  openBlankMenu,
  dragHandlers,
  handleUploadFile,
  onActionDownload,
  handleDownloadFolder,
  onActionRename,
  onActionDelete,
  onActionShare,
  onActionCopy,
  onActionMove,
  handleActionSuccess,
  closeDetailsPanel,
  handleShowDetailsForId,
  openSearchFromElement,
  handlePanelClose,
  retryItem,
  removeItem,
  resolveConflict,
  handleUploadGlobalCommand,
  onActionRegenerateDirectoryThumbnails
} = useFileManager();
</script>

<style>
.file-management-container {
  position: relative;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 135px);
  padding: 24px 24px 0;
  margin: 0 auto !important;
}

.file-management-main {
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
  width: 100%;
  min-height: 0;
  background-color: #fff;
  border: var(--style-border);
}

.file-content-area {
  position: relative;
  flex: 1;
  overflow: hidden;
}

.drag-overlay {
  position: absolute;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  pointer-events: none;
  background-color: rgb(0 0 0 / 60%);
  border-radius: inherit;
}

.drag-content {
  text-align: center;
}

.drag-content .el-icon {
  font-size: 80px;
}

.drag-content span {
  display: block;
  margin-top: 20px;
  font-size: 24px;
}

.drag-content p {
  margin-top: 8px;
  font-size: 16px;
  color: #eee;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background-color: rgb(255 255 255 / 85%);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--el-color-primary-light-7);
  border-top-color: var(--el-color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-fade-enter-active,
.loading-fade-leave-active {
  transition: opacity 0.3s ease-in-out;
}

.loading-fade-enter-from,
.loading-fade-leave-to {
  opacity: 0;
}
</style>
