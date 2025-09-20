// src/views/system/settings-management/settings.descriptor.ts
import { constant } from "@/constant";
import type { SettingKey } from "@/constant";

/**
 * @description 单个设置的描述符接口
 * @param frontendPath - 在前端 form 对象中的路径 (e.g., 'site.siteName')
 * @param backendKey - 在后端API中的键名 (e.g., 'APP_NAME')
 * @param defaultValue - 该项的默认值
 * @param type - 数据类型，用于自动转换。'string' | 'boolean' | 'number' | 'json'
 */
export interface SettingDescriptor {
  frontendPath: string;
  backendKey: SettingKey;
  defaultValue: any;
  type: "string" | "boolean" | "number" | "json";
}

const siteDescriptors: SettingDescriptor[] = [
  {
    frontendPath: "site.siteName",
    backendKey: constant.KeyAppName,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "site.subTitle",
    backendKey: constant.KeySubTitle,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "site.siteDescription",
    backendKey: constant.KeySiteDescription,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "site.primaryUrl",
    backendKey: constant.KeySiteURL,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "site.footerCode",
    backendKey: constant.KeyFooterCode,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "site.announcement",
    backendKey: constant.KeySiteAnnouncement,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "site.logoDay",
    backendKey: constant.KeyLogoHorizontalDay,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "site.logoNight",
    backendKey: constant.KeyLogoHorizontalNight,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "site.favicon",
    backendKey: constant.KeyIconURL,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "site.iconMedium",
    backendKey: constant.KeyLogoURL192,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "site.iconLarge",
    backendKey: constant.KeyLogoURL512,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "site.icpNumber",
    backendKey: constant.KeyIcpNumber,
    defaultValue: "",
    type: "string"
  }
];

const pageDescriptors: SettingDescriptor[] = [
  {
    frontendPath: "page.albumApiURL",
    backendKey: constant.KeyApiURL,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "page.defaultThumbParam",
    backendKey: constant.KeyDefaultThumbParam,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "page.defaultBigParam",
    backendKey: constant.KeyDefaultBigParam,
    defaultValue: "",
    type: "string"
  }
];

const fileDescriptors: SettingDescriptor[] = [
  {
    frontendPath: "file.uploadAllowedExtensions",
    backendKey: constant.KeyUploadAllowedExtensions,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "file.uploadDeniedExtensions",
    backendKey: constant.KeyUploadDeniedExtensions,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "file.enableVipsGenerator",
    backendKey: constant.KeyEnableVipsGenerator,
    defaultValue: false,
    type: "boolean"
  },
  {
    frontendPath: "file.vipsPath",
    backendKey: constant.KeyVipsPath,
    defaultValue: "vips",
    type: "string"
  },
  {
    frontendPath: "file.vipsMaxFileSize",
    backendKey: constant.KeyVipsMaxFileSize,
    defaultValue: "0",
    type: "string"
  }, // 使用字符串以匹配el-input
  {
    frontendPath: "file.vipsSupportedExts",
    backendKey: constant.KeyVipsSupportedExts,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "file.enableMusicCoverGenerator",
    backendKey: constant.KeyEnableMusicCoverGenerator,
    defaultValue: true,
    type: "boolean"
  },
  {
    frontendPath: "file.musicCoverMaxFileSize",
    backendKey: constant.KeyMusicCoverMaxFileSize,
    defaultValue: "0",
    type: "string"
  },
  {
    frontendPath: "file.musicCoverSupportedExts",
    backendKey: constant.KeyMusicCoverSupportedExts,
    defaultValue: "mp3,m4a,ogg,flac",
    type: "string"
  },
  {
    frontendPath: "file.enableFfmpegGenerator",
    backendKey: constant.KeyEnableFfmpegGenerator,
    defaultValue: false,
    type: "boolean"
  },
  {
    frontendPath: "file.ffmpegPath",
    backendKey: constant.KeyFfmpegPath,
    defaultValue: "ffmpeg",
    type: "string"
  },
  {
    frontendPath: "file.ffmpegMaxFileSize",
    backendKey: constant.KeyFfmpegMaxFileSize,
    defaultValue: "0",
    type: "string"
  },
  {
    frontendPath: "file.ffmpegSupportedExts",
    backendKey: constant.KeyFfmpegSupportedExts,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "file.ffmpegCaptureTime",
    backendKey: constant.KeyFfmpegCaptureTime,
    defaultValue: "00:00:01.00",
    type: "string"
  },
  {
    frontendPath: "file.enableBuiltinGenerator",
    backendKey: constant.KeyEnableBuiltinGenerator,
    defaultValue: true,
    type: "boolean"
  },
  {
    frontendPath: "file.builtinMaxFileSize",
    backendKey: constant.KeyBuiltinMaxFileSize,
    defaultValue: "0",
    type: "string"
  },
  {
    frontendPath: "file.builtinDirectServeExts",
    backendKey: constant.KeyBuiltinDirectServeExts,
    defaultValue: "avif,webp",
    type: "string"
  },
  {
    frontendPath: "file.queueThumbConcurrency",
    backendKey: constant.KeyQueueThumbConcurrency,
    defaultValue: 15,
    type: "number"
  },
  {
    frontendPath: "file.queueThumbMaxExecTime",
    backendKey: constant.KeyQueueThumbMaxExecTime,
    defaultValue: 300,
    type: "number"
  },
  {
    frontendPath: "file.queueThumbBackoffFactor",
    backendKey: constant.KeyQueueThumbBackoffFactor,
    defaultValue: 2,
    type: "number"
  },
  {
    frontendPath: "file.queueThumbMaxBackoff",
    backendKey: constant.KeyQueueThumbMaxBackoff,
    defaultValue: 60,
    type: "number"
  },
  {
    frontendPath: "file.queueThumbMaxRetries",
    backendKey: constant.KeyQueueThumbMaxRetries,
    defaultValue: 3,
    type: "number"
  },
  {
    frontendPath: "file.queueThumbRetryDelay",
    backendKey: constant.KeyQueueThumbRetryDelay,
    defaultValue: 5,
    type: "number"
  },
  {
    frontendPath: "file.enableExifExtractor",
    backendKey: constant.KeyEnableExifExtractor,
    defaultValue: true,
    type: "boolean"
  },
  {
    frontendPath: "file.exifMaxSizeLocal",
    backendKey: constant.KeyExifMaxSizeLocal,
    defaultValue: "0",
    type: "string"
  },
  {
    frontendPath: "file.exifMaxSizeRemote",
    backendKey: constant.KeyExifMaxSizeRemote,
    defaultValue: "0",
    type: "string"
  },
  {
    frontendPath: "file.exifUseBruteForce",
    backendKey: constant.KeyExifUseBruteForce,
    defaultValue: false,
    type: "boolean"
  },
  {
    frontendPath: "file.enableMusicExtractor",
    backendKey: constant.KeyEnableMusicExtractor,
    defaultValue: true,
    type: "boolean"
  },
  {
    frontendPath: "file.musicMaxSizeLocal",
    backendKey: constant.KeyMusicMaxSizeLocal,
    defaultValue: "0",
    type: "string"
  },
  {
    frontendPath: "file.musicMaxSizeRemote",
    backendKey: constant.KeyMusicMaxSizeRemote,
    defaultValue: "0",
    type: "string"
  }
];

const postDescriptors: SettingDescriptor[] = [
  {
    frontendPath: "post.ipApi",
    backendKey: constant.KeyIPAPI,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "post.ipApiToken",
    backendKey: constant.KeyIPAPIToKen,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "post.expirationTime",
    backendKey: constant.KeyPostExpirationTime,
    defaultValue: "",
    type: "number"
  },
  {
    frontendPath: "post.default.defaultCover",
    backendKey: constant.KeyDefaultCover,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "post.default.doubleColumn",
    backendKey: constant.KeyDoubleColumn,
    defaultValue: false,
    type: "boolean"
  },
  {
    frontendPath: "post.default.pageSize",
    backendKey: constant.KeyPostDefaultPageSize,
    defaultValue: 12,
    type: "number"
  },
  {
    frontendPath: "post.reward.enable",
    backendKey: constant.KeyPostRewardEnable,
    defaultValue: 12,
    type: "boolean"
  },
  {
    frontendPath: "post.reward.weChat",
    backendKey: constant.KeyPostRewardWeChatQR,
    defaultValue: 12,
    type: "string"
  },
  {
    frontendPath: "post.reward.aliPay",
    backendKey: constant.KeyPostRewardAlipayQR,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "post.codeBlock.codeMaxLines",
    backendKey: constant.KeyPostCodeBlockCodeMaxLines,
    defaultValue: 10,
    type: "number"
  }
];

const equipmentDescriptors: SettingDescriptor[] = [
  {
    frontendPath: "frontDesk.equipment.banner.background",
    backendKey: constant.KeyPostEquipmentBannerBackground,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.equipment.banner.title",
    backendKey: constant.KeyPostEquipmentBannerTitle,
    defaultValue: "好物",
    type: "string"
  },
  {
    frontendPath: "frontDesk.equipment.banner.description",
    backendKey: constant.KeyPostEquipmentBannerDescription,
    defaultValue: "实物装备推荐",
    type: "string"
  },
  {
    frontendPath: "frontDesk.equipment.banner.tip",
    backendKey: constant.KeyPostEquipmentBannerTip,
    defaultValue: "跟 安知鱼 一起享受科技带来的乐趣",
    type: "string"
  },
  {
    frontendPath: "frontDesk.equipment.list",
    backendKey: constant.KeyPostEquipmentList,
    defaultValue: [],
    type: "json"
  }
];

const recentCommentsDescriptors: SettingDescriptor[] = [
  {
    frontendPath: "frontDesk.recentComments.banner.background",
    backendKey: constant.KeyRecentCommentsBannerBackground,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.recentComments.banner.title",
    backendKey: constant.KeyRecentCommentsBannerTitle,
    defaultValue: "评论",
    type: "string"
  },
  {
    frontendPath: "frontDesk.recentComments.banner.description",
    backendKey: constant.KeyRecentCommentsBannerDescription,
    defaultValue: "最近评论",
    type: "string"
  },
  {
    frontendPath: "frontDesk.recentComments.banner.tip",
    backendKey: constant.KeyRecentCommentsBannerTip,
    defaultValue: "发表你的观点和看法，让更多人看到",
    type: "string"
  }
];

const aboutPageDescriptors: SettingDescriptor[] = [
  {
    frontendPath: "frontDesk.about.name",
    backendKey: constant.KeyAboutPageName,
    defaultValue: "安知鱼",
    type: "string"
  },
  {
    frontendPath: "frontDesk.about.description",
    backendKey: constant.KeyAboutPageDescription,
    defaultValue: "是一名 前端工程师、学生、独立开发者、博主",
    type: "string"
  },
  {
    frontendPath: "frontDesk.about.avatarImg",
    backendKey: constant.KeyAboutPageAvatarImg,
    defaultValue:
      "https://npm.elemecdn.com/anzhiyu-blog-static@1.0.4/img/avatar.jpg",
    type: "string"
  },
  {
    frontendPath: "frontDesk.about.subtitle",
    backendKey: constant.KeyAboutPageSubtitle,
    defaultValue: "生活明朗，万物可爱✨",
    type: "string"
  },
  {
    frontendPath: "frontDesk.about.avatarSkillsLeft",
    backendKey: constant.KeyAboutPageAvatarSkillsLeft,
    defaultValue: [
      "🤖️ 数码科技爱好者",
      "🔍 分享与热心帮助",
      "🏠 智能家居小能手",
      "🔨 设计开发一条龙"
    ],
    type: "json"
  },
  {
    frontendPath: "frontDesk.about.avatarSkillsRight",
    backendKey: constant.KeyAboutPageAvatarSkillsRight,
    defaultValue: [
      "专修交互与设计 🤝",
      "脚踏实地行动派 🏃",
      "团队小组发动机 🧱",
      "壮汉人狠话不多 💢"
    ],
    type: "json"
  },
  {
    frontendPath: "frontDesk.about.aboutSiteTips",
    backendKey: constant.KeyAboutPageAboutSiteTips,
    defaultValue: {
      tips: "追求",
      title1: "源于",
      title2: "热爱而去 感受",
      word: ["学习", "生活", "程序", "体验"]
    },
    type: "json"
  },
  {
    frontendPath: "frontDesk.about.map",
    backendKey: constant.KeyAboutPageMap,
    defaultValue: {
      background:
        "https://img02.anheyu.com/adminuploads/1/2022/09/24/632e6f48981d8.jpg",
      backgroundDark:
        "https://img02.anheyu.com/adminuploads/1/2022/09/26/6330ebf1f3e65.jpg",
      strengthenTitle: "中国，长沙市",
      title: "我现在住在"
    },
    type: "json"
  },
  {
    frontendPath: "frontDesk.about.selfInfo",
    backendKey: constant.KeyAboutPageSelfInfo,
    defaultValue: {
      tips1: "生于",
      contentYear: "2002",
      tips2: "湖南信息学院",
      content2: "软件工程",
      tips3: "现在职业",
      content3: "软件工程师👨"
    },
    type: "json"
  },
  {
    frontendPath: "frontDesk.about.personalities",
    backendKey: constant.KeyAboutPagePersonalities,
    defaultValue: {
      authorName: "执政官",
      nameUrl: "https://www.16personalities.com/ch/esfj-%E4%BA%BA%E6%A0%BC",
      personalityImg:
        "https://npm.elemecdn.com/anzhiyu-blog@2.0.8/img/svg/ESFJ-A.svg",
      personalityType: "ESFJ-A",
      personalityTypeColor: "#ac899c",
      photoUrl:
        "https://img02.anheyu.com/adminuploads/1/2022/09/24/632e9643611ec.jpg",
      tips: "性格"
    },
    type: "json"
  },
  {
    frontendPath: "frontDesk.about.maxim",
    backendKey: constant.KeyAboutPageMaxim,
    defaultValue: {
      top: "生活明朗，",
      bottom: "万物可爱。",
      tips: "座右铭"
    },
    type: "json"
  },
  {
    frontendPath: "frontDesk.about.buff",
    backendKey: constant.KeyAboutPageBuff,
    defaultValue: {
      top: "脑回路新奇的 酸菜鱼",
      bottom: "二次元指数 MAX",
      tips: "特长"
    },
    type: "json"
  },
  {
    frontendPath: "frontDesk.about.game",
    backendKey: constant.KeyAboutPageGame,
    defaultValue: {
      background:
        "https://img02.anheyu.com/adminuploads/1/2022/12/19/63a079ca63c8a.webp",
      title: "原神",
      uid: "UID: 125766904",
      tips: "爱好游戏"
    },
    type: "json"
  },
  {
    frontendPath: "frontDesk.about.comic",
    backendKey: constant.KeyAboutPageComic,
    defaultValue: {
      title: "追番",
      tips: "爱好番剧",
      list: [
        {
          cover:
            "https://img02.anheyu.com/adminuploads/1/2022/12/13/63988658aa1b1.webp",
          href: "https://www.bilibili.com/bangumi/media/md5267750/?spm_id_from=666.25.b_6d656469615f6d6f64756c65.1",
          name: "约定的梦幻岛"
        },
        {
          cover:
            "https://img02.anheyu.com/adminuploads/1/2022/12/13/6398864e572ed.webp",
          href: "https://www.bilibili.com/bangumi/media/md28229899/?spm_id_from=666.25.b_6d656469615f6d6f64756c65.1",
          name: "咒术回战"
        },
        {
          cover:
            "https://img02.anheyu.com/adminuploads/1/2022/12/13/639886315d658.webp",
          href: "https://www.bilibili.com/bangumi/media/md8892/?spm_id_from=666.25.b_6d656469615f6d6f64756c65.1",
          name: "紫罗兰永恒花园"
        },
        {
          cover:
            "https://img02.anheyu.com/adminuploads/1/2022/12/13/639886403d472.webp",
          href: "https://www.bilibili.com/bangumi/media/md22718131/?spm_id_from=666.25.b_6d656469615f6d6f64756c65.1",
          name: "鬼灭之刃"
        },
        {
          cover:
            "https://img02.anheyu.com/adminuploads/1/2022/12/13/6398862649585.webp",
          href: "https://www.bilibili.com/bangumi/media/md135652/?spm_id_from=666.25.b_6d656469615f6d6f64756c65.1",
          name: "JOJO的奇妙冒险 黄金之风"
        }
      ]
    },
    type: "json"
  },
  {
    frontendPath: "frontDesk.about.like",
    backendKey: constant.KeyAboutPageLike,
    defaultValue: {
      background:
        "https://img02.anheyu.com/adminuploads/1/2022/09/24/632f0dd8f33c6.webp",
      title: "数码科技",
      bottom: "手机、电脑软硬件",
      tips: "关注偏好"
    },
    type: "json"
  },
  {
    frontendPath: "frontDesk.about.music",
    backendKey: constant.KeyAboutPageMusic,
    defaultValue: {
      background:
        "https://p2.music.126.net/Mrg1i7DwcwjWBvQPIMt_Mg==/79164837213438.jpg",
      title: "许嵩、民谣、华语流行",
      link: "/music",
      tips: "音乐偏好"
    },
    type: "json"
  },
  {
    frontendPath: "frontDesk.about.careers",
    backendKey: constant.KeyAboutPageCareers,
    defaultValue: {
      img: "https://img02.anheyu.com/adminuploads/1/2022/09/26/6330e9bcc39cc.png",
      title: "无限进步",
      tips: "生涯",
      list: [
        {
          color: "#357ef5",
          desc: "EDU,软件工程专业"
        }
      ]
    },
    type: "json"
  },
  {
    frontendPath: "frontDesk.about.skillsTips",
    backendKey: constant.KeyAboutPageSkillsTips,
    defaultValue: {
      title: "开启创造力",
      tips: "技能"
    },
    type: "json"
  },
  {
    frontendPath: "frontDesk.about.statisticsBackground",
    backendKey: constant.KeyAboutPageStatisticsBackground,
    defaultValue:
      "https://upload-bbs.miyoushe.com/upload/2025/08/20/125766904/0d61be5d781e63642743883eb5580024_4597572337700501322.png",
    type: "string"
  }
];

const frontDeskDescriptors: SettingDescriptor[] = [
  {
    frontendPath: "frontDesk.home.siteOwnerName",
    backendKey: constant.KeyFrontDeskSiteOwnerName,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.home.siteOwnerEmail",
    backendKey: constant.KeyFrontDeskSiteOwnerEmail,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.home.footerOwnerName",
    backendKey: constant.KeyFooterOwnerName,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.home.footerOwnerSince",
    backendKey: constant.KeyFooterOwnerSince,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.home.footerRuntimeEnable",
    backendKey: constant.KeyFooterRuntimeEnable,
    defaultValue: false,
    type: "boolean"
  },
  {
    frontendPath: "frontDesk.home.footerRuntimeLaunchTime",
    backendKey: constant.KeyFooterRuntimeLaunchTime,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.home.footerRuntimeWorkImg",
    backendKey: constant.KeyFooterRuntimeWorkImg,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.home.footerRuntimeWorkDesc",
    backendKey: constant.KeyFooterRuntimeWorkDesc,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.home.footerRuntimeOffDutyImg",
    backendKey: constant.KeyFooterRuntimeOffDutyImg,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.home.footerRuntimeOffDutyDesc",
    backendKey: constant.KeyFooterRuntimeOffDutyDesc,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.home.footerSocialBarCenterImg",
    backendKey: constant.KeyFooterSocialBarCenterImg,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.home.footerListRandomFriends",
    backendKey: constant.KeyFooterListRandomFriends,
    defaultValue: "0",
    type: "string"
  },
  {
    frontendPath: "frontDesk.home.footerBarAuthorLink",
    backendKey: constant.KeyFooterBarAuthorLink,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.home.footerBarCCLink",
    backendKey: constant.KeyFooterBarCCLink,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.home.navTravel",
    backendKey: constant.KeyHeaderNavTravel,
    defaultValue: false,
    type: "boolean"
  },
  {
    frontendPath: "frontDesk.home.navClock",
    backendKey: constant.KeyHeaderNavClock,
    defaultValue: false,
    type: "boolean"
  },
  {
    frontendPath: "frontDesk.home.homeTop",
    backendKey: constant.KeyHomeTop,
    defaultValue: {},
    type: "json"
  },
  {
    frontendPath: "frontDesk.home.footerBadges",
    backendKey: constant.KeyFooterBadge,
    defaultValue: [],
    type: "json"
  },
  {
    frontendPath: "frontDesk.home.footerSocialBarLeft",
    backendKey: constant.KeyFooterSocialBarLeft,
    defaultValue: [],
    type: "json"
  },
  {
    frontendPath: "frontDesk.home.footerSocialBarRight",
    backendKey: constant.KeyFooterSocialBarRight,
    defaultValue: [],
    type: "json"
  },
  {
    frontendPath: "frontDesk.home.footerList",
    backendKey: constant.KeyFooterList,
    defaultValue: [],
    type: "json"
  },
  {
    frontendPath: "frontDesk.home.footerBarLinkList",
    backendKey: constant.KeyFooterBarLinkList,
    defaultValue: [],
    type: "json"
  },
  {
    frontendPath: "frontDesk.home.menu",
    backendKey: constant.KeyHeaderMenu,
    defaultValue: [],
    type: "json"
  },
  {
    frontendPath: "frontDesk.home.navMenuItems",
    backendKey: constant.KeyHeaderNavMenu,
    defaultValue: [],
    type: "json"
  },
  {
    frontendPath: "frontDesk.home.music.player.playlist_id",
    backendKey: constant.KeyMusicPlayerPlaylistID,
    defaultValue: "8152976493",
    type: "string"
  }
];

const sidebarDescriptors: SettingDescriptor[] = [
  {
    frontendPath: "frontDesk.sidebar.authorEnable",
    backendKey: constant.KeySidebarAuthorEnable,
    defaultValue: true,
    type: "boolean"
  },
  {
    frontendPath: "frontDesk.sidebar.userAvatar",
    backendKey: constant.KeyUserAvatar,
    defaultValue: "/static/img/avatar.jpg",
    type: "string"
  },
  {
    frontendPath: "frontDesk.sidebar.authorDescription",
    backendKey: constant.KeySidebarAuthorDescription,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.sidebar.authorStatusImg",
    backendKey: constant.KeySidebarAuthorStatusImg,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.sidebar.authorSkills",
    backendKey: constant.KeySidebarAuthorSkills,
    defaultValue: [],
    type: "json"
  },
  {
    frontendPath: "frontDesk.sidebar.authorSocial",
    backendKey: constant.KeySidebarAuthorSocial,
    defaultValue: {},
    type: "json"
  },
  {
    frontendPath: "frontDesk.sidebar.wechatEnable",
    backendKey: constant.KeySidebarWechatEnable,
    defaultValue: true,
    type: "boolean"
  },
  {
    frontendPath: "frontDesk.sidebar.wechatFace",
    backendKey: constant.KeySidebarWechatFace,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.sidebar.wechatBackFace",
    backendKey: constant.KeySidebarWechatBackFace,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.sidebar.wechatBlurredBackground",
    backendKey: constant.KeySidebarWechatBlurredBackground,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.sidebar.tagsEnable",
    backendKey: constant.KeySidebarTagsEnable,
    defaultValue: true,
    type: "boolean"
  },
  {
    frontendPath: "frontDesk.sidebar.tagsHighlight",
    backendKey: constant.KeySidebarTagsHighlight,
    defaultValue: [],
    type: "json"
  },
  {
    frontendPath: "frontDesk.sidebar.siteInfoTotalPostCount",
    backendKey: constant.KeySidebarSiteInfoTotalPostCount,
    defaultValue: true,
    type: "number"
  },
  {
    frontendPath: "frontDesk.sidebar.siteInfoRuntimeEnable",
    backendKey: constant.KeySidebarSiteInfoRuntimeEnable,
    defaultValue: true,
    type: "boolean"
  },
  {
    frontendPath: "frontDesk.sidebar.siteInfoTotalWordCount",
    backendKey: constant.KeySidebarSiteInfoTotalWordCount,
    defaultValue: true,
    type: "number"
  },
  {
    frontendPath: "frontDesk.sidebar.archiveDisplayMonths",
    backendKey: constant.KeySidebarArchiveDisplayMonths,
    defaultValue: 6,
    type: "number"
  }
];

const commentDescriptors: SettingDescriptor[] = [
  {
    frontendPath: "frontDesk.comment.loginRequired",
    backendKey: constant.KeyCommentLoginRequired,
    defaultValue: false,
    type: "boolean"
  },
  {
    frontendPath: "frontDesk.comment.pageSize",
    backendKey: constant.KeyCommentPageSize,
    defaultValue: 10,
    type: "number"
  },
  {
    frontendPath: "frontDesk.comment.masterTag",
    backendKey: constant.KeyCommentMasterTag,
    defaultValue: "博主",
    type: "string"
  },
  {
    frontendPath: "frontDesk.comment.placeholder",
    backendKey: constant.KeyCommentPlaceholder,
    defaultValue: "欢迎留下宝贵的建议啦～",
    type: "string"
  },
  {
    frontendPath: "frontDesk.comment.emojiCDN",
    backendKey: constant.KeyCommentEmojiCDN,
    defaultValue:
      "https://npm.elemecdn.com/anzhiyu-theme-static@1.1.3/twikoo/twikoo.json",
    type: "string"
  },
  {
    frontendPath: "frontDesk.comment.bloggerEmail",
    backendKey: constant.KeyCommentBloggerEmail,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.comment.showUA",
    backendKey: constant.KeyCommentShowUA,
    defaultValue: true,
    type: "boolean"
  },
  {
    frontendPath: "frontDesk.comment.showRegion",
    backendKey: constant.KeyCommentShowRegion,
    defaultValue: true,
    type: "boolean"
  },
  {
    frontendPath: "frontDesk.comment.limitPerMinute",
    backendKey: constant.KeyCommentLimitPerMinute,
    defaultValue: 5,
    type: "number"
  },
  {
    frontendPath: "frontDesk.comment.limitLength",
    backendKey: constant.KeyCommentLimitLength,
    defaultValue: 10000,
    type: "number"
  },
  {
    frontendPath: "frontDesk.comment.forbiddenWords",
    backendKey: constant.KeyCommentForbiddenWords,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.comment.notifyAdmin",
    backendKey: constant.KeyCommentNotifyAdmin,
    defaultValue: false,
    type: "boolean"
  },
  {
    frontendPath: "frontDesk.comment.notifyReply",
    backendKey: constant.KeyCommentNotifyReply,
    defaultValue: true,
    type: "boolean"
  },
  {
    frontendPath: "frontDesk.comment.pushooChannel",
    backendKey: constant.KeyPushooChannel,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.comment.pushooURL",
    backendKey: constant.KeyPushooURL,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.comment.webhookRequestBody",
    backendKey: constant.KeyWebhookRequestBody,
    defaultValue: `{"title":"#{TITLE}","content":"#{BODY}","site_name":"#{SITE_NAME}","comment_author":"#{NICK}","comment_content":"#{COMMENT}","parent_author":"#{PARENT_NICK}","parent_content":"#{PARENT_COMMENT}","post_url":"#{POST_URL}","author_email":"#{MAIL}","author_ip":"#{IP}","time":"#{TIME}"}`,
    type: "json"
  },
  {
    frontendPath: "frontDesk.comment.webhookHeaders",
    backendKey: constant.KeyWebhookHeaders,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.comment.scMailNotify",
    backendKey: constant.KeyScMailNotify,
    defaultValue: false,
    type: "boolean"
  },
  {
    frontendPath: "frontDesk.comment.mailSubject",
    backendKey: constant.KeyCommentMailSubject,
    defaultValue: "您在 [{{.SITE_NAME}}] 上的评论收到了新回复",
    type: "string"
  },
  {
    frontendPath: "frontDesk.comment.mailSubjectAdmin",
    backendKey: constant.KeyCommentMailSubjectAdmin,
    defaultValue: "您的博客 [{{.SITE_NAME}}] 上有新评论了",
    type: "string"
  },
  {
    frontendPath: "frontDesk.comment.mailTemplate",
    backendKey: constant.KeyCommentMailTemplate,
    defaultValue:
      "您在 {{.SITE_NAME}} 上的评论收到了来自 {{.NICK}} 的回复：<br/>{{.COMMENT}}<br/>点击查看：<a href='{{.POST_URL}}'>{{.POST_URL}}</a>",
    type: "string"
  },
  {
    frontendPath: "frontDesk.comment.mailTemplateAdmin",
    backendKey: constant.KeyCommentMailTemplateAdmin,
    defaultValue:
      "您的博客 {{.SITE_NAME}} 收到来自 {{.NICK}} 的新评论：<br/>{{.COMMENT}}<br/>评论链接：<a href='{{.POST_URL}}'>{{.POST_URL}}</a><br/>评论者邮箱：{{.MAIL}}",
    type: "string"
  }
];

const emailDescriptors: SettingDescriptor[] = [
  {
    frontendPath: "frontDesk.email.resetPasswordSubject",
    backendKey: constant.KeyResetPasswordSubject,
    defaultValue: "【{{.AppName}}】重置您的账户密码",
    type: "string"
  },
  {
    frontendPath: "frontDesk.email.resetPasswordTemplate",
    backendKey: constant.KeyResetPasswordTemplate,
    defaultValue: `<!DOCTYPE html><html><head><title>重置密码</title></head><body><p>您好, {{.Nickname}}！</p><p>您正在请求重置您在 <strong>{{.AppName}}</strong> 的账户密码。</p><p>请点击以下链接以完成重置（此链接24小时内有效）：</p><p><a href="{{.ResetLink}}">重置我的密码</a></p><p>如果链接无法点击，请将其复制到浏览器地址栏中打开。</p><p>如果您没有请求重置密码，请忽略此邮件。</p><br/><p>感谢, <br/>{{.AppName}} 团队</p></body></html>`,
    type: "string"
  },
  {
    frontendPath: "frontDesk.email.activateAccountSubject",
    backendKey: constant.KeyActivateAccountSubject,
    defaultValue: "【{{.AppName}}】激活您的账户",
    type: "string"
  },
  {
    frontendPath: "frontDesk.email.activateAccountTemplate",
    backendKey: constant.KeyActivateAccountTemplate,
    defaultValue: `<!DOCTYPE html><html><head><title>激活您的账户</title></head><body><p>您好, {{.Nickname}}！</p><p>欢迎注册 <strong>{{.AppName}}</strong>！</p><p>请点击以下链接以激活您的账户（此链接24小时内有效）：</p><p><a href="{{.ActivateLink}}">激活我的账户</a></p><p>如果链接无法点击，请将其复制到浏览器地址栏中打开。</p><p>如果您并未注册，请忽略此邮件。</p><br/><p>感谢, <br/>{{.AppName}} 团队</p></body></html>`,
    type: "string"
  },
  {
    frontendPath: "frontDesk.email.enableUserActivation",
    backendKey: constant.KeyEnableUserActivation,
    defaultValue: false,
    type: "boolean"
  },
  {
    frontendPath: "frontDesk.email.smtpHost",
    backendKey: constant.KeySmtpHost,
    defaultValue: "smtp.example.com",
    type: "string"
  },
  {
    frontendPath: "frontDesk.email.smtpPort",
    backendKey: constant.KeySmtpPort,
    defaultValue: 587,
    type: "number"
  },
  {
    frontendPath: "frontDesk.email.smtpUsername",
    backendKey: constant.KeySmtpUsername,
    defaultValue: "user@example.com",
    type: "string"
  },
  {
    frontendPath: "frontDesk.email.smtpPassword",
    backendKey: constant.KeySmtpPassword,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.email.smtpSenderName",
    backendKey: constant.KeySmtpSenderName,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.email.smtpSenderEmail",
    backendKey: constant.KeySmtpSenderEmail,
    defaultValue: "noreply@example.com",
    type: "string"
  },
  {
    frontendPath: "frontDesk.email.smtpReplyToEmail",
    backendKey: constant.KeySmtpReplyToEmail,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.email.smtpForceSSL",
    backendKey: constant.KeySmtpForceSSL,
    defaultValue: false,
    type: "boolean"
  }
];

const fLinkDescriptors: SettingDescriptor[] = [
  {
    frontendPath: "frontDesk.fLink.friendLinkDefaultCategory",
    backendKey: constant.KeyFriendLinkDefaultCategory,
    defaultValue: 2,
    type: "number"
  },
  {
    frontendPath: "frontDesk.fLink.friendLinkApplyCondition",
    backendKey: constant.KeyFriendLinkApplyCondition,
    defaultValue: [
      "我已添加 <b>安知鱼</b> 博客的友情链接",
      "我的链接主体为 <b>个人</b>，网站类型为<b>博客</b>",
      "我的网站现在可以在中国大陆区域正常访问",
      "网站内容符合中国大陆法律法规",
      "我的网站可以在1分钟内加载完成首屏"
    ],
    type: "json"
  },
  {
    frontendPath: "frontDesk.fLink.friendLinkApplyCustomCode",
    backendKey: constant.KeyFriendLinkApplyCustomCode,
    defaultValue: "",
    type: "string"
  }
];

export const allSettingDescriptors = [
  ...siteDescriptors,
  ...pageDescriptors,
  ...fileDescriptors,
  ...postDescriptors,
  ...equipmentDescriptors,
  ...recentCommentsDescriptors,
  ...aboutPageDescriptors,
  ...frontDeskDescriptors,
  ...sidebarDescriptors,
  ...commentDescriptors,
  ...emailDescriptors,
  ...fLinkDescriptors
];
