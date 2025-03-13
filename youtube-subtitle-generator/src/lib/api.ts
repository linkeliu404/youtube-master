import axios from "axios";

// 使用环境变量获取 API 地址
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

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
    const response = await axios.post(`${API_BASE_URL}/video-data`, request);
    return response.data;
  } catch (error) {
    console.error("Error fetching video data:", error);
    throw error;
  }
};

export const getVideoCaptions = async (
  request: YouTubeRequest
): Promise<string> => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/video-captions`,
      request
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching video captions:", error);
    throw error;
  }
};

export const getVideoTimestamps = async (
  request: YouTubeRequest
): Promise<string[]> => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/video-timestamps`,
      request
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching video timestamps:", error);
    throw error;
  }
};
