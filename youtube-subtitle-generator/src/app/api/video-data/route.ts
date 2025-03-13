import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";

const execPromise = promisify(exec);

// 检查 Python API 服务器是否正在运行，如果没有则启动它
async function ensureApiServerRunning() {
  try {
    // 尝试访问 API 服务器
    const response = await fetch("http://localhost:8000/docs");
    if (response.ok) {
      console.log("API 服务器已经在运行");
      return;
    }
  } catch (error) {
    console.log("API 服务器未运行，正在启动...");
  }

  try {
    // 获取 API 服务器脚本的绝对路径
    const apiDir = path.join(process.cwd(), "api");
    const mainPyPath = path.join(apiDir, "main.py");

    // 检查文件是否存在
    if (!fs.existsSync(mainPyPath)) {
      console.error(`API 服务器脚本不存在: ${mainPyPath}`);
      return;
    }

    // 在后台启动 API 服务器
    const { stdout, stderr } = await execPromise(
      `cd ${apiDir} && python3 main.py &`
    );
    console.log("API 服务器启动输出:", stdout);
    if (stderr) {
      console.error("API 服务器启动错误:", stderr);
    }

    // 等待服务器启动
    await new Promise((resolve) => setTimeout(resolve, 2000));
  } catch (error) {
    console.error("启动 API 服务器时出错:", error);
  }
}

export async function POST(request: NextRequest) {
  try {
    // 确保 API 服务器正在运行
    await ensureApiServerRunning();

    // 从请求中获取数据
    const data = await request.json();

    // 转发请求到 Python API
    const response = await fetch("http://localhost:8000/video-data", {
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
