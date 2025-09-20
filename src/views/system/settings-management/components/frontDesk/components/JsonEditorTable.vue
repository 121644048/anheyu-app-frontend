<template>
  <div class="json-editor-table">
    <el-divider content-position="left">{{ title }}</el-divider>
    <el-table :data="tableData" border style="width: 100%">
      <el-table-column
        v-for="col in columns"
        :key="col.prop"
        :prop="col.prop"
        :label="col.label"
        :width="col.width"
        min-width="150"
      >
        <template #default="scope">
          <slot v-if="col.slot" :name="col.slot" :scope="scope" />
          <el-input
            v-else
            v-model="scope.row[col.prop]"
            :placeholder="`请输入 ${col.label}`"
          />
        </template>
      </el-table-column>

      <el-table-column label="操作" width="90" fixed="right">
        <template #default="scope">
          <el-button
            type="danger"
            :icon="Delete"
            circle
            :disabled="props.minItems && tableData.length <= props.minItems"
            @click="handleDeleteItem(scope.$index)"
          />
        </template>
      </el-table-column>
    </el-table>
    <el-button
      class="mt-4"
      style="width: 100%"
      :disabled="isLastRowIncomplete"
      @click="handleAddItem"
    >
      添加一项
    </el-button>
    <div v-if="isLastRowIncomplete" class="el-form-item__error custom-error">
      请填写完当前项再添加新项
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, toRaw, computed } from "vue";
import { Delete } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import type { JsonEditorTableColumn } from "../../../type";

const props = defineProps<{
  modelValue: string;
  title: string;
  columns: JsonEditorTableColumn[];
  newItemTemplate: Record<string, any>;
  minItems?: number;
}>();

const emit = defineEmits(["update:modelValue", "item-deleted"]);

const tableData = ref<any[]>([]);

const isLastRowIncomplete = computed(() => {
  if (tableData.value.length === 0) {
    return false;
  }
  const lastItem = tableData.value[tableData.value.length - 1];
  return Object.keys(props.newItemTemplate).some(
    key =>
      lastItem[key] === "" ||
      lastItem[key] === null ||
      lastItem[key] === undefined
  );
});

watch(
  () => props.modelValue,
  newVal => {
    try {
      const parsedData = JSON.parse(newVal || "[]");
      if (
        JSON.stringify(toRaw(tableData.value)) !== JSON.stringify(parsedData)
      ) {
        tableData.value = parsedData;
      }
    } catch (e) {
      console.error(`"${props.title}" 的JSON解析失败:`, newVal, e);
      tableData.value = [];
    }
  },
  { immediate: true }
);

watch(
  tableData,
  newVal => {
    emit("update:modelValue", JSON.stringify(newVal, null, 2));
  },
  { deep: true }
);

const handleAddItem = () => {
  if (isLastRowIncomplete.value) {
    ElMessage.warning("请先填写完当前行的数据！");
    return;
  }
  tableData.value.push({ ...props.newItemTemplate });
};

const handleDeleteItem = (index: number) => {
  // 检查是否违反最小项数限制
  if (props.minItems && tableData.value.length <= props.minItems) {
    ElMessage.warning(`至少需要保留 ${props.minItems} 项！`);
    return;
  }

  tableData.value.splice(index, 1);
  emit("item-deleted", index);
};
</script>

<style scoped>
.json-editor-table {
  margin-bottom: 24px;
}

.mt-4 {
  margin-top: 1rem;
}

.custom-error {
  position: relative;
  padding-top: 4px;
  font-size: 12px;
  line-height: 1;
  color: var(--el-color-danger);
}
</style>
