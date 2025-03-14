import axios from "axios";

// 使用环境变量获取 API 地址
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

// 配置 axios
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 增加超时时间到 30 秒
  headers: {
    "Content-Type": "application/json",
  },
});

export interface VideoData {
  title: string;
  author_name: string;
  author_url: string;
  thumbnail_url: string;
  type: string;
  height: number;
  width: number;
  version: string;
  provider_name: string;
  provider_url: string;
}

export interface YouTubeRequest {
  url: string;
  languages?: string[];
}

export const getVideoData = async (
  request: YouTubeRequest
): Promise<VideoData> => {
  try {
    console.log("发送视频数据请求:", request);
    const response = await apiClient.post("/video-data", request);
    return response.data;
  } catch (error) {
    console.error("Error fetching video data:", error);
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const detail = error.response?.data?.detail;

      console.error("服务器响应:", error.response?.data);

      if (error.code === "ECONNABORTED") {
        throw new Error("请求超时，请检查您的网络连接或稍后重试");
      } else if (error.code === "ERR_NETWORK") {
        throw new Error("网络错误，无法连接到服务器");
      } else if (status === 404) {
        throw new Error(detail || "找不到视频信息");
      } else if (status === 400) {
        throw new Error(detail || "无效的 YouTube 链接");
      } else {
        throw new Error(detail || "获取视频数据失败");
      }
    }
    throw error;
  }
};

export const getVideoCaptions = async (
  request: YouTubeRequest
): Promise<string> => {
  try {
    console.log("发送字幕请求:", request);
    const response = await apiClient.post("/video-captions", request);
    return response.data;
  } catch (error) {
    console.error("Error fetching video captions:", error);
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const detail = error.response?.data?.detail;

      console.error("服务器响应:", error.response?.data);

      if (status === 404) {
        throw new Error(
          detail ||
            "该视频没有启用字幕功能。请尝试其他视频或联系视频所有者启用字幕。"
        );
      } else if (status === 400) {
        throw new Error(detail || "无效的 YouTube 链接");
      } else if (error.code === "ECONNABORTED") {
        throw new Error("请求超时，请检查您的网络连接或稍后重试");
      } else if (error.code === "ERR_NETWORK") {
        throw new Error("网络错误，无法连接到服务器");
      } else {
        throw new Error(detail || "获取字幕失败，请稍后重试");
      }
    }
    throw error;
  }
};

export const getVideoTimestamps = async (
  request: YouTubeRequest
): Promise<string[]> => {
  try {
    console.log("发送时间戳请求:", request);
    const response = await apiClient.post("/video-timestamps", request);
    return response.data;
  } catch (error) {
    console.error("Error fetching video timestamps:", error);
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const detail = error.response?.data?.detail;

      console.error("服务器响应:", error.response?.data);

      if (status === 404) {
        throw new Error(
          detail ||
            "该视频没有启用字幕功能。请尝试其他视频或联系视频所有者启用字幕。"
        );
      } else if (status === 400) {
        throw new Error(detail || "无效的 YouTube 链接");
      } else if (error.code === "ECONNABORTED") {
        throw new Error("请求超时，请检查您的网络连接或稍后重试");
      } else if (error.code === "ERR_NETWORK") {
        throw new Error("网络错误，无法连接到服务器");
      } else {
        throw new Error(detail || "获取时间戳失败，请稍后重试");
      }
    }
    throw error;
  }
};
