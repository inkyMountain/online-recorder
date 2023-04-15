import { RouterProvider, createBrowserRouter } from "react-router-dom"
import "./App.scss"
import { routes } from "./router/routes"

const router = createBrowserRouter(routes)
function App() {
  return <RouterProvider router={router} />
}

export default App

/**
 * 输入: 屏幕视频stream, 摄像头、录音设备的stream。
 * 导出: 下载文件，URLObject。
 * 设备列表：列出所有音频和视频设备

陈亦邦的作业：
给开始录制按钮，加上弹窗，选择要录屏的分辨率，然后开始录制。

下周工作：
   1. 视频的分辨率 [done]

   2. ffmpeg: mp4, mkv, flv, avi [done]
   使用 ffmpeg 导出上述格式的视频 

   3. 将录屏和摄像头视频组合起来，包括：[todo] 
    - 摄像头的 video 标签的拖拽和大小调整
    - 使用 ffmpeg 合并两个视频
ffmpeg -i 1.webm -vf "movie=2.webm:loop=200,scale=iw/2:-1[bg];[bg][0]overlay=100:200:shortest=1" out.mp4
 */
