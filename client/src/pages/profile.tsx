import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { type User, type Analysis } from "@shared/schema";
import { AlertCircle } from "lucide-react";

export default function Profile() {
  const userQuery = useQuery<User>({
    queryKey: ["/api/user/me"],
  });

  const analysesQuery = useQuery<Analysis[]>({
    queryKey: ["/api/user/analyses"],
    enabled: !!userQuery.data,
  });

  if (userQuery.isLoading || analysesQuery.isLoading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-1/4 bg-muted rounded" />
          <div className="h-32 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!userQuery.data) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card>
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Not Logged In</h2>
            <p className="text-muted-foreground">
              Please log in to view your profile and analysis history.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { name, email, createdAt } = userQuery.data;
  const analyses = analysesQuery.data || [];

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Your Profile</h1>

        {/* User Info */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">Name</h3>
                <p className="text-lg">{name}</p>
              </div>
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">Email</h3>
                <p className="text-lg">{email}</p>
              </div>
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">Member Since</h3>
                <p className="text-lg">{format(new Date(createdAt), 'MMMM d, yyyy')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator className="my-8" />

        {/* Analysis History */}
        <div>
          <h2 className="text-2xl font-semibold mb-6">Analysis History</h2>
          {analyses.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">
                  You haven't done any beauty analysis yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {analyses.map((analysis) => (
                <Card key={analysis.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="h-12 w-12 rounded-full overflow-hidden">
                          <img
                            src={analysis.imageUrl}
                            alt="Analysis"
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(analysis.createdAt), 'MMMM d, yyyy')}
                          </p>
                          <p className="font-medium">Skin Type: {analysis.skinType}</p>
                        </div>
                      </div>
                      <Link href={`/analysis/${analysis.id}`}>
                        <Badge variant="secondary" className="cursor-pointer">
                          View Details
                        </Badge>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium mb-2">Key Concerns</h4>
                        <div className="flex flex-wrap gap-2">
                          {analysis.concerns.map((concern, i) => (
                            <Badge key={i} variant="outline">
                              {concern}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
