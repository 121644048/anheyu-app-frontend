/*
 * @Description: 服务器baseURL
 * @Author: 安知鱼
 * @Email: anzhiyu-c@qq.com
 * @Date: 2023-02-26 20:12:37
 * @LastEditTime: 2025-06-28 14:52:38
 * @LastEditors: 安知鱼
 */

let baseUrlApi;

// 因为使用了代理，此处不再使用绝对路径，否则可能会导致文件夹下载失败
if (process.env.NODE_ENV === "production") {
  baseUrlApi = (url: string) => {
    if (url.startsWith("/")) {
      return `/api${url}`;
    } else {
      return `/api/${url}`;
    }
  };
} else {
  baseUrlApi = (url: string) => {
    if (url.startsWith("/")) {
      return `https://106.55.245.138/api/${url}`;
    } else {
      return `https://106.55.245.138/api/${url}`;
    }
  };
}

export { baseUrlApi };
