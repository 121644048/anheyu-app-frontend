<!--
 * @Description: 装备项编辑器
 * @Author: 安知鱼
 * @Date: 2025-08-20
-->
<template>
  <div class="equipment-item-editor">
    <!-- 编辑器头部 -->
    <div class="editor-header">
      <div class="header-left">
        <h4>装备项管理</h4>
        <span class="item-count">{{ equipmentItems.length }} 个装备项</span>
      </div>
      <div class="header-actions">
        <el-button type="primary" :icon="Plus" @click="addNewItem">
          添加装备项
        </el-button>
        <el-button :icon="Upload" @click="showImportDialog">
          批量导入
        </el-button>
        <el-button :icon="Download" @click="exportToJson"> 导出JSON </el-button>
      </div>
    </div>

    <!-- 装备项列表 -->
    <div class="equipment-items-list">
      <div ref="itemsContainerRef" class="items-container">
        <div
          v-for="(item, index) in localEquipmentItems"
          :key="`item-${index}`"
          class="equipment-item-card"
        >
          <div class="item-header">
            <div class="drag-handle">
              <el-icon><Rank /></el-icon>
            </div>
            <div class="item-title">
              <el-input
                v-model="item.name"
                placeholder="装备名称"
                class="name-input"
                @change="updateItem(index, item)"
              />
            </div>
            <div class="item-actions">
              <el-button
                size="small"
                :icon="item._expanded ? ArrowUp : ArrowDown"
                @click="toggleItemExpanded(index)"
              />
              <el-button
                size="small"
                type="danger"
                :icon="Delete"
                @click="removeItem(index)"
              />
            </div>
          </div>

          <!-- 展开的详细信息 -->
          <div v-if="item._expanded" class="item-details">
            <div class="details-grid">
              <div class="detail-item">
                <label>装备规格</label>
                <el-input
                  v-model="item.specification"
                  placeholder="装备规格"
                  @change="updateItem(index, item)"
                />
              </div>

              <div class="detail-item">
                <label>装备描述</label>
                <el-input
                  v-model="item.description"
                  type="textarea"
                  placeholder="装备描述"
                  :rows="3"
                  @change="updateItem(index, item)"
                />
              </div>

              <div class="detail-item">
                <label>装备图片</label>
                <div class="image-input-group">
                  <el-input
                    v-model="item.image"
                    placeholder="图片链接地址"
                    @change="updateItem(index, item)"
                  >
                    <template #prepend>
                      <el-icon><Link /></el-icon>
                    </template>
                  </el-input>
                  <el-button
                    v-if="item.image"
                    :icon="View"
                    @click="previewImage(item.image)"
                  >
                    预览
                  </el-button>
                </div>
                <div v-if="item.image" class="image-preview">
                  <el-image
                    :src="item.image"
                    :preview-src-list="[item.image]"
                    fit="cover"
                    class="preview-image"
                  />
                </div>
              </div>

              <div class="detail-item">
                <label>链接地址</label>
                <div class="link-input-group">
                  <el-input
                    v-model="item.link"
                    placeholder="链接地址"
                    @change="updateItem(index, item)"
                  >
                    <template #prepend>
                      <el-icon><Link /></el-icon>
                    </template>
                  </el-input>
                  <el-button
                    v-if="item.link"
                    :icon="View"
                    @click="openLink(item.link)"
                  >
                    打开
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="equipmentItems.length === 0" class="empty-state">
        <el-icon class="empty-icon"><Collection /></el-icon>
        <p>暂无装备项</p>
        <el-button type="primary" :icon="Plus" @click="addNewItem">
          添加第一个装备项
        </el-button>
      </div>
    </div>

    <!-- 新装备项表单 -->
    <el-drawer
      v-model="isAddingNewItem"
      title="添加新装备项"
      direction="rtl"
      size="500px"
      :append-to-body="true"
    >
      <div class="new-item-form">
        <el-form :model="newItem" label-width="110px">
          <el-form-item label="装备名称" required>
            <el-input
              v-model="newItem.name"
              placeholder="请输入装备名称"
              maxlength="50"
              show-word-limit
            />
          </el-form-item>

          <el-form-item label="装备规格">
            <el-input
              v-model="newItem.specification"
              placeholder="请输入装备规格"
              maxlength="100"
              show-word-limit
            />
          </el-form-item>

          <el-form-item label="装备描述">
            <el-input
              v-model="newItem.description"
              type="textarea"
              placeholder="请输入装备描述"
              maxlength="500"
              show-word-limit
              :rows="4"
            />
          </el-form-item>

          <el-form-item label="装备图片">
            <el-input
              v-model="newItem.image"
              placeholder="请输入图片链接地址"
              clearable
            >
              <template #prepend>
                <el-icon><Link /></el-icon>
              </template>
            </el-input>
            <div v-if="newItem.image" class="image-preview">
              <el-image
                :src="newItem.image"
                :preview-src-list="[newItem.image]"
                fit="cover"
                class="preview-image"
              />
            </div>
          </el-form-item>

          <el-form-item label="链接地址">
            <el-input
              v-model="newItem.link"
              placeholder="请输入链接地址"
              clearable
            >
              <template #prepend>
                <el-icon><Link /></el-icon>
              </template>
            </el-input>
          </el-form-item>
        </el-form>

        <div class="form-actions">
          <el-button @click="cancelAddItem">取消</el-button>
          <el-button
            type="primary"
            :disabled="!newItem.name.trim()"
            @click="confirmAddItem"
          >
            确定
          </el-button>
        </div>
      </div>
    </el-drawer>

    <!-- 批量导入弹窗 -->
    <el-dialog
      v-model="isImportDialogVisible"
      title="批量导入装备项"
      width="600px"
      :append-to-body="true"
    >
      <div class="import-dialog">
        <el-alert title="导入说明" type="info" :closable="false" show-icon>
          <p>请按照以下JSON格式输入装备项数据：</p>
          <pre class="json-example">
[
  {
    "name": "装备名称",
    "specification": "装备规格",
    "description": "装备描述",
    "image": "图片链接",
    "link": "链接地址"
  }
]</pre
          >
        </el-alert>

        <el-form-item label="JSON数据" class="json-input-item">
          <el-input
            v-model="importJsonData"
            type="textarea"
            placeholder="请输入JSON数据"
            :rows="10"
            class="json-textarea"
          />
        </el-form-item>
      </div>

      <template #footer>
        <el-button @click="isImportDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :disabled="!importJsonData.trim()"
          @click="confirmImport"
        >
          导入
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted } from "vue";
import {
  Plus,
  Delete,
  Upload,
  Download,
  View,
  Link,
  Collection,
  ArrowUp,
  ArrowDown,
  Rank
} from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import type { EquipmentItem } from "../../../type";

const props = defineProps<{
  equipmentItems: EquipmentItem[];
}>();

const emit = defineEmits<{
  "update:equipment-items": [value: EquipmentItem[]];
}>();

// 本地装备项数据（用于拖拽排序）
const localEquipmentItems = ref<(EquipmentItem & { _expanded: boolean })[]>([]);
const itemsContainerRef = ref<HTMLElement>();

// 监听props变化，同步到本地数据
watch(
  () => props.equipmentItems,
  newItems => {
    localEquipmentItems.value = newItems.map(item => ({
      ...item,
      _expanded: false
    }));
  },
  { immediate: true, deep: true }
);

// 新装备项状态
const isAddingNewItem = ref(false);
const newItem = ref<EquipmentItem>({
  name: "",
  specification: "",
  description: "",
  image: "",
  link: ""
});

// 导入弹窗状态
const isImportDialogVisible = ref(false);
const importJsonData = ref("");

// 初始化拖拽排序
onMounted(() => {
  nextTick(async () => {
    if (itemsContainerRef.value) {
      // 动态导入 Sortable，只在需要时加载
      const { default: Sortable } = await import("sortablejs");
      new Sortable(itemsContainerRef.value, {
        handle: ".drag-handle",
        animation: 150,
        onEnd: evt => {
          const { oldIndex, newIndex } = evt;
          if (oldIndex !== undefined && newIndex !== undefined) {
            const items = [...localEquipmentItems.value];
            const [removed] = items.splice(oldIndex, 1);
            items.splice(newIndex, 0, removed);
            localEquipmentItems.value = items;
            emit(
              "update:equipment-items",
              items.map(({ _expanded, ...item }) => item)
            );
          }
        }
      });
    }
  });
});

// 添加新装备项
const addNewItem = () => {
  newItem.value = {
    name: "",
    specification: "",
    description: "",
    image: "",
    link: ""
  };
  isAddingNewItem.value = true;
};

// 确认添加装备项
const confirmAddItem = () => {
  if (!newItem.value.name.trim()) {
    ElMessage.warning("装备名称不能为空");
    return;
  }

  const newItemWithExpanded = {
    ...newItem.value,
    _expanded: false
  };

  const newItems = [...localEquipmentItems.value, newItemWithExpanded];
  localEquipmentItems.value = newItems;

  const itemsToEmit = newItems.map(({ _expanded, ...item }) => item);
  emit("update:equipment-items", itemsToEmit);

  isAddingNewItem.value = false;
  ElMessage.success("装备项添加成功");
};

// 取消添加装备项
const cancelAddItem = () => {
  isAddingNewItem.value = false;
};

// 更新装备项
const updateItem = (
  index: number,
  item: EquipmentItem & { _expanded: boolean }
) => {
  const newItems = [...localEquipmentItems.value];
  newItems[index] = { ...item };
  localEquipmentItems.value = newItems;

  const itemsToEmit = newItems.map(({ _expanded, ...item }) => item);
  emit("update:equipment-items", itemsToEmit);
};

// 删除装备项
const removeItem = (index: number) => {
  ElMessageBox.confirm("确定要删除这个装备项吗？", "确认删除", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(() => {
    const newItems = [...localEquipmentItems.value];
    newItems.splice(index, 1);
    localEquipmentItems.value = newItems;

    const itemsToEmit = newItems.map(({ _expanded, ...item }) => item);
    emit("update:equipment-items", itemsToEmit);
    ElMessage.success("装备项删除成功");
  });
};

// 切换装备项展开状态
const toggleItemExpanded = (index: number) => {
  localEquipmentItems.value[index]._expanded =
    !localEquipmentItems.value[index]._expanded;
};

// 预览图片
const previewImage = (url: string) => {
  // Element Plus 的 el-image 组件会自动处理预览
};

// 打开链接
const openLink = (url: string) => {
  window.open(url, "_blank");
};

// 显示导入弹窗
const showImportDialog = () => {
  importJsonData.value = "";
  isImportDialogVisible.value = true;
};

// 确认导入
const confirmImport = () => {
  try {
    const parsed = JSON.parse(importJsonData.value);
    if (!Array.isArray(parsed)) {
      throw new Error("JSON数据必须是数组格式");
    }

    const newItems = parsed.map(item => ({
      ...item,
      _expanded: false
    }));

    localEquipmentItems.value = newItems;
    const itemsToEmit = newItems.map(({ _expanded, ...item }) => item);
    emit("update:equipment-items", itemsToEmit);

    isImportDialogVisible.value = false;
    ElMessage.success(`成功导入 ${newItems.length} 个装备项`);
  } catch (error) {
    ElMessage.error("JSON格式错误，请检查输入的数据");
    console.error("JSON解析失败:", error);
  }
};

// 导出JSON
const exportToJson = () => {
  const dataStr = JSON.stringify(props.equipmentItems, null, 2);
  const dataBlob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "equipment-items.json";
  link.click();
  URL.revokeObjectURL(url);
  ElMessage.success("JSON导出成功");
};
</script>

<style scoped lang="scss">
.equipment-item-editor {
  .editor-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    padding: 20px;
    background: #f8f9fa;
    border-radius: 8px;
    border: 1px solid #e4e7ed;

    .header-left {
      h4 {
        margin: 0 0 8px 0;
        color: #303133;
        font-size: 18px;
        font-weight: 600;
      }

      .item-count {
        color: #909399;
        font-size: 14px;
      }
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }
  }

  .equipment-items-list {
    .items-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .equipment-item-card {
      border: 1px solid #e4e7ed;
      border-radius: 8px;
      overflow: hidden;
      transition: all 0.3s ease;

      &:hover {
        border-color: #409eff;
        box-shadow: 0 2px 12px rgba(64, 158, 255, 0.1);
      }

      .item-header {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px 20px;
        background: #fafafa;
        border-bottom: 1px solid #e4e7ed;

        .drag-handle {
          cursor: move;
          color: #909399;
          padding: 4px;
          border-radius: 4px;
          transition: all 0.2s ease;

          &:hover {
            background: #e4e7ed;
            color: #606266;
          }
        }

        .item-title {
          flex: 1;

          .name-input {
            .el-input__wrapper {
              background: transparent;
              border: none;
              box-shadow: none;
              padding: 0;

              &:focus-within {
                background: white;
                border: 1px solid #409eff;
                border-radius: 4px;
                padding: 0 8px;
              }
            }
          }
        }

        .item-actions {
          display: flex;
          gap: 8px;
        }
      }

      .item-details {
        padding: 20px;
        background: white;

        .details-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;

          .detail-item {
            label {
              display: block;
              margin-bottom: 8px;
              color: #606266;
              font-size: 14px;
              font-weight: 500;
            }

            .image-input-group,
            .link-input-group {
              display: flex;
              gap: 8px;
              align-items: center;
            }

            .image-preview {
              margin-top: 12px;

              .preview-image {
                width: 100px;
                height: 100px;
                border-radius: 4px;
                border: 1px solid #e4e7ed;
              }
            }
          }
        }
      }
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #909399;

      .empty-icon {
        font-size: 48px;
        margin-bottom: 16px;
      }

      p {
        margin: 0 0 20px 0;
        font-size: 16px;
      }
    }
  }

  .new-item-form {
    padding: 20px;

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid #e4e7ed;
    }

    .image-preview {
      margin-top: 12px;

      .preview-image {
        width: 100px;
        height: 100px;
        border-radius: 4px;
        border: 1px solid #e4e7ed;
      }
    }
  }

  .import-dialog {
    .json-example {
      background: #f8f9fa;
      padding: 12px;
      border-radius: 4px;
      border: 1px solid #e4e7ed;
      font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
      font-size: 12px;
      line-height: 1.4;
      margin: 12px 0 0 0;
      overflow-x: auto;
    }

    .json-input-item {
      margin-top: 20px;

      .json-textarea {
        font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
        font-size: 12px;
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .equipment-item-editor {
    .editor-header {
      flex-direction: column;
      gap: 16px;
      align-items: flex-start;

      .header-actions {
        width: 100%;
        justify-content: flex-end;
      }
    }

    .equipment-items-list {
      .equipment-item-card {
        .item-header {
          flex-direction: column;
          gap: 12px;
          align-items: flex-start;

          .item-actions {
            width: 100%;
            justify-content: flex-end;
          }
        }

        .item-details {
          .details-grid {
            grid-template-columns: 1fr;
          }
        }
      }
    }
  }
}
</style>
