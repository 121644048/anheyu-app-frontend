import { ref, computed } from "vue";
import { defineStore } from "pinia";
import {
  getPublicComments,
  createPublicComment,
  likePublicComment,
  unlikePublicComment,
  getCommentChildren,
  getLatestPublicComments
} from "@/api/comment";
import type { Comment, CreateCommentPayload } from "@/api/comment/type";

const LIKED_COMMENTS_KEY = "liked_comment_ids";

export const useCommentStore = defineStore("comment", () => {
  const comments = ref<Comment[]>([]);
  const totalComments = ref(0);
  const currentPage = ref(1);
  const pageSize = ref(10);
  const currentTargetPath = ref<string | null>(null);
  const isLoading = ref(false);
  const isLoadingMore = ref(false);
  const likedCommentIds = ref<Set<string>>(new Set());
  const loadingChildrenCommentIds = ref<Set<string>>(new Set());

  const latestComments = ref<Comment[]>([]);
  const isLoadingLatest = ref(false);
  const globalCommentCount = ref(0);

  const totalLocalComments = computed(() => {
    let count = 0;
    const countComments = (commentList: Comment[]) => {
      for (const comment of commentList) {
        count++;
        if (comment.children && comment.children.length > 0) {
          countComments(comment.children);
        }
      }
    };
    countComments(comments.value);
    return count;
  });

  const hasMore = computed(
    () => totalLocalComments.value < totalComments.value
  );

  function loadLikedIdsFromStorage() {
    try {
      const liked = JSON.parse(
        localStorage.getItem(LIKED_COMMENTS_KEY) || "[]"
      );
      likedCommentIds.value = new Set(liked);
    } catch (e) {
      console.error("Failed to parse liked comments from localStorage", e);
      likedCommentIds.value = new Set();
    }
  }

  function findAndUpdateComment(
    commentList: Comment[],
    commentId: string,
    updateFn: (comment: Comment) => void
  ): boolean {
    for (const comment of commentList) {
      if (comment.id === commentId) {
        updateFn(comment);
        return true;
      }
      if (comment.children && comment.children.length > 0) {
        if (findAndUpdateComment(comment.children, commentId, updateFn)) {
          return true;
        }
      }
    }
    return false;
  }

  async function initComments(targetPath: string, pSize = 10) {
    loadLikedIdsFromStorage();
    if (currentTargetPath.value === targetPath && comments.value.length > 0)
      return;
    resetStore(true);
    currentTargetPath.value = targetPath;
    pageSize.value = pSize;
    await fetchComments(1);
  }

  async function fetchComments(page = 1) {
    if (!currentTargetPath.value) return;
    if (page === 1) {
      isLoading.value = true;
    } else {
      isLoadingMore.value = true;
    }

    try {
      const res = await getPublicComments({
        target_path: currentTargetPath.value,
        page: page,
        pageSize: pageSize.value
      });
      const data = res.data;
      if (data && data.list) {
        if (page === 1) {
          comments.value = data.list;
        } else {
          comments.value.push(...data.list);
        }
        totalComments.value = data.total;
        currentPage.value = data.page;
      }
    } catch (error) {
      console.error("获取评论失败:", error);
    } finally {
      isLoading.value = false;
      isLoadingMore.value = false;
    }
  }

  async function loadMore() {
    if (hasMore.value && !isLoadingMore.value) {
      await fetchComments(currentPage.value + 1);
    }
  }

  async function postComment(payload: CreateCommentPayload) {
    try {
      const res = await createPublicComment(payload);
      const newCommentData = res.data;

      if (!newCommentData || !newCommentData.id) {
        throw new Error("API did not return a valid comment object.");
      }

      const newComment: Comment = {
        ...newCommentData,
        website: payload.website || null,
        children: []
      };

      if (newComment.parent_id) {
        let topLevelParent: Comment | null = null;
        topLevelParent =
          comments.value.find(c => c.id === newComment.parent_id) || null;

        if (!topLevelParent) {
          for (const potentialTopLevelParent of comments.value) {
            if (
              potentialTopLevelParent.children?.find(
                child => child.id === newComment.parent_id
              )
            ) {
              topLevelParent = potentialTopLevelParent;
              break;
            }
          }
        }

        if (topLevelParent) {
          if (!topLevelParent.children) {
            topLevelParent.children = [];
          }
          topLevelParent.children.push(newComment);
        } else {
          console.warn(
            "Parent comment's thread not found, falling back to a refresh."
          );
          await fetchComments(1);
        }
      } else {
        comments.value.unshift(newComment);
        totalComments.value++;
      }
    } catch (error) {
      console.error("评论发布失败:", error);
      throw error;
    }
  }

  async function loadMoreChildren(
    parentCommentId: string,
    page = 1,
    pageSize = 10,
    skipFirst = 0
  ) {
    if (loadingChildrenCommentIds.value.has(parentCommentId)) {
      return;
    }
    loadingChildrenCommentIds.value.add(parentCommentId);
    try {
      const res = await getCommentChildren(parentCommentId, { page, pageSize });
      const data = res.data;

      if (data && data.list) {
        const newChildren =
          skipFirst > 0 ? data.list.slice(skipFirst) : data.list;

        findAndUpdateComment(comments.value, parentCommentId, parentComment => {
          if (!parentComment.children) {
            parentComment.children = [];
          }
          parentComment.children.push(...newChildren);
        });
      }
    } catch (error) {
      console.error("加载子评论失败:", error);
    } finally {
      loadingChildrenCommentIds.value.delete(parentCommentId);
    }
  }

  async function toggleLikeComment(commentId: string) {
    const isCurrentlyLiked = likedCommentIds.value.has(commentId);
    try {
      const apiCall = isCurrentlyLiked
        ? unlikePublicComment(commentId)
        : likePublicComment(commentId);
      const res = await apiCall;
      const newLikeCount = res.data;
      findAndUpdateComment(comments.value, commentId, comment => {
        comment.like_count = newLikeCount;
      });
      if (isCurrentlyLiked) {
        likedCommentIds.value.delete(commentId);
      } else {
        likedCommentIds.value.add(commentId);
      }
      localStorage.setItem(
        LIKED_COMMENTS_KEY,
        JSON.stringify(Array.from(likedCommentIds.value))
      );
    } catch (error) {
      console.error("操作失败:", error);
    }
  }

  function resetStore(soft = false) {
    comments.value = [];
    totalComments.value = 0;
    currentPage.value = 1;
    currentTargetPath.value = null;
    isLoading.value = false;
    isLoadingMore.value = false;
    loadingChildrenCommentIds.value.clear();
    if (!soft) {
      likedCommentIds.value.clear();
    }
  }

  async function fetchLatestComments(limit = 6) {
    if (isLoadingLatest.value) return;
    isLoadingLatest.value = true;
    try {
      const res = await getLatestPublicComments({ page: 1, pageSize: limit });
      if (res.data && res.data.list) {
        latestComments.value = res.data.list;
        // 同时获取全站评论总数
        if (res.data.total) {
          globalCommentCount.value = res.data.total;
        }
      }
    } catch (error) {
      console.error("获取最新评论失败:", error);
      latestComments.value = [];
    } finally {
      isLoadingLatest.value = false;
    }
  }

  // 确保获取全站评论总数的方法（避免重复请求）
  async function ensureGlobalCommentCount() {
    // 如果已经有评论总数，且不为0，就不重复请求
    if (globalCommentCount.value > 0) {
      return;
    }

    try {
      const res = await getLatestPublicComments({ page: 1, pageSize: 1 });
      if (res.data && res.data.total) {
        globalCommentCount.value = res.data.total;
      }
    } catch (error) {
      console.error("获取全站评论总数失败:", error);
    }
  }

  // 专门获取全站评论总数的方法（强制请求）
  async function fetchGlobalCommentCount() {
    try {
      const res = await getLatestPublicComments({ page: 1, pageSize: 1 });
      if (res.data && res.data.total) {
        globalCommentCount.value = res.data.total;
      }
    } catch (error) {
      console.error("获取全站评论总数失败:", error);
    }
  }

  return {
    comments,
    totalComments,
    currentPage,
    pageSize,
    isLoading,
    isLoadingMore,
    currentTargetPath,
    likedCommentIds,
    loadingChildrenCommentIds,
    hasMore,
    initComments,
    loadMore,
    loadMoreChildren,
    postComment,
    toggleLikeComment,
    resetStore,
    latestComments,
    isLoadingLatest,
    fetchLatestComments,
    globalCommentCount,
    fetchGlobalCommentCount,
    ensureGlobalCommentCount
  };
});
