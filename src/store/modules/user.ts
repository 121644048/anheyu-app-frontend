import { ref } from "vue";
import { defineStore } from "pinia";
import { store, router, resetRouter, routerArrays } from "../utils";
import {
  type UserInfo,
  type LoginResultData,
  type RefreshTokenResult,
  type CheckEmailExistsResult,
  type RegisterUserResult,
  type RegisterData,
  getLogin,
  refreshTokenApi,
  checkEmailExistsApi,
  registerUserApi
} from "@/api/user";
import { useMultiTagsStoreHook } from "./multiTags";
import { getToken, setToken, removeToken } from "@/utils/auth";
import { message } from "@/utils/message";

export const useUserStore = defineStore("anheyu-user", () => {
  const initialTokenData = getToken();
  const userInfo = initialTokenData?.userInfo;

  const avatar = ref<string>(userInfo?.avatar ?? "");
  const username = ref<string>(userInfo?.username ?? "");
  const nickname = ref<string>(userInfo?.nickname ?? "");
  const email = ref<string>(userInfo?.email ?? "");
  const roles = ref<string[]>(
    initialTokenData?.roles?.length ? initialTokenData.roles : []
  );
  const isRemembered = ref<boolean>(false);
  const loginDay = ref<number>(7);

  /**
   * @description 统一更新用户信息
   */
  function SET_USER_INFO(info: UserInfo) {
    avatar.value = info.avatar;
    username.value = info.username;
    nickname.value = info.nickname;
    email.value = info.email;
    roles.value = info.userGroup ? [info.userGroup.name] : [];
  }

  /**
   * @description 存储是否勾选了登录页的免登录
   */
  function SET_ISREMEMBERED(bool: boolean) {
    isRemembered.value = bool;
  }

  /**
   * @description 设置登录页的免登录存储几天
   */
  function SET_LOGINDAY(value: number) {
    loginDay.value = Number(value);
  }

  /**
   * @description 登入
   */
  async function loginByEmail(data: object): Promise<LoginResultData> {
    const response = await getLogin(data);
    if (response?.code === 200) {
      setToken(response.data);
      SET_USER_INFO(response.data.userInfo);
      return response.data;
    } else {
      message(response?.message || "登录失败，请重试");
      return Promise.reject(response);
    }
  }

  /**
   * @description 前端登出（不调用接口）
   */
  function logOut() {
    username.value = "";
    nickname.value = "";
    avatar.value = "";
    email.value = "";
    roles.value = [];
    removeToken();
    useMultiTagsStoreHook().handleTags("equal", [...routerArrays]);
    resetRouter();
    // 使用 replace 避免在历史记录中留下痕迹
    router.replace("/login");
  }

  /**
   * @description 刷新`token`
   */
  async function handRefreshToken(data: object): Promise<RefreshTokenResult> {
    const response = await refreshTokenApi(data);
    if (response) {
      setToken(response.data);
    }
    return response;
  }

  /**
   * @description 邮箱校验用户是否注册
   */
  async function checkEmailRegistered(
    email: string
  ): Promise<CheckEmailExistsResult> {
    return checkEmailExistsApi(email);
  }

  /**
   * @description 用户注册
   */
  async function registeredUser(
    data: RegisterData
  ): Promise<RegisterUserResult> {
    return registerUserApi(data);
  }

  /**
   * @description 模拟发送密码重置邮件 TODO: 需要修改
   */
  async function sendPasswordResetEmail(data: { email: string }) {
    return new Promise<any>(resolve => {
      console.log("模拟发送重置邮件到：", data.email);
      // 模拟后端成功响应
      resolve({ code: 200, message: "重置邮件已发送，请检查收件箱" });
    });
  }
  /** 重设密码 TODO: 需要修改 */
  async function resetPassword(data: object) {
    return new Promise<any>(resolve => {
      console.log("模拟使用以下信息重设密码：", data);
      // 模拟后端成功响应
      resolve({ code: 200, message: "密码重设成功" });
    });
  }

  return {
    avatar,
    username,
    nickname,
    email,
    roles,
    isRemembered,
    loginDay,
    SET_USER_INFO,
    SET_ISREMEMBERED,
    SET_LOGINDAY,
    loginByEmail,
    logOut,
    handRefreshToken,
    checkEmailRegistered,
    registeredUser,
    sendPasswordResetEmail,
    resetPassword
  };
});

export function useUserStoreHook() {
  return useUserStore(store);
}
