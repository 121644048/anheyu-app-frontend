<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { type StoragePolicy } from "@/api/sys-policy";

const myInput = ref(null);

const emit = defineEmits<{
  (e: "submit", payload: Partial<StoragePolicy>): void;
}>();

const formRef = ref<FormInstance>();
const formData = ref<Partial<StoragePolicy>>({
  type: "local",
  name: "",
  virtual_path: "",
  max_size: 10485760 // 默认 10MB
});

const rules = reactive<FormRules>({
  name: [{ required: true, message: "策略名称不能为空", trigger: "blur" }],
  virtual_path: [
    { required: true, message: "应用内挂载路径不能为空", trigger: "blur" },
    {
      pattern: /^\/[a-zA-Z0-9_-]+$/,
      message: "路径必须以 / 开头，只能包含字母、数字、下划线和连字符",
      trigger: "blur"
    }
  ]
});

const submitForm = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(valid => {
    if (valid) {
      // 本地存储的 base_path 需要是相对于 data/storage 的路径
      // 从 virtual_path 生成安全的存储路径
      const virtualPath = formData.value.virtual_path || "";
      const safePath = virtualPath.replace(/^\/+/, ""); // 移除开头的斜杠
      const basePath = `data/storage/${safePath}`;

      const submitData = {
        ...formData.value,
        base_path: basePath
      };
      emit("submit", submitData);
    }
  });
};

onMounted(() => {
  setTimeout(() => myInput.value?.focus(), 100);
});

defineExpose({ submitForm });
</script>

<template>
  <el-form
    ref="formRef"
    :model="formData"
    :rules="rules"
    label-position="top"
    class="create-form"
  >
    <el-form-item label="名称" prop="name">
      <el-input
        ref="myInput"
        v-model="formData.name"
        placeholder="例如：评论图片、文章图片"
      />
      <div class="form-item-help">存储策略的展示名，也会用于向用户展示。</div>
    </el-form-item>

    <el-form-item label="存储路径" prop="virtual_path">
      <el-input
        v-model="formData.virtual_path"
        placeholder="例如 /comments 或 /articles"
      />
      <div class="form-item-help">
        文件的访问路径，<strong>需保证唯一性</strong>。例如：/comments、/articles、/uploads<br />
        <span style="color: var(--el-color-info); font-size: 11px">
          实际存储位置：data/storage{{
            formData.virtual_path ? formData.virtual_path : "/路径名"
          }}
        </span>
      </div>
    </el-form-item>

    <el-form-item label="单文件大小限制" prop="max_size">
      <el-input
        v-model.number="formData.max_size"
        type="number"
        placeholder="10485760"
      >
        <template #append>字节</template>
      </el-input>
      <div class="form-item-help">
        单个文件的最大大小限制（字节）。默认 10485760 字节（10MB）。
      </div>
    </el-form-item>

    <div class="info-block">
      <h3>💡 提示</h3>
      <ul>
        <li>文件将保存在应用的 data/storage 目录下</li>
        <li>存储路径必须唯一，不能与其他策略重复</li>
        <li>建议使用有意义的路径名，方便后期管理</li>
        <li>例如：/comments 将存储到 data/storage/comments/</li>
      </ul>
    </div>
  </el-form>
</template>

<style lang="scss" scoped>
.create-form {
  padding: 0 10px;
}

.form-item-help {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.5;
  color: #999;

  strong {
    color: var(--el-color-warning);
  }
}

.info-block {
  padding: 12px 16px;
  margin-bottom: 16px;
  background: var(--el-fill-color-extra-light);
  border-radius: 6px;

  h3 {
    margin: 0 0 8px;
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  ul {
    padding-left: 18px;
    margin: 6px 0 0;

    li {
      margin-bottom: 4px;
      font-size: 13px;
      line-height: 1.6;
      color: var(--el-text-color-regular);
    }
  }
}

:deep(.el-form-item__label) {
  font-size: 16px;
  font-weight: 600;
  color: #000;
}
</style>
