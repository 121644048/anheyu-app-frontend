// import "@/utils/sso";
import { getConfig } from "@/config/base";
// import NProgress from "@/utils/progress";
import { buildHierarchyTree } from "@/utils/tree";
import remainingRouter from "./modules/remaining";
import { useMultiTagsStoreHook } from "@/store/modules/multiTags";
import { usePermissionStoreHook } from "@/store/modules/permission";
import { isUrl, openLink, storageLocal, isAllEmpty } from "@pureadmin/utils";
import { clearArticleMetaTags, isArticlePage } from "@/utils/metaManager";
import {
  ascending,
  getTopMenu,
  initRouter,
  isOneOfArray,
  getHistoryMode,
  findRouteByPath,
  handleAliveRoute,
  formatTwoStageRoutes,
  formatFlatteningRoutes
} from "./utils";
import {
  type Router,
  createRouter,
  type RouteRecordRaw,
  type RouteComponent,
  type RouteLocationNormalized
} from "vue-router";
import type { LoginResultData } from "@/api/user";
import { userKey, removeToken, multipleTabsKey } from "@/utils/auth";
import { useLoadingStore } from "@/store/modules/loadingStore";
import { recordRouteChange } from "./statistics";
import { resetThemeToDefault } from "@/utils/themeManager";

// 定义路由类型别名
type ToRouteType = RouteLocationNormalized;

/** 自动导入全部静态路由，无需再手动引入！匹配 src/router/modules 目录（任何嵌套级别）中具有 .ts 扩展名的所有文件，除了 remaining.ts 文件
 * 如何匹配所有文件请看：https://github.com/mrmlnc/fast-glob#basic-syntax
 * 如何排除文件请看：https://cn.vitejs.dev/guide/features.html#negative-patterns
 */
const modules: Record<string, any> = import.meta.glob(
  ["./modules/**/*.ts", "!./modules/**/remaining.ts"],
  {
    eager: true
  }
);

/** 原始静态路由（未做任何处理） */
const routes = [];

Object.keys(modules).forEach(key => {
  routes.push(modules[key].default);
});

/** 导出处理后的静态路由（三级及以上的路由全部拍成二级） */
export const constantRoutes: Array<RouteRecordRaw> = formatTwoStageRoutes(
  formatFlatteningRoutes(buildHierarchyTree(ascending(routes.flat(Infinity))))
);

/** 用于渲染菜单，保持原始层级 */
export const constantMenus: Array<RouteComponent> = ascending(
  routes.flat(Infinity)
).concat(...remainingRouter);

/** 不参与菜单的路由 */
export const remainingPaths = Object.keys(remainingRouter).map(v => {
  return remainingRouter[v].path;
});

/** 创建路由实例 */
export const router: Router = createRouter({
  history: getHistoryMode(import.meta.env.VITE_ROUTER_HISTORY),
  routes: constantRoutes.concat(...(remainingRouter as any)),
  strict: true,
  scrollBehavior(to, from, savedPosition) {
    // 1. 如果有 savedPosition，说明是浏览器前进后退，直接返回
    if (savedPosition) {
      return savedPosition;
    }

    // 2. 检查前一个路由是否需要保留滚动位置
    //    (注意：我将 saveSrollTop 修正为 saveScrollTop)
    if (from.meta.saveScrollTop) {
      const top = document.documentElement.scrollTop || document.body.scrollTop;
      return { left: 0, top };
    }

    // 3. 对于所有其他情况，都平滑滚动到页面顶部
    return { top: 0 };
  }
});

/** 重置路由 */
export function resetRouter() {
  router.getRoutes().forEach(route => {
    const { name, meta } = route;
    if (name && router.hasRoute(name) && meta?.backstage) {
      router.removeRoute(name);
      router.options.routes = formatTwoStageRoutes(
        formatFlatteningRoutes(
          buildHierarchyTree(ascending(routes.flat(Infinity)))
        )
      );
    }
  });
  usePermissionStoreHook().clearAllCachePage();
}

/** 路由白名单 */
const whiteList = [
  "/",
  "/login/",
  "/album",
  "/album/",
  "/music",
  "/login/reset",
  "/posts/",
  "/tags",
  "/tags/",
  "/tags/",
  "/page/",
  "/categories",
  "/categories/",
  "/archives",
  "/about",
  "/link",
  "/random-post",
  "/air-conditioner",
  "/equipment",
  "/page",
  "/recentcomments",
  "/update"
];

const { VITE_HIDE_HOME } = import.meta.env;

router.beforeEach((to: ToRouteType, _from, next) => {
  const loadingStore = useLoadingStore();
  loadingStore.startLoading();

  // 1. 处理 keepAlive 逻辑
  if (to.meta?.keepAlive) {
    handleAliveRoute(to, "add");
    if (_from.name === undefined || _from.name === "Redirect") {
      handleAliveRoute(to);
    }
  }

  const userInfo = storageLocal().getItem<LoginResultData>(userKey);
  const externalLink = isUrl(to?.name as string);

  // 2. 设置页面标题
  if (!externalLink) {
    to.matched.some(item => {
      if (!item.meta.title) return "";

      let titleText: string;
      if (typeof item.meta.title === "function") {
        titleText = item.meta.title();
      } else {
        titleText = item.meta.title as string;
      }

      const Title = getConfig().Title;
      if (Title) document.title = `${titleText} | ${Title}`;
      else document.title = titleText;
    });
  }

  // 3. 清理Article meta标签（如果不是文章页面）
  if (!isArticlePage(to.path)) {
    clearArticleMetaTags();
  }

  // 4. 主要导航逻辑
  if (storageLocal().getItem(multipleTabsKey) && userInfo) {
    // 已登录用户逻辑

    // 4.1 权限检查
    if (to.meta?.roles && !isOneOfArray(to.meta?.roles, userInfo?.roles)) {
      next({ path: "/error/403" });
      return;
    }

    // 4.2 开启隐藏首页后，手动输入 /welcome 则跳转到 404
    if (VITE_HIDE_HOME === "true" && to.fullPath === "/admin/dashboard") {
      next({ path: "/error/404" });
      return;
    }

    // 已登录状态下访问登录页，直接重定向到第一个菜单页
    if (to.path === "/login") {
      if (usePermissionStoreHook().wholeMenus.length === 0) {
        initRouter()
          .then(() => {
            next({ path: getTopMenu(true).path, replace: true });
          })
          .catch(() => {
            removeToken();
            next();
          });
      } else {
        next({ path: getTopMenu(true).path, replace: true });
      }
      return;
    }

    // 3.3 已登录用户访问白名单页面（如 /album ）直接放行
    const isInWhiteList = whiteList.some(whitePath => {
      // 如果白名单项是根路径 "/"，则必须完全匹配
      if (whitePath === "/") {
        return to.path === "/";
      }
      // 对于其他白名单项，使用前缀匹配
      return to.path.startsWith(whitePath);
    });
    if (isInWhiteList) {
      next();
      return;
    }

    // 3.4 处理外部链接
    if (externalLink) {
      openLink(to?.name as string);
      return;
    }

    // 3.5 刷新或首次直接访问时，初始化路由和处理多标签页
    if (
      usePermissionStoreHook().wholeMenus.length === 0 &&
      to.path !== "/login"
    ) {
      initRouter()
        .then((router: Router) => {
          if (!useMultiTagsStoreHook().getMultiTagsCache) {
            const { path } = to;
            const route = findRouteByPath(
              path,
              router.options.routes[0].children
            );
            getTopMenu(true);
            if (route && route.meta?.title) {
              if (isAllEmpty(route.parentId) && route.meta?.backstage) {
                const { path, name, meta } = route.children[0];
                useMultiTagsStoreHook().handleTags("push", {
                  path,
                  name,
                  meta
                });
              } else {
                const { path, name, meta } = route;
                useMultiTagsStoreHook().handleTags("push", {
                  path,
                  name,
                  meta
                });
              }
            }
          }
          if (isAllEmpty(to.name)) {
            next({ path: to.fullPath, replace: true });
          } else {
            next();
          }
        })
        .catch(() => {
          removeToken();
          next({ path: "/login" });
        });
    } else {
      next();
    }
  } else {
    // 未登录用户逻辑
    if (to.path !== "/login") {
      // 检查当前路由是否是 404 页面或自定义页面
      const isNotFound = to.matched.some(record => record.name === "NotFound");
      const isCustomPage = to.matched.some(
        record => record.name === "CustomPage"
      );

      // 检查路径是否在白名单中
      const isInWhiteList = whiteList.some(whitePath => {
        if (whitePath === "/") {
          return to.path === "/";
        }
        return to.path.startsWith(whitePath);
      });

      // 如果是白名单页面，或者是 404 页面，或者是自定义页面，则直接放行
      if (isInWhiteList || isNotFound || isCustomPage) {
        next();
      } else {
        // 否则，重定向到首页
        removeToken();
        next({ path: "/" });
      }
    } else {
      next();
    }
  }
});

router.afterEach((to, from) => {
  const loadingStore = useLoadingStore();
  const isReloadingSamePost = to.name === "PostDetail" && to.path === from.path;

  // 记录路由变化（访问统计）
  if (to.path !== from.path) {
    recordRouteChange(to, from);
  }

  // 当离开文章详情页时，重置主题色到默认值
  if (from.name === "PostDetail" && to.name !== "PostDetail") {
    resetThemeToDefault();
  }

  if (to.name !== "PostDetail" || isReloadingSamePost) {
    loadingStore.stopLoading();
  }
});

export default router;
