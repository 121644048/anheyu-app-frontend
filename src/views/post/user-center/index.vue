<!--
 * @Description: 用户中心页面
 * @Author: 安知鱼
 * @Date: 2025-10-03 18:26:16
 * @LastEditTime: 2025-10-04 03:45:23
 * @LastEditors: 安知鱼
-->
<template>
  <div class="user-center-container">
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner" />
      <p>加载中...</p>
    </div>

    <div v-else-if="!isLoggedIn" class="not-logged-in">
      <div class="empty-state">
        <i class="anzhiyufont anzhiyu-icon-user" />
        <h2>请先登录</h2>
        <p>登录后即可访问用户中心</p>
        <el-button type="primary" size="large" @click="goToHome">
          返回首页
        </el-button>
      </div>
    </div>

    <div v-else class="user-center-content">
      <!-- 用户信息卡片 -->
      <div class="user-profile-card">
        <div class="profile-header">
          <div class="avatar-section">
            <div class="avatar-wrapper" @click="handleAvatarClick">
              <img :src="userAvatar" :alt="userStore.nickname" class="avatar" />
              <div class="avatar-overlay">
                <IconifyIconOffline icon="ri:camera-fill" />
              </div>
            </div>
          </div>
          <div class="user-info">
            <h1 class="user-nickname">
              {{ userStore.nickname || userStore.username }}
            </h1>
            <div class="user-meta">
              <span class="user-uid">
                <i class="anzhiyufont anzhiyu-icon-id-card" />
                UID: {{ userStore.id || userStore.username }}
              </span>
              <span class="user-join-time">
                <i class="anzhiyufont anzhiyu-icon-calendar" />
                加入于 {{ joinTimeText }}
              </span>
            </div>
            <p class="user-email">
              <i class="anzhiyufont anzhiyu-icon-envelope" />
              {{ userStore.email }}
            </p>
            <div class="user-badges">
              <span v-for="role in userStore.roles" :key="role" class="badge">
                {{ role === "1" ? "管理员" : "普通用户" }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 操作卡片 -->
      <div class="action-cards">
        <div class="action-card" @click="showEditDialog = true">
          <div class="action-icon">
            <IconifyIconOffline icon="ri:edit-fill" />
          </div>
          <div class="action-content">
            <h3>编辑资料</h3>
            <p>修改个人信息</p>
          </div>
          <i class="anzhiyufont anzhiyu-icon-chevron-right action-arrow" />
        </div>

        <div class="action-card" @click="showChangePasswordDialog = true">
          <div class="action-icon">
            <IconifyIconOffline icon="ri:lock-2-fill" />
          </div>
          <div class="action-content">
            <h3>修改密码</h3>
            <p>更改登录密码</p>
          </div>
          <i class="anzhiyufont anzhiyu-icon-chevron-right action-arrow" />
        </div>

        <div class="action-card danger" @click="handleLogout">
          <div class="action-icon">
            <IconifyIconOffline icon="ri:contract-right-line" />
          </div>
          <div class="action-content">
            <h3>退出登录</h3>
            <p>安全退出当前账号</p>
          </div>
          <i class="anzhiyufont anzhiyu-icon-chevron-right action-arrow" />
        </div>
      </div>
    </div>

    <!-- 编辑资料弹窗 -->
    <UserProfileDialog
      v-model="showEditDialog"
      :user-info="{
        nickname: userStore.nickname || userStore.username,
        email: userStore.email,
        website: ''
      }"
      @success="handleProfileUpdateSuccess"
    />

    <!-- 修改密码弹窗 -->
    <ChangePasswordDialog v-model="showChangePasswordDialog" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useUserStoreHook } from "@/store/modules/user";
import { ElMessageBox } from "element-plus";
import UserProfileDialog from "@/components/UserProfileDialog/index.vue";
import ChangePasswordDialog from "@/components/ChangePasswordDialog/index.vue";

defineOptions({
  name: "UserCenter"
});

const router = useRouter();
const userStore = useUserStoreHook();

const isLoading = ref(false);
const showEditDialog = ref(false);
const showChangePasswordDialog = ref(false);

// 检查用户是否已登录
const isLoggedIn = computed(() => {
  return !!userStore.username && userStore.roles.length > 0;
});

// 用户头像
const userAvatar = computed(() => {
  return (
    userStore.avatar ||
    `https://cravatar.cn/avatar/${userStore.email}?s=200&d=mp`
  );
});

// 计算相对时间
const getRelativeTime = (timestamp: string) => {
  if (!timestamp) return "未知";

  const now = new Date().getTime();
  const past = new Date(timestamp).getTime();
  const diff = now - past;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (years > 0) return `${years} 年前`;
  if (months > 0) return `${months} 个月前`;
  if (days > 0) return `${days} 天前`;
  if (hours > 0) return `${hours} 小时前`;
  if (minutes > 0) return `${minutes} 分钟前`;
  if (seconds > 0) return `${seconds} 秒前`;
  return "刚刚";
};

// 加入时间文本
const joinTimeText = computed(() => {
  // TODO: 从 userStore 获取用户创建时间
  // return getRelativeTime(userStore.createdAt);
  return "30 天前"; // 临时数据
});

// 返回首页
const goToHome = () => {
  router.push("/");
};

// 资料更新成功
const handleProfileUpdateSuccess = async () => {
  try {
    // 重新获取用户信息以更新页面显示
    await userStore.fetchUserInfo();
  } catch (error) {
    console.error("刷新用户信息失败:", error);
  }
};

// 点击头像，显示 Cravatar 说明
const handleAvatarClick = () => {
  ElMessageBox.alert(
    "本站使用 Cravatar 作为头像服务。您可以前往 Cravatar 官网使用相同的邮箱地址设置头像，设置后会自动在本站生效。",
    "如何修改头像",
    {
      confirmButtonText: "前往 Cravatar",
      callback: (action: string) => {
        if (action === "confirm") {
          window.open("https://cravatar.com", "_blank");
        }
      }
    }
  );
};

// 退出登录
const handleLogout = async () => {
  try {
    await ElMessageBox.confirm("确定要退出登录吗？", "退出确认", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    });

    userStore.logOut();
  } catch {
    // 用户取消
  }
};

onMounted(() => {
  if (!isLoggedIn.value) {
    setTimeout(() => {
      router.push("/");
    }, 1500);
  }
});
</script>

<style scoped lang="scss">
.user-center-container {
  min-height: calc(100vh - 200px);
  padding: 2rem 1rem;
  margin: 0 auto;
  max-width: 1200px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: 1rem;

  .loading-spinner {
    width: 50px;
    height: 50px;
    border: 4px solid var(--anzhiyu-card-border);
    border-top-color: var(--anzhiyu-main);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  p {
    color: var(--anzhiyu-secondtext);
    font-size: 0.95rem;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.not-logged-in {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;

  .empty-state {
    text-align: center;
    padding: 3rem;
    background: var(--anzhiyu-card-bg);
    border-radius: 20px;
    box-shadow: 0 8px 24px rgb(0 0 0 / 8%);

    i {
      font-size: 4rem;
      color: var(--anzhiyu-main);
      margin-bottom: 1.5rem;
    }

    h2 {
      margin-bottom: 0.5rem;
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--anzhiyu-fontcolor);
    }

    p {
      margin-bottom: 2rem;
      color: var(--anzhiyu-secondtext);
    }
  }
}

.user-center-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.user-profile-card {
  background: var(--anzhiyu-card-bg);
  border: var(--style-border-always);
  border-radius: 20px;
  padding: 2.5rem;
  transition: all 0.3s;
}

.profile-header {
  display: flex;
  align-items: flex-start;
  gap: 2rem;
}

.avatar-section {
  position: relative;

  .avatar-wrapper {
    position: relative;
    width: 120px;
    height: 120px;
    padding: 4px;
    background: var(--anzhiyu-background);
    border-radius: 50%;
    overflow: hidden;
    box-shadow: 0 8px 24px rgb(0 0 0 / 15%);
    transition: all 0.3s;
    cursor: pointer;

    &:hover {
      transform: scale(1.05);
      box-shadow: 0 12px 32px rgb(0 0 0 / 20%);

      .avatar-overlay {
        opacity: 1;
      }
    }

    .avatar {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: cover;
    }

    .avatar-overlay {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgb(0 0 0 / 50%);
      opacity: 0;
      transition: opacity 0.3s;
      cursor: pointer;

      i,
      :deep(svg) {
        font-size: 2rem;
        width: 2rem;
        height: 2rem;
        color: white;
      }
    }
  }
}

.user-info {
  flex: 1;

  .user-nickname {
    margin-bottom: 0.75rem;
    font-size: 2rem;
    font-weight: 700;
    color: var(--anzhiyu-fontcolor);
  }

  .user-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    margin-bottom: 0.75rem;
    font-size: 0.9rem;

    .user-uid,
    .user-join-time {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.35rem 0.75rem;
      color: var(--anzhiyu-secondtext);
      background: var(--anzhiyu-background);
      border-radius: 12px;
      transition: all 0.3s;

      i {
        font-size: 0.95rem;
      }

      &:hover {
        color: var(--anzhiyu-fontcolor);
        background: var(--anzhiyu-post-blockquote-bg);
      }
    }
  }

  .user-email {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
    font-size: 0.95rem;
    color: var(--anzhiyu-secondtext);

    i {
      font-size: 1rem;
    }
  }

  .user-badges {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;

    .badge {
      padding: 0.35rem 1rem;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--anzhiyu-white);
      background: linear-gradient(
        135deg,
        var(--anzhiyu-main),
        var(--anzhiyu-theme)
      );
      border-radius: 20px;
      box-shadow: 0 4px 12px rgb(0 0 0 / 10%);
    }
  }
}

.action-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.action-card {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 2rem;
  background: var(--anzhiyu-card-bg);
  border-radius: 16px;
  border: var(--style-border-always);
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background: var(--anzhiyu-main);
    color: var(--anzhiyu-white);
    .action-content p {
      color: var(--anzhiyu-white);
    }
    i {
      color: var(--anzhiyu-white);
    }
  }

  &.danger {
    &:hover {
      background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);

      .action-icon,
      .action-content h3,
      .action-content p,
      .action-arrow {
        color: white;
      }
    }
  }

  .action-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 60px;
    height: 60px;
    font-size: 1.75rem;
    color: var(--anzhiyu-fontcolor) !important;
    background: var(--anzhiyu-background);
    border-radius: 50%;
    transition: all 0.3s;

    :deep(svg) {
      width: 1.75rem;
      height: 1.75rem;
    }
  }

  .action-content {
    flex: 1;

    h3 {
      margin-bottom: 0.25rem;
      font-size: 1.1rem;
      font-weight: 600;
      transition: color 0.3s;
    }

    p {
      font-size: 0.9rem;
      color: var(--anzhiyu-secondtext);
      transition: color 0.3s;
    }
  }

  .action-arrow {
    font-size: 1.25rem;
    color: var(--anzhiyu-secondtext);
    transition: all 0.3s;
  }
}

.form-tip {
  display: block;
  margin-top: 0.5rem;
  font-size: 0.85rem;
  color: var(--anzhiyu-secondtext);
}

:deep(.user-edit-dialog) {
  .el-dialog__header {
    padding: 1.5rem;
    border-bottom: 1px solid var(--anzhiyu-card-border);
  }

  .el-dialog__body {
    padding: 2rem;
  }

  .el-dialog__footer {
    padding: 1rem 1.5rem;
    border-top: 1px solid var(--anzhiyu-card-border);
  }
}

// 移动端适配
@media (max-width: 768px) {
  .user-center-container {
    padding: 1rem;
  }

  .profile-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .avatar-section .avatar-wrapper {
    width: 100px;
    height: 100px;
  }

  .user-info .user-nickname {
    font-size: 1.5rem;
  }

  .action-cards {
    grid-template-columns: 1fr;
  }

  .user-profile-card {
    padding: 1.5rem;
  }
}
</style>
