import { useCallback, useRef, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ImageIcon, UploadIcon } from "lucide-react";
import * as faceapi from 'face-api.js';
import { useToast } from "@/hooks/use-toast";

interface ImageUploadProps {
  value: string | null;
  onChange: (value: string | null) => void;
  className?: string;
}

export function ImageUpload({ value, onChange, className }: ImageUploadProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isWebGLAvailable, setIsWebGLAvailable] = useState(true);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  // Check WebGL support
  useEffect(() => {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    setIsWebGLAvailable(!!gl);
  }, []);

  // Load face detection models
  useEffect(() => {
    const loadModels = async () => {
      try {
        if (!isWebGLAvailable) {
          // Load only TinyFaceDetector for CPU-only mode
          await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
        } else {
          // Load full feature set for WebGL
          await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
            faceapi.nets.faceLandmark68Net.loadFromUri('/models')
          ]);
        }
        setModelsLoaded(true);
      } catch (error) {
        console.error('Error loading face detection models:', error);
        toast({
          title: "Model Loading Error",
          description: "Using basic image processing. Quality may be reduced.",
          variant: "warning",
        });
        // Still allow uploads even if model loading fails
        setModelsLoaded(true);
      }
    };
    loadModels();
  }, [isWebGLAvailable, toast]);

  const processImage = async (file: File) => {
    if (!modelsLoaded) {
      toast({
        title: "Please wait",
        description: "Image processing is initializing...",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = async (e) => {
        if (!e.target?.result) return;

        img.src = e.target.result as string;
        img.onload = async () => {
          try {
            let detection;
            if (isWebGLAvailable) {
              // Full detection with landmarks
              detection = await faceapi.detectSingleFace(
                img, 
                new faceapi.TinyFaceDetectorOptions()
              ).withFaceLandmarks();
            } else {
              // Basic detection only
              detection = await faceapi.detectSingleFace(
                img, 
                new faceapi.TinyFaceDetectorOptions()
              );
            }

            if (!detection) {
              toast({
                title: "No face detected",
                description: "Please upload a clear photo of your face",
                variant: "destructive",
              });
              setIsProcessing(false);
              return;
            }

            // Create canvas for cropping
            const canvas = document.createElement('canvas');
            const box = detection.box || detection.detection.box;

            // Add padding around the face
            const padding = {
              x: box.width * 0.4,
              y: box.height * 0.4
            };

            // Ensure we don't exceed image boundaries
            const cropX = Math.max(0, box.x - padding.x);
            const cropY = Math.max(0, box.y - padding.y);
            const cropWidth = Math.min(img.width - cropX, box.width + (padding.x * 2));
            const cropHeight = Math.min(img.height - cropY, box.height + (padding.y * 2));

            canvas.width = cropWidth;
            canvas.height = cropHeight;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
              throw new Error("Could not get canvas context");
            }

            // Draw cropped face with padding
            ctx.drawImage(
              img,
              cropX,
              cropY,
              cropWidth,
              cropHeight,
              0,
              0,
              canvas.width,
              canvas.height
            );

            // Convert to base64 with quality adjustment
            const base64 = canvas.toDataURL('image/jpeg', 0.9).split(',')[1];
            onChange(base64);
          } catch (error) {
            console.error('Face detection error:', error);
            toast({
              title: "Processing Error",
              description: "Could not process the image. Please try a different photo.",
              variant: "destructive",
            });
          }
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
    [onChange, modelsLoaded, toast]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png"],
    },
    maxFiles: 1,
    disabled: isProcessing || !modelsLoaded,
  });

  return (
    <Card
      {...getRootProps()}
      className={`relative border-2 border-dashed cursor-pointer hover:border-primary/50 transition ${className}`}
    >
      <input {...getInputProps()} />
      {value ? (
        <div className="relative min-h-[300px]">
          <img
            src={`data:image/jpeg;base64,${value}`}
            alt="Preview"
            className="w-full h-full object-cover"
            ref={imageRef}
          />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-10 text-center">
          {!modelsLoaded ? (
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              <p className="text-sm text-muted-foreground">Initializing image processing...</p>
            </div>
          ) : isProcessing ? (
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              <p className="text-sm text-muted-foreground">Processing image...</p>
            </div>
          ) : isDragActive ? (
            <UploadIcon className="h-10 w-10 text-muted-foreground mb-4" />
          ) : (
            <div className="space-y-4">
              <ImageIcon className="h-10 w-10 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">
                Drag & drop your photo here, or click to select
              </p>
              {!isWebGLAvailable && (
                <p className="text-xs text-muted-foreground">
                  Running in compatibility mode
                </p>
              )}
            </div>
          )}
        </div>
      )}
      <canvas ref={canvasRef} className="hidden" />
    </Card>
  );
}