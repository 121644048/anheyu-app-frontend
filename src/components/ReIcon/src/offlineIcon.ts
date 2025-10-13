/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-06-15 11:31:00
 * @LastEditTime: 2025-10-03 18:19:26
 * @LastEditors: 安知鱼
 */
// 这里存放本地图标，在 src/layout/index.vue 文件中加载，避免在首启动加载
import { addIcon } from "@iconify/vue/dist/offline";

// 本地菜单图标，后端在路由的 icon 中返回对应的图标字符串并且前端在此处使用 addIcon 添加即可渲染菜单图标
// @iconify-icons/ep
import Lollipop from "@iconify-icons/ep/lollipop";
import HomeFilled from "@iconify-icons/ep/home-filled";
addIcon("ep:lollipop", Lollipop);
addIcon("ep:home-filled", HomeFilled);
// @iconify-icons/ri
import Search from "@iconify-icons/ri/search-line";
import InformationLine from "@iconify-icons/ri/information-line";
import AppsFill from "@iconify-icons/ri/apps-fill";
import Chat1Fill from "@iconify-icons/ri/chat-1-fill";
import UserFill from "@iconify-icons/ri/user-fill";
import EditFill from "@iconify-icons/ri/edit-fill";
import Lock2Fill from "@iconify-icons/ri/lock-2-fill";
import ContractRightLine from "@iconify-icons/ri/contract-right-line";
import CameraFill from "@iconify-icons/ri/camera-fill";
import Notification3Fill from "@iconify-icons/ri/notification-3-fill";
addIcon("ri:search-line", Search);
addIcon("ri:information-line", InformationLine);
addIcon("ri:apps-fill", AppsFill);
addIcon("ri:chat-1-fill", Chat1Fill);
addIcon("ri:user-fill", UserFill);
addIcon("ri:edit-fill", EditFill);
addIcon("ri:lock-2-fill", Lock2Fill);
addIcon("ri:contract-right-line", ContractRightLine);
addIcon("ri:camera-fill", CameraFill);
addIcon("ri:notification-3-fill", Notification3Fill);
