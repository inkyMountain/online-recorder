/**
 * mkv, webm, mp4, flv
 */
export const downloadBlob = (
  blob: Blob | Blob[],
  options: {
    extensionName: SupportedExtensionNames
    filename: string
  },
) => {
  const { extensionName, filename } = options
  const extensionNameRecord: Record<
    SupportedExtensionNames,
    SupportedMimeTypes
  > = {
    webm: "video/webm",
    mp4: "video/mp4",
    flv: "video/x-flv",
    mkv: "video/x-matroska",
    avi: "video/x-msvideo",
  }
  const mimeType = extensionNameRecord[extensionName]
  const blobArray = Array.isArray(blob) ? blob : [blob]
  const mergedBlob = new Blob(blobArray, { type: mimeType })
  const url = URL.createObjectURL(mergedBlob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.style.display = "none"
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
