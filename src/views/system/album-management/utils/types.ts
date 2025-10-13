/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-04-11 15:38:10
 * @LastEditTime: 2025-06-24 00:19:06
 * @LastEditors: 安知鱼
 */
interface FormItemProps {
  id: number;
  title: string;
  categoryId?: number | null;
  imageUrl: string;
  bigImageUrl: string;
  downloadUrl: string;
  thumbParam: string;
  bigParam: string;
  tags: Array<string>;
  viewCount: number;
  downloadCount: number;
  aspectRatio: string;
  widthAndHeight: string;
  fileSize: number;
  displayOrder: number;
}
interface FormProps {
  formInline: FormItemProps;
  categories?: Array<{ id: number; name: string }>;
}

export type { FormItemProps, FormProps };
