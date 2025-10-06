<!--
 * @Description: 装备列表组件
 * @Author: 安知鱼
 * @Date: 2025-01-27
-->
<script setup lang="ts">
import IconifyIconOffline from "@/components/ReIcon/src/iconifyIconOffline";

defineOptions({
  name: "EquipmentList"
});

interface EquipmentItem {
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

interface EquipmentCategory {
  /** 分类标题 */
  title: string;
  /** 分类描述 */
  description: string;
  /** 装备列表 */
  equipment_list: EquipmentItem[];
}

interface Props {
  /** 装备数据 */
  data: EquipmentCategory[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  "comment-quote": [quoteText: string];
}>();

// 处理图片加载错误
const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  img.src = "/img/friend_404.gif";
};

// 复制装备名称
const copyEquipmentName = (name: string) => {
  navigator.clipboard.writeText(name).then(() => {
    console.log(`已复制装备名称: ${name}`);
  });
};

// 生成评论文本
const generateCommentText = (item: EquipmentItem) => {
  return `${item.name} ${item.specification} ${item.description}`;
};

// 处理评论按钮点击
const handleCommentClick = (item: EquipmentItem) => {
  const quoteText = item.description;
  emit("comment-quote", quoteText);

  // 滚动到评论区域
  const commentSection = document.querySelector(".link-comment-section");
  if (commentSection) {
    commentSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }
};
</script>

<template>
  <div class="equipment-list">
    <div v-for="category in data" :key="category.title" class="goodthings-item">
      <h2 class="goodthings-title">{{ category.title }}</h2>
      <div class="goodthings-item-description">{{ category.description }}</div>

      <div class="equipment-item">
        <div class="equipment-item-content">
          <div
            v-for="item in category.equipment_list"
            :key="item.name"
            class="equipment-item-content-item"
          >
            <div class="equipment-item-content-item-cover">
              <img
                class="equipment-item-content-item-image"
                :src="item.image"
                :alt="item.name"
                @error="handleImageError"
              />
            </div>

            <div class="equipment-item-content-item-info">
              <div
                class="equipment-item-content-item-name"
                :title="item.name"
                @click="copyEquipmentName(item.name)"
              >
                {{ item.name }}
              </div>

              <div class="equipment-item-content-item-specification">
                {{ item.specification }}
              </div>

              <div class="equipment-item-content-item-description">
                {{ item.description }}
              </div>

              <div class="equipment-item-content-item-toolbar">
                <a
                  v-if="item.link"
                  class="equipment-item-content-item-link"
                  :href="item.link"
                  target="_blank"
                  rel="external nofollow noreferrer"
                >
                  {{ item.linkText || "详情" }}
                </a>

                <div class="bber-reply" @click="handleCommentClick(item)">
                  <IconifyIconOffline icon="ri:chat-1-fill" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.equipment-list {
  // 我的装备
  .goodthings-title {
    margin: 1rem 0;
    line-height: 1;
  }

  .goodthings-item-description {
    margin-bottom: 1.5rem;
    color: var(--anzhiyu-secondtext);
  }

  .equipment-item {
    .equipment-item-content {
      display: flex;
      flex-flow: row wrap;
      margin: 0 -8px;

      .equipment-item-content-item {
        position: relative;
        width: calc(25% - 12px);
        min-height: 400px;
        margin: 8px 6px;
        overflow: hidden;
        background: var(--anzhiyu-card-bg);
        border: var(--style-border-always);
        border-radius: 12px;
        box-shadow: var(--anzhiyu-shadow-border);

        @media (width <= 1200px) {
          width: calc(50% - 12px);
        }

        @media (width <= 768px) {
          width: 100%;
        }

        .equipment-item-content-item-info {
          padding: 8px 16px 16px;
          margin-top: 12px;
        }

        .equipment-item-content-item-name {
          width: fit-content;
          margin-bottom: 8px;
          overflow: hidden;
          font-size: 18px;
          font-weight: bold;
          line-height: 1;
          text-overflow: ellipsis;
          white-space: nowrap;
          cursor: pointer;

          &:hover {
            color: var(--anzhiyu-main);
          }
        }

        .equipment-item-content-item-specification {
          margin-bottom: 5px;
          overflow: hidden;
          font-size: 12px;
          line-height: 16px;
          color: var(--anzhiyu-secondtext);
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .equipment-item-content-item-description {
          display: -webkit-box;
          height: 60px;
          overflow: hidden;
          font-size: 14px;
          line-height: 20px;
          color: var(--anzhiyu-secondtext);
          -webkit-line-clamp: 3;
          line-clamp: 3;
          -webkit-box-orient: vertical;
        }

        a.equipment-item-content-item-link {
          padding: 4px 8px;
          font-size: 12px;
          color: inherit;
          text-decoration: none;
          cursor: pointer;
          background: var(--anzhiyu-gray-op);
          border-radius: 8px;

          &:hover {
            color: var(--anzhiyu-white);
            background: var(--anzhiyu-main);
          }
        }

        .equipment-item-content-item-cover {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 200px;
          background: var(--anzhiyu-secondbg);
        }

        img.equipment-item-content-item-image {
          width: 260px;
          height: 80%;
          object-fit: contain;
        }

        .equipment-item-content-item-toolbar {
          position: absolute;
          bottom: 12px;
          left: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 0 16px;

          .bber-reply {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 4px 8px;
            cursor: pointer;
            background: var(--anzhiyu-gray-op);
            border-radius: 8px;
            transition: all 0.3s ease;

            &:hover {
              color: var(--anzhiyu-white);
              background: var(--anzhiyu-main);
            }

            i {
              font-size: 14px;
            }
          }
        }
      }
    }
  }
}
</style>
