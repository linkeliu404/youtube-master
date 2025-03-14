"use client";

import { useState } from "react";
import { toast } from "sonner";

import { YouTubeUrlForm } from "@/components/YouTubeUrlForm";
import { VideoResult } from "@/components/VideoResult";
import { YoutubeUrlFormData } from "@/lib/validations";
import {
  getVideoData,
  getVideoCaptions,
  getVideoTimestamps,
  VideoData,
} from "@/lib/api";

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [captions, setCaptions] = useState<string>("");
  const [timestamps, setTimestamps] = useState<string[]>([]);

  const handleSubmit = async (data: YoutubeUrlFormData) => {
    try {
      setIsLoading(true);

      // 获取视频数据
      const videoDataResult = await getVideoData({
        url: data.url,
        languages: data.languages,
      });
      setVideoData(videoDataResult);

      // 获取字幕
      const captionsResult = await getVideoCaptions({
        url: data.url,
        languages: data.languages,
      });
      setCaptions(captionsResult);

      // 获取时间戳
      const timestampsResult = await getVideoTimestamps({
        url: data.url,
        languages: data.languages,
      });
      setTimestamps(timestampsResult);

      toast.success("字幕生成成功！");
    } catch (error: any) {
      console.error("Error:", error);

      // 显示更具体的错误信息
      if (error.message) {
        if (
          error.message.includes("subtitles") ||
          error.message.includes("字幕")
        ) {
          toast.error(`无法获取字幕: ${error.message}`, {
            duration: 5000,
          });
        } else if (
          error.message.includes("network") ||
          error.message.includes("timeout")
        ) {
          toast.error(`网络错误: 请检查您的网络连接或API服务器是否可用`, {
            duration: 5000,
          });
        } else {
          toast.error(`处理失败: ${error.message}`, {
            duration: 5000,
          });
        }
      } else {
        toast.error("获取视频数据时出错，请稍后重试", {
          duration: 5000,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-24">
      <div className="w-full max-w-5xl">
        <h1 className="text-4xl font-bold text-center mb-8">
          YouTube 字幕生成器
        </h1>

        <YouTubeUrlForm onSubmit={handleSubmit} isLoading={isLoading} />

        {(videoData || isLoading) && (
          <VideoResult
            videoData={videoData as VideoData}
            captions={captions}
            timestamps={timestamps}
            isLoading={isLoading}
          />
        )}
      </div>
    </main>
  );
}
