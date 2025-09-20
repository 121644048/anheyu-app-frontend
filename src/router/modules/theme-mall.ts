/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-06-24 14:03:31
 * @LastEditTime: 2025-09-18 14:30:59
 * @LastEditors: 安知鱼
 */
const Layout = () => import("@/layout/index.vue");

export default {
  path: "/theme-mall",
  component: Layout,
  redirect: "/admin/theme-mall",
  meta: {
    icon: "ep:chrome-filled",
    title: "主题商城",
    rank: 3
  },
  children: [
    {
      path: "/admin/theme-mall",
      name: "ThemeMall",
      component: () => import("@/views/system/theme-mall/index.vue"),
      meta: {
        title: "主题商城",
        roles: ["1"]
      }
    }
  ]
} satisfies RouteConfigsTable;
