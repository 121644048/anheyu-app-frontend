import Axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type CustomParamsSerializer,
  type InternalAxiosRequestConfig
} from "axios";
import type {
  AnHttpError,
  RequestMethods,
  AnHttpResponse,
  AnHttpRequestConfig
} from "./types.d";
import { stringify } from "qs";
import { getToken, formatToken, removeToken } from "@/utils/auth";
import { useUserStoreHook } from "@/store/modules/user";
import { handleBackendError } from "./error"; // 引入我们之前创建的全局错误处理器

/**
 * @description Axios的默认配置
 * @property {number} timeout - 请求超时时间，单位为毫秒。
 * @property {object} headers - 自定义请求头。
 * @property {object} paramsSerializer - 自定义请求参数序列化逻辑，这里使用`qs`库。
 */
const defaultConfig: AxiosRequestConfig = {
  timeout: 30000,
  headers: {
    Accept: "application/json, text/plain, */*",
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest"
  },
  paramsSerializer: {
    serialize: stringify as unknown as CustomParamsSerializer
  }
};

/**
 * @class AnHttp
 * @description 一个基于Axios的HTTP请求封装类，实现了Token自动刷新、请求队列、全局错误处理等功能。
 */
class AnHttp {
  /**
   * @private
   * @static
   * @property {AxiosInstance} axiosInstance - Axios的实例，用于所有请求的发送。
   */
  private static axiosInstance: AxiosInstance = Axios.create(defaultConfig);

  /**
   * @private
   * @static
   * @property {Function[]} retryRequests - 在Token刷新期间，暂存待重试的请求队列。
   * 每个函数接收新的accessToken作为参数，并附加了一个`reject`方法，用于在刷新失败时拒绝Promise。
   */
  private static retryRequests: {
    (newAccessToken: string): void;
    reject: (reason?: any) => void;
  }[] = [];

  /**
   * @private
   * @static
   * @property {boolean} isRefreshing - 一个锁，防止因并发请求而多次触发刷新Token的操作。
   */
  private static isRefreshing = false;

  constructor() {
    this.httpInterceptorsRequest();
    this.httpInterceptorsResponse();
  }

  /**
   * @private
   * @static
   * @method addRetryRequest
   * @description 当Token正在刷新时，将后续请求暂停并存入队列。
   * @param {InternalAxiosRequestConfig} config - 原始请求的配置。
   * @returns {Promise<any>} 返回一个Promise，它会在Token刷新完成后被resolve或reject。
   */
  private static addRetryRequest(
    config: InternalAxiosRequestConfig
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      // 创建一个请求函数
      const request = (newAccessToken: string) => {
        config.headers["Authorization"] = formatToken(newAccessToken);
        // 用更新了Token的配置重新发起请求，并resolve这个Promise
        resolve(AnHttp.axiosInstance(config));
      };
      // 在请求函数上附加一个reject方法
      request.reject = reject;
      // 将这个包装后的请求函数推入队列
      AnHttp.retryRequests.push(request);
    });
  }

  /**
   * @private
   * @static
   * @method handleRefreshToken
   * @description 统一处理Token刷新逻辑。
   * @returns {Promise<string>} 成功时返回新的accessToken，失败时返回一个被reject的Promise。
   */
  private static async handleRefreshToken(): Promise<string> {
    AnHttp.isRefreshing = true;
    try {
      const tokenData = getToken();
      if (!tokenData?.refreshToken) {
        throw new Error("本地没有可用的refreshToken。");
      }

      // 调用Pinia/Vuex store中的方法来执行刷新Token的API调用
      const res = await useUserStoreHook().handRefreshToken({
        refreshToken: tokenData.refreshToken
      });

      const newAccessToken = res.data?.accessToken;
      if (!newAccessToken) {
        throw new Error("刷新Token的响应中不包含accessToken。");
      }

      // Token刷新成功，遍历执行队列中所有待重试的请求
      AnHttp.retryRequests.forEach(cb => cb(newAccessToken));

      // 返回新的Token，供第一个触发刷新的请求使用
      return newAccessToken;
    } catch (error) {
      // Token刷新失败，拒绝所有待重试的请求，并强制用户登出
      AnHttp.retryRequests.forEach(cb =>
        cb.reject(new Error("Token刷新失败，请重新登录。"))
      );
      removeToken();
      useUserStoreHook().logOut();
      // 将原始错误继续抛出
      return Promise.reject(error);
    } finally {
      // 无论成功或失败，最后都要清空队列并重置状态
      AnHttp.retryRequests = [];
      AnHttp.isRefreshing = false;
    }
  }

  /**
   * @private
   * @method httpInterceptorsRequest
   * @description 请求拦截器。主要负责为请求头附加Authorization。
   */
  private httpInterceptorsRequest(): void {
    AnHttp.axiosInstance.interceptors.request.use(
      (config: AnHttpRequestConfig) => {
        // 白名单内的请求直接放行，无需Token
        const whiteList = [
          "/auth/refresh-token",
          "/auth/login",
          "auth/check-email",
          "public/wallpapers",
          "public/site-config",
          // 文章（前台）
          "public/articles",
          "public/articles/home",
          "public/articles/random",
          "public/articles/archives",
          // 友链（前台）
          "public/links",
          "public/links/random",
          "public/link-categories",
          // 评论（前台）
          "public/comments",
          "public/comments/upload",
          "public/comments/like",
          "public/comments/unlike",
          "public/comments/children",
          // 统计
          "public/statistics/basic",
          "public/statistics/visit",
          // 自定义页面
          "public/pages",
          // 最近评论
          "public/comments/latest",
          // 主题商城（公开接口）
          "public/theme/market",
          "public/theme/static-mode"
        ];
        if (whiteList.some(url => config.url?.endsWith(url))) {
          return config;
        }

        // 为非白名单的请求附上AccessToken
        const tokenData = getToken();
        if (tokenData?.accessToken) {
          config.headers["Authorization"] = formatToken(tokenData.accessToken);
        }
        return config;
      },
      error => Promise.reject(error)
    );
  }

  /**
   * @private
   * @method httpInterceptorsResponse
   * @description 响应拦截器。处理成功响应的数据转换、Token失效的自动刷新以及全局的错误捕获。
   */
  private httpInterceptorsResponse(): void {
    AnHttp.axiosInstance.interceptors.response.use(
      // 对于成功的响应(2xx)，直接返回响应体中的`data`部分，简化业务层的调用
      (response: AnHttpResponse) => response.data,

      // 对于失败的响应进行统一处理
      async (error: AnHttpError) => {
        const { config, response }: any = error;

        // 如果是请求被取消或配置不存在，则直接将错误抛出
        if (Axios.isCancel(error) || !config) {
          return Promise.reject(error);
        }

        // 如果是刷新Token或登录接口本身返回401，说明认证失败，直接登出，防止无限循环刷新
        const isAuthRequest =
          config.url?.endsWith("/auth/refresh-token") ||
          config.url?.endsWith("/auth/login");
        if (isAuthRequest && response?.status === 401) {
          removeToken();
          useUserStoreHook().logOut();
          return Promise.reject(response.data);
        }

        // 当接收到401错误时，触发Token刷新流程
        if (response?.status === 401) {
          if (!AnHttp.isRefreshing) {
            // 如果是第一个收到401的请求，则启动刷新流程
            try {
              const newAccessToken = await AnHttp.handleRefreshToken();
              // 刷新成功后，使用新Token重新发起当前失败的请求
              config.headers["Authorization"] = formatToken(newAccessToken);
              return AnHttp.axiosInstance(config);
            } catch (refreshError) {
              // 如果`handleRefreshToken`内部发生错误（例如刷新也失败了），则直接抛出
              return Promise.reject(refreshError);
            }
          } else {
            // 如果已有请求正在刷新Token，则将当前请求加入待重试队列
            return AnHttp.addRetryRequest(config);
          }
        }

        // 我们需要它抛出到业务层，以便对单个上传任务进行状态管理
        const isUploadRequest = config.url?.includes("/file/upload");
        if (isUploadRequest) {
          // 对于上传相关的错误，直接将原始错误抛出
          // 让 Uploader 类和 useFileUploader 的 .catch 去处理
          console.warn(
            "检测到上传接口错误，将错误传递到业务层处理:",
            response?.data?.message || "未知错误"
          );
          return Promise.reject(error);
        }

        const isTestEmailRequest = config.url?.endsWith("/settings/test-email");
        if (isTestEmailRequest) {
          // 对于测试邮件请求，我们不使用全局错误提示，而是将错误直接抛出，
          // 让组件中的 try...catch...finally 能够完整地执行，从而可以控制按钮的 loading 状态。
          console.warn(
            "检测到测试邮件接口错误，将错误传递到业务层处理:",
            response?.data?.message || "未知错误"
          );
          return Promise.reject(error);
        }

        // 对于404错误，直接抛出到业务层，让业务层决定如何处理
        if (response?.status === 404) {
          return Promise.reject(error);
        }

        // 对于其他所有错误（如500等），调用全局错误处理器显示UI提示
        handleBackendError(error);

        // 返回一个永远处于挂起状态的Promise，以中断业务层代码的执行
        // 这实现了“错误在HTTP层被完全处理，不再传递到业务层”的目标
        return new Promise(() => {});
      }
    );
  }

  /**
   * @public
   * @method request
   * @description 通用的请求方法。
   * @template T - 期望的响应数据类型。
   * @param {RequestMethods} method - 请求方法 (get, post, ...)。
   * @param {string} url - 请求的URL。
   * @param {AxiosRequestConfig} [param] - 请求参数 (如`data`, `params`)。
   * @param {AnHttpRequestConfig} [axiosConfig] - 额外的Axios配置。
   * @returns {Promise<T>} 返回一个Promise，成功时resolve响应数据。
   */
  public request<T>(
    method: RequestMethods,
    url: string,
    param?: AxiosRequestConfig,
    axiosConfig?: AnHttpRequestConfig
  ): Promise<T> {
    const config = {
      method,
      url,
      ...param,
      ...axiosConfig
    };
    return AnHttp.axiosInstance.request(config);
  }

  /**
   * @public
   * @method post
   * @description POST请求的便捷方法。
   * @template T - 期望的响应数据类型。
   * @template P - `data`参数的类型。
   * @param {string} url - 请求的URL。
   * @param {P} [data] - 请求体数据。
   * @param {AnHttpRequestConfig} [config] - 额外的Axios配置。
   * @returns {Promise<T>}
   */
  public post<T, P>(
    url: string,
    data?: P,
    config?: AnHttpRequestConfig
  ): Promise<T> {
    return this.request<T>("post", url, { data }, config);
  }

  /**
   * @public
   * @method get
   * @description GET请求的便捷方法。
   * @template T - 期望的响应数据类型。
   * @template P - `params`参数的类型。
   * @param {string} url - 请求的URL。
   * @param {P} [params] - URL查询参数。
   * @param {AnHttpRequestConfig} [config] - 额外的Axios配置。
   * @returns {Promise<T>}
   */
  public get<T, P>(
    url: string,
    params?: P,
    config?: AnHttpRequestConfig
  ): Promise<T> {
    return this.request<T>("get", url, { params }, config);
  }
}

/**
 * @description 导出的`http`实例，在整个应用中应作为单例使用。
 */
export const http = new AnHttp();
