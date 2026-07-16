"use client"

import * as React from "react"
import { toast } from "sonner"

export function useCamera() {
  const [stream, setStream] = React.useState<MediaStream | null>(null)
  const [recording, setRecording] = React.useState(false)
  const [mediaRecorder, setMediaRecorder] = React.useState<MediaRecorder | null>(null)
  const [, setRecordedChunks] = React.useState<Blob[]>([])
  const [photoUrl, setPhotoUrl] = React.useState<string | null>(null)
  const [videoUrl, setVideoUrl] = React.useState<string | null>(null)
  const [videoReady, setVideoReady] = React.useState(false)
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const canvasRef = React.useRef<HTMLCanvasElement>(null)

  const startCamera = async () => {
    try {
      setVideoReady(false)
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: true
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        videoRef.current.play().catch(err => {
          console.error("Error playing video:", err)
          toast.error("Failed to start camera preview")
        })
      }
      toast.success("Camera started")
    } catch (error) {
      console.error("Camera error:", error)
      toast.error("Failed to access camera. Please check permissions.")
      setVideoReady(false)
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    if (recording && mediaRecorder) {
      mediaRecorder.stop()
      setRecording(false)
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) {
      toast.error("Camera not started")
      return
    }

    const canvas = canvasRef.current
    const video = videoRef.current

    if (video.videoWidth === 0 || video.videoHeight === 0) {
      toast.warning("Camera feed not ready. Please wait for the video to load.")
      return
    }

    try {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext("2d")

      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        canvas.toBlob((blob) => {
          if (blob) {
            if (photoUrl) {
              URL.revokeObjectURL(photoUrl)
            }
            const url = URL.createObjectURL(blob)
            setPhotoUrl(url)
            toast.success("Photo captured!")
          } else {
            toast.error("Failed to capture photo")
          }
        }, "image/png")
      } else {
        toast.error("Failed to get canvas context")
      }
    } catch (error) {
      console.error("Photo capture error:", error)
      toast.error("Failed to capture photo. Please try again.")
    }
  }

  const startRecording = () => {
    if (!stream) {
      toast.error("Camera not started")
      return
    }

    const chunks: Blob[] = []
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : MediaRecorder.isTypeSupported('video/webm')
      ? 'video/webm'
      : 'video/mp4'

    const recorder = new MediaRecorder(stream, { mimeType })

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data)
      }
    }

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType })
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl)
      }
      const url = URL.createObjectURL(blob)
      setVideoUrl(url)
      setRecordedChunks([])
      toast.success("Recording stopped. Preview available below.")
    }

    try {
      recorder.start()
      setMediaRecorder(recorder)
      setRecording(true)
      toast.success("Recording started")
    } catch (error) {
      console.error("Recording error:", error)
      toast.error("Failed to start recording")
    }
  }

  const stopRecording = () => {
    if (mediaRecorder && recording) {
      mediaRecorder.stop()
      setRecording(false)
    }
  }

  const downloadVideo = () => {
    if (!videoUrl) return
    const a = document.createElement("a")
    a.href = videoUrl
    a.download = `recording-${Date.now()}.webm`
    a.click()
    toast.success("Video downloaded")
  }

  React.useEffect(() => {
    if (!stream || !videoRef.current) return

    const checkVideoReady = () => {
      const video = videoRef.current
      if (video && video.videoWidth > 0 && video.videoHeight > 0) {
        setVideoReady(true)
        return true
      }
      return false
    }

    if (checkVideoReady()) {
      return
    }

    const interval = setInterval(() => {
      if (checkVideoReady()) {
        clearInterval(interval)
      }
    }, 100)

    const video = videoRef.current
    const handleReady = () => {
      if (checkVideoReady()) {
        clearInterval(interval)
        video.removeEventListener('loadedmetadata', handleReady)
        video.removeEventListener('canplay', handleReady)
        video.removeEventListener('playing', handleReady)
      }
    }

    video.addEventListener('loadedmetadata', handleReady)
    video.addEventListener('canplay', handleReady)
    video.addEventListener('playing', handleReady)

    return () => {
      clearInterval(interval)
      video.removeEventListener('loadedmetadata', handleReady)
      video.removeEventListener('canplay', handleReady)
      video.removeEventListener('playing', handleReady)
    }
  }, [stream])

  React.useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
      if (photoUrl) {
        URL.revokeObjectURL(photoUrl)
      }
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl)
      }
    }
  }, [stream, photoUrl, videoUrl])

  return {
    stream,
    recording,
    photoUrl,
    videoUrl,
    videoReady,
    setVideoReady,
    videoRef,
    canvasRef,
    startCamera,
    stopCamera,
    takePhoto,
    startRecording,
    stopRecording,
    downloadVideo,
  }
}
