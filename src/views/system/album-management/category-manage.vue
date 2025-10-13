<script setup lang="ts">
import { ref, onMounted, h } from "vue";
import { message } from "@/utils/message";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Delete from "@iconify-icons/ep/delete";
import EditPen from "@iconify-icons/ep/edit-pen";
import AddFill from "@iconify-icons/ri/add-circle-line";
import {
  getAlbumCategoryList,
  createAlbumCategory,
  updateAlbumCategory,
  deleteAlbumCategory,
  type AlbumCategoryDTO
} from "@/api/album-category";
import { addDialog } from "@/components/ReDialog";
import {
  ElMessageBox,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber
} from "element-plus";

const emit = defineEmits(["refresh"]);

const loading = ref(false);
const dataList = ref<AlbumCategoryDTO[]>([]);

const columns: TableColumnList = [
  {
    label: "ID",
    prop: "id",
    minWidth: 60
  },
  {
    label: "分类名称",
    prop: "name",
    minWidth: 120
  },
  {
    label: "描述",
    prop: "description",
    minWidth: 150
  },
  {
    label: "排序",
    prop: "displayOrder",
    minWidth: 80
  },
  {
    label: "操作",
    fixed: "right",
    width: 150,
    slot: "operation"
  }
];

async function loadData() {
  loading.value = true;
  try {
    const { data } = await getAlbumCategoryList();
    if (data) {
      dataList.value = data;
    }
  } catch (error) {
    message("获取分类列表失败", { type: "error" });
  } finally {
    loading.value = false;
  }
}

function openDialog(title = "新增", row?: AlbumCategoryDTO) {
  addDialog({
    title: `${title}相册分类`,
    props: {
      formInline: {
        id: row?.id ?? 0,
        name: row?.name ?? "",
        description: row?.description ?? "",
        displayOrder: row?.displayOrder ?? 0
      }
    },
    width: "460px",
    draggable: true,
    closeOnClickModal: false,
    contentRenderer: ({ options }) => {
      const formInline = options.props.formInline;
      return h(ElForm, { labelWidth: "80px" }, () => [
        h(ElFormItem, { label: "分类名称" }, () =>
          h(ElInput, {
            modelValue: formInline.name,
            "onUpdate:modelValue": (val: string) => (formInline.name = val),
            placeholder: "请输入分类名称",
            clearable: true
          })
        ),
        h(ElFormItem, { label: "描述" }, () =>
          h(ElInput, {
            modelValue: formInline.description,
            "onUpdate:modelValue": (val: string) =>
              (formInline.description = val),
            type: "textarea",
            rows: 3,
            placeholder: "请输入分类描述",
            clearable: true
          })
        ),
        h(ElFormItem, { label: "排序" }, () =>
          h(ElInputNumber, {
            modelValue: formInline.displayOrder,
            "onUpdate:modelValue": (val: number) =>
              (formInline.displayOrder = val),
            min: 0,
            max: 9999,
            controlsPosition: "right",
            placeholder: "数字越小越靠前"
          })
        )
      ]);
    },
    beforeSure: async (done, { options }) => {
      const formData = options.props.formInline;

      if (!formData.name || formData.name.trim() === "") {
        message("请输入分类名称", { type: "warning" });
        return;
      }

      try {
        if (title === "新增") {
          await createAlbumCategory({
            name: formData.name,
            description: formData.description,
            displayOrder: formData.displayOrder
          });
          message("创建成功", { type: "success" });
        } else {
          await updateAlbumCategory(formData.id, {
            name: formData.name,
            description: formData.description,
            displayOrder: formData.displayOrder
          });
          message("更新成功", { type: "success" });
        }
        done();
        loadData();
        emit("refresh"); // 通知父组件刷新分类选择器
      } catch (error: any) {
        message(error.response?.data?.message || "操作失败", {
          type: "error"
        });
      }
    }
  });
}

async function handleDelete(row: AlbumCategoryDTO) {
  try {
    await ElMessageBox.confirm(
      `是否确认删除分类「${row.name}」？删除后该分类下的相册将不再关联此分类。`,
      "提示",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }
    );

    await deleteAlbumCategory(row.id);
    message("删除成功", { type: "success" });
    loadData();
    emit("refresh"); // 通知父组件刷新分类选择器
  } catch (error: any) {
    if (error !== "cancel") {
      message(error.response?.data?.message || "删除失败", { type: "error" });
    }
  }
}

onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="category-manage">
    <div class="header">
      <span class="title">相册分类管理</span>
      <el-button
        v-ripple
        type="primary"
        size="small"
        :icon="useRenderIcon(AddFill)"
        @click="openDialog()"
      >
        新增分类
      </el-button>
    </div>

    <pure-table
      :loading="loading"
      :data="dataList"
      :columns="columns"
      :header-cell-style="{
        background: 'var(--el-fill-color-light)',
        color: 'var(--el-text-color-primary)'
      }"
      max-height="400"
    >
      <template #operation="{ row }">
        <el-button
          v-ripple
          link
          type="primary"
          size="small"
          :icon="useRenderIcon(EditPen)"
          @click="openDialog('修改', row)"
        >
          编辑
        </el-button>
        <el-button
          v-ripple
          link
          type="danger"
          size="small"
          :icon="useRenderIcon(Delete)"
          @click="handleDelete(row)"
        >
          删除
        </el-button>
      </template>
    </pure-table>
  </div>
</template>

<style lang="scss" scoped>
.category-manage {
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding: 0 4px;

    .title {
      font-size: 15px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }
  }
}
</style>
