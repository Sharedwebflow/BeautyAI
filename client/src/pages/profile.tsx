import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { type User, type Analysis } from "@shared/schema";
import { AlertCircle, User as UserIcon, Calendar, Star, Camera } from "lucide-react";

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
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Your Beauty Profile</h1>

          {/* User Info */}
          <Card className="mb-8 overflow-hidden">
            <CardHeader className="bg-primary/5 pb-6">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <UserIcon className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold">{name}</h2>
                  <p className="text-muted-foreground">{email}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Member since {format(new Date(createdAt), 'MMMM d, yyyy')}</span>
              </div>
            </CardContent>
          </Card>

          <Separator className="my-8" />

          {/* Analysis History */}
          <div>
            <h2 className="text-2xl font-semibold mb-6">Beauty Analysis History</h2>
            {analyses.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    You haven't done any beauty analysis yet.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {analyses.map((analysis) => (
                  <Card key={analysis.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-4">
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
                            <div className="flex items-center space-x-2">
                              <Star className="h-4 w-4 text-primary" />
                              <p className="font-medium">Skin Type: {analysis.skinType}</p>
                            </div>
                          </div>
                        </div>
                        <Link href={`/analysis/${analysis.id}`}>
                          <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">
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
                        <div>
                          <h4 className="text-sm font-medium mb-2">Recommended Products</h4>
                          <div className="flex flex-wrap gap-2">
                            {analysis.recommendations.slice(0, 3).map((rec, i) => (
                              <Badge key={i} variant="secondary">
                                {rec.productType}
                              </Badge>
                            ))}
                            {analysis.recommendations.length > 3 && (
                              <Badge variant="secondary">+{analysis.recommendations.length - 3} more</Badge>
                            )}
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
    </div>
  );
}