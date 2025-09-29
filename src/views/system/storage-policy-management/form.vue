<script setup lang="ts">
import { ref, computed, watch, shallowRef } from "vue";
import type { StoragePolicy } from "@/api/sys-policy";
import type { FormInstance, FormRules } from "element-plus";
import { commonFormRules } from "./utils/rule";

// 动态导入
import LocalForm from "./components/local/Form.vue";
import { localRules } from "./components/local/config";
import OneDriveForm from "./components/onedrive/Form.vue";
import { oneDriveRules } from "./components/onedrive/config";
import TencentCosForm from "./components/tencent-cos/Form.vue";
import { tencentCosRules } from "./components/tencent-cos/config";
import AliyunOssForm from "./components/aliyun-oss/Form.vue";
import { aliyunOssRules } from "./components/aliyun-oss/config";
import AwsS3Form from "./components/aws-s3/Form.vue";
import { awsS3Rules } from "./components/aws-s3/config";

// 注册动态组件和规则
const providerForms = shallowRef({
  local: LocalForm,
  onedrive: OneDriveForm,
  tencent_cos: TencentCosForm,
  aliyun_oss: AliyunOssForm,
  aws_s3: AwsS3Form
});
const providerRules = {
  local: localRules,
  onedrive: oneDriveRules,
  tencent_cos: tencentCosRules,
  aliyun_oss: aliyunOssRules,
  aws_s3: awsS3Rules
};

const props = defineProps<{ modelValue: Partial<StoragePolicy> }>();
const formData = defineModel<Partial<StoragePolicy>>();

const ruleFormRef = ref<FormInstance>();
const formRules = computed<FormRules>(() => {
  const currentProviderRules = providerRules[formData.value.type] || {};
  return { ...commonFormRules, ...currentProviderRules };
});

const providerFormComponent = computed(() => {
  return providerForms.value[formData.value.type] || null;
});

// 单位换算逻辑
const units = [
  { label: "B", value: 1 },
  { label: "KB", value: 1024 },
  { label: "MB", value: 1024 * 1024 },
  { label: "GB", value: 1024 * 1024 * 1024 }
];

function bytesToHuman(
  bytes: number,
  defaultVal: number,
  defaultUnit: number
): [number, number] {
  if (!bytes) return [defaultVal, defaultUnit];
  for (let i = units.length - 1; i >= 0; i--) {
    const unit = units[i];
    if (bytes >= unit.value && bytes % unit.value === 0) {
      return [bytes / unit.value, unit.value];
    }
  }
  return [parseFloat((bytes / defaultUnit).toFixed(2)), defaultUnit];
}

// “文件大小限制”的逻辑
const maxsizeValue = ref(0);
const maxsizeUnit = ref(1024 * 1024);
watch(
  () => props.modelValue.max_size,
  newVal => {
    [maxsizeValue.value, maxsizeUnit.value] = bytesToHuman(
      newVal ?? 0,
      0,
      1024 * 1024
    );
  },
  { immediate: true }
);
watch(
  [maxsizeValue, maxsizeUnit],
  ([newSize, newUnit]) => {
    formData.value.max_size = Math.round(newSize * newUnit);
  },
  { immediate: true }
);

// “上传分片大小”的逻辑
const chunkSizeValue = ref(50);
const chunkSizeUnit = ref(1024 * 1024);
watch(
  () => props.modelValue.settings?.chunk_size,
  newVal => {
    [chunkSizeValue.value, chunkSizeUnit.value] = bytesToHuman(
      newVal ?? 0,
      50,
      1024 * 1024
    );
  },
  { immediate: true }
);
watch(
  [chunkSizeValue, chunkSizeUnit],
  ([newSize, newUnit]) => {
    if (!formData.value.settings) formData.value.settings = {};
    formData.value.settings.chunk_size = Math.round(newSize * newUnit);
  },
  { immediate: true }
);

function getRef() {
  return ruleFormRef.value;
}
defineExpose({ getRef });
</script>

<template>
  <el-form
    ref="ruleFormRef"
    :model="formData"
    :rules="formRules"
    label-width="150px"
  >
    <h1>基本信息</h1>
    <el-form-item label="策略名称" prop="name">
      <el-input v-model="formData.name" placeholder="请输入策略名称" />
    </el-form-item>

    <el-form-item label="策略标志" prop="flag">
      <el-select
        v-model="formData.flag"
        placeholder="请选择策略标志"
        style="width: 100%"
      >
        <el-option label="无 (普通策略)" value="" />
        <el-option label="文章图片默认" value="article_image" />
        <el-option label="评论图片默认" value="comment_image" />
      </el-select>
      <div class="form-item-help">
        设置后，该策略将成为系统核心功能的默认存储位置。此标志在系统中具有唯一性。
      </div>
    </el-form-item>

    <el-form-item label="存储类型" prop="type">
      <el-select v-model="formData.type" :disabled="!!formData.id">
        <el-option label="本机存储" value="local" />
        <el-option label="OneDrive" value="onedrive" />
        <el-option label="腾讯云COS" value="tencent_cos" />
        <el-option label="阿里云OSS" value="aliyun_oss" />
        <el-option label="AWS S3" value="aws_s3" />
      </el-select>
    </el-form-item>

    <component
      :is="providerFormComponent"
      v-if="providerFormComponent"
      v-model="formData"
    />

    <el-divider><h2 class="divider-title">存储与上传</h2></el-divider>

    <el-form-item label="文件大小限制" prop="max_size">
      <div>
        <el-input v-model.number="maxsizeValue" :min="0" style="width: 180px">
          <template #append>
            <el-select v-model="maxsizeUnit" style="width: 80px">
              <el-option
                v-for="u in units"
                :key="u.value"
                :label="u.label"
                :value="u.value"
              />
            </el-select>
          </template>
        </el-input>
        <div class="form-item-help">
          单个文件的最大大小，输入为 0 时表示不限制单文件大小。
        </div>
      </div>
    </el-form-item>

    <el-form-item label="上传分片大小" prop="settings.chunk_size">
      <div>
        <el-input v-model.number="chunkSizeValue" :min="0" style="width: 180px">
          <template #append>
            <el-select v-model="chunkSizeUnit" style="width: 80px">
              <el-option
                v-for="u in units.filter(u => u.label !== 'B')"
                :key="u.value"
                :label="u.label"
                :value="u.value"
              />
            </el-select>
          </template>
        </el-input>
        <div class="form-item-help">
          分片上传时每个分片的大小，0 表示使用后端默认值。
        </div>
      </div>
    </el-form-item>
  </el-form>
</template>

<style scoped>
.divider-title {
  font-size: 16px;
  font-weight: bold;
}

.form-item-help {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.5;
  color: #999;
}
</style>
