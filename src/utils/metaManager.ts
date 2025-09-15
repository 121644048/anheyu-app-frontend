/**
 * 动态Meta标签管理工具
 * 用于在单页应用中动态更新article相关的meta标签
 */

export interface ArticleMetaData {
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  tags?: string[];
}

// 存储之前添加的meta标签，用于清理
const addedMetaTags: HTMLMetaElement[] = [];

/**
 * 设置或更新meta标签
 * @param property - meta标签的property属性
 * @param content - meta标签的content内容
 */
function setMetaTag(property: string, content: string): void {
  // 查找是否已存在相同property的meta标签
  let metaElement = document.querySelector(
    `meta[property="${property}"]`
  ) as HTMLMetaElement;

  if (metaElement) {
    // 如果存在，更新content
    metaElement.content = content;
  } else {
    // 如果不存在，创建新的meta标签
    metaElement = document.createElement("meta");
    metaElement.setAttribute("property", property);
    metaElement.content = content;
    document.head.appendChild(metaElement);

    // 记录新添加的标签，用于后续清理
    addedMetaTags.push(metaElement);
  }
}

/**
 * 移除指定property的meta标签
 * @param property - 要移除的meta标签property
 */
function removeMetaTag(property: string): void {
  const metaElement = document.querySelector(`meta[property="${property}"]`);
  if (metaElement) {
    metaElement.remove();

    // 从记录列表中移除
    const index = addedMetaTags.indexOf(metaElement as HTMLMetaElement);
    if (index > -1) {
      addedMetaTags.splice(index, 1);
    }
  }
}

/**
 * 设置article相关的meta标签
 * @param articleMeta - 文章meta数据
 */
export function setArticleMetaTags(articleMeta: ArticleMetaData): void {
  // 设置发布时间
  if (articleMeta.publishedTime) {
    setMetaTag("article:published_time", articleMeta.publishedTime);
  }

  // 设置修改时间
  if (articleMeta.modifiedTime) {
    setMetaTag("article:modified_time", articleMeta.modifiedTime);
  }

  // 设置作者
  if (articleMeta.author) {
    setMetaTag("article:author", articleMeta.author);
  }

  // 设置标签
  if (articleMeta.tags && articleMeta.tags.length > 0) {
    // 先清除所有现有的article:tag标签
    clearArticleTagMetaTags();

    // 为每个标签添加meta标签
    articleMeta.tags.forEach(tag => {
      setMetaTag("article:tag", tag);
    });
  }
}

/**
 * 清除所有article:tag类型的meta标签
 */
function clearArticleTagMetaTags(): void {
  const tagMetas = document.querySelectorAll('meta[property="article:tag"]');
  tagMetas.forEach(meta => {
    meta.remove();

    // 从记录列表中移除
    const index = addedMetaTags.indexOf(meta as HTMLMetaElement);
    if (index > -1) {
      addedMetaTags.splice(index, 1);
    }
  });
}

/**
 * 清除所有article相关的meta标签
 */
export function clearArticleMetaTags(): void {
  const articleProperties = [
    "article:published_time",
    "article:modified_time",
    "article:author",
    "article:tag"
  ];

  articleProperties.forEach(property => {
    // 对于article:tag，需要移除所有实例
    if (property === "article:tag") {
      clearArticleTagMetaTags();
    } else {
      removeMetaTag(property);
    }
  });
}

/**
 * 清除所有动态添加的meta标签
 */
export function clearAllDynamicMetaTags(): void {
  addedMetaTags.forEach(meta => {
    if (meta.parentNode) {
      meta.remove();
    }
  });
  addedMetaTags.length = 0;
}

/**
 * 检查是否为文章页面路径
 * @param path - 当前路径
 */
export function isArticlePage(path: string): boolean {
  return /^\/posts\/[^/]+$/.test(path);
}
