import type { FormRules } from "element-plus";

export const tencentCosRules: FormRules = {
  server: [{ required: true, message: "访问域名不能为空", trigger: "blur" }],
  bucket_name: [
    { required: true, message: "存储桶名称不能为空", trigger: "blur" }
  ],
  access_key: [
    { required: true, message: "SecretId 不能为空", trigger: "blur" }
  ],
  secret_key: [
    { required: true, message: "SecretKey 不能为空", trigger: "blur" }
  ],
  virtual_path: [
    { required: true, message: "应用内挂载路径不能为空", trigger: "blur" }
  ],
  "settings.cdn_domain": [
    {
      validator: (rule: any, value: string, callback: any) => {
        if (value) {
          // 验证是否为完整的URL格式
          try {
            const url = new URL(value);
            if (!url.protocol.startsWith("http")) {
              callback(new Error("CDN域名必须包含协议（http://或https://）"));
              return;
            }
            callback();
          } catch {
            callback(
              new Error("CDN域名格式不正确，请输入完整的URL（包含协议）")
            );
          }
        } else {
          callback();
        }
      },
      trigger: "blur"
    }
  ]
};
