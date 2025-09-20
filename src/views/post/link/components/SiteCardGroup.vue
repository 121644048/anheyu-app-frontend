<script setup lang="ts">
import type { LinkItem } from "@/api/postLink/type";
defineProps<{ links: LinkItem[] }>();
</script>

<template>
  <div class="site-card-group">
    <div v-for="link in links" :key="link.id" class="site-card">
      <template v-if="link.tag">
        <span class="link-tag" :style="{ background: link.tag.color }">
          {{ link.tag.name }}
          <i class="light" />
        </span>
      </template>

      <a
        class="img"
        target="_blank"
        :title="link.name"
        :href="link.url"
        rel="external nofollow"
      >
        <img class="flink-avatar" :src="link.siteshot" :alt="link.name" />
      </a>
      <a
        class="info"
        target="_blank"
        :title="link.name"
        :href="link.url"
        rel="external nofollow"
      >
        <div class="site-card-avatar">
          <img class="flink-avatar" :src="link.logo" :alt="link.name" />
        </div>
        <div class="site-card-text">
          <span class="title">{{ link.name }}</span>
          <span class="desc" :title="link.description">{{
            link.description
          }}</span>
        </div>
      </a>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.site-card-group {
  display: flex;
  flex-wrap: wrap;
  align-items: stretch;
  justify-content: flex-start;
  padding: 20px 0;
  margin: -8px;
  -webkit-box-pack: start;
  -webkit-box-align: stretch;

  // 移动端优化
  @media (max-width: 576px) {
    padding: 15px 0;
    margin: -6px;
  }

  @media (max-width: 480px) {
    padding: 10px 0;
    margin: -6px;
  }
}

.site-card {
  position: relative;
  display: block;
  width: calc(14.2857% - 16px);
  height: 200px;
  margin: 8px;
  overflow: hidden;
  line-height: 1.4;
  background: var(--anzhiyu-card-bg);
  border: var(--style-border);
  border-radius: 12px;
  box-shadow: var(--anzhiyu-shadow-border);
  transition: 0.3s ease-in-out;

  // 响应式布局
  @media (max-width: 1200px) {
    width: calc(20% - 16px); // 5列
  }

  @media (max-width: 1024px) {
    width: calc(20% - 16px); // 5列
  }

  @media (max-width: 992px) {
    width: calc(25% - 16px); // 4列
  }

  @media (max-width: 768px) {
    width: calc(33.3333% - 16px); // 3列
    height: 180px;
  }

  @media (max-width: 576px) {
    width: calc(50% - 16px); // 2列
    height: 160px;
    margin: 6px;
  }

  @media (max-width: 480px) {
    width: calc(50% - 16px); // 2列
    height: 140px;
    margin: 6px;
  }

  // 桌面端 hover 效果
  @media (hover: hover) and (pointer: fine) {
    &:hover {
      background: var(--anzhiyu-lighttext);
      border: var(--style-border-hover);
      box-shadow: var(--anzhiyu-shadow-main);
      transform: translateY(-2px);

      .link-tag {
        left: -50px;
      }

      .img {
        height: 80px;
        background: var(--anzhiyu-lighttext);

        img {
          filter: brightness(0.3);
          transform: scale(1.1);
        }
      }

      .info {
        height: 120px;
        background: var(--anzhiyu-lighttext);

        img.flink-avatar {
          width: 0;
          min-width: 0;
          height: 0;
          min-height: 0;
          opacity: 0;
        }

        .title {
          color: var(--anzhiyu-card-bg);
        }

        .desc {
          color: var(--anzhiyu-card-bg);
        }
      }

      a {
        color: var(--anzhiyu-white);
        text-decoration: none;
        background: var(--anzhiyu-main);
        border-bottom: 2px solid var(--anzhiyu-none);
        box-shadow: var(--anzhiyu-shadow-main);
      }
    }
  }

  // 移动端触摸效果
  @media (hover: none) {
    &:active {
      transform: scale(0.98);
      box-shadow: var(--anzhiyu-shadow-border);
    }
  }

  .link-tag {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 1;
    padding: 4px 8px;
    overflow: hidden;
    font-size: 0.75rem;
    color: var(--anzhiyu-white);
    background-color: var(--anzhiyu-blue);
    border-radius: 12px 0;
    transition: 0.3s;
  }

  a.img {
    display: flex;
    width: 100%;
    height: 120px;
    padding: 0 !important;
    overflow: hidden;
    background: rgb(246 246 246);
    border-color: initial;
    border-style: none;
    border-width: initial;
    border-radius: 0;
    border-image: initial;
    mask-image: radial-gradient(center center, rgb(255 255 255), rgb(0 0 0));

    // 移动端高度调整
    @media (max-width: 768px) {
      height: 100px;
    }

    @media (max-width: 576px) {
      height: 90px;
    }

    @media (max-width: 480px) {
      height: 80px;
    }

    img {
      width: 100%;
      max-width: 100%;
      height: 100%;
      margin: 0;
      pointer-events: none;
      object-fit: cover;
      border-radius: 0;
      transition: 0.3s;
      transform: scale(1.03);
    }
  }

  a.img:hover img {
    transform: scale(1.1);
  }

  a.info {
    display: flex;
    width: 100%;
    height: 90px;
    padding: 0.625rem;
    margin: 0;
    font-weight: 700;
    color: var(--anzhiyu-fontcolor);
    text-decoration: none;
    border-color: initial;
    border-style: none;
    border-width: initial;
    border-radius: 0 0 12px 12px;
    border-image: initial;

    // 移动端高度和内边距调整
    @media (max-width: 768px) {
      height: 80px;
      padding: 0.5rem;
    }

    @media (max-width: 576px) {
      height: 70px;
      padding: 0.5rem;
    }

    @media (max-width: 480px) {
      height: 60px;
      padding: 0.4rem;
    }

    .site-card-avatar {
      img {
        width: 20px;
        min-width: 20px;
        height: 20px;
        min-height: 20px;
        margin: 2px 8px 0 0;
        background: var(--anzhiyu-secondbg);
        border-radius: 32px;
        transition: 0.3s ease-out;
      }
    }

    .site-card-text {
      display: flex;
      flex-direction: column;
      align-items: flex-start;

      .title {
        overflow: hidden;
        font-weight: 600;
        text-align: left;
        -webkit-line-clamp: 1;
        line-clamp: 1;
        transition: 0.3s;
        -webkit-box-orient: vertical;

        // 移动端字体大小调整
        @media (max-width: 576px) {
          font-size: 0.9rem;
        }

        @media (max-width: 480px) {
          font-size: 0.85rem;
        }
      }

      .desc {
        overflow: hidden;
        font-size: 0.875rem;
        line-height: 1.2;
        text-align: left;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        overflow-wrap: break-word;
        opacity: 0.7;
        transition: 0.3s;
        -webkit-box-orient: vertical;

        // 移动端字体大小和行数调整
        @media (max-width: 576px) {
          font-size: 0.8rem;
          -webkit-line-clamp: 1;
          line-clamp: 1;
        }

        @media (max-width: 480px) {
          font-size: 0.75rem;
        }
      }
    }
  }

  .light {
    position: absolute;
    top: 0;
    width: 100px;
    height: 50px;
    cursor: pointer;
    background-image: -webkit-linear-gradient(
      0deg,
      rgba(255, 255, 255, 0),
      rgba(255, 255, 255, 0.5),
      rgba(255, 255, 255, 0)
    );
    animation: 4s ease 0s infinite normal both running light_tag;
  }
}
</style>
