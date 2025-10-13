/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-07-24 17:29:16
 * @LastEditTime: 2025-09-20 17:44:56
 * @LastEditors: 安知鱼
 */

/**
 * @description: 站点信息表单接口
 */
export interface SiteInfo {
  siteName: string;
  subTitle: string;
  siteDescription: string;
  siteKeywords: string;
  primaryUrl: string;
  announcement: string;
  logoDay: string;
  logoNight: string;
  favicon: string;
  iconMedium: string;
  iconLarge: string;
  icpNumber: string;
}

/**
 * @description: 页面配置表单接口
 */
export interface PageSittingInfo {
  albumApiURL: string;
  defaultThumbParam?: string;
  defaultBigParam?: string;
  customHeaderHTML: string;
  customFooterHTML: string;
  customCSS: string;
  customJS: string;
  customPostTopHTML: string;
  customPostBottomHTML: string;
}

/**
 * @description: 文件配置表单接口
 */
export interface FileSettingsInfo {
  uploadAllowedExtensions: string;
  uploadDeniedExtensions: string;

  enableVipsGenerator: boolean;
  vipsPath: string;
  vipsMaxFileSize: string;
  vipsSupportedExts: string;

  enableMusicCoverGenerator: boolean;
  musicCoverMaxFileSize: string;
  musicCoverSupportedExts: string;

  enableFfmpegGenerator: boolean;

  ffmpegPath: string;
  ffmpegMaxFileSize: string;
  ffmpegSupportedExts: string;
  ffmpegCaptureTime: string;

  enableBuiltinGenerator: boolean;
  builtinMaxFileSize: string;
  builtinDirectServeExts: string;

  queueThumbConcurrency: number;
  queueThumbMaxExecTime: number;

  queueThumbBackoffFactor: number;
  queueThumbMaxBackoff: number;
  queueThumbMaxRetries: number;
  queueThumbRetryDelay: number;

  enableExifExtractor: boolean;
  exifMaxSizeLocal: string;
  exifMaxSizeRemote: string;
  exifUseBruteForce: boolean;

  enableMusicExtractor: boolean;
  musicMaxSizeLocal: string;
  musicMaxSizeRemote: string;
}

/**
 * @description: 装备项类型
 */
export interface EquipmentItem {
  /** 装备名称 */
  name: string;
  /** 装备规格 */
  specification: string;
  /** 装备描述 */
  description: string;
  /** 装备图片 */
  image: string;
  /** 链接地址 */
  link?: string;
  /** 链接文本 */
  linkText?: string;
}

/**
 * @description: 装备分类类型
 */
export interface EquipmentCategory {
  /** 分类标题 */
  title: string;
  /** 分类描述 */
  description: string;
  /** 装备列表 */
  equipment_list: EquipmentItem[];
}

/**
 * @description: 文章配置表单接口
 */
export interface PostSettingsInfo {
  ipApi: string;
  ipApiToken: string;
  default: {
    defaultCover: string;
    doubleColumn: boolean;
    pageSize: number;
  };
  expirationTime: number;
  reward: {
    enable: boolean;
    weChat: string;
    aliPay: string;
  };
  codeBlock: {
    codeMaxLines: number;
  };
}

/**
 * @description: 装备页配置表单接口
 */
export interface EquipmentSettingsInfo {
  banner: {
    background: string;
    title: string;
    description: string;
    tip: string;
  };
  list: EquipmentCategory[];
}

/**
 * @description: 完整设置表单的聚合接口
 */
export interface SettingsForm {
  site: SiteInfo;
  page: PageSittingInfo;
  file: FileSettingsInfo;
  frontDesk: FrontDeskSettings;
  post: PostSettingsInfo;
}

/**
 * @description: 徽标项类型
 */
export interface BadgeItem {
  link: string;
  shields: string;
  message: string;
}

/**
 * @description: 社交链接项类型
 */
export interface SocialLinkItem {
  title: string;
  link: string;
  icon: string;
}

/**
 * @description: 底部栏链接项类型
 */
export interface FooterBarLinkItem {
  text: string;
  link: string;
}

/**
 * @description: 页脚多栏链接中的单个链接类型
 */
export interface FooterLink {
  title: string;
  link: string;
}

/**
 * @description: 页脚多栏链接中的单栏类型
 */
export interface FooterLinkColumn {
  title: string;
  links: FooterLink[];
}

/**
 * @description: 导航菜单项（支持一级和二级菜单）
 */
export interface MainMenuItem {
  title: string;
  // 一级菜单：有path和icon，没有items或items为空
  path?: string;
  icon?: string;
  isExternal?: boolean;
  // 二级菜单：有items子菜单，没有path（或path为空）
  items?: SubMenuItem[];
  // 菜单类型：'direct'(一级菜单) 或 'dropdown'(二级菜单)
  type: "direct" | "dropdown";
}

/**
 * @description: 页眉下拉菜单分组
 */
export interface NavMenuGroup {
  title: string;
  items: NavMenuItem[];
}

/**
 * @description: 首页顶部横幅的类型定义
 */
export interface HomeTopBanner {
  image: string;
  isExternal: boolean;
  link: string;
  tips: string;
  title: string;
}

/**
 * @description: 首页顶部每个分类项的类型定义
 */
export interface HomeTopCategoryItem {
  background: string;
  icon: string;
  isExternal: boolean;
  name: string;
  path: string;
}

/**
 * @description: 首页顶部配置的完整类型定义
 */
export interface HomeTopInfo {
  banner: HomeTopBanner;
  category: HomeTopCategoryItem[];
  siteText: string;
  subTitle: string;
  title: string;
}

export interface HomePageSettingsInfo {
  siteOwnerName: string;
  siteOwnerEmail: string;
  footerOwnerName: string;
  footerOwnerSince: string;
  footerRuntimeEnable: boolean;
  footerRuntimeLaunchTime: string;
  footerRuntimeWorkImg: string;
  footerRuntimeWorkDesc: string;
  footerRuntimeOffDutyImg: string;
  footerRuntimeOffDutyDesc: string;
  footerSocialBarCenterImg: string;
  footerListRandomFriends: string;
  footerBarAuthorLink: string;
  footerBarCCLink: string;

  navTravel: boolean;
  navClock: boolean;
  homeTop: HomeTopInfo;

  footerBadgesEnable: boolean;
  footerBadges: BadgeItem[];
  footerSocialBarLeft: SocialLinkItem[];
  footerSocialBarRight: SocialLinkItem[];
  footerList: FooterLinkColumn[];
  footerBarLinkList: FooterBarLinkItem[];
  menu: MainMenuItem[];
  navMenuItems: NavMenuGroup[];
  music?: {
    player?: {
      enable?: boolean;
      playlist_id?: string;
      custom_playlist?: string;
    };
  };
}

/**
 * @description: 侧边栏配置表单接口
 */
export interface SidebarPageSettingsInfo {
  authorEnable: boolean;
  userAvatar: string;
  authorDescription: string;
  authorStatusImg: string;
  authorSkills: string[];
  authorSocial: Record<string, { icon: string; link: string }>;
  wechatEnable: boolean;
  wechatFace: string;
  wechatBackFace: string;
  wechatBlurredBackground: string;
  tagsEnable: boolean;
  tagsHighlight: string[];
  siteInfoTotalPostCount: number;
  siteInfoRuntimeEnable: boolean;
  siteInfoTotalWordCount: number;
  archiveDisplayMonths: number;
  customSidebar: string;
  customShowInPost: boolean;
}

/**
 * @description: 评论配置表单接口
 */
export interface CommentSettingsInfo {
  enable: boolean;
  loginRequired: boolean;
  pageSize: number;
  masterTag: string;
  placeholder: string;
  emojiCDN: string;
  bloggerEmail: string;
  anonymousEmail: string;
  showUA: boolean;
  showRegion: boolean;
  limitPerMinute: number;
  limitLength: number;
  forbiddenWords: string;
  notifyAdmin: boolean;
  notifyReply: boolean;
  pushooChannel: string;
  pushooURL: string;
  webhookRequestBody: string;
  webhookHeaders: string;
  scMailNotify: boolean;
  mailSubject: string;
  mailSubjectAdmin: string;
  mailTemplate: string;
  mailTemplateAdmin: string;
}

/**
 * @description: 邮件服务配置表单接口
 */
export interface EmailSettingsInfo {
  resetPasswordSubject: string;
  resetPasswordTemplate: string;
  activateAccountSubject: string;
  activateAccountTemplate: string;
  enableUserActivation: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpUsername: string;
  smtpPassword: string;
  smtpSenderName: string;
  smtpSenderEmail: string;
  smtpReplyToEmail: string;
  smtpForceSSL: boolean;
}

/**
 * @description: 友链分类类型
 */
export interface FLinkCategory {
  name: string;
  style: string;
  description: string;
}

/**
 * @description: 友链配置表单接口
 */
export interface FLinkSettingsInfo {
  friendLinkDefaultCategory: number;
  friendLinkApplyCondition: string[];
  friendLinkApplyCustomCode: string; // Markdown 内容（用于编辑）
  friendLinkApplyCustomCodeHtml: string; // 渲染后的 HTML（用于前台展示）
  notifyAdmin: boolean; // 是否通知站长
  pushooChannel: string; // 推送渠道
  pushooURL: string; // 推送URL
  webhookRequestBody: string | object; // Webhook请求体
  webhookHeaders: string; // Webhook请求头
  scMailNotify: boolean; // 是否同时通过邮件和IM通知
  mailSubjectAdmin: string; // 博主收到新友链申请的邮件主题
  mailTemplateAdmin: string; // 博主收到新友链申请的邮件内容模板
}

/**
 * @description: 装备页配置表单接口
 */
export interface EquipmentPageSettingsInfo {
  banner: {
    background: string;
    title: string;
    description: string;
    tip: string;
  };
  list: EquipmentCategory[];
}

/**
 * @description: 关于页配置表单接口
 */
export interface AboutPageSettingsInfo {
  name: string;
  description: string;
  avatarImg: string;
  subtitle: string;
  avatarSkillsLeft: string[];
  avatarSkillsRight: string[];
  aboutSiteTips: {
    tips: string;
    title1: string;
    title2: string;
    word: string[];
  };
  map: {
    background: string;
    backgroundDark: string;
    strengthenTitle: string;
    title: string;
  };
  selfInfo: {
    tips1: string;
    contentYear: string;
    tips2: string;
    content2: string;
    tips3: string;
    content3: string;
  };
  personalities: {
    authorName: string;
    nameUrl: string;
    personalityImg: string;
    personalityType: string;
    personalityTypeColor: string;
    photoUrl: string;
    tips: string;
  };
  maxim: {
    top: string;
    bottom: string;
    tips: string;
  };
  buff: {
    top: string;
    bottom: string;
    tips: string;
  };
  game: {
    background: string;
    title: string;
    uid: string;
    tips: string;
  };
  comic: {
    title: string;
    tips: string;
    list: Array<{
      cover: string;
      href: string;
      name: string;
    }>;
  };
  like: {
    background: string;
    title: string;
    bottom: string;
    tips: string;
  };
  music: {
    background: string;
    title: string;
    link: string;
    tips: string;
  };
  careers: {
    img: string;
    title: string;
    tips: string;
    list: Array<{
      color: string;
      desc: string;
    }>;
  };
  skillsTips: {
    title: string;
    tips: string;
  };
  statisticsBackground: string;
}

export interface RecentCommentsSettingsInfo {
  banner: {
    background: string;
    title: string;
    description: string;
    tip: string;
  };
}

export interface FrontDeskSettings {
  home: HomePageSettingsInfo;
  sidebar: SidebarPageSettingsInfo;
  comment: CommentSettingsInfo;
  email: EmailSettingsInfo;
  fLink: FLinkSettingsInfo;
  equipment: EquipmentSettingsInfo;
  about: AboutPageSettingsInfo;
  recentComments: RecentCommentsSettingsInfo;
}

/**
 * @description: 用于 JsonEditorTable 组件的列定义
 */
export interface JsonEditorTableColumn {
  prop: string;
  label: string;
  slot?: string;
  width?: string;
}

/**
 * @description: 导航栏的子菜单项类型
 */
export interface SubMenuItem {
  title: string;
  path: string;
  icon: string;
  isExternal: boolean; // 对应“是否新页面打开”
}

/**
 * @description: 页眉下拉菜单的链接项类型
 */
export interface NavMenuItem {
  name: string;
  link: string;
  icon: string;
}
