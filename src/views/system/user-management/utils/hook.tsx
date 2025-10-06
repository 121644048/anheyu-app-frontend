/*
 * @Description: 用户管理 Hook
 * @Author: 安知鱼
 * @Date: 2025-10-03 00:00:00
 * @LastEditTime: 2025-10-04 03:15:13
 * @LastEditors: 安知鱼
 */

import dayjs from "dayjs";
import editForm from "../form.vue";
import { message } from "@/utils/message";
import {
  getAdminUsers,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
  batchDeleteAdminUsers,
  resetUserPassword,
  updateUserStatus,
  getUserGroups
} from "@/api/user-management";
import { addDialog } from "@/components/ReDialog";
import { reactive, ref, onMounted, h } from "vue";
import type { FormItemProps } from "./types";
import { deviceDetection } from "@pureadmin/utils";
import type { PaginationProps, LoadingConfig } from "@pureadmin/table";
import { ElTag, ElMessageBox } from "element-plus";
import type { AdminUser, UserGroupOption } from "@/api/user-management/type";

export function useUserManagement() {
  // 用户组列表
  const userGroups = ref<UserGroupOption[]>([]);

  const form = reactive({
    keyword: "",
    status: undefined,
    groupID: undefined,
    created_at: null
  });

  const dataList = ref<AdminUser[]>([]);
  const loading = ref(true);
  const selectedIds = ref<string[]>([]);

  // 用户状态标签渲染
  const statusTagType = (status: number) => {
    const statusMap = {
      1: "success", // 正常
      2: "warning", // 未激活
      3: "danger" // 已封禁
    };
    return statusMap[status] || "info";
  };

  const statusText = (status: number) => {
    const statusMap = {
      1: "正常",
      2: "未激活",
      3: "已封禁"
    };
    return statusMap[status] || "未知";
  };

  const columns: TableColumnList = [
    {
      type: "selection",
      width: 55,
      align: "left"
    },
    {
      label: "用户ID",
      prop: "id",
      minWidth: 100,
      showOverflowTooltip: true
    },
    {
      label: "用户名",
      prop: "username",
      minWidth: 120,
      showOverflowTooltip: true
    },
    {
      label: "昵称",
      prop: "nickname",
      minWidth: 120,
      showOverflowTooltip: true
    },
    {
      label: "邮箱",
      prop: "email",
      minWidth: 180,
      showOverflowTooltip: true
    },
    {
      label: "头像",
      prop: "avatar",
      minWidth: 80,
      cellRenderer: ({ row }) => {
        if (row.avatar) {
          return h("img", {
            src: row.avatar,
            alt: "头像",
            style: {
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              objectFit: "cover"
            }
          });
        }
        return h("span", "无头像");
      }
    },
    {
      label: "用户组",
      prop: "userGroup",
      minWidth: 120,
      cellRenderer: ({ row }) => {
        return h("span", row.userGroup?.name || "无");
      }
    },
    {
      label: "状态",
      prop: "status",
      minWidth: 100,
      cellRenderer: ({ row }) => {
        return h(
          ElTag,
          {
            type: statusTagType(row.status),
            effect: "plain"
          },
          () => statusText(row.status)
        );
      }
    },
    {
      label: "网站",
      prop: "website",
      minWidth: 150,
      hide: true,
      showOverflowTooltip: true
    },
    {
      label: "最后登录",
      prop: "lastLoginAt",
      minWidth: 180,
      formatter: ({ lastLoginAt }) => {
        return lastLoginAt
          ? dayjs(lastLoginAt).format("YYYY-MM-DD HH:mm:ss")
          : "从未登录";
      }
    },
    {
      label: "创建时间",
      minWidth: 180,
      prop: "created_at",
      formatter: ({ created_at }) =>
        dayjs(created_at).format("YYYY-MM-DD HH:mm:ss")
    },
    {
      label: "操作",
      fixed: "right",
      width: 280,
      slot: "operation",
      showOverflowTooltip: false
    }
  ];

  const pagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 10,
    currentPage: 1,
    background: true
  });

  const loadingConfig = reactive<LoadingConfig>({
    text: "正在加载...",
    viewBox: "-10, -10, 50, 50",
    spinner: `
      <path class="path" d="
        M 30 15
        L 28 17
        M 25.61 25.61
        A 15 15, 0, 0, 1, 15 30
        A 15 15, 0, 1, 1, 27.99 7.5
        L 15 15
      " style="stroke-width: 4px; fill: rgba(0, 0, 0, 0)"/>
    `
  });

  function resetForm(formEl) {
    if (!formEl) return;
    formEl.resetFields();
    form.keyword = "";
    form.status = undefined;
    form.groupID = undefined;
    form.created_at = null;
    onSearch();
  }

  // 加载用户组列表
  async function loadUserGroups() {
    try {
      const { data } = await getUserGroups();
      userGroups.value = data;
    } catch (error) {
      console.error("获取用户组列表失败:", error);
      message("获取用户组列表失败", { type: "error" });
    }
  }

  async function onSearch() {
    loading.value = true;
    const { currentPage, pageSize } = pagination;
    try {
      const { data } = await getAdminUsers({
        page: currentPage,
        pageSize: pageSize,
        keyword: form.keyword,
        status: form.status,
        groupID: form.groupID,
        startTime: form.created_at ? form.created_at[0] : undefined,
        endTime: form.created_at ? form.created_at[1] : undefined
      });
      dataList.value = data.users;
      pagination.total = data.total;
      setTimeout(() => {
        loading.value = false;
      }, 300);
    } catch (error) {
      console.error("获取用户列表失败:", error);
      loading.value = false;
    }
  }

  async function openDialog(title = "新增", row?: FormItemProps) {
    // 先加载用户组列表
    if (userGroups.value.length === 0) {
      await loadUserGroups();
    }

    // 查找"普通用户"组
    const normalUserGroup = userGroups.value.find(
      group => group.name === "普通用户"
    );

    addDialog({
      title: `${title}用户`,
      props: {
        formInline: {
          title,
          id: row?.id ?? "",
          username: row?.username ?? "",
          email: row?.email ?? "",
          nickname: row?.nickname ?? "",
          avatar: row?.avatar ?? "",
          website: row?.website ?? "",
          // 新增时使用"普通用户"组，编辑时保持原值
          userGroupID: row?.userGroupID ?? (normalUserGroup?.id || ""),
          status: row?.status ?? 1,
          password: ""
        }
      },
      width: "46%",
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: false,
      contentRenderer: () => h(editForm, { ref: formRef }),
      beforeSure: (done, { options }) => {
        const FormRef = formRef.value.getRef();
        const curData = options.props.formInline as FormItemProps;

        function chores() {
          done();
          onSearch();
        }

        FormRef.validate(async valid => {
          if (valid) {
            // 新增
            if (title === "新增") {
              try {
                await createAdminUser({
                  username: curData.username,
                  password: curData.password,
                  email: curData.email,
                  nickname: curData.nickname,
                  avatar: curData.avatar,
                  website: curData.website,
                  userGroupID: curData.userGroupID,
                  status: curData.status
                });
                message("创建成功", { type: "success" });
                chores();
              } catch (error) {
                message(`创建失败: ${error.message}`, { type: "error" });
              }
            }
            // 修改
            else {
              try {
                await updateAdminUser(curData.id, {
                  username: curData.username,
                  email: curData.email,
                  nickname: curData.nickname,
                  avatar: curData.avatar,
                  website: curData.website,
                  userGroupID: curData.userGroupID, // 提交原用户组，保持不变
                  status: curData.status
                });
                message("修改成功", { type: "success" });
                chores();
              } catch (error) {
                message(`修改失败: ${error.message}`, { type: "error" });
              }
            }
          }
        });
      }
    });
  }

  // 重置密码
  async function handleResetPassword(row: AdminUser) {
    ElMessageBox.prompt("请输入新密码", "重置密码", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      inputPattern: /^.{6,20}$/,
      inputErrorMessage: "密码长度应在 6 到 20 个字符",
      inputType: "password"
    })
      .then(async ({ value }) => {
        try {
          await resetUserPassword(row.id, { newPassword: value });
          message("密码重置成功", { type: "success" });
        } catch (error) {
          message(`密码重置失败: ${error.message}`, { type: "error" });
        }
      })
      .catch(() => {
        message("已取消", { type: "info" });
      });
  }

  // 切换用户状态
  async function handleToggleStatus(row: AdminUser) {
    const newStatus = row.status === 1 ? 3 : 1;
    const statusText = newStatus === 1 ? "启用" : "封禁";
    try {
      await updateUserStatus(row.id, { status: newStatus });
      message(`${statusText}成功`, { type: "success" });
      onSearch();
    } catch (error) {
      message(`${statusText}失败: ${error.message}`, { type: "error" });
    }
  }

  // 删除用户
  async function handleDelete(row: AdminUser) {
    try {
      await deleteAdminUser(row.id);
      message("删除成功", { type: "success" });
      onSearch();
    } catch (error) {
      message(`删除失败: ${error.message}`, { type: "error" });
    }
  }

  // 批量删除
  async function handleBatchDelete() {
    if (selectedIds.value.length === 0) {
      message("请至少选择一个用户", { type: "warning" });
      return;
    }

    ElMessageBox.confirm(
      `确定要删除选中的 ${selectedIds.value.length} 个用户吗？此操作不可逆。`,
      "警告",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }
    )
      .then(async () => {
        try {
          await batchDeleteAdminUsers(selectedIds.value);
          message("批量删除成功", { type: "success" });
          selectedIds.value = [];
          onSearch();
        } catch (error) {
          message(`批量删除失败: ${error.message}`, { type: "error" });
        }
      })
      .catch(() => {
        message("已取消", { type: "info" });
      });
  }

  function handleSelectionChange(val: AdminUser[]) {
    selectedIds.value = val.map(item => item.id);
  }

  function onSizeChange(val: number) {
    pagination.pageSize = val;
    onSearch();
  }

  function onCurrentChange(val: number) {
    pagination.currentPage = val;
    onSearch();
  }

  const formRef = ref();

  onMounted(() => {
    onSearch();
  });

  return {
    form,
    loading,
    columns,
    dataList,
    pagination,
    loadingConfig,
    selectedIds,
    onSizeChange,
    onCurrentChange,
    onSearch,
    resetForm,
    openDialog,
    handleDelete,
    handleBatchDelete,
    handleResetPassword,
    handleToggleStatus,
    handleSelectionChange
  };
}
