<script setup lang="ts">
defineOptions({
  name: "BackMenuListGroups"
});

const props = defineProps<{
  navConfig: {
    enable: boolean;
    menu: Array<{
      title: string;
      items: Array<{
        name: string;
        link: string;
        icon: string;
      }>;
    }>;
  };
}>();
</script>

<template>
  <div v-if="navConfig?.menu.length > 0" class="back-home-button">
    <IconifyIconOffline icon="ri:apps-fill" class="w-[1.375rem] h-[1.375rem]" />
    <div class="back-menu-list-groups">
      <div
        v-for="group in navConfig.menu"
        :key="group.title"
        class="back-menu-list-group"
      >
        <div class="back-menu-list-title">{{ group.title }}</div>
        <div class="back-menu-list">
          <a
            v-for="item in group.items"
            :key="item.name"
            class="back-menu-item"
            :href="item.link"
            :title="item.name"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              class="back-menu-item-icon"
              :src="item.icon"
              :alt="item.name"
            />
            <span class="back-menu-item-text">{{ item.name }}</span>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.back-home-button {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 35px;
  height: 35px;
  margin-right: 5px;
  cursor: pointer;
  border-radius: 50px;
  transition: 0.3s;

  &::after {
    position: absolute;
    top: 75%;
    left: 17px;
    width: 120%;
    height: 20px;
    pointer-events: none;
    content: "";
    transition: pointer-events 0s linear 1s;
  }

  > i {
    font-size: 1.2rem;
  }

  &:hover {
    color: var(--anzhiyu-white);
    background: var(--anzhiyu-main);
    box-shadow: var(--anzhiyu-shadow-main);

    &::after {
      pointer-events: auto;
      transition-delay: 0s;
    }

    .back-menu-list-groups {
      pointer-events: auto;
      opacity: 1;
      transform: scale(1);
    }
  }
}

.back-menu-list-groups {
  position: absolute;
  top: 55px;
  left: 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  padding: 0.5rem;
  pointer-events: none;
  background-color: var(--anzhiyu-maskbgdeep);
  backdrop-filter: blur(20px);
  border: var(--style-border);
  border-radius: 12px;
  box-shadow: var(--anzhiyu-shadow-border);
  opacity: 0;
  transition: 0.2s;
  transform: scale(0.8);
  transform-origin: top left;
}

.back-menu-list-group {
  display: flex;
  flex-direction: column;

  &:hover .back-menu-list-title {
    color: var(--anzhiyu-main);
  }
}

.back-menu-list-title {
  margin: 8px 0 4px 12px;
  font-size: 12px;
  color: var(--anzhiyu-secondtext);
  transition: 0.3s;
}

.back-menu-list {
  display: flex;
  flex-wrap: wrap;
  width: 340px;
  margin-bottom: 8px;

  &::before {
    position: absolute;
    top: -24px;
    left: 0;
    width: 100%;
    height: 25px;
    content: "";
    transition: 0s;
  }
}

.back-menu-item {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  width: 162px;
  padding: 4px 8px;
  margin: 4px;
  border-radius: 8px;
  transition: 0.2s;

  &:hover {
    background-color: var(--anzhiyu-main);

    .back-menu-item-text {
      color: var(--anzhiyu-white);
    }
  }
}

.back-menu-item-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
}

.back-menu-item-text {
  overflow: hidden;
  font-size: var(--global-font-size);
  color: var(--anzhiyu-fontcolor);
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: 0.2s;
}

@media (width <= 768px) {
  .back-home-button {
    display: none;
  }
}
</style>
