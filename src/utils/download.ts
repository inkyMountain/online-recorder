/**
 * mkv, webm, mp4, flv
 */
export const downloadBlob = (
  blob: Blob | Blob[],
  options: {
    mimeType: "video/webm" | "video/x-matroska" | "video/mp4" | "video/x-flv"
    filename: string
  },
) => {
  const { mimeType, filename } = options
  type ExtensionNameKeys = typeof options.mimeType
  const extensionNameRecord: Record<ExtensionNameKeys, string> = {
    "video/webm": "webm",
    "video/mp4": "mp4",
    "video/x-flv": "flv",
    "video/x-matroska": "mkv",
  }
  const extensionName = extensionNameRecord[mimeType]
  const blobArray = Array.isArray(blob) ? blob : [blob]
  const mergedBlob = new Blob(blobArray, { type: mimeType })
  const url = URL.createObjectURL(mergedBlob)
  const link = document.createElement("a")
  link.href = url
  link.download = `${filename}.${extensionName}`
  document.body.appendChild(link)
  link.style.display = "none"
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
