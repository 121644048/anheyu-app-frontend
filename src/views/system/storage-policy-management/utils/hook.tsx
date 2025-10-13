/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-06-23 13:41:03
 * @LastEditTime: 2025-10-13 11:43:04
 * @LastEditors: 安知鱼
 */
import { ref, onMounted, reactive } from "vue";
import { message } from "@/utils/message";
import {
  getPolicyList,
  deletePolicy,
  type StoragePolicy,
  type PolicyListParams
} from "@/api/sys-policy";
import type { Router } from "vue-router";

export function usePolicy(router: Router) {
  const dataList = ref<StoragePolicy[]>([]);
  const loading = ref(true);

  const pagination = reactive({
    total: 0,
    pageSize: 10,
    currentPage: 1,
    background: true
  });

  async function onSearch() {
    loading.value = true;
    try {
      const params: PolicyListParams = {
        page: pagination.currentPage,
        pageSize: pagination.pageSize
      };
      // 2. 调用 getPolicyList 时传入分页参数
      const { data } = await getPolicyList(params);
      // 3. 正确地赋值 list 和 total
      dataList.value = data.list;
      pagination.total = data.total;
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => {
        loading.value = false;
      }, 300);
    }
  }

  function onSizeChange(val: number) {
    pagination.pageSize = val;
    onSearch();
  }

  function onCurrentChange(val: number) {
    pagination.currentPage = val;
    onSearch();
  }

  // 处理编辑跳转
  function handleEdit(row: StoragePolicy) {
    router.push({ name: "StoragePolicyEdit", params: { id: row.id } });
  }

  async function handleDelete(row: StoragePolicy) {
    await deletePolicy(row.id);
    message(`您删除了存储策略 ${row.name}`, { type: "success" });
    onSearch();
  }

  onMounted(() => {
    onSearch();
  });

  return {
    loading,
    dataList,
    pagination,
    onSearch,
    handleEdit,
    handleDelete,
    onSizeChange,
    onCurrentChange
  };
}
