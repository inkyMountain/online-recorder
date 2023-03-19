import { useEffect, useRef, useState } from "react"
import { createFFmpeg } from "@ffmpeg/ffmpeg"
import "./App.scss"
import classnames from "classnames"
import { Modal, Select } from "antd"
import type { SelectProps } from "antd"
import { downloadBlob } from "./utils/download"

// const ffmpeg = createFFmpeg()
// ffmpeg.load().then(() => {
//   console.log("加载完成")
// })
// ffmpeg.setProgress(({ ratio }) => {
//   console.log("ratio ===========>", ratio)
// })
// ffmpeg.setLogger(({ type, message }) => {
//   console.log(type, message)
//   /*
//    * type can be one of following:
//    *
//    * info: internal workflow debug messages
//    * fferr: ffmpeg native stderr output
//    * ffout: ffmpeg native stdout output
//    */
// })
// // file system
// // mkdir: make directory
// // ffmpeg.FS('mkdir')
// // ffmpeg.run('ffmpeg', '-i', 'test.webm')

// const transformWebm = async (blob: Blob) => {
//   return blob
//     .arrayBuffer()
//     .then((buffer) => {
//       const arrayBuffer = new Uint8Array(buffer, 0, buffer.byteLength)
//       // 我们有的：ArrayBuffer 需要的：Uint8Array
//       ffmpeg.FS("writeFile", "test.webm", arrayBuffer)
//       console.log("开始转换")
//       return ffmpeg.run("-i", "test.webm", "output.mp4")
//     })
//     .then(() => {
//       console.log("转换完成")
//       const array = ffmpeg.FS("readFile", "output.mp4")
//       return new Blob([array])
//     })
// }

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
    stream.getTracks().forEach((track) => {
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
    // const videoBlob = new Blob(blobs.current)
    // const mp4Blob = await transformWebm(videoBlob)
    // console.log("完成！！")
    // transformedBlob.current = mp4Blob
  }

  const onDownload = () => {
    downloadBlob(blobs.current, {
      filename: "test",
      mimeType: "video/webm",
    })
    blobs.current = []
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
    video: {},
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

  return (
    <div className="App">
      <div className="buttons">
        <button onClick={onCameraClick}>请求用户媒体</button>
        <button onClick={onStart}>开始录制</button>
        <button onClick={onEnd}>结束录制</button>
        <button onClick={onTransform}>转换格式</button>
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
    </div>
  )
}

export default App

/**
 * 输入: 屏幕视频stream, 摄像头、录音设备的stream。
 * 导出: 下载文件，URLObject。
 * 设备列表：列出所有音频和视频设备

下周工作：
   音频的质量
   视频的分辨率
   以什么视频格式导出
   将录屏和摄像头视频组合起来
 */
