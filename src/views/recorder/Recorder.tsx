import { SelectProps, message, Checkbox, Modal, Select } from "antd"
import { CheckboxGroupProps } from "antd/es/checkbox"
import { useEffect, useRef, useState } from "react"
import { downloadBlob } from "../../utils/download"
import ffmpegUtil from "../../utils/ffmpeg"

// 导出一个名为 Component 的路由组件。这是 react router 的约定。
export const Component = () => {
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
        audio: true,
        video: {},
      })
      .then((stream) => {
        videoRef.current.srcObject = stream
        const recorder = new MediaRecorder(stream)
        recorderRef.current = recorder
        const dataAvailableListener = (event: BlobEvent) => {
          blobs.current.push(event.data)
        }
        const recordStopListener = () => {}
        recorder.addEventListener("dataavailable", dataAvailableListener)
        recorder.start()
        // 视频录制结束后，解除所有的事件监听。
        const cleanup = () => {
          recorder.removeEventListener("dataavailable", dataAvailableListener)
          recorder.removeEventListener("stop", recordStopListener)
        }
        recorder.addEventListener("stop", cleanup)
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
    // downloadBlob(videoBlob, {
    //   extensionName: "webm",
    //   filename: "xxx.webm",
    // })
    // setIsConfirmButtonLoading(false)
    try {
      await ffmpegUtil.init()
      const transformedBlob = await ffmpegUtil.transformVideoFormat(videoBlob, {
        inputFilename: "test.webm",
        outputFilename,
      })

      // 2. 下载 blob
      downloadBlob(transformedBlob, {
        extensionName: selectedVideoFormat,
        filename: outputFilename,
      })
    } catch (error) {
      console.log(`视频下载失败`, error)
    } finally {
      setIsConfirmButtonLoading(false)
    }
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
        message.error("本页面需要录制权限，才能正常工作。")
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

        // const options = {
        //   mimeType: 'video/webm; codecs="av01.2.19H.12.0.000.09.16.09.1, flac"',
        //   bitsPerSecond: 1600 * Mbps,
        // }
        // const recorder = new MediaRecorder(stream, options)
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

  const streamSourceOptions = [
    {
      label: "摄像头",
      value: "camera",
    },
    {
      label: "屏幕捕获",
      value: "screen",
    },
  ]

  const onChange: CheckboxGroupProps["onChange"] = (checked) => {
    console.log("checked ===========>", checked)
  }
  return (
    <div className="App">
      <div className="buttons">
        <button onClick={onCameraClick}>请求用户媒体</button>
        <button onClick={onStart}>开始录制</button>
        <button onClick={onEnd}>结束录制</button>
        <button onClick={onDownload}>下载</button>
        <Checkbox.Group
          options={streamSourceOptions}
          defaultValue={["Apple"]}
          onChange={onChange}
        />
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
