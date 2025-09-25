<script setup lang="ts">
import { computed, ref, type PropType } from "vue";
import type { Article } from "@/api/post/type";
import { useSiteConfigStore } from "@/store/modules/siteConfig";
import HandHeartIcon from "@iconify-icons/ri/hand-heart-fill";
import RssIcon from "@iconify-icons/ri/plant-fill";
import { useRouter } from "vue-router";

const props = defineProps({
  article: {
    type: Object as PropType<Article>,
    required: true
  }
});

defineOptions({
  name: "PostCopyright"
});

const router = useRouter();
const siteConfigStore = useSiteConfigStore();
const siteConfig = siteConfigStore.getSiteConfig;
const showRewardPanel = ref(false);

const copyrightInfo = computed(() => {
  const license = siteConfig.copyright?.license ?? "CC BY-NC-SA 4.0";
  const licenseUrl =
    siteConfig.copyright?.license_url ??
    "https://creativecommons.org/licenses/by-nc-sa/4.0/";
  const author = siteConfig.frontDesk?.siteOwner?.name ?? "本站博主";
  const siteUrl = siteConfig.site?.url ?? "/";
  const siteOwnerName = siteConfig.frontDesk?.siteOwner?.name;

  // 判断是否为转载文章
  const isReprint =
    props.article.copyright_author &&
    props.article.copyright_author !== siteOwnerName;

  if (isReprint) {
    // 转载文章的版权声明
    const originalAuthor = props.article.copyright_author;
    const originalUrl = props.article.copyright_url;

    if (originalUrl) {
      return `本文是转载或翻译文章，版权归 <a href="${originalUrl}" target="_blank">${originalAuthor}</a> 所有。建议访问原文，转载本文请联系原作者。`;
    } else {
      return `本文是转载或翻译文章，版权归 ${originalAuthor} 所有。建议访问原文，转载本文请联系原作者。`;
    }
  } else {
    // 原创文章的版权声明
    return `本文是原创文章，采用 <a href="${licenseUrl}" target="_blank">${license}</a> 协议，完整转载请注明来自 <a href="${siteUrl}" target="_blank">${author}</a>`;
  }
});

const goAbout = () => {
  router.push({ path: "/about" });
};

const goRewardPage = () => {
  router.push({ path: "/about/#about-reward" });
};
</script>

<template>
  <div v-if="article.copyright" class="post-copyright">
    <div class="author-avatar" title="关于博主" @click="goAbout">
      <img :src="siteConfig.USER_AVATAR" alt="作者形象" />
    </div>
    <div class="author-name">
      {{ siteConfig.frontDesk.siteOwner?.name }}
    </div>
    <div class="author-desc">{{ siteConfig?.SUB_TITLE }}</div>

    <div class="button-group">
      <div v-if="siteConfig.post.reward?.enable" class="reward">
        <div class="reward-button" @click="showRewardPanel = !showRewardPanel">
          <IconifyIconOffline :icon="HandHeartIcon" />
          <span>打赏作者</span>
        </div>
        <div
          class="reward-main"
          :style="{ display: showRewardPanel ? 'flex' : '', zIndex: 102 }"
        >
          <div class="reward-all">
            <span class="reward-title">感谢你赐予我前进的力量</span>
            <ul class="reward-group">
              <li class="reward-item">
                <a :href="siteConfig.post.reward.wechat_qr" target="_blank">
                  <img
                    class="qr-code"
                    :src="siteConfig.post.reward.wechat_qr"
                    alt="微信"
                  />
                </a>

                <div class="qr-code-desc">微信</div>
              </li>
              <li class="reward-item">
                <a :href="siteConfig.post.reward.alipay_qr" target="_blank">
                  <img
                    class="qr-code"
                    :src="siteConfig.post.reward.alipay_qr"
                    alt="支付宝"
                  />
                </a>
                <div class="qr-code-desc">支付宝</div>
              </li>
            </ul>
            <div class="reward-main-btn" @click="goRewardPage">
              <div class="reward-text">打赏者名单</div>
              <div class="reward-dec">
                因为你们的支持让我意识到写文章的价值🙏
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        id="quit-box"
        :style="{ display: showRewardPanel ? 'flex' : 'none' }"
        @click="showRewardPanel = !showRewardPanel"
      />
      <div class="subscribe-button" @click="goAbout">
        <IconifyIconOffline :icon="RssIcon" />
        <span>订阅</span>
      </div>
    </div>

    <div class="copyright-notice">
      <span v-html="copyrightInfo" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.post-copyright {
  position: relative;
  padding: 34px 12px 20px;
  margin: 80px 0 30px;
  background: var(--anzhiyu-secondbg);
  border: var(--style-border-always);
  border-width: 1px;
  border-radius: 12px;
  transition: 0.3s;
}

.author-avatar {
  position: absolute;
  top: -33px;
  left: calc(50% - 33px);
  width: 66px;
  height: 66px;
  margin: auto;
  overflow: hidden;
  cursor: pointer;
  background: var(--anzhiyu-main);
  border: var(--style-border-always);
  border-radius: 66px;
  box-shadow: var(--anzhiyu-shadow-main);
  transition: all 0.2s ease 0s;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: all 0.2s ease 0s;
  }

  &:hover {
    box-shadow: inset 0 0 0 10px var(--anzhiyu-main);
    transform: scale(1.05);

    img {
      overflow: hidden;
      border-radius: 66px;
      transform: scale(0.8);
    }
  }
}

.author-name {
  margin-top: 16px;
  font-size: 20px;
  font-weight: 700;
  line-height: 1;
  color: var(--anzhiyu-fontcolor);
  text-align: center;
}

.author-desc {
  margin-top: 4px;
  font-size: 14px;
  color: var(--anzhiyu-secondtext);
  text-align: center;
}

.button-group {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: center;
  width: 100%;
  margin-top: 8px;
  user-select: none;
  user-select: none;

  .reward {
    position: relative;
    display: flex;
    justify-content: center;
    margin-top: 0;

    .reward-button {
      background: var(--anzhiyu-red);

      svg {
        font-size: 22px;
        line-height: 1;
      }
    }

    &:hover .reward-main {
      display: flex;
      justify-content: left;
    }
  }

  .reward-button,
  .subscribe-button {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    justify-content: center;
    height: 40px;
    padding: 0.6rem 1.5rem;
    font-weight: bold;
    color: var(--anzhiyu-white);
    cursor: pointer;
    border: none;
    border-radius: 8px;
    transition: all 0.4s ease 0s;

    &:hover {
      background: var(--anzhiyu-theme);
      box-shadow: none;
    }
  }

  .subscribe-button {
    background: var(--anzhiyu-green);
  }
}

.reward-main {
  position: absolute;
  bottom: 40px;
  left: -96px;
  z-index: 100;
  display: none;
  width: fit-content;
  padding: 0 0 15px;
  animation: slide-in 0.3s ease 0s 1 normal none running;
}

.reward-all {
  z-index: 999;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  margin: 0;
  background: var(--anzhiyu-card-bg);
  border: var(--style-border-always);
  border-radius: 12px;
  box-shadow: var(--anzhiyu-shadow-border);

  &::before {
    position: absolute;
    bottom: -10px;
    left: 0;
    width: 100%;
    height: 20px;
    content: "";
  }

  .reward-title {
    font-weight: 700;
    color: var(--anzhiyu-red);
  }

  .reward-group {
    display: flex;
    margin-top: 0.625rem;
  }

  .reward-item {
    display: inline-block;
    padding: 0 8px;
    text-align: center;
    vertical-align: top;
    list-style-type: none;

    &:first-child img {
      border-color: var(--anzhiyu-green);
    }

    &:last-child img {
      border-color: var(--anzhiyu-blue);
    }

    .qr-code {
      width: 130px;
      height: 130px;
      border: var(--style-border-always);
      border-radius: 8px;
      box-shadow: var(--anzhiyu-shadow-lightblack);
    }

    .qr-code-desc {
      width: 130px;
      padding-top: 0;
      margin-top: -8px;
      margin-bottom: 8px;
    }
  }

  .reward-main-btn {
    display: flex;
    flex-direction: column;
    width: calc(100% - 16px);
    padding: 4px 0;
    margin: 8px;
    color: var(--anzhiyu-fontcolor);
    text-align: center;
    cursor: pointer;
    background: var(--anzhiyu-secondbg);
    border: var(--style-border-always);
    border-radius: 12px;

    &:hover {
      color: var(--anzhiyu-white);
      background: var(--anzhiyu-red);
      background-image: url("https://upload-bbs.miyoushe.com/upload/2025/08/10/125766904/dfc8878f7e65451f068d69830a4ff39c_2744970941687453951.gif");
      border-color: var(--anzhiyu-red);
      box-shadow: var(--anzhiyu-shadow-red);
    }

    .reward-text {
      margin-bottom: 0;
      font-weight: 700;
    }

    .reward-dec {
      font-size: 0.75rem;
    }
  }
}

#quit-box {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 101;
  display: none;
  width: 100vw;
  height: 100vh;
  margin: 0;
  background: rgb(0 0 0 / 20%);
}

.copyright-notice {
  padding-left: 0;
  margin: 1rem 0 0.5rem;
  overflow: hidden;
  font-size: 12px;
  color: var(--anzhiyu-secondtext);
  text-align: center;
  -webkit-line-clamp: 1;
  line-clamp: 1;
  -webkit-box-orient: vertical;

  :deep(a) {
    font-weight: bold;
    color: var(--anzhiyu-fontcolor);
    border-bottom: 1px solid var(--anzhiyu-gray-100);

    &:hover {
      color: var(--anzhiyu-main);
      border-bottom-color: var(--anzhiyu-main);
    }
  }
}

[data-theme="dark"] .reward .reward-button,
[data-theme="dark"] .button-group .subscribe-button {
  filter: "progid:DXImageTransform.Microsoft.Alpha(Opacity=50)";
  filter: alpha(opacity=50);
  opacity: 0.5;
}
</style>
