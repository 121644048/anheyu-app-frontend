/*
 * @Description: 路由配置
 * @Author: 安知鱼
 * @Date: 2025-04-08 17:29:06
 * @LastEditTime: 2025-10-03 18:24:31
 * @LastEditors: 安知鱼
 */
const Layout = () => import("@/layout/index.vue");
const FrontendLayout = () => import("@/layout/frontend/index.vue");
import { getConfig } from "@/config/base";

export default [
  {
    path: "/",
    component: FrontendLayout,
    meta: {
      title: () => {
        const configs = getConfig();

        const appName = configs?.APP_NAME;
        const subTitle = configs?.SUB_TITLE;
        return `${appName} - ${subTitle}`;
      },
      rank: 100
    },
    children: [
      {
        path: "",
        name: "PostHome",
        component: () => import("@/views/post/post-home/index.vue"),
        meta: {
          title: () => {
            const configs = getConfig();
            const appName = configs?.APP_NAME;
            const subTitle = configs?.SUB_TITLE;
            return `${appName} - ${subTitle}`;
          },
          showLink: false
        }
      },
      {
        path: "posts/:id",
        name: "PostDetail",
        component: () => import("@/views/post/post-detail/index.vue"),
        meta: {
          title: () => {
            const configs = getConfig();
            const appName = configs?.APP_NAME;
            const subTitle = configs?.SUB_TITLE;
            return `${appName} - ${subTitle}`;
          },
          showLink: false
        }
      },
      {
        path: "page/:id",
        name: "PostPage",
        component: () => import("@/views/post/post-home/index.vue"),
        meta: {
          title: () => {
            const configs = getConfig();
            const appName = configs?.APP_NAME;
            const subTitle = configs?.SUB_TITLE;
            return `${appName} - ${subTitle}`;
          },
          showLink: false
        }
      },
      {
        path: "archives",
        name: "PostArchives",
        component: () => import("@/views/post/post-home/index.vue"),
        meta: {
          title: () => {
            const configs = getConfig();
            const appName = configs?.APP_NAME;
            return `${appName} - 归档`;
          },
          showLink: false
        }
      },
      {
        path: "archives/:year(\\d{4})/",
        name: "PostArchivesByYear",
        component: () => import("@/views/post/post-home/index.vue"),
        meta: {
          title: () => {
            const configs = getConfig();
            const appName = configs?.APP_NAME;
            return `${appName} - 归档`;
          },
          showLink: false
        }
      },
      {
        path: "archives/:year(\\d{4})/:month(\\d{1,2})/",
        name: "PostArchivesByMonth",
        component: () => import("@/views/post/post-home/index.vue"),
        meta: {
          title: () => {
            const configs = getConfig();
            const appName = configs?.APP_NAME;
            return `${appName} - 归档`;
          },
          showLink: false
        }
      },
      {
        path: "archives/page/:id",
        name: "PostArchivesDetailPaginated",
        component: () => import("@/views/post/post-home/index.vue"),
        meta: {
          title: () => {
            const configs = getConfig();
            const appName = configs?.APP_NAME;
            return `${appName} - 归档`;
          },
          showLink: false
        }
      },
      {
        path: "archives/:year(\\d{4})/page/:id",
        name: "PostArchivesByYearPaginated",
        component: () => import("@/views/post/post-home/index.vue"),
        meta: {
          title: () => {
            const configs = getConfig();
            const appName = configs?.APP_NAME;
            return `${appName} - 归档`;
          },
          showLink: false
        }
      },
      {
        path: "archives/:year(\\d{4})/:month(\\d{1,2})/page/:id",
        name: "PostArchivesByMonthPaginated",
        component: () => import("@/views/post/post-home/index.vue"),
        meta: {
          title: () => {
            const configs = getConfig();
            const appName = configs?.APP_NAME;
            return `${appName} - 归档`;
          },
          showLink: false
        }
      },
      {
        path: "tags",
        name: "PostTagsAll",
        component: () => import("@/views/post/tags/index.vue"),
        meta: {
          title: () => {
            const configs = getConfig();
            const appName = configs?.APP_NAME;
            return `${appName} - 标签`;
          },
          showLink: false
        }
      },
      {
        path: "tags/:name/",
        name: "PostTagsDetail",
        component: () => import("@/views/post/post-home/index.vue"),
        meta: {
          title: () => {
            const configs = getConfig();
            const appName = configs?.APP_NAME;
            return `${appName} - 标签`;
          },
          showLink: false
        }
      },
      {
        path: "tags/:name/page/:id",
        name: "PostTagsDetailPaginated",
        component: () => import("@/views/post/post-home/index.vue"),
        meta: {
          title: () => {
            const configs = getConfig();
            const appName = configs?.APP_NAME;
            return `${appName} - 标签`;
          },
          showLink: false
        }
      },
      {
        path: "categories",
        name: "PostCategoriesAll",
        component: () => import("@/views/post/categories/index.vue"),
        meta: {
          title: () => {
            const configs = getConfig();
            const appName = configs?.APP_NAME;
            return `${appName} - 分类`;
          },
          showLink: false
        }
      },
      {
        path: "categories/:name/",
        name: "PostHomeByCategory",
        component: () => import("@/views/post/post-home/index.vue"),
        meta: {
          title: () => {
            const configs = getConfig();
            const appName = configs?.APP_NAME;
            return `${appName} - 分类`;
          },
          showLink: false
        }
      },
      {
        path: "categories/:name/page/:id",
        name: "PostHomeByCategoryPaginated",
        component: () => import("@/views/post/post-home/index.vue"),
        meta: {
          title: () => {
            const configs = getConfig();
            const appName = configs?.APP_NAME;
            return `${appName} - 分类`;
          },
          showLink: false
        }
      },
      {
        path: "link",
        name: "PostLink",
        component: () => import("@/views/post/link/index.vue"),
        meta: {
          title: () => {
            const configs = getConfig();
            const appName = configs?.APP_NAME;
            return `${appName} - 友人帐`;
          },
          showLink: false
        }
      },
      {
        path: "random-post",
        name: "RandomPost",
        component: () => import("@/views/post/random-post/index.vue"),
        meta: {
          title: () => {
            const configs = getConfig();
            const appName = configs?.APP_NAME;
            return `${appName} - 随机文章`;
          },
          showLink: false
        }
      },
      {
        path: "air-conditioner",
        name: "AirConditioner",
        component: () => import("@/views/post/air-conditioner/index.vue"),
        meta: {
          title: () => {
            const configs = getConfig();
            const appName = configs?.APP_NAME;
            return `${appName} - 小空调`;
          },
          showLink: false
        }
      },
      {
        path: "equipment",
        name: "Equipment",
        component: () => import("@/views/post/equipment/index.vue"),
        meta: {
          title: () => {
            const configs = getConfig();
            const appName = configs?.APP_NAME;
            return `${appName} - 我的装备`;
          },
          showLink: false
        }
      },
      {
        path: "about",
        name: "PostAbout",
        component: () => import("@/views/post/about/index.vue"),
        meta: {
          title: () => {
            const configs = getConfig();
            const appName = configs?.APP_NAME;
            return `${appName} - 关于本站`;
          },
          showLink: false
        }
      },
      {
        path: "update",
        name: "UpdateLog",
        component: () => import("@/views/post/update/index.vue"),
        meta: {
          title: () => {
            const configs = getConfig();
            const appName = configs?.APP_NAME;
            return `${appName} - 更新日志`;
          },
          showLink: false
        }
      },
      {
        path: "user-center",
        name: "UserCenter",
        component: () => import("@/views/post/user-center/index.vue"),
        meta: {
          title: () => {
            const configs = getConfig();
            const appName = configs?.APP_NAME;
            return `${appName} - 用户中心`;
          },
          showLink: false
        }
      },
      {
        path: "recentcomments",
        name: "RecentComments",
        component: () => import("@/views/post/recent-comments/index.vue"),
        meta: {
          title: () => {
            const configs = getConfig();
            const appName = configs?.APP_NAME;
            return `${appName} - 最近评论`;
          },
          showLink: false
        }
      },
      {
        path: ":pathMatch(.*)",
        name: "CustomPage",
        component: () => import("@/views/custom-page/index.vue"),
        meta: {
          title: () => {
            const configs = getConfig();
            const appName = configs?.APP_NAME;
            return `${appName} - 页面`;
          },
          showLink: false
        }
      }
    ]
  },
  {
    path: "/admin/post-management/edit/:id",
    name: "PostEdit",
    component: () => import("@/views/system/post-management/edit.vue"),
    meta: {
      title: "编辑文章",
      showLink: false
    }
  },
  {
    path: "/login",
    name: "Login",
    component: () => import("@/views/login/index.vue"),
    alias: "/login/reset",
    meta: {
      title: () => {
        const configs = getConfig();
        const appName = configs?.APP_NAME;
        return `${appName} - 登录`;
      },
      showLink: false,
      rank: 101
    }
  },
  {
    path: "/activate",
    name: "Activate",
    component: () => import("@/views/activate/index.vue"),
    meta: {
      title: () => {
        const configs = getConfig();
        const appName = configs?.APP_NAME;
        return `${appName} - 账号激活`;
      },
      showLink: false,
      rank: 101
    }
  },
  {
    path: "/redirect",
    component: Layout,
    meta: {
      title: () => {
        const configs = getConfig();
        const appName = configs?.APP_NAME;
        return `${appName} - 加载中`;
      },
      showLink: false,
      rank: 102
    },
    children: [
      {
        path: "/redirect/:path(.*)",
        name: "Redirect",
        component: () => import("@/layout/redirect.vue")
      }
    ]
  },
  {
    path: "/album",
    name: "AlbumHome",
    component: () => import("@/views/album-home/index.vue"),
    meta: {
      title: () => {
        const configs = getConfig();
        const appName = configs?.APP_NAME;
        return `${appName} - 相册`;
      },
      showLink: false,
      rank: 103
    }
  },
  {
    path: "/music",
    name: "MusicHome",
    component: () => import("@/views/music-home/index.vue"),
    meta: {
      title: () => {
        const configs = getConfig();
        const appName = configs?.APP_NAME;
        return `${appName} - 音乐`;
      },
      showLink: false,
      rank: 103
    }
  }
] satisfies Array<RouteConfigsTable>;
