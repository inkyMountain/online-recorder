import { useRef } from "react"
import { createFFmpeg } from "@ffmpeg/ffmpeg"
import "./App.scss"

const ffmpeg = createFFmpeg()
ffmpeg.load().then(() => {
  console.log("加载完成")
})
ffmpeg.setProgress(({ ratio }) => {
  console.log("ratio ===========>", ratio)
})
ffmpeg.setLogger(({ type, message }) => {
  console.log(type, message);
  /*
   * type can be one of following:
   *
   * info: internal workflow debug messages
   * fferr: ffmpeg native stderr output
   * ffout: ffmpeg native stdout output
   */
});
// file system
// mkdir: make directory
// ffmpeg.FS('mkdir')
// ffmpeg.run('ffmpeg', '-i', 'test.webm')

const transformWebm = async (blob: Blob) => {
  return blob
    .arrayBuffer()
    .then((buffer) => {
      const arrayBuffer = new Uint8Array(buffer, 0, buffer.byteLength)
      // 我们有的：ArrayBuffer 需要的：Uint8Array
      ffmpeg.FS("writeFile", "test.webm", arrayBuffer)
      console.log('开始转换');
      return ffmpeg.run("-i", "test.webm", "output.mp4")
    })
    .then(() => {
      console.log('转换完成');
      const array = ffmpeg.FS("readFile", "output.mp4")
      return new Blob([array])
    })
}

function App() {
  const videoRef = useRef<HTMLVideoElement>(null!)
  const recorderRef = useRef<MediaRecorder>(null!)
  // Blob
  const blobs = useRef<Array<Blob>>([])

  const onStart = () => {
    // navigator: 导航者
    // display: 显示器
    // stream: 流
    // MediaStream
    // src: source 源头
    // videoElement.srcObject = stream
    // track 视频轨或者音轨
    window.navigator.mediaDevices.getDisplayMedia().then((stream) => {
      videoRef.current.srcObject = stream
      const recorder = new MediaRecorder(stream)
      recorderRef.current = recorder
      // data available
      const dataAvailableListener = (event: BlobEvent) => {
        blobs.current.push(event.data)
      }
      recorder.addEventListener("dataavailable", dataAvailableListener)
      recorder.start()
    })
  }

  const onEnd = () => {
    const stream = videoRef.current.srcObject as MediaStream
    stream.getVideoTracks().forEach((track) => {
      track.stop()
    })
    recorderRef.current.stop()
  }

  // 转换成 mp4 格式的 blob
  const transformedBlob = useRef<Blob>(null!)
  const onTransform = async () => {
    /**
     * webm格式blob -> mp4格式blob
     */
    const videoBlob = new Blob(blobs.current)
    const mp4Blob = await transformWebm(videoBlob)
    console.log('完成！！')
    transformedBlob.current = mp4Blob
  }

  const onDownload = () => {
    const videoBlob = transformedBlob.current
    const url = URL.createObjectURL(videoBlob)

    // 下载视频
    const link = document.createElement("a")
    link.href = url
    link.download = "test.mp4"
    document.body.appendChild(link)
    link.style.display = "none"
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    blobs.current = []
  }

  return (
    <div className="App" style={{ margin: 100 }}>
      <button onClick={onStart}>开始录制</button>
      <button onClick={onEnd}>结束录制</button>
      <button onClick={onTransform}>转换格式</button>
      <button onClick={onDownload}>下载</button>
      <video ref={videoRef} autoPlay></video>
    </div>
  )
}

export default App
