"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { VideoData } from "@/lib/api";

interface VideoResultProps {
  videoData: VideoData;
  captions: string;
  timestamps: string[];
  isLoading: boolean;
}

export function VideoResult({
  videoData,
  captions,
  timestamps,
  isLoading,
}: VideoResultProps) {
  const [activeTab, setActiveTab] = useState<"captions" | "timestamps">(
    "captions"
  );
  const [showFullCaptions, setShowFullCaptions] = useState(false);

  if (isLoading) {
    return (
      <Card className="w-full max-w-2xl mx-auto mt-8">
        <CardHeader>
          <CardTitle>处理中...</CardTitle>
          <CardDescription>正在从 YouTube 视频中提取字幕</CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={45} className="w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!videoData || (!captions && !timestamps.length)) {
    return null;
  }

  const truncatedCaptions =
    captions.length > 500 ? `${captions.substring(0, 500)}...` : captions;

  const downloadTxt = (content: string, filename: string) => {
    const element = document.createElement("a");
    const file = new Blob([content], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const downloadSrt = (timestamps: string[]) => {
    let srtContent = "";
    timestamps.forEach((timestamp, index) => {
      const parts = timestamp.split(" - ");
      const time = parts[0];
      const text = parts[1] || "";

      const [minutes, seconds] = time.split(":");
      const startTime = `00:${minutes.padStart(2, "0")}:${seconds.padStart(
        2,
        "0"
      )},000`;
      const endTimeSeconds = parseInt(seconds) + 5;
      const endTimeMinutes = parseInt(minutes) + (endTimeSeconds >= 60 ? 1 : 0);
      const endTime = `00:${endTimeMinutes.toString().padStart(2, "0")}:${(
        endTimeSeconds % 60
      )
        .toString()
        .padStart(2, "0")},000`;

      srtContent += `${index + 1}\n${startTime} --> ${endTime}\n${text}\n\n`;
    });

    downloadTxt(
      srtContent,
      `${videoData.title.replace(/[^a-zA-Z0-9]/g, "_")}.srt`
    );
  };

  return (
    <Card className="w-full max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>{videoData.title}</CardTitle>
        <CardDescription>
          作者:{" "}
          <a
            href={videoData.author_url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            {videoData.author_name}
          </a>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="aspect-video w-full overflow-hidden rounded-md">
          <img
            src={videoData.thumbnail_url}
            alt={videoData.title}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex space-x-2 border-b pb-2">
          <Button
            variant={activeTab === "captions" ? "default" : "outline"}
            onClick={() => setActiveTab("captions")}
          >
            完整字幕
          </Button>
          <Button
            variant={activeTab === "timestamps" ? "default" : "outline"}
            onClick={() => setActiveTab("timestamps")}
          >
            带时间戳字幕
          </Button>
        </div>

        {activeTab === "captions" && (
          <div>
            <Textarea
              value={showFullCaptions ? captions : truncatedCaptions}
              readOnly
              className="min-h-[200px]"
            />
            {captions.length > 500 && !showFullCaptions && (
              <Button
                variant="link"
                onClick={() => setShowFullCaptions(true)}
                className="mt-2 p-0 h-auto"
              >
                显示全部
              </Button>
            )}
          </div>
        )}

        {activeTab === "timestamps" && (
          <div className="max-h-[400px] overflow-y-auto border rounded-md p-4">
            {timestamps.map((timestamp, index) => (
              <div key={index} className="mb-2 pb-2 border-b last:border-0">
                <span className="font-medium">{timestamp.split(" - ")[0]}</span>
                : {timestamp.split(" - ")[1]}
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">预览</Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{videoData.title}</DialogTitle>
              <DialogDescription>
                作者: {videoData.author_name}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="aspect-video w-full">
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${videoData.author_url
                    .split("/")
                    .pop()}`}
                  title={videoData.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        <div className="space-x-2">
          <Button
            onClick={() =>
              downloadTxt(
                captions,
                `${videoData.title.replace(/[^a-zA-Z0-9]/g, "_")}.txt`
              )
            }
          >
            下载 TXT
          </Button>
          <Button onClick={() => downloadSrt(timestamps)}>下载 SRT</Button>
        </div>
      </CardFooter>
    </Card>
  );
}
