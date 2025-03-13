import { z } from "zod";

export const youtubeUrlSchema = z.object({
  url: z
    .string()
    .min(1, { message: "请输入YouTube链接" })
    .refine(
      (url) => {
        const youtubeRegex =
          /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})(\S*)?$/;
        return youtubeRegex.test(url);
      },
      { message: "请输入有效的YouTube链接" }
    ),
  languages: z.array(z.string()).optional(),
});

export type YoutubeUrlFormData = z.infer<typeof youtubeUrlSchema>;
