import dayjs from "dayjs";
import editForm from "../form.vue";
import batchImportForm from "../batch-import-form.vue";
import { message } from "@/utils/message";
import {
  getWallpapertList,
  addWallpapert,
  updateWallpaper,
  deleteWallpaper,
  batchImportAlbums
} from "@/api/album-home";
import {
  getAlbumCategoryList,
  type AlbumCategoryDTO
} from "@/api/album-category";
import { addDialog } from "@/components/ReDialog";
import { reactive, ref, onMounted, h } from "vue";
import type { FormItemProps } from "./types";
import { deviceDetection } from "@pureadmin/utils";
import type { PaginationProps, LoadingConfig } from "@pureadmin/table";
import { ElIcon, ElScrollbar } from "element-plus";
import {
  SuccessFilled,
  WarningFilled,
  InfoFilled
} from "@element-plus/icons-vue";

export function useAlbum() {
  const form = reactive({
    categoryId: null,
    created_at: null,
    sort: "display_order_asc"
  });

  const categories = ref<AlbumCategoryDTO[]>([]);

  const formRef = ref();
  const dataList = ref([]);
  const loading = ref(true);

  const columns: TableColumnList = [
    {
      label: "id",
      prop: "id",
      minWidth: 70
    },
    {
      label: "分类",
      prop: "categoryId",
      minWidth: 100,
      cellRenderer: ({ row }) => {
        if (!row.categoryId) return "未分类";
        const category = categories.value.find(c => c.id === row.categoryId);
        return category?.name || "未知分类";
      }
    },
    {
      label: "图片URL",
      prop: "imageUrl",
      minWidth: 120,
      cellRenderer: ({ row }) => {
        const thumbnailUrl =
          row.imageUrl + "?" + (row.thumbParam ? row.thumbParam : "");
        return h("img", {
          src: thumbnailUrl,
          alt: "缩略图",
          style: {
            width: "100px",
            height: "auto",
            objectFit: "contain"
          }
        });
      }
    },
    {
      label: "大图",
      prop: "bigImageUrl",
      minWidth: 70,
      hide: true
    },
    {
      label: "下载地址",
      prop: "downloadUrl",
      minWidth: 120,
      hide: true
    },
    {
      label: "大图参数",
      prop: "bigParam",
      minWidth: 120
    },
    {
      label: "缩略参数",
      prop: "thumbParam",
      minWidth: 120
    },
    {
      label: "标签",
      prop: "tags",
      minWidth: 120
    },
    {
      label: "查看次数",
      prop: "viewCount",
      minWidth: 70,
      hide: true
    },
    {
      label: "图片大小",
      prop: "fileSize",
      minWidth: 70,
      formatter: (row: any) => {
        const size = row.fileSize;
        if (size >= 1024 * 1024) {
          return (size / 1024 / 1024).toFixed(2) + " MB";
        } else if (size >= 1024) {
          return (size / 1024).toFixed(2) + " KB";
        } else {
          return size + " B";
        }
      },
      hide: true
    },
    {
      label: "长宽比",
      prop: "aspectRatio",
      minWidth: 70,
      hide: true
    },
    {
      label: "下载次数",
      prop: "downloadCount",
      minWidth: 70,
      hide: true
    },
    {
      label: "宽*高",
      prop: "widthAndHeight",
      minWidth: 90,
      hide: true
    },
    {
      label: "排序",
      prop: "displayOrder",
      minWidth: 70
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
      // fixed: "right",
      width: 210,
      slot: "operation"
    }
  ];
  function resetForm(formEl) {
    if (!formEl) return;
    formEl.resetFields();
    form.categoryId = null;
    form.created_at = null;
    form.sort = "display_order_asc";
    onSearch();
  }

  async function loadCategories() {
    try {
      const { data } = await getAlbumCategoryList();
      if (data) {
        categories.value = data;
      }
    } catch (error) {
      console.error("加载分类列表失败:", error);
    }
  }

  async function onSearch() {
    loading.value = true;
    const { currentPage, pageSize } = pagination;
    const { data } = await getWallpapertList({
      page: currentPage,
      pageSize: pageSize,
      categoryId: form.categoryId,
      created_at: form.created_at,
      sort: form.sort
    });
    dataList.value = data.list;
    pagination.total = data.total;
    pagination.currentPage = data.pageNum;
    pagination.pageSize = data.pageSize;
    setTimeout(() => {
      loading.value = false;
    }, 300);
  }

  /**
   * 策略性地获取图片Blob数据（单张图片添加时使用）
   * 优先尝试直接fetch，失败后回退到后端代理
   * @param url 图片的原始URL
   * @returns Promise<Blob>
   */
  async function fetchImageBlobWithStrategies(url: string): Promise<Blob> {
    const proxyUrl = `/api/proxy/download?url=${encodeURIComponent(url)}`;

    try {
      // 策略1: 尝试直接 fetch
      console.log("尝试直接获取图片元数据:", url);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`直接获取失败，状态码: ${response.status}`);
      }
      return await response.blob();
    } catch (error) {
      console.warn("直接获取失败，回退到后端代理:", error);
      // 策略2: 尝试使用后端代理
      try {
        const proxyResponse = await fetch(proxyUrl);
        if (!proxyResponse.ok) {
          throw new Error(`代理获取失败，状态码: ${proxyResponse.status}`);
        }
        return await proxyResponse.blob();
      } catch (proxyError) {
        console.error("所有获取图片的方案均失败:", proxyError);
        // 抛出最终错误，让调用者处理
        throw proxyError;
      }
    }
  }

  /**
   * 从Blob数据中获取图片尺寸
   * @param blob 图片的Blob对象
   * @returns Promise<{ width: number; height: number }>
   */
  function getImageDimensionsFromBlob(
    blob: Blob
  ): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const objectUrl = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
        URL.revokeObjectURL(objectUrl); // 及时释放内存
      };
      img.onerror = err => {
        reject(err);
        URL.revokeObjectURL(objectUrl); // 出错也要释放
      };
      img.src = objectUrl;
    });
  }

  /**
   * 计算文件的SHA-256哈希值
   * @param blob 文件的Blob对象
   * @returns Promise<string>
   */
  async function getFileHash(blob: Blob): Promise<string> {
    try {
      const buffer = await blob.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
    } catch (error) {
      console.error("计算文件哈希值失败:", error);
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 15);
      return `fallback_${timestamp}_${randomStr}`; // 返回备用哈希
    }
  }

  // 默认的元数据返回值
  function getDefaultMetadata() {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    return {
      width: 0,
      height: 0,
      fileSize: 0,
      format: "unknown",
      fileHash: `fallback_${timestamp}_${randomStr}`
    };
  }

  /**
   * 获取图片元数据的主函数（单张图片添加时使用）
   * @param url 图片URL
   */
  async function getImageMeta(url: string) {
    if (!url) {
      message("图片 URL 不能为空", { type: "error" });
      return getDefaultMetadata();
    }

    try {
      // 1. 使用策略函数获取Blob
      const blob = await fetchImageBlobWithStrategies(url);

      // 2. 从Blob并行计算尺寸和哈希
      const [dimensions, fileHash] = await Promise.all([
        getImageDimensionsFromBlob(blob),
        getFileHash(blob)
      ]);

      // 3. 组装元数据
      const fileSize = blob.size;
      const format = url.split(".").pop()?.toLowerCase() ?? "unknown";

      return {
        width: dimensions.width,
        height: dimensions.height,
        fileSize,
        format,
        fileHash
      };
    } catch (error) {
      console.error("获取图片元数据失败:", error);
      message("无法获取图片元数据，请检查URL或网络连接", { type: "error" });
      return getDefaultMetadata(); // 发生任何错误都返回默认值
    }
  }

  function openDialog(title = "新增", row?: FormItemProps) {
    addDialog({
      title: `${title}图片`,
      props: {
        formInline: {
          id: row?.id ?? 0,
          title: title,
          categoryId: row?.categoryId ?? null,
          imageUrl: row?.imageUrl ?? "",
          bigImageUrl: row?.bigImageUrl ?? "",
          downloadUrl: row?.downloadUrl ?? "",
          thumbParam: row?.thumbParam ?? "",
          bigParam: row?.bigParam ?? "",
          tags: (() => {
            const tags: any = row?.tags;
            if (tags === undefined || tags === null) return [];
            if (Array.isArray(tags)) return tags;
            if (typeof tags === "string")
              return tags
                .split(",")
                .map(item => item.trim())
                .filter(Boolean);
            return [];
          })(),
          viewCount: row?.viewCount ?? 1,
          downloadCount: row?.downloadCount ?? 0,
          aspectRatio: row?.aspectRatio ?? "",
          widthAndHeight: row?.widthAndHeight ?? "",
          fileSize: row?.fileSize ?? 0,
          displayOrder: row?.displayOrder ?? 0
        },
        categories: categories.value
      },
      top: "10vh",
      width: "80vw",
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: false,
      sureBtnLoading: true,
      contentRenderer: () =>
        h(editForm, {
          ref: formRef,
          formInline: null,
          categories: categories.value
        }),
      beforeSure: (done, { options, closeLoading }) => {
        const FormRef = formRef.value.getRef();
        const curData = options.props.formInline as FormItemProps;
        function chores() {
          message(`您${title}了一张图片`, {
            type: "success"
          });
          done(); // 关闭弹框
          onSearch(); // 刷新表格数据
        }

        FormRef.validate(async valid => {
          if (valid) {
            // 表单规则校验通过
            if (title === "新增") {
              // 🧠 调用重构后的函数获取图片元数据
              const imageInfo = await getImageMeta(curData.imageUrl);
              addWallpapert({
                ...curData,
                ...imageInfo
              }).then(res => {
                if (res.code === 200) {
                  chores();
                } else {
                  message(res.message, { type: "error" });
                  closeLoading();
                }
              });
            } else {
              updateWallpaper(curData).then(res => {
                if (res.code === 200) {
                  chores();
                } else {
                  message(res.message, { type: "error" });
                }
              });
            }
          } else {
            // 如果校验失败，确保关闭加载状态
            closeLoading();
          }
        });
      }
    });
  }

  function handleDelete(row) {
    deleteWallpaper(row).then(res => {
      if (res.code === 200) {
        message(`您删除了图片id为${row.id}的这条数据`, {
          type: "success"
        });
        onSearch();
      } else {
        message(res.message, { type: "error" });
      }
    });
  }

  /**
   * 显示导入结果弹窗
   */
  function showImportResultDialog(result: {
    successCount: number;
    failCount: number;
    skipCount: number;
    invalidCount: number;
    total: number;
    duration: string;
    errors?: Array<{ url: string; reason: string }>;
    duplicates?: string[];
    invalidUrls?: string[];
  }) {
    const {
      successCount,
      failCount,
      skipCount,
      invalidCount,
      total,
      duration,
      errors,
      duplicates
      // invalidUrls 暂未在此函数中直接使用，但保留以供future扩展
    } = result;

    // 判断整体状态
    const hasError = failCount > 0 || invalidCount > 0;
    const allSuccess = successCount === total && failCount === 0;

    const resultContent = h(
      "div",
      {
        style: {
          padding: "20px 10px",
          maxHeight: "73vh",
          overflowY: "auto"
        }
      },
      [
        // 状态图标和标题
        h(
          "div",
          {
            style: {
              textAlign: "center",
              marginBottom: "24px"
            }
          },
          [
            h(
              ElIcon,
              {
                size: 64,
                color: allSuccess
                  ? "#67C23A"
                  : hasError
                    ? "#E6A23C"
                    : "#409EFF",
                style: { marginBottom: "12px" }
              },
              () =>
                h(
                  allSuccess
                    ? SuccessFilled
                    : hasError
                      ? WarningFilled
                      : InfoFilled
                )
            ),
            h(
              "div",
              {
                style: {
                  fontSize: "18px",
                  fontWeight: "600",
                  color: "#303133"
                }
              },
              allSuccess
                ? "导入成功！"
                : hasError
                  ? "导入完成（部分失败）"
                  : "导入完成"
            ),
            h(
              "div",
              {
                style: {
                  fontSize: "13px",
                  color: "#909399",
                  marginTop: "8px"
                }
              },
              `耗时 ${duration} 秒`
            )
          ]
        ),

        // 统计信息
        h(
          "div",
          {
            style: {
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "12px",
              marginBottom: "20px"
            }
          },
          [
            // 成功
            h(
              "div",
              {
                style: {
                  padding: "16px",
                  background: "#f0f9ff",
                  borderRadius: "8px",
                  border: "1px solid #409EFF20"
                }
              },
              [
                h(
                  "div",
                  {
                    style: {
                      fontSize: "13px",
                      color: "#909399",
                      marginBottom: "4px"
                    }
                  },
                  "成功导入"
                ),
                h(
                  "div",
                  {
                    style: {
                      fontSize: "24px",
                      fontWeight: "600",
                      color: "#67C23A"
                    }
                  },
                  successCount
                )
              ]
            ),
            // 失败
            h(
              "div",
              {
                style: {
                  padding: "16px",
                  background: failCount > 0 ? "#fef0f0" : "#f5f5f5",
                  borderRadius: "8px",
                  border:
                    failCount > 0 ? "1px solid #F5672220" : "1px solid #DCDFE6"
                }
              },
              [
                h(
                  "div",
                  {
                    style: {
                      fontSize: "13px",
                      color: "#909399",
                      marginBottom: "4px"
                    }
                  },
                  "导入失败"
                ),
                h(
                  "div",
                  {
                    style: {
                      fontSize: "24px",
                      fontWeight: "600",
                      color: failCount > 0 ? "#F56C6C" : "#909399"
                    }
                  },
                  failCount
                )
              ]
            ),
            // 跳过
            h(
              "div",
              {
                style: {
                  padding: "16px",
                  background: skipCount > 0 ? "#fdf6ec" : "#f5f5f5",
                  borderRadius: "8px",
                  border:
                    skipCount > 0 ? "1px solid #E6A23C20" : "1px solid #DCDFE6"
                }
              },
              [
                h(
                  "div",
                  {
                    style: {
                      fontSize: "13px",
                      color: "#909399",
                      marginBottom: "4px"
                    }
                  },
                  "跳过重复"
                ),
                h(
                  "div",
                  {
                    style: {
                      fontSize: "24px",
                      fontWeight: "600",
                      color: skipCount > 0 ? "#E6A23C" : "#909399"
                    }
                  },
                  skipCount
                )
              ]
            ),
            // 无效URL
            h(
              "div",
              {
                style: {
                  padding: "16px",
                  background: invalidCount > 0 ? "#f4f4f5" : "#f5f5f5",
                  borderRadius: "8px",
                  border: "1px solid #DCDFE6"
                }
              },
              [
                h(
                  "div",
                  {
                    style: {
                      fontSize: "13px",
                      color: "#909399",
                      marginBottom: "4px"
                    }
                  },
                  "无效URL"
                ),
                h(
                  "div",
                  {
                    style: {
                      fontSize: "24px",
                      fontWeight: "600",
                      color: invalidCount > 0 ? "#909399" : "#C0C4CC"
                    }
                  },
                  invalidCount
                )
              ]
            )
          ]
        ),

        // 错误详情（如果有）
        (errors && errors.length > 0) || (duplicates && duplicates.length > 0)
          ? h(
              "div",
              {
                style: {
                  marginTop: "20px",
                  padding: "16px",
                  background: "#fafafa",
                  borderRadius: "8px"
                }
              },
              [
                h(
                  "div",
                  {
                    style: {
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "#606266",
                      marginBottom: "12px"
                    }
                  },
                  "📋 详细信息"
                ),
                h(ElScrollbar, { maxHeight: "250px" }, () =>
                  h(
                    "div",
                    {
                      style: {
                        fontSize: "13px",
                        lineHeight: "1.8"
                      }
                    },
                    [
                      errors && errors.length > 0
                        ? h("div", { style: { marginBottom: "12px" } }, [
                            h(
                              "div",
                              {
                                style: {
                                  fontWeight: "500",
                                  color: "#F56C6C",
                                  marginBottom: "8px"
                                }
                              },
                              `❌ 失败 ${errors.length} 个：`
                            ),
                            ...errors.map((err, idx) =>
                              h(
                                "div",
                                {
                                  style: {
                                    padding: "8px",
                                    background: "#fff",
                                    borderRadius: "4px",
                                    marginBottom: "6px",
                                    fontSize: "12px"
                                  }
                                },
                                [
                                  h(
                                    "div",
                                    {
                                      style: {
                                        color: "#303133",
                                        marginBottom: "4px"
                                      }
                                    },
                                    `${idx + 1}. ${err.url}`
                                  ),
                                  h(
                                    "div",
                                    {
                                      style: {
                                        color: "#F56C6C",
                                        paddingLeft: "16px"
                                      }
                                    },
                                    `原因: ${err.reason}`
                                  )
                                ]
                              )
                            )
                          ])
                        : null,
                      duplicates &&
                      duplicates.length > 0 &&
                      duplicates.length <= 10
                        ? h("div", [
                            h(
                              "div",
                              {
                                style: {
                                  fontWeight: "500",
                                  color: "#E6A23C",
                                  marginBottom: "8px"
                                }
                              },
                              `⚠️ 重复 ${duplicates.length} 个：`
                            ),
                            ...duplicates.map((url, idx) =>
                              h(
                                "div",
                                {
                                  style: {
                                    padding: "6px 8px",
                                    background: "#fff",
                                    borderRadius: "4px",
                                    marginBottom: "4px",
                                    fontSize: "12px",
                                    color: "#606266"
                                  }
                                },
                                `${idx + 1}. ${url}`
                              )
                            )
                          ])
                        : duplicates && duplicates.length > 10
                          ? h(
                              "div",
                              {
                                style: {
                                  color: "#E6A23C",
                                  fontSize: "12px"
                                }
                              },
                              `⚠️ ${duplicates.length} 个重复图片（太多，请查看控制台）`
                            )
                          : null
                    ].filter(Boolean)
                  )
                )
              ]
            )
          : null
      ].filter(Boolean)
    );

    addDialog({
      title: "批量导入结果",
      width: "600px",
      top: "10vh",
      draggable: true,
      closeOnClickModal: true,
      contentRenderer: () => resultContent,
      props: {
        class: "batch-import-result-dialog"
      }
    });
  }

  /**
   * 批量导入图片
   */
  function openBatchImportDialog() {
    const batchFormRef = ref();

    addDialog({
      title: "批量导入图片",
      props: {
        formInline: {
          categoryId: null,
          urls: "",
          thumbParam: "",
          bigParam: "",
          tags: [],
          displayOrder: 0
        },
        categories: categories.value
      },
      top: "10vh",
      width: "80vw",
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: false,
      sureBtnLoading: true,
      contentRenderer: () =>
        h(batchImportForm, {
          ref: batchFormRef,
          formInline: null,
          categories: categories.value
        }),
      beforeSure: async (done, { options, closeLoading }) => {
        const FormRef = batchFormRef.value.getRef();
        const curData = options.props.formInline;

        FormRef.validate(async valid => {
          if (valid) {
            // 解析URL列表并验证
            const urls = curData.urls
              .split("\n")
              .map(line => line.trim())
              .filter(Boolean);

            if (urls.length === 0) {
              message("请输入至少一个图片链接", { type: "error" });
              closeLoading();
              return;
            }

            if (urls.length > 100) {
              message("单次最多导入100张图片", { type: "error" });
              closeLoading();
              return;
            }

            // 验证URL格式（记录无效URL数量供统计使用）
            const invalidUrls: string[] = [];
            const validUrls = urls.filter(url => {
              try {
                new URL(url);
                // 检查是否为图片URL（简单的后缀检查）
                const isImageUrl =
                  /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?$/i.test(url) ||
                  url.includes("upload") ||
                  url.includes("image");
                if (!isImageUrl) {
                  console.warn(`可能不是图片URL: ${url}`);
                }
                return true;
              } catch {
                invalidUrls.push(url);
                return false;
              }
            });

            if (invalidUrls.length > 0) {
              console.warn("无效的URL格式：", invalidUrls);
              message(
                `发现 ${invalidUrls.length} 个无效的URL格式，已自动跳过。有效URL: ${validUrls.length} 个`,
                { type: "warning" }
              );
              if (validUrls.length === 0) {
                closeLoading();
                return;
              }
            }

            // 显示加载提示
            const loadingMsg = message(
              `正在批量导入 ${validUrls.length} 张图片，请稍候...`,
              {
                type: "info",
                duration: 0 // 不自动关闭
              }
            );

            try {
              // 调用后端批量导入接口
              const startTime = Date.now();
              const res = await batchImportAlbums({
                categoryId: curData.categoryId,
                urls: validUrls,
                thumbParam: curData.thumbParam,
                bigParam: curData.bigParam,
                tags: curData.tags,
                displayOrder: curData.displayOrder
              });
              const duration = ((Date.now() - startTime) / 1000).toFixed(1);

              // 关闭加载提示
              loadingMsg.close();
              closeLoading();

              if (res.code === 200 && res.data) {
                const {
                  successCount,
                  failCount,
                  skipCount,
                  errors,
                  duplicates
                } = res.data;

                // 输出详细日志
                if (errors && errors.length > 0) {
                  console.group("📋 批量导入详细错误信息");
                  errors.forEach(({ url, reason }, index) => {
                    console.error(`${index + 1}. ${url}\n   原因: ${reason}`);
                  });
                  console.groupEnd();
                }

                if (duplicates && duplicates.length > 0) {
                  console.warn("跳过的重复图片：", duplicates);
                }

                // 显示详细结果弹窗
                showImportResultDialog({
                  successCount,
                  failCount,
                  skipCount,
                  invalidCount: invalidUrls.length,
                  total: validUrls.length + invalidUrls.length,
                  duration,
                  errors,
                  duplicates,
                  invalidUrls
                });

                done(); // 关闭导入表单弹框
                onSearch(); // 刷新表格数据
              } else {
                message(`批量导入失败: ${res.message || "未知错误"}`, {
                  type: "error"
                });
              }
            } catch (error) {
              // 关闭加载提示
              loadingMsg.close();
              closeLoading();
              console.error("批量导入请求失败:", error);
              message(`批量导入请求失败: ${error.message || "未知错误"}`, {
                type: "error",
                duration: 5000
              });
            }
          } else {
            closeLoading();
          }
        });
      }
    });
  }

  /** 分页配置 */
  const pagination = reactive<PaginationProps>({
    pageSize: 10,
    currentPage: 1,
    pageSizes: [10, 12, 24, 50, 100],
    total: 0,
    align: "right",
    background: true,
    size: "default",
    style: {
      paddingRight: "20px"
    }
  });

  /** 加载动画配置 */
  const loadingConfig = reactive<LoadingConfig>({
    text: "正在加载第一页...",
    viewBox: "-10 -10 50 50"
  });

  function onSizeChange(val) {
    pagination.pageSize = val;
    pagination.currentPage = 1;
    onSearch();
  }

  function onCurrentChange(val) {
    pagination.currentPage = val;
    loadingConfig.text = `正在加载第${val}页...`;
    onSearch();
  }

  onMounted(() => {
    loadCategories();
    onSearch();
  });

  return {
    form,
    categories,
    loading,
    columns,
    dataList,
    pagination,
    onSizeChange,
    onCurrentChange,
    loadingConfig,
    onSearch,
    resetForm,
    openDialog,
    handleDelete,
    openBatchImportDialog,
    loadCategories
  };
}
