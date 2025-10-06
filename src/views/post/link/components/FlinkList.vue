<script setup lang="ts">
import type { LinkItem } from "@/api/postLink/type";

defineOptions({
  name: "FlinkList"
});

defineProps<{
  links: LinkItem[];
}>();
</script>

<template>
  <div class="flink-list">
    <TransitionGroup name="flink-item">
      <div v-for="link in links" :key="link.id" class="flink-list-item">
        <template v-if="link.tag">
          <span class="link-tag" :style="{ background: link.tag.color }">
            {{ link.tag.name }}
            <i class="light" />
          </span>
        </template>

        <a
          class="cf-friends-link"
          :href="link.url"
          rel="external nofollow"
          :title="link.name"
          target="_blank"
        >
          <img class="flink-avatar" :src="link.logo" :alt="link.name" />
          <div class="flink-item-info">
            <span class="flink-item-name">{{ link.name }}</span>
            <span class="flink-item-desc" :title="link.description">{{
              link.description
            }}</span>
          </div>
        </a>
      </div>
    </TransitionGroup>
  </div>
</template>

<style lang="scss" scoped>
.flink-list {
  padding: 0;
  margin: 0.625rem -6px 1.25rem;
  overflow: hidden;
  text-align: center;
}

// TransitionGroup 动画
.flink-item-enter-active {
  transition: all 0.5s ease;
}

.flink-item-leave-active {
  transition: all 0.3s ease;
}

.flink-item-enter-from {
  opacity: 0;
  transform: translateY(-20px) scale(0.95);
}

.flink-item-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

.flink-item-move {
  transition: transform 0.5s ease;
}

.flink-list-item {
  position: relative;
  display: flex;
  float: left;
  width: calc(20% - 12px);
  height: 90px;
  margin: 6px;
  overflow: hidden;
  line-height: 17px;
  background: var(--anzhiyu-card-bg);
  border: var(--style-border-always);
  border-radius: 12px;
  box-shadow: var(--anzhiyu-shadow-border);
  transition: 0.3s ease-in-out;
  transform: translateZ(0);

  &:hover {
    background: var(--anzhiyu-lighttext);
    border: var(--style-border-hover);
    box-shadow: var(--anzhiyu-shadow-main);
    transform: scale(1.02);

    .link-tag {
      left: -70px;
    }

    .cf-friends-link {
      .flink-avatar {
        width: 0;
        min-width: 0;
        height: 0;
        min-height: 0;
        margin: 5px;
        opacity: 0;
        transition: 0.6s;
      }

      .flink-item-info {
        min-width: calc(100% - 20px);

        .flink-item-name {
          color: var(--anzhiyu-white);
        }

        .flink-item-desc {
          width: 100%;
          overflow: hidden;
          color: var(--anzhiyu-white);
        }
      }
    }
  }

  .link-tag {
    position: absolute;
    top: -1;
    left: 0;
    z-index: 1;
    padding: 4px 8px;
    overflow: hidden;
    font-size: 0.6rem;
    color: var(--anzhiyu-white);
    background-color: var(--anzhiyu-blue);
    border-radius: 12px 0;
    box-shadow: var(--anzhiyu-shadow-blue);
    transition: 0.3s;
  }

  .cf-friends-link {
    display: flex;
    align-items: center;
    width: 100%;
    height: 100%;
    padding: 0 4px;
    font-weight: 700;
    color: var(--anzhiyu-fontcolor);
    text-decoration: none;
    border-color: initial;
    border-style: none;
    border-width: initial;
    border-radius: 4px 4px 0 0;
    border-image: initial;

    .flink-avatar {
      float: left;
      width: 60px;
      min-width: 60px;
      height: 60px;
      min-height: 60px;
      margin: 15px 20px 15px 15px;
      object-fit: cover;
      background: var(--anzhiyu-background);
      border-radius: 32px;
      transition: 0.3s;
    }

    .flink-item-info {
      display: flex;
      flex-direction: column;
      justify-content: center;
      width: calc(100% - 90px);
      height: fit-content;

      .flink-item-name {
        display: block;
        max-width: calc(100% - 12px);
        padding: 0 10px 0 0;
        overflow: hidden;
        font-size: 19px;
        font-weight: 700;
        line-height: 20px;
        color: var(--anzhiyu-fontcolor);
        text-align: left;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .flink-item-desc {
        height: 40px;
        padding: 5px 10px 16px 0;
        overflow: hidden;
        font-size: 0.93rem;
        color: var(--anzhiyu-fontcolor);
        text-align: left;
        text-overflow: ellipsis;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        white-space: normal;
        opacity: 0.7;
        -webkit-box-orient: vertical;
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

// 移动端适配
@media screen and (max-width: 768px) {
  .flink-list {
    margin: 0.625rem -4px 1.25rem;
  }

  .flink-list-item {
    width: calc(50% - 8px);
    height: 80px;
    margin: 4px;

    .cf-friends-link {
      padding: 0 2px;

      .flink-avatar {
        width: 50px;
        min-width: 50px;
        height: 50px;
        min-height: 50px;
        margin: 15px 12px 15px 10px;
        margin-left: 30px;
      }

      .flink-item-info {
        width: calc(100% - 72px);
      }
    }

    &:hover {
      .cf-friends-link {
        .flink-item-info {
          min-width: calc(100% - 16px);
        }
      }
    }
  }
}

@media screen and (max-width: 480px) {
  .flink-list {
    margin: 0.625rem -2px 1.25rem;
  }

  .flink-list-item {
    width: calc(100% - 4px);
    margin: 2px;

    &:hover {
      .cf-friends-link {
        .flink-avatar {
          margin: 10px 8px 10px 6px;
        }

        .flink-item-info {
          min-width: calc(100% - 12px);
        }
      }
    }
  }

  .link-tag {
    padding: 3px 6px;
    font-size: 0.5rem;
  }
}
</style>
