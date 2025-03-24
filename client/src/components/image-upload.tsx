import { useCallback, useState, useRef } from "react";
import { useDropzone } from "react-dropzone";
import Webcam from "react-webcam";
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
  const webcamRef = useRef<Webcam>(null);
  const { toast } = useToast();

  const startCamera = () => {
    setIsCameraActive(true);
  };

  const stopCamera = () => {
    setIsCameraActive(false);
  };

  const capturePhoto = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      processImage(dataURLtoFile(imageSrc, 'webcam-photo.jpg'));
      stopCamera();
    }
  }, [webcamRef, onChange]);

  const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  const processImage = async (file: File) => {
    setIsProcessing(true);
    try {
      // Create a new image element
      const img = new Image();
      const reader = new FileReader();

      reader.onload = () => {
        img.src = reader.result as string;
        img.onload = () => {
          // Create canvas for resizing
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            throw new Error("Could not get canvas context");
          }

          // Calculate new dimensions while maintaining aspect ratio
          let { width, height } = img;
          const MAX_SIZE = 2048;
          const MIN_SIZE = 512;

          // Scale down if larger than max size
          if (width > MAX_SIZE || height > MAX_SIZE) {
            if (width > height) {
              height = (height * MAX_SIZE) / width;
              width = MAX_SIZE;
            } else {
              width = (width * MAX_SIZE) / height;
              height = MAX_SIZE;
            }
          }

          // Scale up if smaller than min size
          if (width < MIN_SIZE || height < MIN_SIZE) {
            if (width < height) {
              height = (height * MIN_SIZE) / width;
              width = MIN_SIZE;
            } else {
              width = (width * MIN_SIZE) / height;
              height = MIN_SIZE;
            }
          }

          // Set canvas dimensions
          canvas.width = width;
          canvas.height = height;

          // Draw and compress image
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to JPEG format with quality adjustment
          let quality = 0.95;
          let compressedBase64 = canvas.toDataURL('image/jpeg', quality);

          // Reduce quality if size is too large (20MB limit)
          while (compressedBase64.length * 0.75 > 20 * 1024 * 1024 && quality > 0.5) {
            quality -= 0.05;
            compressedBase64 = canvas.toDataURL('image/jpeg', quality);
          }

          // Extract base64 data (remove data:image/jpeg;base64, prefix)
          const base64Data = compressedBase64.split(',')[1];
          onChange(base64Data);
        };
      };

      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Error processing image:', err);
      toast({
        title: "Error",
        description: "Failed to process image. Please try again with a different photo.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': [] },
    maxFiles: 1,
    onDrop: async ([file]) => {
      if (file) {
        await processImage(file);
      }
    },
  });

  return (
    <Card
      {...getRootProps()}
      className={`relative border-2 border-dashed cursor-pointer hover:border-primary/50 transition ${className}`}
    >
      <input {...getInputProps()} />
      {isCameraActive ? (
        <div className="relative min-h-[400px] flex items-center justify-center">
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            videoConstraints={{
              width: 1280,
              height: 720,
              facingMode: "user"
            }}
            className="w-full h-[400px] object-cover"
            style={{ transform: 'scaleX(-1)' }}
          />
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
            <Button
              variant="secondary"
              onClick={(e) => {
                e.stopPropagation();
                stopCamera();
              }}
              className="bg-white/80 hover:bg-white"
            >
              Cancel
            </Button>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                capturePhoto();
              }}
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
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    startCamera();
                  }}
                >
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