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
  type: "aliyun_oss",
  name: "",
  server: "",
  bucket_name: "",
  access_key: "",
  secret_key: "",
  base_path: "",
  virtual_path: "/oss",
  is_private: false,
  settings: {
    upload_method: "client"
  }
});

// 默认使用客户端直传方式
const uploadMethod = {
  label: "客户端直传",
  value: "client",
  description: "客户端直接上传到阿里云OSS，减少服务器带宽压力，提升上传效率"
};

const rules = reactive<FormRules>({
  name: [{ required: true, message: "策略名称不能为空", trigger: "blur" }],
  bucket_name: [
    { required: true, message: "存储桶名称不能为空", trigger: "blur" }
  ],
  server: [{ required: true, message: "访问域名不能为空", trigger: "blur" }],
  access_key: [
    { required: true, message: "AccessKey ID 不能为空", trigger: "blur" }
  ],
  secret_key: [
    { required: true, message: "AccessKey Secret 不能为空", trigger: "blur" }
  ],
  virtual_path: [
    { required: true, message: "应用内挂载路径不能为空", trigger: "blur" }
  ]
});

const submitForm = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(valid => {
    if (valid) {
      emit("submit", formData.value);
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
      <el-input ref="myInput" v-model="formData.name" />
      <div class="form-item-help">存储策略的展示名，也会用于向用户展示。</div>
    </el-form-item>

    <el-form-item label="应用内挂载路径" prop="virtual_path">
      <el-input
        v-model="formData.virtual_path"
        placeholder="例如 /oss 或 /aliyun"
      />
      <div class="form-item-help">此策略在应用内部的访问路径，需保证唯一。</div>
    </el-form-item>

    <div class="info-block">
      <h3>阿里云OSS配置</h3>
      <p>
        前往
        <el-link
          type="primary"
          href="https://oss.console.aliyun.com/"
          target="_blank"
          >阿里云对象存储OSS控制台</el-link
        >
        创建存储桶，并获取访问密钥。
      </p>
    </div>

    <el-form-item label="存储桶名称" prop="bucket_name">
      <el-input v-model="formData.bucket_name" placeholder="例如 my-bucket" />
      <div class="form-item-help">
        在阿里云OSS控制台创建的存储桶名称，全球唯一。
      </div>
    </el-form-item>

    <el-form-item label="访问域名" prop="server">
      <el-input
        v-model="formData.server"
        placeholder="https://bucket.oss-region.aliyuncs.com 或 https://oss.yourdomain.com"
      />
      <div class="form-item-help">
        在存储桶概况页面的"域名管理"栏目下获取OSS访问域名。<br />
        <strong>支持的域名类型：</strong><br />
        • 外网访问域名：https://bucket.oss-region.aliyuncs.com<br />
        • 自定义域名：https://oss.yourdomain.com（需在OSS控制台绑定）<br />
        此域名用于API操作（上传、删除、列表等），CDN加速域名请在下方单独配置。
      </div>
    </el-form-item>

    <div class="info-block">
      <h3>API 密钥信息</h3>
      <p>
        前往
        <el-link
          type="primary"
          href="https://usercenter.console.aliyun.com/#/manage/ak"
          target="_blank"
          >阿里云AccessKey管理</el-link
        >
        获取您的 AccessKey ID 和 AccessKey
        Secret。建议使用RAM子用户，仅授予OSS相关权限。
      </p>
    </div>

    <el-form-item label="AccessKey ID" prop="access_key">
      <el-input v-model="formData.access_key" />
      <div class="form-item-help">阿里云API访问密钥 AccessKey ID。</div>
    </el-form-item>

    <el-form-item label="AccessKey Secret" prop="secret_key">
      <el-input v-model="formData.secret_key" />
      <div class="form-item-help">阿里云API访问密钥 AccessKey Secret。</div>
    </el-form-item>

    <el-form-item label="云端存储根目录" prop="base_path">
      <el-input
        v-model="formData.base_path"
        placeholder="例如 /files 或留空表示存储桶根目录"
      />
      <div class="form-item-help">
        文件在OSS中的存放根目录，以 / 开头，留空表示存储桶根目录。
      </div>
    </el-form-item>

    <el-form-item label="访问权限" prop="is_private">
      <el-radio-group v-model="formData.is_private">
        <div
          class="access-permission-option"
          @click="formData.is_private = false"
        >
          <el-radio :value="false">公用读，私有写</el-radio>
          <div class="permission-description">
            文件可以被公开访问（无需授权），但只有授权用户能上传/修改文件。适合用于网站静态资源、图片等公开内容。
          </div>
        </div>
        <div
          class="access-permission-option"
          @click="formData.is_private = true"
        >
          <el-radio :value="true">私有读写</el-radio>
          <div class="permission-description">
            文件的读取和写入都需要授权。适合用于存储敏感文件、私人文档等需要权限控制的内容。
          </div>
        </div>
      </el-radio-group>
      <div class="form-item-help">
        <strong>提示：</strong>请确保您的OSS存储桶访问权限与此设置一致。
        公用读需要将存储桶设置为"公共读"或"公共读写"，
        私有读写需要将存储桶设置为"私有"。
      </div>
    </el-form-item>

    <div class="info-block">
      <h3>上传方式</h3>
      <div class="upload-method-info">
        <div class="method-title">{{ uploadMethod.label }}</div>
        <div class="method-description">{{ uploadMethod.description }}</div>
      </div>
    </div>

    <div class="info-block">
      <h3>关于图片处理服务</h3>
      <p>
        如果您需要图片处理、缩略图生成等功能，请在
        <el-link
          type="primary"
          href="https://oss.console.aliyun.com/"
          target="_blank"
          >阿里云OSS控制台</el-link
        >
        自行开通图片处理服务。开通后，系统将自动支持图片处理功能。
      </p>
      <ul>
        <li>实时图片缩放、裁剪、旋转</li>
        <li>图片格式转换（WEBP、HEIF等）</li>
        <li>图片质量压缩和优化</li>
        <li>图片水印和文字叠加</li>
      </ul>
    </div>

    <div class="info-block">
      <h3>跨域策略配置</h3>
      <p>
        系统将自动为您的OSS存储桶配置跨域策略（CORS），确保文件能被正常访问。
      </p>
      <div class="cors-config-details">
        <h4>将自动配置以下CORS规则：</h4>
        <ul>
          <li><strong>来源：</strong>* （允许所有来源）</li>
          <li><strong>方法：</strong>GET, POST, PUT, DELETE, HEAD</li>
          <li><strong>允许Headers：</strong>* （允许所有请求头）</li>
          <li><strong>暴露Headers：</strong>ETag</li>
          <li><strong>缓存时间：</strong>3600秒</li>
        </ul>
      </div>
    </div>

    <div class="info-block">
      <h3>权限配置建议</h3>
      <p>为确保安全，建议:</p>
      <ul>
        <li>使用RAM子用户账号，仅授予必要的OSS权限</li>
        <li>定期更换AccessKey</li>
        <li>设置合适的存储桶访问权限</li>
        <li>如需要跨域访问，请配置CORS规则</li>
      </ul>
    </div>
  </el-form>
</template>

<style lang="scss" scoped>
.create-form {
  max-height: 60vh;
  padding: 20px 24px;
  overflow-y: auto;

  /* 自定义滚动条样式 */
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: var(--el-fill-color-light);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--el-color-info-light-5);
    border-radius: 3px;

    &:hover {
      background: var(--el-color-info-light-3);
    }
  }
}

.form-item-help {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.5;
  color: #999;
}

.upload-method-info {
  padding: 12px 16px;
  background: var(--el-fill-color-extra-light);
  border: var(--style-border);
  border-radius: 6px;

  .method-title {
    margin-bottom: 4px;
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .method-description {
    font-size: 13px;
    line-height: 1.5;
    color: var(--el-text-color-regular);
  }
}

.info-block {
  margin-bottom: 16px;

  h3 {
    margin-bottom: 8px;
    font-size: 16px;
    font-weight: 600;
  }

  p {
    margin: 0 0 8px;
    font-size: 14px;
    line-height: 1.7;
    color: var(--el-text-color-regular);
  }

  ul {
    padding-left: 18px;
    margin: 6px 0;

    li {
      margin-bottom: 2px;
      font-size: 13px;
      line-height: 1.4;
      color: var(--el-text-color-regular);
    }
  }
}

.access-permission-option {
  padding: 10px;
  margin-bottom: 12px;
  cursor: pointer;
  border: 1px solid var(--el-border-color-light);
  border-radius: 6px;
  transition: border-color 0.2s;

  &:hover {
    background-color: var(--el-fill-color-extra-light);
    border-color: var(--el-color-primary);
  }
}

.permission-description {
  margin-top: 8px;
  margin-left: 24px;
  font-size: 13px;
  line-height: 1.5;
  color: var(--el-color-info);
}

.cors-config-details {
  padding: 10px;
  margin-top: 10px;
  background: var(--el-fill-color-extra-light);
  border: var(--style-border);
  border-radius: 6px;

  h4 {
    margin: 0 0 8px;
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  ul {
    padding-left: 16px;
    margin: 0;

    li {
      margin-bottom: 4px;
      font-size: 13px;
      line-height: 1.4;
      color: var(--el-text-color-regular);
    }
  }

  code {
    padding: 2px 6px;
    font-size: 0.9em;
    color: var(--el-text-color-primary);
    background: var(--el-fill-color-light);
    border: 1px solid var(--el-border-color-light);
    border-radius: 4px;
  }

  .el-link {
    font-size: 14px;
    vertical-align: baseline;
  }
}

:deep(.el-form-item__label) {
  font-size: 16px;
  font-weight: 600;
  color: #000;
}
</style>
