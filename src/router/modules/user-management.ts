/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-06-15 11:31:00
 * @LastEditTime: 2025-10-04 02:58:35
 * @LastEditors: 安知鱼
 */

export default {
  path: "/user-management",
  redirect: "/admin/user-management",
  meta: {
    icon: "ep:user",
    title: "用户管理",
    rank: 7
  },
  children: [
    {
      path: "/admin/user-management",
      name: "UserManagement",
      component: () => import("@/views/system/user-management/index.vue"),
      meta: {
        title: "用户管理",
        icon: "ep:user",
        roles: ["1"]
      }
    }
  ]
} satisfies RouteConfigsTable;
