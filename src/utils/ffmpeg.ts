import { createFFmpeg } from "@ffmpeg/ffmpeg"
import type { FFmpeg } from "@ffmpeg/ffmpeg"

let ffmpeg: FFmpeg

/**
 * 转换视频格式
 * @param blob 需要转换的视频 blob
 * @param param1.inputFilename 存储到 ffmpeg 文件系统时的名字
 * @param param1.outputFilename 存储到 ffmpeg 文件系统时的名字
 * @returns
 */
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
      console.log(`开始转换: ${inputFilename}`)
      return ffmpeg.run("-i", inputFilename, outputFilename)
    })
    .then(() => {
      console.log(`转换完成: ${outputFilename}`)
      const array = ffmpeg.FS("readFile", outputFilename)
      // 在转换完成后，把存储的文件删掉。不然一个视频就会占用比自身体积好几倍的内存。
      ffmpeg.FS("unlink", inputFilename)
      const outputFileBlob = new Blob([array])
      ffmpeg.FS("unlink", outputFilename)
      return outputFileBlob
    })
}

let hasInit = false
const init = async () => {
  // 使用一个变量标记是否已经初始化
  if (hasInit) {
    console.log("不能重复初始化 ffmpeg")
    return
  }
  hasInit = true
  const ffmpeg = createFFmpeg({
    log: true,
  })
  ffmpeg.setProgress((progress) => {
    console.log("progress ===========>", progress)
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
  await ffmpeg
    .load()
    .then(() => {
      console.log("ffmpeg 加载完成")
    })
    .catch((error) => {
      // 如果ffmpeg加载失败，需要让 hasInit 变为 false，允许再次调用 init 函数。
      hasInit = false
      console.error("ffmpeg 加载失败", error)
    })
}

const ffmpegUtil = {
  transformVideoFormat,
  init,
}

export default ffmpegUtil
