"use client"

import * as React from "react"
import { getToolByPath } from "@/lib/tools"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Camera, Video, Download } from "lucide-react"
import { toast } from "sonner"

export default function CameraRecorderPage() {
  const tool = getToolByPath("/media-qr/camera-recorder")
  const [stream, setStream] = React.useState<MediaStream | null>(null)
  const [recording, setRecording] = React.useState(false)
  const [mediaRecorder, setMediaRecorder] = React.useState<MediaRecorder | null>(null)
  const [recordedChunks, setRecordedChunks] = React.useState<Blob[]>([])
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
    
    // Check if video is ready and has valid dimensions
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
            // Clean up previous photo URL
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
      // Clean up previous video URL
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

  // Check video readiness periodically when stream is active
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

    // Check immediately
    if (checkVideoReady()) {
      return
    }

    // Check periodically until ready
    const interval = setInterval(() => {
      if (checkVideoReady()) {
        clearInterval(interval)
      }
    }, 100)

    // Also listen to video events
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

  if (!tool) {
    return <div>Tool not found</div>
  }
return (
    <div className="space-y-6"><Card>
        <CardHeader>
          <CardTitle>Camera</CardTitle>
          <CardDescription>Access your camera to take photos or record videos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            {!stream ? (
              <Button onClick={startCamera}>Start Camera</Button>
            ) : (
              <>
                <Button variant="destructive" onClick={stopCamera}>Stop Camera</Button>
                <Button onClick={takePhoto} disabled={recording || !videoReady}>
                  <Camera className="h-4 w-4 mr-2" />
                  Take Photo
                </Button>
                {!recording ? (
                  <Button onClick={startRecording}>
                    <Video className="h-4 w-4 mr-2" />
                    Start Recording
                  </Button>
                ) : (
                  <Button variant="destructive" onClick={stopRecording}>
                    Stop Recording
                  </Button>
                )}
              </>
            )}
          </div>

          {stream && (
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full max-w-md rounded border bg-black"
                style={{ transform: 'scaleX(-1)' }}
                onLoadedMetadata={() => {
                  if (videoRef.current && videoRef.current.videoWidth > 0) {
                    setVideoReady(true)
                  }
                }}
                onCanPlay={() => {
                  if (videoRef.current && videoRef.current.videoWidth > 0) {
                    setVideoReady(true)
                  }
                }}
                onPlaying={() => {
                  if (videoRef.current && videoRef.current.videoWidth > 0) {
                    setVideoReady(true)
                  }
                }}
              />
              <canvas ref={canvasRef} className="hidden" />
              {!videoReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded z-10">
                  <p className="text-white">Loading camera...</p>
                </div>
              )}
              {recording && (
                <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2 z-20">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  Recording
                </div>
              )}
            </div>
          )}

          {photoUrl && (
            <Card>
              <CardHeader>
                <CardTitle>Captured Photo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <img src={photoUrl} alt="Captured" className="w-full max-w-md rounded border mx-auto" />
                <Button
                  variant="outline"
                  onClick={() => {
                    const a = document.createElement("a")
                    a.href = photoUrl
                    a.download = `photo-${Date.now()}.png`
                    a.click()
                    toast.success("Photo downloaded")
                  }}
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Photo
                </Button>
              </CardContent>
            </Card>
          )}

          {videoUrl && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recorded Video</CardTitle>
                  <Button variant="outline" onClick={downloadVideo}>
                    <Download className="h-4 w-4 mr-2" />
                    Download Video
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <video
                  src={videoUrl}
                  controls
                  className="w-full max-w-md rounded border mx-auto"
                >
                  Your browser does not support the video tag.
                </video>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
