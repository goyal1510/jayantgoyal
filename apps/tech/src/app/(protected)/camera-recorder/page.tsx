"use client"

import * as React from "react"
import { getToolByPath } from "@/lib/tools"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Camera, Video, Download } from "lucide-react"
import { toast } from "sonner"

export default function CameraRecorderPage() {
  const tool = getToolByPath("/camera-recorder")
  const [stream, setStream] = React.useState<MediaStream | null>(null)
  const [recording, setRecording] = React.useState(false)
  const [mediaRecorder, setMediaRecorder] = React.useState<MediaRecorder | null>(null)
  const [recordedChunks, setRecordedChunks] = React.useState<Blob[]>([])
  const [photoUrl, setPhotoUrl] = React.useState<string | null>(null)
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const canvasRef = React.useRef<HTMLCanvasElement>(null)

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (error) {
      toast.error("Failed to access camera")
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
  }

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current
      const video = videoRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.drawImage(video, 0, 0)
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob)
            setPhotoUrl(url)
          }
        })
      }
    }
  }

  const startRecording = () => {
    if (!stream) return
    
    const chunks: Blob[] = []
    const recorder = new MediaRecorder(stream)
    
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data)
      }
    }
    
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `recording-${Date.now()}.webm`
      a.click()
      toast.success("Video downloaded")
      setRecordedChunks([])
    }
    
    recorder.start()
    setMediaRecorder(recorder)
    setRecording(true)
  }

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop()
      setRecording(false)
    }
  }

  React.useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [stream])

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
                <Button onClick={takePhoto} disabled={recording}>
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
                className="w-full max-w-md rounded border"
              />
              <canvas ref={canvasRef} className="hidden" />
            </div>
          )}

          {photoUrl && (
            <div className="space-y-2">
              <p className="text-sm font-semibold">Captured Photo:</p>
              <img src={photoUrl} alt="Captured" className="max-w-md rounded border" />
              <Button
                variant="outline"
                onClick={() => {
                  const a = document.createElement("a")
                  a.href = photoUrl
                  a.download = `photo-${Date.now()}.png`
                  a.click()
                  toast.success("Photo downloaded")
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Download Photo
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
