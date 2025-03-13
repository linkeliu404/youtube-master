"use client";

import { useState } from "react";
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
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-center text-sm text-muted-foreground">
        支持标准 YouTube 链接和短链接格式
      </CardFooter>
    </Card>
  );
}
