import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { ProductCard } from "@/components/product-card";
import { Separator } from "@/components/ui/separator";
import LoadingAnalysis from "@/components/loading-analysis";
import { type Analysis, type Product } from "@shared/schema";

export default function Analysis() {
  const { id } = useParams();

  const analysisQuery = useQuery<Analysis>({
    queryKey: ["/api/analysis", id],
  });

  const productsQuery = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  if (analysisQuery.isLoading || productsQuery.isLoading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <LoadingAnalysis />
      </div>
    );
  }

  if (!analysisQuery.data || !productsQuery.data) {
    return <div>Analysis not found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold">Your Beauty Analysis</h1>
        
        <div className="mt-8 grid gap-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Facial Features</h2>
            <div className="grid gap-4">
              {Object.entries(analysisQuery.data.features).map(([key, value]) => (
                <div key={key}>
                  <h3 className="font-medium capitalize">{key}</h3>
                  <p className="text-muted-foreground">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <h2 className="text-xl font-semibold mb-4">Recommended Products</h2>
            <div className="grid gap-6 sm:grid-cols-2">
              {productsQuery.data.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
