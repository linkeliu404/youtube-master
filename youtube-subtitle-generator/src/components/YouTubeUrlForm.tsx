"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { youtubeUrlSchema, YoutubeUrlFormData } from "@/lib/validations";

interface YouTubeUrlFormProps {
  onSubmit: (data: YoutubeUrlFormData) => void;
  isLoading: boolean;
}

export function YouTubeUrlForm({ onSubmit, isLoading }: YouTubeUrlFormProps) {
  const form = useForm<YoutubeUrlFormData>({
    resolver: zodResolver(youtubeUrlSchema),
    defaultValues: {
      url: "",
    },
  });

  const handleSubmit = async (data: YoutubeUrlFormData) => {
    try {
      onSubmit(data);
    } catch (error) {
      toast.error("提交表单时出错");
      console.error(error);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">YouTube 字幕生成器</CardTitle>
        <CardDescription>
          输入 YouTube 视频链接，自动生成字幕。支持多种语言和格式。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>YouTube 链接</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://www.youtube.com/watch?v=..."
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "处理中..." : "生成字幕"}
            </Button>

            <div className="text-sm text-muted-foreground mt-4">
              <p>提示：</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>确保视频已启用字幕功能</li>
                <li>如果遇到错误，请尝试其他视频</li>
                <li>某些视频可能因版权或设置原因无法获取字幕</li>
                <li>
                  推荐使用 TED、教育类或官方频道的视频，这些视频通常有高质量字幕
                </li>
                <li>
                  <strong>测试视频推荐：</strong>{" "}
                  <a
                    href="https://www.youtube.com/watch?v=UF8uR6Z6KLc"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                    onClick={(e) => {
                      e.preventDefault();
                      form.setValue(
                        "url",
                        "https://www.youtube.com/watch?v=UF8uR6Z6KLc"
                      );
                    }}
                  >
                    点击填入测试视频
                  </a>
                </li>
              </ul>
            </div>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-center text-sm text-muted-foreground">
        支持标准 YouTube 链接和短链接格式
      </CardFooter>
    </Card>
  );
}
