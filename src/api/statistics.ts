/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-08-20 15:13:49
 * @LastEditTime: 2025-08-20 15:57:06
 * @LastEditors: 安知鱼
 */
import { http } from "@/utils/http";
import { baseUrlApi } from "@/utils/http/config";
import type { StatisticData } from "@/types/about";

// 访问统计接口响应类型
interface StatisticsResponse {
  code: number;
  message: string;
  data: StatisticData | null;
}

// 访问记录请求类型
interface VisitRecordRequest {
  url_path: string;
  page_title: string;
  referer?: string;
  duration?: number;
}

// 访问记录响应类型
interface VisitRecordResponse {
  code: number;
  message: string;
  data: null;
}

// 访客分析数据类型
interface VisitorAnalytics {
  top_countries: Array<{
    country: string;
    count: number;
  }>;
  top_cities: Array<{
    city: string;
    count: number;
  }>;
  top_browsers: Array<{
    browser: string;
    count: number;
  }>;
  top_os: Array<{
    os: string;
    count: number;
  }>;
  top_devices: Array<{
    device: string;
    count: number;
  }>;
  top_referers: Array<{
    referer: string;
    count: number;
  }>;
}

// 热门页面数据类型
interface URLStatistics {
  url_path: string;
  page_title: string;
  total_views: number;
  unique_views: number;
  bounce_count: number;
  bounce_rate: number;
  avg_duration: number;
  last_visited_at: string;
}

// 访客趋势数据类型
interface VisitorTrendData {
  daily: Array<{
    date: string;
    visitors: number;
    views: number;
  }>;
  weekly: Array<{
    date: string;
    visitors: number;
    views: number;
  }> | null;
  monthly: Array<{
    date: string;
    visitors: number;
    views: number;
  }> | null;
}

// 访客日志数据类型
export interface VisitorLogDTO {
  user_agent: string;
  ip_address: string;
  city: string;
  url_path: string;
  duration: number;
  created_at: string;
}

// 统计概览数据类型
interface StatisticsSummary {
  basic_stats: StatisticData;
  top_pages: URLStatistics[];
  analytics: VisitorAnalytics;
  trend_data: VisitorTrendData;
}

// 获取访问统计数据
export function getStatistics() {
  return http.request<StatisticsResponse>(
    "get",
    baseUrlApi("public/statistics/basic")
  );
}

// 记录访问行为
export function recordVisit(data: VisitRecordRequest) {
  return http.request<VisitRecordResponse>(
    "post",
    baseUrlApi("public/statistics/visit"),
    { data }
  );
}

// 获取访客分析数据
export function getVisitorAnalytics(startDate?: string, endDate?: string) {
  const params: any = {};
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;

  return http.request<{
    code: number;
    message: string;
    data: VisitorAnalytics;
  }>("get", baseUrlApi("statistics/analytics"), { params });
}

// 获取热门页面
export function getTopPages(limit: number = 10) {
  return http.request<{ code: number; message: string; data: URLStatistics[] }>(
    "get",
    baseUrlApi("statistics/top-pages"),
    { params: { limit } }
  );
}

// 获取访客趋势数据
export function getVisitorTrend(period: string = "daily", days: number = 30) {
  return http.request<{
    code: number;
    message: string;
    data: VisitorTrendData;
  }>("get", baseUrlApi("statistics/trend"), { params: { period, days } });
}

// 获取访客访问日志
export function getVisitorLogs(params: {
  start_date?: string;
  end_date?: string;
  page?: number;
  page_size?: number;
}) {
  return http.request<{
    code: number;
    message: string;
    data: {
      list: VisitorLogDTO[];
      total: number;
      page: number;
      page_size: number;
    };
  }>("get", baseUrlApi("statistics/visitor-logs"), { params });
}

// 获取统计概览
export function getStatisticsSummary() {
  return http.request<{
    code: number;
    message: string;
    data: StatisticsSummary;
  }>("get", baseUrlApi("statistics/summary"));
}
