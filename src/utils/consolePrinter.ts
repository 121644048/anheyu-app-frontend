/*
 * @Description: 控制台打印工具 - 在生产环境中也能显示品牌信息
 * @Author: 安知鱼
 * @Date: 2025-09-26
 * @LastEditTime: 2025-09-30 14:12:57
 * @LastEditors: 安知鱼
 */

import { getConfig } from "@/config/base";
import { getVersionInfo } from "@/utils/versionManager";

interface ConsoleConfig {
  author?: string;
  version?: string;
  launchTime?: string;
  since?: string;
}

/**
 * 初始化控制台打印功能
 * @param config 配置信息，如果不传则从全局配置中获取
 */
export const initConsolePrinter = async (config?: ConsoleConfig) => {
  try {
    // 获取配置信息
    const globalConfig = getConfig();
    const versionInfo = await getVersionInfo();

    const finalConfig = {
      author:
        config?.author ||
        globalConfig?.author?.name ||
        globalConfig?.USER_NAME ||
        "安知鱼",
      version: config?.version || versionInfo.version || "1.0.0",
      launchTime:
        config?.launchTime ||
        globalConfig?.footer?.runtime?.launch_time ||
        "2022-08-28",
      since: config?.since || globalConfig?.footer?.owner?.since || "2022"
    };

    // 备份原始的 console 方法
    const originalConsoleLog = console.log;
    const originalConsoleWarn = console.warn;

    // 临时屏蔽 console.log
    console.log = function (..._args: any[]) {};

    const now = new Date();

    // 使用 queueMicrotask 确保在下一个微任务中执行
    queueMicrotask(() => {
      // 恢复 console.log 功能，但使用我们自己的实现
      const Log = function (...args: any[]) {
        originalConsoleLog.apply(console, args);
      };

      // 计算网站运行天数
      const launchDate = new Date(finalConfig.launchTime);
      now.setTime(now.getTime() + 250);
      const days = (now.getTime() - launchDate.getTime()) / 1000 / 60 / 60 / 24;
      const runningDays = Math.floor(days);

      // ASCII 艺术和欢迎信息
      const welcomeMessages = [
        `欢迎使用安知鱼!`,
        `生活明朗, 万物可爱`,
        `

         █████╗ ███╗   ██╗███████╗██╗  ██╗██╗██╗   ██╗██╗   ██╗
        ██╔══██╗████╗  ██║╚══███╔╝██║  ██║██║╚██╗ ██╔╝██║   ██║
        ███████║██╔██╗ ██║  ███╔╝ ███████║██║ ╚████╔╝ ██║   ██║
        ██╔══██║██║╚██╗██║ ███╔╝  ██╔══██║██║  ╚██╔╝  ██║   ██║
        ██║  ██║██║ ╚████║███████╗██║  ██║██║   ██║   ╚██████╔╝
        ╚═╝  ╚═╝╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝╚═╝   ╚═╝    ╚═════╝

          `,
        "已上线",
        runningDays,
        "天",
        `©${finalConfig.since} By 安知鱼 V${finalConfig.version}`
      ];

      // 趣味信息
      const funMessages = [
        `NCC2-036`,
        `调用前置摄像头拍照成功，识别为【小笨蛋】.`,
        `Photo captured: `,
        `🤪`
      ];

      // 延时打印欢迎信息
      setTimeout(() => {
        Log(
          `\n%c${welcomeMessages[0]} %c ${welcomeMessages[1]} %c ${welcomeMessages[2]} %c${welcomeMessages[3]}%c ${welcomeMessages[4]}%c ${welcomeMessages[5]}\n\n%c ${welcomeMessages[6]}\n`,
          "color:#425AEF",
          "",
          "color:#425AEF",
          "color:#425AEF",
          "",
          "color:#425AEF",
          ""
        );
      }, 100);

      // 延时打印趣味信息
      setTimeout(() => {
        Log(
          `%c ${funMessages[0]} %c ${funMessages[1]} %c \n${funMessages[2]} %c\n${funMessages[3]}\n`,
          "color:white; background-color:#4fd953",
          "",
          "",
          'background:url("https://npm.elemecdn.com/anzhiyu-blog@1.1.6/img/post/common/tinggge.gif") no-repeat;font-size:450%'
        );
      }, 300);

      // 延时打印欢迎信息
      setTimeout(() => {
        Log(
          "%c WELCOME %c 你好，小笨蛋.",
          "color:white; background-color:#4f90d9",
          ""
        );
      }, 500);

      // 延时打印技术信息
      setTimeout(() => {
        originalConsoleWarn(
          `%c ⚡ Powered by 安知鱼 %c 你正在访问 ${finalConfig.author} 的博客.`,
          "color:white; background-color:#f0ad4e",
          ""
        );
      }, 700);

      // 延时打印控制台信息
      setTimeout(() => {
        Log(
          "%c W23-12 %c 你已打开控制台.",
          "color:white; background-color:#4f90d9",
          ""
        );
      }, 900);

      // 延时打印监控警告
      setTimeout(() => {
        originalConsoleWarn(
          "%c S013-782 %c 你现在正处于监控中.",
          "color:white; background-color:#d9534f",
          ""
        );
      }, 1100);

      // 最后恢复 console.log
      setTimeout(() => {
        console.log = originalConsoleLog;
      }, 1500);
    });
  } catch (error) {
    console.error("初始化控制台打印器失败:", error);
  }
};

/**
 * 立即执行版本的控制台打印
 * 适用于需要立即显示的场景
 */
export const printConsoleWelcome = async (config?: ConsoleConfig) => {
  await initConsolePrinter(config);
};

export default {
  initConsolePrinter,
  printConsoleWelcome
};
