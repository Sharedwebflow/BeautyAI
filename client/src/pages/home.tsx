import { useState } from "react";
import { useLocation } from "wouter";
import { ImageUpload } from "@/components/image-upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import LoadingAnalysis from "@/components/loading-analysis";

export default function Home() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [image, setImage] = useState<string | null>(null);

  const analyzeMutation = useMutation({
    mutationFn: async (base64Image: string) => {
      const response = await apiRequest("POST", "/api/analyze", { image: base64Image });
      return response.json();
    },
    onSuccess: (data) => {
      setLocation(`/analysis/${data.id}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent sm:text-6xl">
            Your Personal Beauty Advisor
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            Upload your photo and get personalized beauty product recommendations based on your unique features.
          </p>
        </div>

        <Card className="mt-12 max-w-xl mx-auto">
          <CardContent className="p-6">
            {analyzeMutation.isPending ? (
              <LoadingAnalysis />
            ) : (
              <>
                <ImageUpload
                  value={image}
                  onChange={(base64) => setImage(base64)}
                  className="w-full aspect-square"
                />
                <Button
                  className="w-full mt-4"
                  size="lg"
                  disabled={!image}
                  onClick={() => image && analyzeMutation.mutate(image)}
                >
                  Analyze My Features
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
