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
    if (axios.isAxiosError(error) && error.response) {
      console.error("服务器响应:", error.response.data);
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
    if (axios.isAxiosError(error) && error.response) {
      console.error("服务器响应:", error.response.data);
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
    if (axios.isAxiosError(error) && error.response) {
      console.error("服务器响应:", error.response.data);
    }
    throw error;
  }
};
