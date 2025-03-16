import { useCallback, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ImageIcon, UploadIcon, Camera } from "lucide-react";

interface ImageUploadProps {
  value: string | null;
  onChange: (value: string | null) => void;
  className?: string;
}

export function ImageUpload({ value, onChange, className }: ImageUploadProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user" }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCapturing(true);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL('image/jpeg').split(',')[1];
        onChange(base64);

        // Stop camera stream
        const stream = video.srcObject as MediaStream;
        stream?.getTracks().forEach(track => track.stop());
        setIsCapturing(false);
      }
    }
  };

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64 = (e.target?.result as string).split(",")[1];
          onChange(base64);
        };
        reader.readAsDataURL(file);
      }
    },
    [onChange],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png"],
    },
    maxFiles: 1,
  });

  return (
    <Card
      {...getRootProps()}
      className={`relative border-2 border-dashed cursor-pointer hover:border-primary/50 transition ${className}`}
    >
      <input {...getInputProps()} />
      {isCapturing ? (
        <div className="relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          <Button
            onClick={(e) => {
              e.stopPropagation();
              capturePhoto();
            }}
            className="absolute bottom-4 left-1/2 transform -translate-x-1/2"
          >
            Take Photo
          </Button>
          <canvas ref={canvasRef} className="hidden" />
        </div>
      ) : value ? (
        <img
          src={`data:image/jpeg;base64,${value}`}
          alt="Preview"
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="flex flex-col items-center justify-center p-10 text-center">
          {isDragActive ? (
            <UploadIcon className="h-10 w-10 text-muted-foreground mb-4" />
          ) : (
            <div className="space-y-4">
              <ImageIcon className="h-10 w-10 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">
                Drag & drop your photo here, or click to select
              </p>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  startCamera();
                }}
                variant="outline"
                className="mx-auto"
              >
                <Camera className="h-4 w-4 mr-2" />
                Use Camera
              </Button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}