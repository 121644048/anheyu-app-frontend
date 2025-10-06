<template>
  <div>
    <div class="h-full overflow-hidden bg-white file-toolbar rounded-2xl">
      <div class="right-actions">
        <el-tooltip content="刷新" placement="bottom" :show-arrow="false">
          <el-button
            circle
            :icon="RefreshSvg"
            class="!text-[var(--anzhiyu-white)] !border-none !bg-[var(--anzhiyu-theme)]"
            @click="emit('refresh')"
          />
        </el-tooltip>

        <el-tooltip
          v-if="viewMode === 'grid'"
          content="重新生成缩略图"
          placement="bottom"
          :show-arrow="false"
        >
          <el-button
            circle
            :icon="MagicStick"
            class="!text-[var(--anzhiyu-white)] !border-none !bg-[#F5A623] !ml-0"
            @click="emit('regenerate-thumbnails')"
          />
        </el-tooltip>

        <el-tooltip
          v-if="!isSimplified"
          content="选择操作"
          placement="bottom"
          :show-arrow="false"
        >
          <div>
            <el-dropdown trigger="click" placement="bottom-end">
              <el-button
                circle
                :icon="FullScreen"
                class="!text-[var(--anzhiyu-white)] !border-none !bg-[#8468F3]"
              />
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="emit('select-all')">
                    全选
                  </el-dropdown-item>
                  <el-dropdown-item
                    :disabled="!hasSelection"
                    @click="emit('clear-selection')"
                  >
                    取消选择
                  </el-dropdown-item>
                  <el-dropdown-item @click="emit('invert-selection')">
                    反选
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </el-tooltip>

        <el-tooltip
          content="视图设置"
          placement="bottom"
          :disabled="isSettingsPopoverVisible"
          :hide-after="0"
          :show-arrow="false"
        >
          <div>
            <el-popover
              ref="settingsPopoverRef"
              placement="bottom-end"
              :width="250"
              :visible="isSettingsPopoverVisible"
              popper-class="directional-reveal-popover"
              :show-arrow="false"
              transition="none"
            >
              <template #reference>
                <el-button
                  ref="settingsButtonRef"
                  circle
                  :icon="Setting"
                  class="!text-[var(--anzhiyu-white)] !border-none !bg-[#73A6F5]"
                  @click="toggleSettingsPopover"
                />
              </template>
              <div class="popover-content">
                <div class="popover-section">
                  <h1 class="popover-title">布局</h1>
                  <el-button-group class="view-switcher">
                    <el-button
                      :type="viewMode === 'grid' ? 'primary' : 'default'"
                      :icon="Grid"
                      @click="handleViewChange('grid')"
                      >网格</el-button
                    >
                    <el-button
                      :type="viewMode === 'list' ? 'primary' : 'default'"
                      :icon="Tickets"
                      @click="handleViewChange('list')"
                      >列表</el-button
                    >
                  </el-button-group>
                </div>
                <el-divider />
                <div v-if="viewMode === 'list'" class="popover-section">
                  <h1 class="popover-title">列设置</h1>
                  <el-button
                    class="w-full"
                    :icon="Operation"
                    @click="handleOpenDialog"
                  >
                    自定义列表列
                  </el-button>
                </div>
                <el-divider v-if="viewMode === 'list'" />
                <div class="popover-section">
                  <h1 class="popover-title">分页大小</h1>
                  <div class="slider-wrapper">
                    <el-slider
                      :model-value="localPageSize"
                      :min="10"
                      :max="200"
                      :step="10"
                      size="small"
                      @input="onPageSizeInput"
                      @change="onPageSizeChange"
                    />
                    <span class="slider-value">{{ localPageSize }}</span>
                  </div>
                </div>
              </div>
            </el-popover>
          </div>
        </el-tooltip>

        <el-tooltip content="排序" placement="bottom" :show-arrow="false">
          <div>
            <el-dropdown
              trigger="click"
              placement="bottom-end"
              class="sort-dropdown"
              @command="(key: SortKey) => emit('set-sort-key', key)"
            >
              <el-button
                circle
                :icon="Sort"
                class="!text-[var(--anzhiyu-white)] !border-none !bg-[#6EB65E]"
              />
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item
                    command="name_asc"
                    :class="{ active: sortKey === 'name_asc' }"
                    >A-Z</el-dropdown-item
                  >
                  <el-dropdown-item
                    command="name_desc"
                    :class="{ active: sortKey === 'name_desc' }"
                    >Z-A</el-dropdown-item
                  >
                  <el-dropdown-item
                    divided
                    command="size_asc"
                    :class="{ active: sortKey === 'size_asc' }"
                    >最小</el-dropdown-item
                  >
                  <el-dropdown-item
                    command="size_desc"
                    :class="{ active: sortKey === 'size_desc' }"
                    >最大</el-dropdown-item
                  >
                  <el-dropdown-item
                    divided
                    command="updated_at_desc"
                    :class="{ active: sortKey === 'updated_at_desc' }"
                    >最新修改</el-dropdown-item
                  >
                  <el-dropdown-item
                    command="updated_at_asc"
                    :class="{ active: sortKey === 'updated_at_asc' }"
                    >最早修改</el-dropdown-item
                  >
                  <el-dropdown-item
                    divided
                    command="created_at_desc"
                    :class="{ active: sortKey === 'created_at_desc' }"
                    >最新上传</el-dropdown-item
                  >
                  <el-dropdown-item
                    command="created_at_asc"
                    :class="{ active: sortKey === 'created_at_asc' }"
                    >最早上传</el-dropdown-item
                  >
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </el-tooltip>
      </div>
    </div>

    <el-dialog
      v-model="dialogVisible"
      title="列设置"
      width="500"
      class="rounded-2xl"
      append-to-body
      :close-on-click-modal="false"
    >
      <div class="column-settings-body">
        <div class="column-settings-header">
          <span>列</span>
          <span>操作</span>
        </div>
        <transition-group name="list-anim" tag="div" class="column-list">
          <div
            v-for="(col, index) in editableColumns"
            :key="col.type"
            class="column-item"
          >
            <span class="column-name">{{
              columnTypeMap.get(col.type)?.name
            }}</span>
            <div class="column-actions">
              <el-icon
                v-if="index > 0"
                class="action-icon"
                @click="moveColumn(index, -1)"
                ><Top
              /></el-icon>
              <el-icon
                v-if="index < editableColumns.length - 1"
                class="action-icon"
                @click="moveColumn(index, 1)"
                ><Bottom
              /></el-icon>
              <el-icon class="action-icon danger" @click="removeColumn(index)"
                ><Close
              /></el-icon>
            </div>
          </div>
        </transition-group>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-dropdown trigger="click" placement="top-start">
            <el-button type="primary" plain :icon="Plus">添加列</el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  v-for="colType in availableColumnsToAdd"
                  :key="colType"
                  @click="addColumn(colType)"
                >
                  {{ columnTypeMap.get(colType)?.name }}
                </el-dropdown-item>
                <el-dropdown-item v-if="!availableColumnsToAdd.length" disabled>
                  已添加所有列
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <div>
            <el-button @click="dialogVisible = false">取消</el-button>
            <el-button type="primary" @click="handleConfirm">确定</el-button>
          </div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  watch,
  computed,
  toRaw,
  type ComponentPublicInstance,
  nextTick
} from "vue";
import type { ElButton, ElPopover } from "element-plus";
import gsap from "gsap";
import type { SortKey } from "@/store/modules/fileStore";
import type { ColumnConfig } from "@/api/sys-file/type";
import {
  Grid,
  Tickets,
  Setting,
  Sort,
  FullScreen,
  Operation,
  Plus,
  Top,
  Bottom,
  Close,
  MagicStick
} from "@element-plus/icons-vue";
import RefreshSvg from "@/assets/icons/refresh.svg?component";

enum ColumnType {
  Name = 0,
  Size = 1,
  UpdatedAt = 2,
  CreatedAt = 3
}

const columnTypeMap = new Map<ColumnType, { name: string }>([
  [ColumnType.Name, { name: "文件名" }],
  [ColumnType.Size, { name: "大小" }],
  [ColumnType.UpdatedAt, { name: "修改日期" }],
  [ColumnType.CreatedAt, { name: "创建日期" }]
]);

const props = defineProps<{
  viewMode: "list" | "grid";
  sortKey: SortKey;
  pageSize: number;
  hasSelection: boolean;
  isSimplified?: boolean;
  columns: ColumnConfig[];
}>();

const emit = defineEmits<{
  (e: "refresh"): void;
  (e: "select-all"): void;
  (e: "clear-selection"): void;
  (e: "invert-selection"): void;
  (e: "set-view-mode", mode: "list" | "grid"): void;
  (e: "set-page-size", size: number): void;
  (e: "set-sort-key", key: SortKey): void;
  (e: "set-columns", columns: ColumnConfig[]): void;
  (e: "regenerate-thumbnails"): void;
}>();

const localPageSize = ref(props.pageSize);
watch(
  () => props.pageSize,
  newValue => {
    localPageSize.value = newValue;
  }
);
const onPageSizeInput = (value: number) => {
  localPageSize.value = value;
};
const onPageSizeChange = (value: number) => {
  emit("set-page-size", value);
};

const dialogVisible = ref(false);
const editableColumns = ref<ColumnConfig[]>([]);
const openDialog = () => {
  editableColumns.value = structuredClone(toRaw(props.columns));
  dialogVisible.value = true;
};
const availableColumnsToAdd = computed(() => {
  const allColumnTypes = Array.from(columnTypeMap.keys());
  const currentColTypes = new Set(editableColumns.value.map(c => c.type));
  return allColumnTypes.filter(type => !currentColTypes.has(type));
});
const addColumn = (type: ColumnType) => editableColumns.value.push({ type });
const removeColumn = (index: number) => editableColumns.value.splice(index, 1);
const moveColumn = (index: number, direction: -1 | 1) => {
  const newIndex = index + direction;
  if (newIndex < 0 || newIndex >= editableColumns.value.length) return;
  const temp = editableColumns.value[index];
  editableColumns.value[index] = editableColumns.value[newIndex];
  editableColumns.value[newIndex] = temp;
};
const handleConfirm = () => {
  emit("set-columns", editableColumns.value);
  dialogVisible.value = false;
};

const settingsButtonRef = ref<ComponentPublicInstance<typeof ElButton>>();
const settingsPopoverRef = ref<InstanceType<typeof ElPopover>>();
const isSettingsPopoverVisible = ref(false);

const closePopover = () => {
  const popoverEl = settingsPopoverRef.value?.popperRef?.contentRef;
  if (!popoverEl) return;
  gsap.to(popoverEl, {
    scale: 0.6,
    opacity: 0,
    duration: 0.2,
    ease: "cubic-bezier(0.4, 0, 1, 1)",
    onComplete: () => {
      isSettingsPopoverVisible.value = false;
    }
  });
};

const openPopover = async () => {
  isSettingsPopoverVisible.value = true;
  await nextTick();
  const popoverEl = settingsPopoverRef.value?.popperRef?.contentRef;
  if (!popoverEl) return;
  gsap.fromTo(
    popoverEl,
    { scale: 0.6, opacity: 0 },
    {
      scale: 1,
      opacity: 1,
      duration: 0.25,
      ease: "cubic-bezier(0, 0, 0.2, 1)"
    }
  );
};

const toggleSettingsPopover = () => {
  if (isSettingsPopoverVisible.value) {
    closePopover();
  } else {
    openPopover();
  }
};

const handleClickOutside = (event: MouseEvent) => {
  if (!isSettingsPopoverVisible.value) return;
  const popoverContentEl = settingsPopoverRef.value?.popperRef?.contentRef;
  const buttonEl = settingsButtonRef.value?.$el;
  if (
    buttonEl &&
    !buttonEl.contains(event.target as Node) &&
    popoverContentEl &&
    !popoverContentEl.contains(event.target as Node)
  ) {
    closePopover();
  }
};

watch(isSettingsPopoverVisible, isVisible => {
  if (isVisible) {
    document.addEventListener("mousedown", handleClickOutside);
  } else {
    document.removeEventListener("mousedown", handleClickOutside);
  }
});

const handleViewChange = (mode: "list" | "grid") => {
  emit("set-view-mode", mode);
};

const handleOpenDialog = () => {
  openDialog();
  isSettingsPopoverVisible.value = false;
};

defineExpose({
  openDialog
});
</script>

<style lang="scss">
.directional-reveal-popover {
  padding: 0 !important;
  background-color: var(--anzhiyu-maskbgdeep, rgb(255 255 255 / 90%));
  backdrop-filter: blur(20px);
  border: none !important;
  border-radius: 12px !important;
  box-shadow: 0 5px 15px rgb(0 0 0 / 10%) !important;
  transform-origin: top right;

  .popover-content {
    padding: 8px;
  }

  .popover-section {
    padding: 8px;
  }

  .popover-title {
    padding-left: 4px;
    margin-bottom: 12px;
    font-size: 13px;
    font-weight: 500;
    color: #909399;
  }

  .el-button-group.view-switcher {
    display: flex;
    width: 100%;

    .el-button {
      flex: 1;
    }
  }

  .slider-wrapper {
    display: flex;
    gap: 12px;
    align-items: center;
    padding: 0 4px;

    .el-slider {
      flex-grow: 1;
    }

    .slider-value {
      min-width: 45px;
      padding: 2px 8px;
      font-size: 14px;
      color: var(--el-text-color-primary);
      text-align: center;
      user-select: none;
      background-color: var(--el-fill-color-light);
      border-radius: 4px;
    }
  }

  .el-divider--horizontal {
    margin: 8px 0;
  }
}
</style>

<style scoped lang="scss">
.file-toolbar {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px 12px;
  background-color: var(--anzhiyu-card-bg);
  border: var(--style-border);
}

.right-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

:deep(.el-dropdown-menu__item.active) {
  color: var(--el-color-primary, #409eff);
  background-color: var(--el-color-primary-light-9, #ecf5ff);
}

.column-settings-body {
  overflow: hidden;
  background-color: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
}

.column-settings-header {
  display: flex;
  justify-content: space-between;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-secondary);
  background-color: var(--el-fill-color-light);
}

.column-list {
  position: relative;
}

.column-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background-color: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);

  &:last-child {
    border-bottom: none;
  }
}

.column-name {
  font-size: 14px;
}

.column-actions {
  display: flex;
  gap: 16px;
  align-items: center;
  color: var(--el-text-color-regular);

  .action-icon {
    font-size: 16px;
    cursor: pointer;
    transition: color 0.2s ease;

    &:hover {
      color: var(--el-color-primary);
    }

    &.danger:hover {
      color: var(--el-color-danger);
    }
  }
}

.dialog-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.list-anim-move,
.list-anim-enter-active,
.list-anim-leave-active {
  transition: all 0.4s cubic-bezier(0.55, 0, 0.1, 1);
}

.list-anim-enter-from,
.list-anim-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.list-anim-leave-active {
  position: absolute;
  width: calc(100% - 32px);
}
</style>
