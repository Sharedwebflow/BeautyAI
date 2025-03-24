import { useCallback, useState, useRef, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ImageIcon, UploadIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ImageUploadProps {
  value: string | null;
  onChange: (value: string | null) => void;
  className?: string;
}

export function ImageUpload({ value, onChange, className }: ImageUploadProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (err) {
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg');
        onChange(dataUrl.split(',')[1]);
        stopCamera();
      }
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const processImage = async (file: File) => {
    setIsProcessing(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        if (!e.target?.result) return;

        // Create an image element to check dimensions and compress if needed
        const img = new Image();
        img.src = e.target.result as string;

        img.onload = () => {
          // Create canvas for potential resizing and compression
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            throw new Error("Could not get canvas context");
          }

          // Set maximum dimensions while maintaining aspect ratio
          const MAX_SIZE = 800;
          let width = img.width;
          let height = img.height;

          if (width > MAX_SIZE || height > MAX_SIZE) {
            if (width > height) {
              height = Math.round((height * MAX_SIZE) / width);
              width = MAX_SIZE;
            } else {
              width = Math.round((width * MAX_SIZE) / height);
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;

          // Draw and compress image
          ctx.drawImage(img, 0, 0, width, height);
          const base64 = canvas.toDataURL('image/jpeg', 0.9).split(',')[1];
          onChange(base64);
        };
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error processing image:', error);
      toast({
        title: "Error",
        description: "Failed to process image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        processImage(file);
      }
    },
    [onChange, toast]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png"],
    },
    maxFiles: 1,
    disabled: isProcessing,
  });

  return (
    <Card
      {...getRootProps()}
      className={`relative border-2 border-dashed cursor-pointer hover:border-primary/50 transition ${className}`}
    >
      <input {...getInputProps()} />
      {isCameraActive ? (
        <div className="relative min-h-[300px] flex items-center justify-center">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            style={{ width: '100%', height: '300px', objectFit: 'cover' }}
          />
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
            <Button
              variant="secondary"
              onClick={stopCamera}
              className="bg-white/80 hover:bg-white"
            >
              Cancel
            </Button>
            <Button
              onClick={capturePhoto}
              className="bg-primary/80 hover:bg-primary"
            >
              Take Photo
            </Button>
          </div>
        </div>
      ) : value ? (
        <div className="relative min-h-[300px]">
          <img
            src={`data:image/jpeg;base64,${value}`}
            alt="Preview"
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-10 text-center">
          {isProcessing ? (
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              <p className="text-sm text-muted-foreground">Processing image...</p>
            </div>
          ) : isDragActive ? (
            <UploadIcon className="h-10 w-10 text-muted-foreground mb-4" />
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-4">
                <ImageIcon className="h-10 w-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Drag & drop your photo here, or click to select
                </p>
                <Button variant="outline" onClick={startCamera}>
                  Open Camera
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}