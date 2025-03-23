import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ImageIcon, UploadIcon } from "lucide-react";

interface ImageUploadProps {
  value: string | null;
  onChange: (value: string | null) => void;
  className?: string;
}

export function ImageUpload({ value, onChange, className }: ImageUploadProps) {
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
    [onChange]
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
      {value ? (
        <div className="relative min-h-[300px]">
          <img
            src={`data:image/jpeg;base64,${value}`}
            alt="Preview"
            className="w-full h-full object-cover"
          />
        </div>
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
            </div>
          )}
        </div>
      )}
    </Card>
  );
}