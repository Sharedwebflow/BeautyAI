import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { ProductCard } from "@/components/product-card";
import { Separator } from "@/components/ui/separator";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import LoadingAnalysis from "@/components/loading-analysis";
import { type Analysis, type Product } from "@shared/schema";
import { AlertCircle } from "lucide-react";

export default function Analysis() {
  const { id } = useParams();

  const analysisQuery = useQuery<Analysis>({
    queryKey: ["/api/analysis", id],
  });

  const productsQuery = useQuery<Product[]>({
    queryKey: ["/api/analysis", id, "recommendations"],
    enabled: !!analysisQuery.data
  });

  if (analysisQuery.isLoading || productsQuery.isLoading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <LoadingAnalysis />
      </div>
    );
  }

  if (!analysisQuery.data || !productsQuery.data) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card>
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Analysis Not Found</h2>
            <p className="text-muted-foreground">
              The analysis you're looking for could not be found. Please try analyzing your photo again.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { features, recommendations } = analysisQuery.data;

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Your Beauty Analysis</h1>

        <div className="grid gap-8">
          {/* Facial Features Analysis */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Facial Features Analysis</h2>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-6">
                {Object.entries(features).map(([key, value]) => (
                  <div key={key} className="space-y-2">
                    <h3 className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</h3>
                    <p className="text-sm text-muted-foreground">{String(value)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Product Recommendations */}
          <div>
            <h2 className="text-xl font-semibold mb-6">Recommended Products</h2>
            <div className="grid gap-6">
              {recommendations.sort((a, b) => a.priority - b.priority).map((rec, index) => (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{rec.category}</h3>
                        <p className="text-sm text-muted-foreground">{rec.productType}</p>
                      </div>
                      <Badge variant="secondary">Priority {rec.priority}</Badge>
                    </div>
                    <p className="text-sm mb-4">{rec.reason}</p>
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Key Ingredients to Look For:</h4>
                      <div className="flex flex-wrap gap-2">
                        {rec.ingredients.map((ingredient, i) => (
                          <Badge key={i} variant="outline">{ingredient}</Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Separator className="my-8" />

            {/* Available Products */}
            <h2 className="text-xl font-semibold mb-6">Available Products</h2>
            <div className="grid sm:grid-cols-2 gap-6">
              {productsQuery.data.map((product) => (
                <div key={product.id} className="relative">
                  <ProductCard product={product} />
                  {product.matchScore !== null && (
                    <Badge
                      className="absolute top-2 right-2"
                      variant="secondary"
                    >
                      {product.matchScore}% Match
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}