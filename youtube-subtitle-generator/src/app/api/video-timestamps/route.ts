import { NextRequest, NextResponse } from "next/server";

// 带重试的 fetch 函数
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 3,
  delay = 1000
) {
  let lastError;

  for (let i = 0; i < retries; i++) {
    try {
      return await fetch(url, options);
    } catch (error) {
      console.log(`请求失败，尝试 ${i + 1}/${retries}`, error);
      lastError = error;

      // 最后一次尝试失败，不需要等待
      if (i < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

export async function POST(request: NextRequest) {
  try {
    // 从请求中获取数据
    const data = await request.json();

    // 转发请求到 Python API，使用带重试的 fetch
    const response = await fetchWithRetry(
      "http://localhost:8000/video-timestamps",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      },
      3,
      2000
    );

    // 检查响应状态
    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `API 请求失败: ${errorText}` },
        { status: response.status }
      );
    }

    // 返回 API 响应
    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error("处理请求时出错:", error);
    return NextResponse.json(
      { error: "处理请求时出错，请确保 API 服务器正在运行" },
      { status: 500 }
    );
  }
}
