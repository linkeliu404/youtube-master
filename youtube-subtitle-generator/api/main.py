import json
import os
import logging
import re
import requests
from urllib.parse import urlparse, parse_qs, urlencode
from urllib.request import urlopen
from typing import Optional, List

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

# 配置日志
logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

try:
    from youtube_transcript_api import YouTubeTranscriptApi
except ImportError:
    raise ImportError(
        "`youtube_transcript_api` not installed. Please install using `pip install youtube_transcript_api`"
    )

app = FastAPI(title="YouTube Tools API")

# 添加 CORS 中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 允许所有来源，生产环境中应该限制为特定域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

class YouTubeTools:
    @staticmethod
    def get_youtube_video_id(url: str) -> Optional[str]:
        """Function to get the video ID from a YouTube URL."""
        parsed_url = urlparse(url)
        hostname = parsed_url.hostname

        if hostname == "youtu.be":
            return parsed_url.path[1:]
        if hostname in ("www.youtube.com", "youtube.com"):
            if parsed_url.path == "/watch":
                query_params = parse_qs(parsed_url.query)
                return query_params.get("v", [None])[0]
            if parsed_url.path.startswith("/embed/"):
                return parsed_url.path.split("/")[2]
            if parsed_url.path.startswith("/v/"):
                return parsed_url.path.split("/")[2]
        return None

    @staticmethod
    def get_video_data(url: str) -> dict:
        """Function to get video data from a YouTube URL."""
        if not url:
            raise HTTPException(status_code=400, detail="No URL provided")

        try:
            video_id = YouTubeTools.get_youtube_video_id(url)
            if not video_id:
                raise HTTPException(status_code=400, detail="Invalid YouTube URL")
        except Exception:
            raise HTTPException(status_code=400, detail="Error getting video ID from URL")

        try:
            params = {"format": "json", "url": f"https://www.youtube.com/watch?v={video_id}"}
            oembed_url = "https://www.youtube.com/oembed"
            query_string = urlencode(params)
            full_url = oembed_url + "?" + query_string

            with urlopen(full_url) as response:
                response_text = response.read()
                video_data = json.loads(response_text.decode())
                clean_data = {
                    "title": video_data.get("title"),
                    "author_name": video_data.get("author_name"),
                    "author_url": video_data.get("author_url"),
                    "type": video_data.get("type"),
                    "height": video_data.get("height"),
                    "width": video_data.get("width"),
                    "version": video_data.get("version"),
                    "provider_name": video_data.get("provider_name"),
                    "provider_url": video_data.get("provider_url"),
                    "thumbnail_url": video_data.get("thumbnail_url"),
                }
                return clean_data
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error getting video data: {str(e)}")

    @staticmethod
    def get_video_captions(url: str, languages: Optional[List[str]] = None) -> str:
        """Get captions from a YouTube video."""
        if not url:
            raise HTTPException(status_code=400, detail="No URL provided")

        try:
            video_id = YouTubeTools.get_youtube_video_id(url)
            if not video_id:
                raise HTTPException(status_code=400, detail="Invalid YouTube URL")
        except Exception:
            raise HTTPException(status_code=400, detail="Error getting video ID from URL")

        try:
            # 记录更详细的信息
            logger.info(f"尝试获取视频 ID: {video_id} 的字幕")
            
            # 如果没有指定语言，尝试多种常见语言
            if not languages:
                languages = ["en", "zh", "zh-Hans", "zh-Hant", "zh-CN", "zh-TW", "ja", "ko", "es", "fr", "de", "ru", "pt", "it"]
                logger.info(f"未指定语言，将尝试以下语言: {languages}")
            
            # 首先尝试直接从 YouTube 获取字幕
            try:
                logger.info("尝试直接从 YouTube 获取字幕")
                captions_text = YouTubeTools.get_captions_direct(video_id)
                if captions_text:
                    logger.info("成功直接从 YouTube 获取字幕")
                    return captions_text
                logger.warning("直接获取字幕失败，尝试使用 youtube_transcript_api")
            except Exception as direct_e:
                logger.warning(f"直接获取字幕失败: {str(direct_e)}，尝试使用 youtube_transcript_api")
            
            try:
                # 尝试使用 youtube_transcript_api
                logger.info(f"尝试使用指定语言获取字幕: {languages}")
                captions = YouTubeTranscriptApi.get_transcript(video_id, languages=languages)
                logger.info(f"成功获取字幕，语言: {languages}")
            except Exception as e:
                # 如果指定语言失败，尝试获取任何可用的字幕
                logger.warning(f"使用指定语言获取字幕失败: {str(e)}，尝试获取任何可用的字幕")
                try:
                    transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
                    logger.info(f"可用的字幕列表: {[tr.language_code for tr in transcript_list]}")
                    
                    # 获取第一个可用的字幕
                    transcript = transcript_list.find_transcript(languages)
                    if not transcript:
                        # 如果找不到指定语言，获取自动生成的字幕
                        transcript = next(transcript_list._manually_created_transcripts.values().__iter__(), None)
                        if not transcript:
                            # 如果没有手动创建的字幕，获取自动生成的字幕
                            transcript = next(transcript_list._generated_transcripts.values().__iter__(), None)
                    
                    if transcript:
                        logger.info(f"找到可用字幕，语言: {transcript.language_code}")
                        captions = transcript.fetch()
                    else:
                        raise Exception("No available transcripts found")
                except Exception as inner_e:
                    logger.error(f"获取任何可用字幕失败: {str(inner_e)}")
                    raise HTTPException(
                        status_code=404,
                        detail=f"This video does not have available subtitles. Error: {str(inner_e)}"
                    )
            
            if captions:
                return " ".join(line["text"] for line in captions)
            return "No captions found for video"
        except Exception as e:
            error_msg = str(e)
            logger.error(f"获取字幕时出错: {error_msg}")
            if "Subtitles are disabled" in error_msg:
                raise HTTPException(
                    status_code=404,
                    detail="This video does not have subtitles enabled. Please try another video or contact the video owner to enable subtitles."
                )
            raise HTTPException(status_code=500, detail=error_msg)

    @staticmethod
    def get_captions_direct(video_id: str) -> Optional[str]:
        """直接从 YouTube 获取字幕，不使用第三方库"""
        try:
            # 获取视频页面
            url = f"https://www.youtube.com/watch?v={video_id}"
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            }
            response = requests.get(url, headers=headers)
            html_content = response.text
            
            # 尝试提取字幕 URL
            caption_url_match = re.search(r'"captionTracks":\[(.*?)\]', html_content)
            if not caption_url_match:
                logger.warning("未找到字幕轨道信息")
                return None
                
            caption_data = caption_url_match.group(1)
            base_url_match = re.search(r'"baseUrl":"(.*?)"', caption_data)
            
            if not base_url_match:
                logger.warning("未找到字幕 URL")
                return None
                
            caption_url = base_url_match.group(1).replace('\\u0026', '&')
            
            # 获取字幕内容
            caption_response = requests.get(caption_url)
            caption_xml = caption_response.text
            
            # 解析 XML 提取文本
            text_parts = re.findall(r'<text[^>]*>(.*?)</text>', caption_xml)
            if not text_parts:
                logger.warning("未找到字幕文本")
                return None
                
            # 清理 HTML 实体
            cleaned_parts = [part.replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>').replace('&quot;', '"') for part in text_parts]
            
            return " ".join(cleaned_parts)
        except Exception as e:
            logger.error(f"直接获取字幕失败: {str(e)}")
            return None

    @staticmethod
    def get_video_timestamps(url: str, languages: Optional[List[str]] = None) -> List[str]:
        """Generate timestamps for a YouTube video based on captions."""
        if not url:
            raise HTTPException(status_code=400, detail="No URL provided")

        try:
            video_id = YouTubeTools.get_youtube_video_id(url)
            if not video_id:
                raise HTTPException(status_code=400, detail="Invalid YouTube URL")
        except Exception:
            raise HTTPException(status_code=400, detail="Error getting video ID from URL")

        try:
            # 记录更详细的信息
            logger.info(f"尝试获取视频 ID: {video_id} 的时间戳")
            
            # 首先尝试直接从 YouTube 获取字幕
            try:
                logger.info("尝试直接从 YouTube 获取字幕用于时间戳")
                captions_text = YouTubeTools.get_captions_direct_with_timestamps(video_id)
                if captions_text:
                    logger.info("成功直接从 YouTube 获取带时间戳的字幕")
                    return captions_text
                logger.warning("直接获取带时间戳的字幕失败，尝试使用 youtube_transcript_api")
            except Exception as direct_e:
                logger.warning(f"直接获取带时间戳的字幕失败: {str(direct_e)}，尝试使用 youtube_transcript_api")
            
            # 如果没有指定语言，尝试多种常见语言
            if not languages:
                languages = ["en", "zh", "zh-Hans", "zh-Hant", "zh-CN", "zh-TW", "ja", "ko", "es", "fr", "de", "ru", "pt", "it"]
                logger.info(f"未指定语言，将尝试以下语言: {languages}")
            
            try:
                # 尝试使用 youtube_transcript_api
                logger.info(f"尝试使用指定语言获取字幕: {languages}")
                captions = YouTubeTranscriptApi.get_transcript(video_id, languages=languages)
                logger.info(f"成功获取字幕，语言: {languages}")
            except Exception as e:
                # 如果指定语言失败，尝试获取任何可用的字幕
                logger.warning(f"使用指定语言获取字幕失败: {str(e)}，尝试获取任何可用的字幕")
                try:
                    transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
                    logger.info(f"可用的字幕列表: {[tr.language_code for tr in transcript_list]}")
                    
                    # 获取第一个可用的字幕
                    transcript = transcript_list.find_transcript(languages)
                    if not transcript:
                        # 如果找不到指定语言，获取自动生成的字幕
                        transcript = next(transcript_list._manually_created_transcripts.values().__iter__(), None)
                        if not transcript:
                            # 如果没有手动创建的字幕，获取自动生成的字幕
                            transcript = next(transcript_list._generated_transcripts.values().__iter__(), None)
                    
                    if transcript:
                        logger.info(f"找到可用字幕，语言: {transcript.language_code}")
                        captions = transcript.fetch()
                    else:
                        raise Exception("No available transcripts found")
                except Exception as inner_e:
                    logger.error(f"获取任何可用字幕失败: {str(inner_e)}")
                    raise HTTPException(
                        status_code=404,
                        detail=f"This video does not have available subtitles. Error: {str(inner_e)}"
                    )
            
            timestamps = []
            for line in captions:
                start = int(line["start"])
                minutes, seconds = divmod(start, 60)
                timestamps.append(f"{minutes}:{seconds:02d} - {line['text']}")
            return timestamps
        except Exception as e:
            error_msg = str(e)
            logger.error(f"生成时间戳时出错: {error_msg}")
            if "Subtitles are disabled" in error_msg:
                raise HTTPException(
                    status_code=404,
                    detail="This video does not have subtitles enabled. Please try another video or contact the video owner to enable subtitles."
                )
            raise HTTPException(status_code=500, detail=error_msg)

    @staticmethod
    def get_captions_direct_with_timestamps(video_id: str) -> Optional[List[str]]:
        """直接从 YouTube 获取带时间戳的字幕，不使用第三方库"""
        try:
            # 获取视频页面
            url = f"https://www.youtube.com/watch?v={video_id}"
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            }
            response = requests.get(url, headers=headers)
            html_content = response.text
            
            # 尝试提取字幕 URL
            caption_url_match = re.search(r'"captionTracks":\[(.*?)\]', html_content)
            if not caption_url_match:
                logger.warning("未找到字幕轨道信息")
                return None
                
            caption_data = caption_url_match.group(1)
            base_url_match = re.search(r'"baseUrl":"(.*?)"', caption_data)
            
            if not base_url_match:
                logger.warning("未找到字幕 URL")
                return None
                
            caption_url = base_url_match.group(1).replace('\\u0026', '&')
            
            # 获取字幕内容
            caption_response = requests.get(caption_url)
            caption_xml = caption_response.text
            
            # 解析 XML 提取文本和时间
            timestamps = []
            pattern = re.compile(r'<text start="([\d\.]+)"[^>]*>(.*?)</text>')
            matches = pattern.findall(caption_xml)
            
            for start, text in matches:
                # 清理 HTML 实体
                cleaned_text = text.replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>').replace('&quot;', '"')
                
                # 转换时间为分:秒格式
                start_seconds = float(start)
                minutes, seconds = divmod(int(start_seconds), 60)
                
                timestamps.append(f"{minutes}:{seconds:02d} - {cleaned_text}")
            
            return timestamps
        except Exception as e:
            logger.error(f"直接获取带时间戳的字幕失败: {str(e)}")
            return None

class YouTubeRequest(BaseModel):
    url: str
    languages: Optional[List[str]] = None

@app.post("/video-data")
async def get_video_data(request: YouTubeRequest):
    """Endpoint to get video metadata"""
    logger.info(f"收到视频数据请求: {request.url}")
    try:
        result = YouTubeTools.get_video_data(request.url)
        logger.info(f"视频数据请求成功: {request.url}")
        return result
    except Exception as e:
        logger.error(f"视频数据请求失败: {request.url}, 错误: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/video-captions")
async def get_video_captions(request: YouTubeRequest):
    """Endpoint to get video captions"""
    logger.info(f"收到字幕请求: {request.url}, 语言: {request.languages}")
    try:
        result = YouTubeTools.get_video_captions(request.url, request.languages)
        logger.info(f"字幕请求成功: {request.url}")
        return result
    except Exception as e:
        logger.error(f"字幕请求失败: {request.url}, 错误: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/video-timestamps")
async def get_video_timestamps(request: YouTubeRequest):
    """Endpoint to get video timestamps"""
    logger.info(f"收到时间戳请求: {request.url}, 语言: {request.languages}")
    try:
        result = YouTubeTools.get_video_timestamps(request.url, request.languages)
        logger.info(f"时间戳请求成功: {request.url}")
        return result
    except Exception as e:
        logger.error(f"时间戳请求失败: {request.url}, 错误: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    # 使用环境变量为端口，默认为 8000
    # 注意：许多云平台会自动设置 PORT 环境变量
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    print(f"Starting server on {host}:{port}")
    uvicorn.run(app, host=host, port=port)