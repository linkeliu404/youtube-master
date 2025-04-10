# YouTube 字幕生成器

这是一个基于 Next.js 和 FastAPI 的应用程序，可以从 YouTube 视频中提取字幕。

## 功能

- 输入 YouTube 视频链接，自动生成字幕
- 支持完整字幕和带时间戳字幕
- 支持下载 TXT 和 SRT 格式的字幕文件
- 支持视频预览

## 技术栈

- 前端：Next.js、TypeScript、Tailwind CSS、shadcn/ui
- 后端：FastAPI、Python
- API：YouTube Data API、YouTube Transcript API

## 安装和运行

### 前提条件

- Node.js 18+
- Python 3.7+
- pip (Python 包管理器)

### 安装依赖

1. 安装前端依赖：

```bash
npm install
```

2. 安装后端依赖：

```bash
cd api
pip install -r requirements.txt
```

### 运行应用程序

有两种方式运行应用程序：

#### 方式一：一键启动（推荐）

```bash
npm run dev
```

应用程序将在 http://localhost:3000 上运行，并在需要时自动启动 API 服务器。

#### 方式二：分别启动前端和后端

1. 启动 API 服务器：

在 Linux/macOS 上：

```bash
./start-api-server.sh
```

在 Windows 上：

```bash
start-api-server.bat
```

2. 启动前端应用程序：

```bash
npm run dev
```

应用程序将在 http://localhost:3000 上运行，API 服务器将在 http://localhost:8000 上运行。

### 故障排除

如果遇到 API 服务器无法启动的问题，请尝试以下步骤：

1. 确保已安装 Python 3.7+ 和 pip
2. 手动安装依赖：
   ```bash
   cd api
   pip install -r requirements.txt
   ```
3. 手动启动 API 服务器：
   ```bash
   cd api
   python main.py
   ```
4. 检查端口 8000 是否已被占用，如果已被占用，可以修改 `api/main.py` 文件中的端口号

## 项目结构

```
youtube-subtitle-generator/
├── api/                  # Python API 服务器
│   ├── main.py           # FastAPI 应用程序
│   └── requirements.txt  # Python 依赖
├── public/               # 静态资源
├── src/                  # 前端源代码
│   ├── app/              # Next.js 应用程序
│   │   ├── api/          # API 路由
│   │   ├── page.tsx      # 主页
│   │   └── layout.tsx    # 布局组件
│   ├── components/       # React 组件
│   │   ├── ui/           # UI 组件
│   │   ├── YouTubeUrlForm.tsx  # YouTube URL 表单组件
│   │   └── VideoResult.tsx     # 视频结果组件
│   └── lib/              # 工具函数和类型定义
│       ├── api.ts        # API 客户端
│       └── validations.ts # 表单验证
└── package.json          # 项目配置
```

## 使用方法

1. 在主页输入 YouTube 视频链接
2. 点击"生成字幕"按钮
3. 等待字幕生成完成
4. 查看完整字幕或带时间戳字幕
5. 下载 TXT 或 SRT 格式的字幕文件

## 许可证

MIT

## 部署指南

本项目分为前端和后端两部分，需要分别部署。

### 部署后端 API 服务器

1. 选择支持 Python 的云平台（如 Heroku、Railway、Render、PythonAnywhere 等）
2. 部署 `api` 目录中的代码
3. 确保安装了所有依赖：`pip install -r requirements.txt`
4. 启动服务器：`python main.py`
5. 记录下部署后的 API URL，如 `https://your-backend-api.com`

### 部署前端到 Vercel

1. Fork 或克隆本仓库到你的 GitHub 账户
2. 在 Vercel 中导入该仓库
3. 设置以下环境变量：
   - `NEXT_PUBLIC_API_URL`: 后端 API 的公开地址（如 `https://your-backend-api.com`）
   - `BACKEND_API_URL`: 后端 API 的地址（同上）
4. 点击部署

### 本地开发与生产环境的区别

在本地开发时，前端会尝试自动启动后端 API 服务器。但在生产环境中，前端和后端是分开部署的，需要通过环境变量指定后端 API 的地址。

## 故障排除

如果遇到 API 服务器无法启动的问题，请尝试以下步骤：

1. 确保已安装 Python 3.7+ 和 pip
2. 手动安装依赖：
   ```bash
   cd api
   pip install -r requirements.txt
   ```
3. 手动启动 API 服务器：
   ```bash
   cd api
   python main.py
   ```
4. 检查端口 8000 是否已被占用，如果已被占用，可以修改 `api/main.py` 文件中的端口号
