<script setup lang="ts">
import { type StoragePolicy } from "@/api/sys-policy";

// 使用 defineModel 来处理双向绑定
const formData = defineModel<Partial<StoragePolicy>>({ required: true });

// 确保 settings 对象存在并初始化默认值
if (!formData.value.settings) {
  formData.value.settings = {};
}

// 确保腾讯云COS相关的设置有默认值
if (!formData.value.settings.upload_method) {
  formData.value.settings.upload_method = "client";
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
  description: "客户端直接上传到腾讯云COS，减少服务器带宽压力，提升上传效率"
};
</script>

<template>
  <div>
    <el-divider><h2 class="divider-title">腾讯云COS配置</h2></el-divider>

    <el-form-item label="存储桶名称" prop="bucket_name">
      <el-input
        v-model="formData.bucket_name"
        placeholder="例如 my-bucket-1234567890"
      />
      <div class="form-item-help">
        在腾讯云COS控制台创建的存储桶名称，格式为 bucket-appid。
      </div>
    </el-form-item>

    <el-form-item label="访问域名" prop="server">
      <el-input
        v-model="formData.server"
        placeholder="https://bucket-appid.cos.region.myqcloud.com 或 https://oss.yourdomain.com"
      />
      <div class="form-item-help">
        在存储桶概况页面的"域名信息"栏目下获取COS访问域名。<br />
        <strong>支持的域名类型：</strong><br />
        • 默认域名：https://bucket-appid.cos.region.myqcloud.com<br />
        • 自定义源站域名：https://oss.yourdomain.com（需在COS控制台绑定）<br />
        此域名用于API操作（上传、删除、列表等），CDN加速域名请在下方单独配置。
      </div>
    </el-form-item>

    <el-divider><h2 class="divider-title">路径设置</h2></el-divider>

    <el-form-item label="云端存储根目录" prop="base_path">
      <el-input
        v-model="formData.base_path"
        placeholder="例如 /images 或留空表示存储桶根目录"
      />
      <div class="form-item-help">
        文件在腾讯云COS存储桶中的存放根目录，以 / 开头。留空表示存储桶根目录。
      </div>
    </el-form-item>

    <el-form-item label="应用内挂载路径" prop="virtual_path">
      <el-input
        v-model="formData.virtual_path"
        placeholder="例如 /tencent-cos"
      />
      <div class="form-item-help">此策略在应用内部的访问路径，需保证唯一。</div>
    </el-form-item>

    <el-divider><h2 class="divider-title">API 密钥信息</h2></el-divider>

    <el-form-item label="SecretId" prop="access_key">
      <el-input v-model="formData.access_key" />
      <div class="form-item-help">腾讯云API访问密钥 SecretId。</div>
    </el-form-item>

    <el-form-item label="SecretKey" prop="secret_key">
      <el-input v-model="formData.secret_key" />
      <div class="form-item-help">腾讯云API访问密钥 SecretKey。</div>
    </el-form-item>

    <el-divider><h2 class="divider-title">上传方式</h2></el-divider>

    <div class="upload-method-info">
      <div class="method-item">
        <div class="method-title">{{ uploadMethod.label }}</div>
        <div class="method-description">{{ uploadMethod.description }}</div>
      </div>
    </div>

    <el-divider><h2 class="divider-title">访问权限</h2></el-divider>

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
        <strong>提示：</strong>请确保您的COS存储桶访问权限与此设置一致。
      </div>
    </el-form-item>

    <div class="info-block">
      <h3>关于数据万象服务</h3>
      <p>
        如果您需要图片处理、缩略图生成等功能，请在
        <el-link
          type="primary"
          href="https://console.cloud.tencent.com/ci"
          target="_blank"
          >腾讯云数据万象控制台</el-link
        >
        中开通数据万象服务。系统会自动检测并使用相关功能。
      </p>
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
          如果你在 COS 域名设置中开启了 "回源鉴权"，请勾选此项。
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
      <h3>关于数据万象服务</h3>
      <p>
        如果您需要图片处理、缩略图生成等功能，请在
        <el-link
          type="primary"
          href="https://console.cloud.tencent.com/ci"
          target="_blank"
          >腾讯云数据万象控制台</el-link
        >
        中开通数据万象服务。系统会自动检测并使用相关功能。
      </p>
    </div>

    <div class="info-block">
      <h3>跨域策略配置</h3>
      <p>
        <strong>系统会自动为您的存储桶配置以下跨域策略：</strong>
      </p>
      <div class="cors-config-details">
        <ul>
          <li><strong>来源：</strong>* （允许所有来源）</li>
          <li><strong>方法：</strong>GET, POST, PUT, DELETE, HEAD</li>
          <li><strong>允许的头部：</strong>* （允许所有头部）</li>
          <li><strong>暴露的头部：</strong>ETag</li>
          <li><strong>缓存时间：</strong>3600 秒</li>
        </ul>
      </div>
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
    margin: 0;
    font-size: 13px;
    line-height: 1.4;
    color: var(--el-color-info);
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

.cors-config-details {
  padding: 10px;
  margin-top: 10px;
  background-color: var(--el-fill-color-extra-light);
  border-radius: 4px;

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
</style>
