import { useEffect, useRef, useState } from "react"
import { createFFmpeg } from "@ffmpeg/ffmpeg"
import "./App.scss"
import classnames from "classnames"
import { Modal, Select } from "antd"
import type { SelectProps } from "antd"
import { downloadBlob } from "./utils/download"

const ffmpeg = createFFmpeg()
ffmpeg.load().then(() => {
  console.log("加载完成")
})
ffmpeg.setProgress(({ ratio }) => {
  console.log("ratio ===========>", ratio)
})
ffmpeg.setLogger(({ type, message }) => {
  console.log(type, message)
  /*
   * type can be one of following:
   *
   * info: internal workflow debug messages
   * fferr: ffmpeg native stderr output
   * ffout: ffmpeg native stdout output
   */
})
// file system
// mkdir: make directory
// ffmpeg.FS('mkdir')
// ffmpeg.run('ffmpeg', '-i', 'test.webm')

const transformVideoFormat = async (
  blob: Blob,
  {
    inputFilename,
    outputFilename,
  }: {
    inputFilename: string
    outputFilename: string
  },
) => {
  return blob
    .arrayBuffer()
    .then((buffer) => {
      const arrayBuffer = new Uint8Array(buffer, 0, buffer.byteLength)
      // 我们有的：ArrayBuffer 需要的：Uint8Array
      ffmpeg.FS("writeFile", inputFilename, arrayBuffer)
      console.log("开始转换")
      return ffmpeg.run("-i", inputFilename, outputFilename)
    })
    .then(() => {
      console.log("转换完成")
      const array = ffmpeg.FS("readFile", outputFilename)
      return new Blob([array])
    })
}

function App() {
  const videoRef = useRef<HTMLVideoElement>(null!)
  const recorderRef = useRef<MediaRecorder>(null!)
  // Blob
  const blobs = useRef<Array<Blob>>([])

  const [deviceList, setDeviceList] = useState<{
    audioInput: MediaDeviceInfo[]
    videoInput: MediaDeviceInfo[]
  }>({
    audioInput: [],
    videoInput: [],
  })

  const [isGetUserMediaModalOpen, setIsGetUserMediaModalOpen] = useState(false)

  const onStart = () => {
    // navigator: 导航者
    // display: 显示器
    // stream: 流
    // MediaStream
    // src: source 源头
    // videoElement.srcObject = stream
    // track 视频轨或者音轨
    blobs.current = []
    window.navigator.mediaDevices
      .getDisplayMedia({
        audio: {},
        // video: true,
      })
      .then((stream) => {
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
    stream.getTracks().forEach((track) => {
      track.stop()
    })
    recorderRef.current.stop()
  }

  const onDownload = () => {
    setIsDownloadModalOpen(true)
    // downloadBlob(blobs.current, {
    //   filename: "test",
    //   mimeType: "video/x-msvideo",
    // })
    // blobs.current = []
  }

  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false)
  const [selectedVideoFormat, setSelectedVideoFormat] =
    useState<SupportedExtensionNames>("mp4")
  const videoFormatOptions: SelectProps["options"] = [
    {
      label: "mp4",
      value: "mp4",
    },
    {
      label: "flv",
      value: "flv",
    },
    {
      label: "mkv",
      value: "mkv",
    },
    {
      label: "avi",
      value: "avi",
    },
  ]

  const [isConfirmButtonLoading, setIsConfirmButtonLoading] = useState(false)

  const onConfirmDownload = async () => {
    setIsConfirmButtonLoading(true)
    // 1. 转换 blob 的格式
    const videoBlob = new Blob(blobs.current)
    const outputFilename = `output.${selectedVideoFormat}`
    const transformedBlob = await transformVideoFormat(videoBlob, {
      inputFilename: "test.webm",
      outputFilename,
    })

    // 2. 下载 blob
    downloadBlob(transformedBlob, {
      extensionName: selectedVideoFormat,
      filename: outputFilename,
    })
    // downloadBlob(videoBlob, {
    //   extensionName: selectedVideoFormat,
    //   filename: "output.webm",
    // })
    setIsConfirmButtonLoading(false)
    console.log("下载完成")
  }

  const createOptions = (devices: MediaDeviceInfo[]) => {
    return devices.map((device) => {
      return {
        label: device.label,
        value: device.deviceId,
      }
    })
  }

  const audioOptions: SelectProps["options"] = createOptions(
    deviceList.audioInput,
  )
  const videoOptions: SelectProps["options"] = createOptions(
    deviceList.videoInput,
  )
  const [deviceId, setDeviceId] = useState<{ audio: string; video: string }>({
    audio: "",
    video: "",
  })
  const constraints: MediaStreamConstraints = {
    video: {
      width: 1080,
      height: 720,
    },
    audio: {},
  }
  // 筛选有效的设备
  const filterValidDeivces = (devices: MediaDeviceInfo[]) => {
    return devices.filter((device) => device.deviceId && device.groupId)
  }
  const onCameraClick = () => {
    window.navigator.mediaDevices
      .getUserMedia(constraints)
      .then((stream) => {
        const audioInputDeviceNumber = filterValidDeivces(
          deviceList.audioInput,
        ).length
        const videoInputDeviceNumber = filterValidDeivces(
          deviceList.videoInput,
        ).length
        if (audioInputDeviceNumber === 0 || videoInputDeviceNumber === 0) {
          // 首次获得用户的权限
          onDeviceChange()
        }
        stream.getTracks().forEach((track) => {
          track.stop()
        })
        setIsGetUserMediaModalOpen(true)
      })
      .catch((error) => {
        alert("兄弟你不给权限我很难办啊")
      })
    return
  }

  // 当用户点击请求用户媒体，并且点击弹窗中的开始录屏，就会调用这个函数。
  const onStartRecord = () => {
    constraints.audio = {
      deviceId: deviceId.audio,
    }
    constraints.video = {
      deviceId: deviceId.video,
    }
    setIsGetUserMediaModalOpen(false)
    window.navigator.mediaDevices
      .getUserMedia(constraints)
      .then((stream) => {
        videoRef.current.srcObject = stream
        const recorder = new MediaRecorder(stream)
        recorderRef.current = recorder
        blobs.current = []
        const dataAvailableListener = (event: BlobEvent) => {
          blobs.current.push(event.data)
        }
        recorder.addEventListener("dataavailable", dataAvailableListener)
        recorder.start()
      })
      .catch((error) => {
        console.log(`请求用户媒体失败, error: ${error}`)
      })
  }

  const onDeviceChange = () => {
    window.navigator.mediaDevices.enumerateDevices().then((devices) => {
      const audioInputDevices = devices.filter(
        (device) => device.kind === "audioinput",
      )
      const videoInputDevices = devices.filter(
        (device) => device.kind === "videoinput",
      )
      setDeviceList({
        audioInput: audioInputDevices,
        videoInput: videoInputDevices,
      })
    })
  }

  useEffect(() => {
    onDeviceChange()
    window.navigator.mediaDevices.addEventListener(
      "devicechange",
      onDeviceChange,
    )

    return () => {
      window.navigator.mediaDevices.removeEventListener(
        "devicechange",
        onDeviceChange,
      )
    }
  }, [])

  const startRecordButtonDisabled = !deviceId.audio || !deviceId.video
  /**
   * todo
   * 720p 1080 * 720
   * 1080p 1920 * 1080
   * 2k
   * 4k
   * Select string 1080x720
   * resolution.split('x') ["1080", "720"]
   * parseInt()
   */

  return (
    <div className="App">
      <div className="buttons">
        <button onClick={onCameraClick}>请求用户媒体</button>
        <button onClick={onStart}>开始录制</button>
        <button onClick={onEnd}>结束录制</button>
        <button onClick={onDownload}>下载</button>
      </div>

      <div className="video-container">
        <video ref={videoRef} autoPlay></video>
      </div>

      <Modal
        open={isGetUserMediaModalOpen}
        okText="开始录屏"
        cancelText="取消"
        // close + able: 是否显示x按钮，用于关闭弹窗。
        closable={false}
        onOk={onStartRecord}
        onCancel={() => {
          setIsGetUserMediaModalOpen(false)
        }}
        okButtonProps={{ disabled: startRecordButtonDisabled }}
      >
        <div>
          选择音频设备：
          <Select
            style={{ width: "100%" }}
            value={deviceId.audio}
            onChange={(value) => {
              setDeviceId((deviceIds) => {
                return {
                  ...deviceIds,
                  audio: value,
                }
              })
            }}
            options={audioOptions}
          />
        </div>
        <div className="video-device-selector">
          选择视频设备：
          <Select
            style={{ width: "100%" }}
            // value + onChange = 受控模式，代码会繁琐一些，但是对值有很强的掌控能力。
            value={deviceId.video}
            onChange={(value) => {
              setDeviceId((deviceIds) => {
                return {
                  ...deviceIds,
                  video: value,
                }
              })
            }}
            options={videoOptions}
          />
        </div>
      </Modal>

      <Modal
        open={isDownloadModalOpen}
        okText="下载"
        cancelText="取消"
        closable={false}
        onOk={onConfirmDownload}
        onCancel={() => {
          setIsDownloadModalOpen(false)
        }}
        okButtonProps={{ loading: isConfirmButtonLoading }}
      >
        <div>
          选择下载视频的格式：
          <Select
            style={{ width: "100%" }}
            value={selectedVideoFormat}
            onChange={(value) => {
              setSelectedVideoFormat(value)
            }}
            options={videoFormatOptions}
          />
        </div>
      </Modal>
    </div>
  )
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
