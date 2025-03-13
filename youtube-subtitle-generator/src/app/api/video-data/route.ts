import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";

const execPromise = promisify(exec);
let isStartingServer = false;

// 检查 Python API 服务器是否正在运行，如果没有则启动它
async function ensureApiServerRunning() {
  // 如果已经有一个启动过程在进行，等待它完成
  if (isStartingServer) {
    console.log("API 服务器正在启动中，等待...");
    await new Promise((resolve) => setTimeout(resolve, 5000));
    return;
  }

  try {
    // 尝试访问 API 服务器
    const response = await fetch("http://localhost:8000/docs", {
      method: "GET",
      // 设置较短的超时时间
      signal: AbortSignal.timeout(2000),
    });
    if (response.ok) {
      console.log("API 服务器已经在运行");
      return;
    }
  } catch (error) {
    console.log("API 服务器未运行，正在启动...");
  }

  try {
    isStartingServer = true;

    // 获取 API 服务器脚本的绝对路径
    const apiDir = path.join(process.cwd(), "api");
    const mainPyPath = path.join(apiDir, "main.py");

    // 检查文件是否存在
    if (!fs.existsSync(mainPyPath)) {
      console.error(`API 服务器脚本不存在: ${mainPyPath}`);
      isStartingServer = false;
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
    console.log("等待 API 服务器启动...");
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // 验证服务器是否已启动
    let serverRunning = false;
    for (let i = 0; i < 3; i++) {
      try {
        const checkResponse = await fetch("http://localhost:8000/docs", {
          method: "GET",
          signal: AbortSignal.timeout(2000),
        });
        if (checkResponse.ok) {
          console.log("API 服务器已成功启动");
          serverRunning = true;
          break;
        }
      } catch (error) {
        console.log(`尝试 ${i + 1}/3 检查 API 服务器失败`);
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    if (!serverRunning) {
      console.error("无法启动 API 服务器，请手动检查");
    }
  } catch (error) {
    console.error("启动 API 服务器时出错:", error);
  } finally {
    isStartingServer = false;
  }
}

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
    // 确保 API 服务器正在运行
    await ensureApiServerRunning();

    // 从请求中获取数据
    const data = await request.json();

    // 转发请求到 Python API，使用带重试的 fetch
    const response = await fetchWithRetry(
      "http://localhost:8000/video-data",
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
      {
        error:
          "处理请求时出错，请确保 Python 环境已正确安装并且 API 服务器可以启动",
      },
      { status: 500 }
    );
  }
}
