/*
 * @Description: 系统配置相关的常量，与后端 Go 定义和 API 响应保持同步。
 * @Author: 安知鱼
 * @Date: 2025-06-21 18:42:04
 * @LastEditTime: 2025-09-20 17:31:19
 * @LastEditors: 安知鱼
 */

// 定义了 localStorage 存储的键名
export const LOCAL_STORAGE_KEY = "site_config_cache";

/**
 * 定义配置键的类型，增强类型安全
 */
export type SettingKey = string;

// --- 站点基础配置 (可暴露给前端) ---
const KeyAppName: SettingKey = "APP_NAME";
const KeySiteURL: SettingKey = "SITE_URL";
const KeySubTitle: SettingKey = "SUB_TITLE";
const KeyAppVersion: SettingKey = "APP_VERSION";
const KeyApiURL: SettingKey = "API_URL";
const KeyAboutLink: SettingKey = "ABOUT_LINK";
const KeyIcpNumber: SettingKey = "ICP_NUMBER";
const KeySiteKeywords: SettingKey = "SITE_KEYWORDS";
const KeySiteDescription: SettingKey = "SITE_DESCRIPTION";
const KeyUserAvatar: SettingKey = "USER_AVATAR";
const KeyLogoURL: SettingKey = "LOGO_URL";
const KeyLogoURL192: SettingKey = "LOGO_URL_192x192";
const KeyLogoURL512: SettingKey = "LOGO_URL_512x512";
const KeyLogoHorizontalDay: SettingKey = "LOGO_HORIZONTAL_DAY";
const KeyLogoHorizontalNight: SettingKey = "LOGO_HORIZONTAL_NIGHT";
const KeyIconURL: SettingKey = "ICON_URL";
const KeyDefaultThumbParam: SettingKey = "DEFAULT_THUMB_PARAM";
const KeyDefaultBigParam: SettingKey = "DEFAULT_BIG_PARAM";
const KeyGravatarURL: SettingKey = "GRAVATAR_URL";
const KeyThemeColor: SettingKey = "THEME_COLOR";
const KeySiteAnnouncement: SettingKey = "SITE_ANNOUNCEMENT";
const KeyFooterCode: SettingKey = "FOOTER_CODE";
const KeyUploadAllowedExtensions: SettingKey = "UPLOAD_ALLOWED_EXTENSIONS";
const KeyUploadDeniedExtensions: SettingKey = "UPLOAD_DENIED_EXTENSIONS";

// --- Header/Nav 配置 ---
const KeyHeaderMenu: SettingKey = "header.menu";
const KeyHeaderNavTravel: SettingKey = "header.nav.travelling";
const KeyHeaderNavClock: SettingKey = "header.nav.clock";
const KeyHeaderNavMenu: SettingKey = "header.nav.menu";
const KeyHomeTop: SettingKey = "HOME_TOP";

// --- Sidebar 配置 ---
const KeySidebarAuthorEnable: SettingKey = "sidebar.author.enable";
const KeySidebarAuthorDescription: SettingKey = "sidebar.author.description";
const KeySidebarAuthorStatusImg: SettingKey = "sidebar.author.statusImg";
const KeySidebarAuthorSkills: SettingKey = "sidebar.author.skills";
const KeySidebarAuthorSocial: SettingKey = "sidebar.author.social";
const KeySidebarWechatEnable: SettingKey = "sidebar.wechat.enable";
const KeySidebarWechatFace: SettingKey = "sidebar.wechat.face";
const KeySidebarWechatBackFace: SettingKey = "sidebar.wechat.backFace";
const KeySidebarWechatBlurredBackground: SettingKey =
  "sidebar.wechat.blurBackground";
const KeySidebarTagsEnable: SettingKey = "sidebar.tags.enable";
const KeySidebarTagsHighlight: SettingKey = "sidebar.tags.highlight";
const KeySidebarSiteInfoTotalPostCount: SettingKey =
  "sidebar.siteinfo.totalPostCount";
const KeySidebarSiteInfoRuntimeEnable: SettingKey =
  "sidebar.siteinfo.runtimeEnable";
const KeySidebarSiteInfoTotalWordCount: SettingKey =
  "sidebar.siteinfo.totalWordCount";
const KeySidebarArchiveDisplayMonths: SettingKey =
  "sidebar.archive.displayMonths";

// 友链配置
const KeyFriendLinkDefaultCategory: SettingKey = "FRIEND_LINK_DEFAULTCATEGORY";
const KeyFriendLinkApplyCondition: SettingKey = "FRIEND_LINK_APPLY_CONDITION";
const KeyFriendLinkApplyCustomCode: SettingKey =
  "FRIEND_LINK_APPLY_CUSTOM_CODE";

// --- 前台及页脚配置 ---
const KeyFrontDeskSiteOwnerName: SettingKey = "frontDesk.siteOwner.name";
const KeyFrontDeskSiteOwnerEmail: SettingKey = "frontDesk.siteOwner.email";
const KeyFooterOwnerName: SettingKey = "footer.owner.name";
const KeyFooterOwnerSince: SettingKey = "footer.owner.since";
const KeyFooterCustomText: SettingKey = "footer.custom_text";
const KeyFooterRuntimeEnable: SettingKey = "footer.runtime.enable";
const KeyFooterRuntimeLaunchTime: SettingKey = "footer.runtime.launch_time";
const KeyFooterRuntimeWorkImg: SettingKey = "footer.runtime.work_img";
const KeyFooterRuntimeWorkDesc: SettingKey = "footer.runtime.work_description";
const KeyFooterRuntimeOffDutyImg: SettingKey = "footer.runtime.offduty_img";
const KeyFooterRuntimeOffDutyDesc: SettingKey =
  "footer.runtime.offduty_description";
const KeyFooterSocialBarCenterImg: SettingKey = "footer.socialBar.centerImg";
const KeyFooterListRandomFriends: SettingKey = "footer.list.randomFriends";
const KeyFooterBarAuthorLink: SettingKey = "footer.bar.authorLink";
const KeyFooterBarCCLink: SettingKey = "footer.bar.cc.link";
const KeyFooterBadge: SettingKey = "footer.badge.list";
const KeyFooterSocialBarLeft: SettingKey = "footer.socialBar.left";
const KeyFooterSocialBarRight: SettingKey = "footer.socialBar.right";
const KeyFooterList: SettingKey = "footer.project.list";
const KeyFooterBarLinkList: SettingKey = "footer.bar.linkList";

// --- 文章配置 ---
const KeyDefaultCover: SettingKey = "post.default.cover";
const KeyPostExpirationTime: SettingKey = "post.expiration_time";
const KeyDoubleColumn: SettingKey = "post.default.double_column";
const KeyPostDefaultPageSize: SettingKey = "post.default.page_size";
const KeyPostRewardEnable: SettingKey = "post.reward.enable";
const KeyPostRewardWeChatQR: SettingKey = "post.reward.wechat_qr";
const KeyPostRewardAlipayQR: SettingKey = "post.reward.alipay_qr";
const KeyPostCodeBlockCodeMaxLines: SettingKey =
  "post.code_block.code_max_lines";

// --- 装备页面配置 ---
const KeyPostEquipmentBannerBackground: SettingKey =
  "equipment.banner.background";
const KeyPostEquipmentBannerTitle: SettingKey = "equipment.banner.title";
const KeyPostEquipmentBannerDescription: SettingKey =
  "equipment.banner.description";
const KeyPostEquipmentBannerTip: SettingKey = "equipment.banner.tip";
const KeyPostEquipmentList: SettingKey = "equipment.list";

// --- 最近评论页面配置 ---
const KeyRecentCommentsBannerBackground: SettingKey =
  "recent_comments.banner.background";
const KeyRecentCommentsBannerTitle: SettingKey = "recent_comments.banner.title";
const KeyRecentCommentsBannerDescription: SettingKey =
  "recent_comments.banner.description";
const KeyRecentCommentsBannerTip: SettingKey = "recent_comments.banner.tip";

// --- 关于页面配置 ---
const KeyAboutPageName: SettingKey = "about.page.name";
const KeyAboutPageDescription: SettingKey = "about.page.description";
const KeyAboutPageAvatarImg: SettingKey = "about.page.avatar_img";
const KeyAboutPageSubtitle: SettingKey = "about.page.subtitle";
const KeyAboutPageAvatarSkillsLeft: SettingKey =
  "about.page.avatar_skills_left";
const KeyAboutPageAvatarSkillsRight: SettingKey =
  "about.page.avatar_skills_right";
const KeyAboutPageAboutSiteTips: SettingKey = "about.page.about_site_tips";
const KeyAboutPageMap: SettingKey = "about.page.map";
const KeyAboutPageSelfInfo: SettingKey = "about.page.self_info";
const KeyAboutPagePersonalities: SettingKey = "about.page.personalities";
const KeyAboutPageMaxim: SettingKey = "about.page.maxim";
const KeyAboutPageBuff: SettingKey = "about.page.buff";
const KeyAboutPageGame: SettingKey = "about.page.game";
const KeyAboutPageComic: SettingKey = "about.page.comic";
const KeyAboutPageLike: SettingKey = "about.page.like";
const KeyAboutPageMusic: SettingKey = "about.page.music";
const KeyAboutPageCareers: SettingKey = "about.page.careers";
const KeyAboutPageSkillsTips: SettingKey = "about.page.skills_tips";
const KeyAboutPageStatisticsBackground: SettingKey =
  "about.page.statistics_background";
const KeyMusicPlayerEnable: SettingKey = "music.player.enable";
const KeyMusicPlayerPlaylistID: SettingKey = "music.player.playlist_id";
const KeyMusicPlayerCustomPlaylist: SettingKey = "music.player.custom_playlist";

// --- 评论配置 ---
const KeyCommentLoginRequired: SettingKey = "comment.login_required";
const KeyCommentPageSize: SettingKey = "comment.page_size";
const KeyCommentMasterTag: SettingKey = "comment.master_tag";
const KeyCommentPlaceholder: SettingKey = "comment.placeholder";
const KeyCommentEmojiCDN: SettingKey = "comment.emoji_cdn";
const KeyCommentBloggerEmail: SettingKey = "comment.blogger_email";
const KeyCommentShowUA: SettingKey = "comment.show_ua";
const KeyCommentShowRegion: SettingKey = "comment.show_region";
const KeyCommentLimitPerMinute: SettingKey = "comment.limit_per_minute";
const KeyCommentLimitLength: SettingKey = "comment.limit_length";
const KeyCommentForbiddenWords: SettingKey = "comment.forbidden_words";
const KeyCommentNotifyAdmin: SettingKey = "comment.notify_admin";
const KeyCommentNotifyReply: SettingKey = "comment.notify_reply";
const KeyPushooChannel: SettingKey = "pushoo.channel";
const KeyPushooURL: SettingKey = "pushoo.url";
const KeyWebhookRequestBody: SettingKey = "webhook.request_body";
const KeyWebhookHeaders: SettingKey = "webhook.headers";
const KeyScMailNotify: SettingKey = "sc.mail_notify";
const KeyCommentMailSubject: SettingKey = "comment.mail_subject";
const KeyCommentMailTemplate: SettingKey = "comment.mail_template";
const KeyCommentMailSubjectAdmin: SettingKey = "comment.mail_subject_admin";
const KeyCommentMailTemplateAdmin: SettingKey = "comment.mail_template_admin";

// --- 文件生成及处理配置 ---
const KeyEnableVipsGenerator: SettingKey = "ENABLE_VIPS_GENERATOR";
const KeyVipsPath: SettingKey = "VIPS_PATH";
const KeyVipsSupportedExts: SettingKey = "VIPS_SUPPORTED_EXTS";
const KeyVipsMaxFileSize: SettingKey = "VIPS_MAX_FILE_SIZE";
const KeyEnableMusicCoverGenerator: SettingKey = "ENABLE_MUSIC_COVER_GENERATOR";
const KeyMusicCoverSupportedExts: SettingKey = "MUSIC_COVER_SUPPORTED_EXTS";
const KeyMusicCoverMaxFileSize: SettingKey = "MUSIC_COVER_MAX_FILE_SIZE";
const KeyEnableFfmpegGenerator: SettingKey = "ENABLE_FFMPEG_GENERATOR";
const KeyFfmpegPath: SettingKey = "FFMPEG_PATH";
const KeyFfmpegSupportedExts: SettingKey = "FFMPEG_SUPPORTED_EXTS";
const KeyFfmpegMaxFileSize: SettingKey = "FFMPEG_MAX_FILE_SIZE";
const KeyFfmpegCaptureTime: SettingKey = "FFMPEG_CAPTURE_TIME";
const KeyEnableBuiltinGenerator: SettingKey = "ENABLE_BUILTIN_GENERATOR";
const KeyBuiltinMaxFileSize: SettingKey = "BUILTIN_MAX_FILE_SIZE";
const KeyBuiltinDirectServeExts: SettingKey = "BUILTIN_DIRECT_SERVE_EXTS";

// --- 缩略图生成队列配置 ---
const KeyQueueThumbConcurrency: SettingKey = "QUEUE_THUMB_CONCURRENCY";
const KeyQueueThumbMaxExecTime: SettingKey = "QUEUE_THUMB_MAX_EXEC_TIME";
const KeyQueueThumbBackoffFactor: SettingKey = "QUEUE_THUMB_BACKOFF_FACTOR";
const KeyQueueThumbMaxBackoff: SettingKey = "QUEUE_THUMB_MAX_BACKOFF";
const KeyQueueThumbMaxRetries: SettingKey = "QUEUE_THUMB_MAX_RETRIES";
const KeyQueueThumbRetryDelay: SettingKey = "QUEUE_THUMB_RETRY_DELAY";

// --- 媒体信息提取配置 ---
const KeyEnableExifExtractor: SettingKey = "ENABLE_EXIF_EXTRACTOR";
const KeyExifMaxSizeLocal: SettingKey = "EXIF_MAX_SIZE_LOCAL";
const KeyExifMaxSizeRemote: SettingKey = "EXIF_MAX_SIZE_REMOTE";
const KeyExifUseBruteForce: SettingKey = "EXIF_USE_BRUTE_FORCE";
const KeyEnableMusicExtractor: SettingKey = "ENABLE_MUSIC_EXTRACTOR";
const KeyMusicMaxSizeLocal: SettingKey = "MUSIC_MAX_SIZE_LOCAL";
const KeyMusicMaxSizeRemote: SettingKey = "MUSIC_MAX_SIZE_REMOTE";

// --- 站点敏感或内部配置 (在管理后台使用) ---
const KeyJWTSecret: SettingKey = "JWT_SECRET";
const KeyResetPasswordSubject: SettingKey = "DEFAULT_RESET_PASSWORD_SUBJECT";
const KeyResetPasswordTemplate: SettingKey = "DEFAULT_RESET_PASSWORD_TEMPLATE";
const KeyActivateAccountSubject: SettingKey =
  "DEFAULT_ACTIVATE_ACCOUNT_SUBJECT";
const KeyActivateAccountTemplate: SettingKey =
  "DEFAULT_ACTIVATE_ACCOUNT_TEMPLATE";
const KeyEnableUserActivation: SettingKey = "ENABLE_USER_ACTIVATION";
const KeySmtpHost: SettingKey = "SMTP_HOST";
const KeySmtpPort: SettingKey = "SMTP_PORT";
const KeySmtpUsername: SettingKey = "SMTP_USERNAME";
const KeySmtpPassword: SettingKey = "SMTP_PASSWORD";
const KeySmtpSenderName: SettingKey = "SMTP_SENDER_NAME";
const KeySmtpSenderEmail: SettingKey = "SMTP_SENDER_EMAIL";
const KeySmtpReplyToEmail: SettingKey = "SMTP_REPLY_TO_EMAIL";
const KeySmtpForceSSL: SettingKey = "SMTP_FORCE_SSL";
const KeyIPAPI: SettingKey = "IP_API";
const KeyIPAPIToKen: SettingKey = "IP_API_TOKEN";

const DEFAULT_CHUNK_SIZE = 50 * 1024 * 1024;

/**
 * 将所有常量组合到一个对象中导出
 */
export const constant = {
  // --- 站点基础配置 ---
  KeyAppName,
  KeySubTitle,
  KeySiteURL,
  KeyAppVersion,
  KeyApiURL,
  KeyAboutLink,
  KeyIcpNumber,
  KeySiteKeywords,
  KeySiteDescription,
  KeyUserAvatar,
  KeyLogoURL,
  KeyLogoURL192,
  KeyLogoURL512,
  KeyLogoHorizontalDay,
  KeyLogoHorizontalNight,
  KeyIconURL,
  KeyDefaultThumbParam,
  KeyDefaultBigParam,
  KeyGravatarURL,
  KeyThemeColor,
  KeySiteAnnouncement,
  KeyFooterCode,
  KeyUploadAllowedExtensions,
  KeyUploadDeniedExtensions,

  // --- Header/Nav 配置 ---
  KeyHeaderMenu,
  KeyHeaderNavTravel,
  KeyHeaderNavClock,
  KeyHeaderNavMenu,
  KeyHomeTop,

  // --- Sidebar 配置 ---
  KeySidebarAuthorEnable,
  KeySidebarAuthorDescription,
  KeySidebarAuthorStatusImg,
  KeySidebarAuthorSkills,
  KeySidebarAuthorSocial,
  KeySidebarWechatEnable,
  KeySidebarWechatFace,
  KeySidebarWechatBackFace,
  KeySidebarWechatBlurredBackground,
  KeySidebarTagsEnable,
  KeySidebarTagsHighlight,
  KeySidebarSiteInfoTotalPostCount,
  KeySidebarSiteInfoRuntimeEnable,
  KeySidebarSiteInfoTotalWordCount,
  KeySidebarArchiveDisplayMonths,

  // --- 前台及页脚配置 ---
  KeyFrontDeskSiteOwnerName,
  KeyFrontDeskSiteOwnerEmail,
  KeyFooterOwnerName,
  KeyFooterOwnerSince,
  KeyFooterCustomText,
  KeyFooterRuntimeEnable,
  KeyFooterRuntimeLaunchTime,
  KeyFooterRuntimeWorkImg,
  KeyFooterRuntimeWorkDesc,
  KeyFooterRuntimeOffDutyImg,
  KeyFooterRuntimeOffDutyDesc,
  KeyFooterSocialBarCenterImg,
  KeyFooterListRandomFriends,
  KeyFooterBarAuthorLink,
  KeyFooterBarCCLink,
  KeyFooterBadge,
  KeyFooterSocialBarLeft,
  KeyFooterSocialBarRight,
  KeyFooterList,
  KeyFooterBarLinkList,

  // 友链配置
  KeyFriendLinkDefaultCategory,
  KeyFriendLinkApplyCondition,
  KeyFriendLinkApplyCustomCode,

  // --- 文章配置 ---
  KeyDefaultCover,
  KeyDoubleColumn,
  KeyPostDefaultPageSize,
  KeyPostRewardEnable,
  KeyPostRewardWeChatQR,
  KeyPostRewardAlipayQR,
  KeyPostExpirationTime,
  KeyPostCodeBlockCodeMaxLines,

  // --- 装备页面配置 ---
  KeyPostEquipmentBannerBackground,
  KeyPostEquipmentBannerTitle,
  KeyPostEquipmentBannerDescription,
  KeyPostEquipmentBannerTip,
  KeyPostEquipmentList,

  // --- 最近评论页面配置 ---
  KeyRecentCommentsBannerBackground,
  KeyRecentCommentsBannerTitle,
  KeyRecentCommentsBannerDescription,
  KeyRecentCommentsBannerTip,

  // --- 关于页面配置 ---
  KeyAboutPageName,
  KeyAboutPageDescription,
  KeyAboutPageAvatarImg,
  KeyAboutPageSubtitle,
  KeyAboutPageAvatarSkillsLeft,
  KeyAboutPageAvatarSkillsRight,
  KeyAboutPageAboutSiteTips,
  KeyAboutPageMap,
  KeyAboutPageSelfInfo,
  KeyAboutPagePersonalities,
  KeyAboutPageMaxim,
  KeyAboutPageBuff,
  KeyAboutPageGame,
  KeyAboutPageComic,
  KeyAboutPageLike,
  KeyAboutPageMusic,
  KeyAboutPageCareers,
  KeyAboutPageSkillsTips,
  KeyAboutPageStatisticsBackground,
  KeyMusicPlayerEnable,
  KeyMusicPlayerPlaylistID,
  KeyMusicPlayerCustomPlaylist,

  // --- 评论配置 ---
  KeyCommentLoginRequired,
  KeyCommentPageSize,
  KeyCommentMasterTag,
  KeyCommentPlaceholder,
  KeyCommentEmojiCDN,
  KeyCommentBloggerEmail,
  KeyCommentShowUA,
  KeyCommentShowRegion,
  KeyCommentLimitPerMinute,
  KeyCommentLimitLength,
  KeyCommentForbiddenWords,
  KeyCommentNotifyAdmin,
  KeyCommentNotifyReply,
  KeyPushooChannel,
  KeyPushooURL,
  KeyWebhookRequestBody,
  KeyWebhookHeaders,
  KeyScMailNotify,
  KeyCommentMailSubject,
  KeyCommentMailTemplate,
  KeyCommentMailSubjectAdmin,
  KeyCommentMailTemplateAdmin,

  // --- 文件生成及处理配置 ---
  KeyEnableVipsGenerator,
  KeyVipsPath,
  KeyVipsSupportedExts,
  KeyVipsMaxFileSize,
  KeyEnableMusicCoverGenerator,
  KeyMusicCoverSupportedExts,
  KeyMusicCoverMaxFileSize,
  KeyEnableFfmpegGenerator,
  KeyFfmpegPath,
  KeyFfmpegSupportedExts,
  KeyFfmpegMaxFileSize,
  KeyFfmpegCaptureTime,
  KeyEnableBuiltinGenerator,
  KeyBuiltinMaxFileSize,
  KeyBuiltinDirectServeExts,

  // --- 缩略图生成队列配置 ---
  KeyQueueThumbConcurrency,
  KeyQueueThumbMaxExecTime,
  KeyQueueThumbBackoffFactor,
  KeyQueueThumbMaxBackoff,
  KeyQueueThumbMaxRetries,
  KeyQueueThumbRetryDelay,

  // --- 媒体信息提取配置 ---
  KeyEnableExifExtractor,
  KeyExifMaxSizeLocal,
  KeyExifMaxSizeRemote,
  KeyExifUseBruteForce,
  KeyEnableMusicExtractor,
  KeyMusicMaxSizeLocal,
  KeyMusicMaxSizeRemote,

  // --- 站点敏感或内部配置 ---
  KeyJWTSecret,
  KeyResetPasswordSubject,
  KeyResetPasswordTemplate,
  KeyActivateAccountSubject,
  KeyActivateAccountTemplate,
  KeyEnableUserActivation,
  KeySmtpHost,
  KeySmtpPort,
  KeySmtpUsername,
  KeySmtpPassword,
  KeySmtpSenderName,
  KeySmtpSenderEmail,
  KeySmtpReplyToEmail,
  KeySmtpForceSSL,
  KeyIPAPI,
  KeyIPAPIToKen,

  // --- 其他 ---
  DEFAULT_CHUNK_SIZE
};
