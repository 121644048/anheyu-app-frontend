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
  type: "aws_s3",
  name: "",
  server: "",
  bucket_name: "",
  access_key: "",
  secret_key: "",
  base_path: "",
  virtual_path: "/s3",
  is_private: false,
  settings: {
    upload_method: "client",
    force_path_style: false
  }
});

// 默认使用客户端直传方式
const uploadMethod = {
  label: "客户端直传",
  value: "client",
  description: "客户端直接上传到AWS S3，减少服务器带宽压力，提升上传效率"
};

// AWS区域代码由用户手动输入

// Bucket读写权限选项
const bucketPermissions = [
  {
    value: false,
    label: "公有读，私有写",
    description:
      "文件可以被公开访问（无需授权），但只有授权用户能上传/修改文件。适合用于网站静态资源、图片等公开内容。"
  },
  {
    value: true,
    label: "私有读写",
    description:
      "文件的读取和写入都需要授权。系统将生成预签名URL供访问。适合用于存储敏感文件、私人文档等需要权限控制的内容。"
  }
];

const rules = reactive<FormRules>({
  name: [{ required: true, message: "策略名称不能为空", trigger: "blur" }],
  bucket_name: [
    { required: true, message: "存储桶名称不能为空", trigger: "blur" }
  ],
  server: [
    { required: true, message: "Endpoint URL不能为空", trigger: "blur" }
  ],
  access_key: [
    { required: true, message: "Access Key ID 不能为空", trigger: "blur" }
  ],
  secret_key: [
    { required: true, message: "Secret Access Key 不能为空", trigger: "blur" }
  ],
  virtual_path: [
    { required: true, message: "应用内挂载路径不能为空", trigger: "blur" }
  ]
});

// Endpoint配置已简化为直接输入URL

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
        placeholder="例如 /s3 或 /aws"
      />
      <div class="form-item-help">此策略在应用内部的访问路径，需保证唯一。</div>
    </el-form-item>

    <div class="info-block">
      <h3>AWS S3配置</h3>
      <p>
        前往
        <el-link
          type="primary"
          href="https://s3.console.aws.amazon.com/"
          target="_blank"
          >AWS S3控制台</el-link
        >
        创建存储桶，并获取访问密钥。
      </p>
    </div>

    <el-form-item label="Bucket 名称" prop="bucket_name">
      <el-input v-model="formData.bucket_name" placeholder="例如 my-bucket" />
      <div class="form-item-help">
        在AWS
        S3控制台创建的存储桶名称，全球唯一，只能包含小写字母、数字和连字符。
      </div>
    </el-form-item>

    <el-form-item label="Bucket 读写权限" prop="is_private">
      <el-radio-group v-model="formData.is_private">
        <div
          v-for="permission in bucketPermissions"
          :key="permission.value.toString()"
          class="access-permission-option"
          @click="formData.is_private = permission.value"
        >
          <el-radio :value="permission.value">{{ permission.label }}</el-radio>
          <div class="permission-description">
            {{ permission.description }}
          </div>
        </div>
      </el-radio-group>
      <div class="form-item-help">
        <strong>提示：</strong
        >请选择你创建的存储空间的读写权限类型。请确保您的S3存储桶访问权限与此设置一致。
        公用读需要配置存储桶策略允许公开访问，
        私有读写将使用预签名URL进行安全访问。
      </div>
    </el-form-item>

    <el-form-item label="Endpoint 配置" prop="server">
      <el-input
        v-model="formData.server"
        placeholder="https://bucket.region.example.com"
      />
      <div class="form-item-help">
        指定存储桶的 EndPoint（地域节点），填写为完整的 URL 格式，比如
        https://bucket.region.example.com。
      </div>
    </el-form-item>

    <el-form-item label="强制路径格式 Endpoint">
      <el-switch
        v-model="formData.settings.force_path_style"
        active-text="启用"
        inactive-text="禁用"
      />
      <div class="form-item-help">
        选择是否强制使用路径格式 Endpoint。某些第三方 S3
        兼容存储可能需要勾选此选项。 开启后，将会强制使用路径格式地址，比如
        http://s3.amazonaws.com/BUCKET/KEY。
      </div>
    </el-form-item>

    <div class="info-block">
      <h3>访问凭证</h3>
      <p>
        前往
        <el-link
          type="primary"
          href="https://console.aws.amazon.com/iam/home?#/security_credentials"
          target="_blank"
          >AWS IAM控制台</el-link
        >
        获取您的 Access Key ID 和 Secret Access
        Key。建议使用IAM用户，仅授予S3相关权限。
      </p>
    </div>

    <el-form-item label="Access Key ID" prop="access_key">
      <el-input v-model="formData.access_key" />
      <div class="form-item-help">AWS API访问密钥 Access Key ID。</div>
    </el-form-item>

    <el-form-item label="Secret Access Key" prop="secret_key">
      <el-input v-model="formData.secret_key" />
      <div class="form-item-help">AWS API访问密钥 Secret Access Key。</div>
    </el-form-item>

    <el-form-item label="云端存储根目录" prop="base_path">
      <el-input
        v-model="formData.base_path"
        placeholder="例如 /files 或留空表示存储桶根目录"
      />
      <div class="form-item-help">
        文件在S3中的存放根目录，以 / 开头，留空表示存储桶根目录。
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
      <h3>跨域策略</h3>
      <p>
        此存储策略需要正确配置如上跨域策略后才能使用 Web
        端上传文件，系统可以帮你自动设置，你也可以手动设置。 如果你已设置过此
        Bucket 的跨域策略，此步骤可以跳过。
      </p>
      <div class="cors-config-table">
        <h4>将自动配置以下CORS规则：</h4>
        <table class="cors-table">
          <thead>
            <tr>
              <th>来源</th>
              <th>允许 Methods</th>
              <th>允许 Headers</th>
              <th>暴露 Headers</th>
              <th>缓存时间</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>*</td>
              <td>GET<br />POST<br />PUT<br />DELETE<br />HEAD</td>
              <td>*</td>
              <td>ETag</td>
              <td>3600</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="info-block">
      <h3>关于CloudFront CDN</h3>
      <p>
        如果您需要CDN加速，可以在AWS控制台配置CloudFront，然后在存储策略的高级设置中配置CDN域名。
      </p>
      <ul>
        <li>全球边缘节点加速文件分发</li>
        <li>降低访问延迟和带宽成本</li>
        <li>支持HTTPS和自定义域名</li>
        <li>缓存控制和安全防护</li>
      </ul>
    </div>

    <div class="info-block">
      <h3>权限配置建议</h3>
      <p>为确保安全，建议:</p>
      <ul>
        <li>使用IAM用户账号，仅授予必要的S3权限</li>
        <li>定期轮换Access Key</li>
        <li>设置合适的存储桶策略</li>
        <li>启用MFA删除保护（重要数据）</li>
        <li>配置访问日志记录</li>
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
  border-left: 3px solid var(--el-color-success);
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

.cors-config-table {
  padding: 10px;
  margin-top: 10px;
  background: var(--el-fill-color-extra-light);
  border-left: 3px solid var(--el-color-primary);
  border-radius: 6px;

  h4 {
    margin: 0 0 8px;
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }
}

.cors-table {
  width: 100%;
  font-size: 12px;
  border-collapse: collapse;

  th,
  td {
    padding: 6px 8px;
    line-height: 1.4;
    text-align: left;
    border: 1px solid var(--el-border-color-light);
  }

  th {
    font-weight: 600;
    color: var(--el-text-color-primary);
    background: var(--el-fill-color-light);
  }

  td {
    color: var(--el-text-color-regular);
  }
}

:deep(.el-form-item__label) {
  font-size: 16px;
  font-weight: 600;
  color: #000;
}
</style>
