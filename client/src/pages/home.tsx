import { useState } from "react";
import { useLocation } from "wouter";
import { ImageUpload } from "@/components/image-upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import LoadingAnalysis from "@/components/loading-analysis";
import { Sparkles, Scan, Heart, Star } from "lucide-react";

export default function Home() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [image, setImage] = useState<string | null>(null);

  const analyzeMutation = useMutation({
    mutationFn: async (base64Image: string) => {
      const response = await apiRequest("POST", "/api/analyze", { image: base64Image });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to analyze image");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setLocation(`/analysis/${data.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAnalyze = () => {
    if (image) {
      analyzeMutation.mutate(image);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4 py-16 space-y-24">
        {/* Hero Section */}
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-sm font-medium text-primary mb-2">AI-Powered Beauty Advice</p>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent sm:text-6xl">
            Your Personal Beauty Expert
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            Get personalized skincare and makeup recommendations powered by advanced AI technology.
          </p>
        </div>

        {/* Upload Section */}
        <Card className="max-w-xl mx-auto" data-section="upload">
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
                  onClick={handleAnalyze}
                >
                  Analyze My Features
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Key Features */}
        <div className="py-12">
          <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 flex items-center justify-center rounded-full bg-primary/10 mb-4">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Personalized Advice</h3>
              <p className="text-sm text-muted-foreground">
                Get tailored recommendations based on your unique skin type and concerns.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto w-12 h-12 flex items-center justify-center rounded-full bg-primary/10 mb-4">
                <Scan className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Smart Analysis</h3>
              <p className="text-sm text-muted-foreground">
                Advanced AI technology analyzes your skin conditions and needs.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto w-12 h-12 flex items-center justify-center rounded-full bg-primary/10 mb-4">
                <Heart className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Product Matching</h3>
              <p className="text-sm text-muted-foreground">
                Find the perfect products that match your skin type and preferences.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto w-12 h-12 flex items-center justify-center rounded-full bg-primary/10 mb-4">
                <Star className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Expert Results</h3>
              <p className="text-sm text-muted-foreground">
                Achieve professional-level results with AI-powered guidance.
              </p>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="py-12">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-primary">1</span>
              </div>
              <h3 className="font-semibold mb-2">Take the Quiz</h3>
              <p className="text-sm text-muted-foreground">
                Upload your photo for AI analysis of your facial features and skin.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-primary">2</span>
              </div>
              <h3 className="font-semibold mb-2">Get Your Plan</h3>
              <p className="text-sm text-muted-foreground">
                Receive a personalized beauty routine tailored to your needs.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-primary">3</span>
              </div>
              <h3 className="font-semibold mb-2">See Results</h3>
              <p className="text-sm text-muted-foreground">
                Follow your custom plan and watch your skin transform.
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="py-12 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Beauty Routine?</h2>
          <p className="text-muted-foreground mb-8">
            Join thousands of satisfied users who have discovered their perfect beauty routine with our AI advisor.
          </p>
          <Button
            size="lg"
            className="bg-primary hover:bg-primary/90"
            onClick={() => {
              const uploadSection = document.querySelector('[data-section="upload"]');
              uploadSection?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            Get Started Free
          </Button>
        </div>
      </div>
    </div>
  );
}