<script setup lang="ts">
import { type StoragePolicy } from "@/api/sys-policy";

// 使用 defineModel 来处理双向绑定
const formData = defineModel<Partial<StoragePolicy>>({ required: true });

// 确保 settings 对象存在并初始化默认值
if (!formData.value.settings) {
  formData.value.settings = {};
}

// 确保AWS S3相关的设置有默认值
if (!formData.value.settings.upload_method) {
  formData.value.settings.upload_method = "client";
}
if (formData.value.settings.force_path_style === undefined) {
  formData.value.settings.force_path_style = false;
}
if (!formData.value.settings.cdn_domain) {
  formData.value.settings.cdn_domain = "";
}
if (formData.value.settings.source_auth === undefined) {
  formData.value.settings.source_auth = false;
}
if (formData.value.settings.custom_proxy === undefined) {
  formData.value.settings.custom_proxy = false;
}

// 默认使用客户端直传方式
const uploadMethod = {
  label: "客户端直传",
  value: "client",
  description: "客户端直接上传到AWS S3，减少服务器带宽压力，提升上传效率"
};

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
</script>

<template>
  <div>
    <el-divider><h2 class="divider-title">AWS S3配置</h2></el-divider>

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

    <el-divider><h2 class="divider-title">API 密钥信息</h2></el-divider>

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

    <el-divider><h2 class="divider-title">上传方式</h2></el-divider>

    <div class="upload-method-info">
      <div class="method-item">
        <div class="method-title">{{ uploadMethod.label }}</div>
        <div class="method-description">{{ uploadMethod.description }}</div>
      </div>
    </div>

    <el-divider><h2 class="divider-title">下载设置</h2></el-divider>

    <el-form-item
      label="CDN 加速域名（可选）"
      prop="settings.cdn_domain"
      label-width="160px"
    >
      <el-input
        v-model="formData.settings.cdn_domain"
        placeholder="https://cdn.example.com"
      />
      <div class="form-item-help">
        填写完整的CDN访问地址（包含协议），用于替换文件URL中的主机名和协议部分。<br />
        <strong>示例：</strong> https://cdn.example.com 或
        https://files.yourdomain.com
      </div>
    </el-form-item>

    <el-form-item label="CDN 配置选项">
      <div>
        <el-checkbox v-model="formData.settings.source_auth">
          不为 CDN 签名文件 URL
        </el-checkbox>
        <div class="form-item-help">
          如果你在 S3 域名设置中开启了 "回源鉴权"，请勾选此项。
        </div>
      </div>
    </el-form-item>

    <el-form-item label="下载中转">
      <div>
        <el-checkbox v-model="formData.settings.custom_proxy">
          开启下载中转
        </el-checkbox>
        <div class="form-item-help">
          开启后，用户下载文件时会通过 Anheyu
          代理，可以提供更好的访问控制和统计。
        </div>
      </div>
    </el-form-item>

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
      <h3>跨域策略配置</h3>
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
  </div>
</template>

<style scoped>
.divider-title {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: var(--el-color-primary);
}

.form-item-help {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.4;
  color: var(--el-color-info);
}

.upload-method-info {
  margin-bottom: 16px;
}

.method-item {
  padding: 12px;
  background-color: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
}

.method-title {
  margin-bottom: 4px;
  font-weight: 500;
  color: var(--el-color-primary);
}

.method-description {
  font-size: 13px;
  line-height: 1.4;
  color: var(--el-color-info);
}

.info-block {
  padding: 12px;
  margin-bottom: 16px;
  background-color: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;

  h3 {
    margin: 0 0 8px;
    font-size: 14px;
    font-weight: 500;
    color: var(--el-text-color-primary);
  }

  p {
    margin: 0 0 8px;
    font-size: 13px;
    line-height: 1.4;
    color: var(--el-color-info);
  }

  ul {
    padding-left: 20px;
    margin: 0;

    li {
      margin: 4px 0;
      font-size: 13px;
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
  line-height: 1.4;
  color: var(--el-color-info);
}

.cors-config-table {
  margin-top: 10px;

  h4 {
    margin: 0 0 8px;
    font-size: 13px;
    font-weight: 500;
    color: var(--el-text-color-primary);
  }
}

.cors-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;

  th,
  td {
    padding: 8px 6px;
    text-align: left;
    border: 1px solid var(--el-border-color-light);
  }

  th {
    background-color: var(--el-fill-color-lighter);
    font-weight: 500;
    color: var(--el-text-color-primary);
  }

  td {
    color: var(--el-text-color-regular);
  }
}
</style>
