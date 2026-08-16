"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@jayantgoyal/web-ui/card";
import { Button } from "@jayantgoyal/web-ui/button";
import { Camera, Video, Download } from "lucide-react";
import { toast } from "sonner";

import { useCamera } from "./use-camera";

export default function CameraRecorderClient() {
  const {
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
  } = useCamera();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Camera</CardTitle>
          <CardDescription>
            Access your camera to take photos or record videos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            {!stream ? (
              <Button onClick={startCamera}>Start Camera</Button>
            ) : (
              <>
                <Button variant="destructive" onClick={stopCamera}>
                  Stop Camera
                </Button>
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
                style={{ transform: "scaleX(-1)" }}
                onLoadedMetadata={() => {
                  if (videoRef.current && videoRef.current.videoWidth > 0) {
                    setVideoReady(true);
                  }
                }}
                onCanPlay={() => {
                  if (videoRef.current && videoRef.current.videoWidth > 0) {
                    setVideoReady(true);
                  }
                }}
                onPlaying={() => {
                  if (videoRef.current && videoRef.current.videoWidth > 0) {
                    setVideoReady(true);
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
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photoUrl}
                  alt="Captured"
                  className="w-full max-w-md rounded border mx-auto"
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    const a = document.createElement("a");
                    a.href = photoUrl;
                    a.download = `photo-${Date.now()}.png`;
                    a.click();
                    toast.success("Photo downloaded");
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
  );
}
