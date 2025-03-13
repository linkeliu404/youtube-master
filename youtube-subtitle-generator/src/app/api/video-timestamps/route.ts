import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // 从请求中获取数据
    const data = await request.json();

    // 转发请求到 Python API
    const response = await fetch("http://localhost:8000/video-timestamps", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

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
    return NextResponse.json({ error: "处理请求时出错" }, { status: 500 });
  }
}
