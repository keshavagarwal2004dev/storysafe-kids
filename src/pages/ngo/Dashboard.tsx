import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { BookPlus, Users, BookOpen, TrendingUp, BarChart3, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { getUserStories } from "@/lib/supabaseStoryService";
import { FollowUpAlert, getNgoFollowUpAlerts, resolveFollowUpAlert } from "@/lib/supabaseFollowUpService";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface Story {
  id: string;
  title: string;
  topic?: string;
  status: string;
  age_group?: string;
  created_at: string;
}

const Dashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stories, setStories] = useState<Story[]>([]);
  const [followUpAlerts, setFollowUpAlerts] = useState<FollowUpAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolvingAlertId, setResolvingAlertId] = useState<string | null>(null);
  const [showResolved, setShowResolved] = useState(false);

  useEffect(() => {
    const loadStories = async () => {
      if (!user?.id) return;
      setLoading(true);
      const [storiesData, alertsData] = await Promise.all([
        getUserStories(user.id),
        getNgoFollowUpAlerts(user.id),
      ]);
      setStories(storiesData || []);
      setFollowUpAlerts(alertsData || []);
      setLoading(false);
    };
    loadStories();
  }, [user]);

  const handleResolveAlert = async (alertId: string) => {
    try {
      setResolvingAlertId(alertId);
      await resolveFollowUpAlert(alertId);
      setFollowUpAlerts((prev) =>
        prev.map((alert) =>
          alert.id === alertId
            ? { ...alert, is_resolved: true, resolved_at: new Date().toISOString() }
            : alert
        )
      );
      toast({ title: "Marked as talked to" });
    } catch (error) {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Could not update follow-up status.",
        variant: "destructive",
      });
    } finally {
      setResolvingAlertId(null);
    }
  };

  const storiesCreated = stories.length;
  const publishedStories = stories.filter((story) => story.status === "published").length;
  const draftStories = stories.filter((story) => story.status !== "published").length;
  const uniqueTopics = new Set(stories.map((story) => story.topic).filter(Boolean));
  const uniqueAgeGroups = new Set(stories.map((story) => story.age_group).filter(Boolean));

  const statCards = [
    { label: "Stories Created", value: storiesCreated, icon: BookOpen, color: "text-primary" },
    { label: "Published Stories", value: publishedStories, icon: Users, color: "text-secondary" },
    { label: "Draft Stories", value: draftStories, icon: TrendingUp, color: "text-accent" },
    { label: "Topics Covered", value: uniqueTopics.size, icon: BarChart3, color: "text-primary" },
    { label: "Age Groups Covered", value: uniqueAgeGroups.size, icon: BookOpen, color: "text-secondary" },
  ];

  const recentStories = stories.slice(0, 5);
  const filteredFollowUps = showResolved ? followUpAlerts : followUpAlerts.filter((alert) => !alert.is_resolved);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your overview.</p>
        </div>
        <Button asChild>
          <Link to="/ngo/create-story">
            <BookPlus className="h-4 w-4" />
            Create Story
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading
          ? [1, 2, 3, 4].map((item) => (
              <Card key={item} className="border-0 shadow-card">
                <CardContent className="p-6 space-y-3">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-8 w-1/3" />
                </CardContent>
              </Card>
            ))
          : statCards.map((stat) => (
              <Card key={stat.label} className="border-0 shadow-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-muted-foreground">{stat.label}</span>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                </CardContent>
              </Card>
            ))}
      </div>

      <Card className="border-0 shadow-card">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-lg">Children Needing Follow-up</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setShowResolved((prev) => !prev)}>
            {showResolved ? "Show Unresolved" : "Show All"}
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="rounded-xl border border-border p-3">
                  <Skeleton className="h-5 w-40 mb-2" />
                  <Skeleton className="h-4 w-56" />
                </div>
              ))}
            </div>
          ) : filteredFollowUps.length === 0 ? (
            <p className="text-sm text-muted-foreground">No unresolved follow-ups right now.</p>
          ) : (
            <div className="space-y-3">
              {filteredFollowUps.slice(0, 10).map((alert) => (
                <div key={alert.id} className="rounded-xl border border-border p-3 flex items-center justify-between gap-3">
                  <div>
                    <p className={`font-medium ${alert.is_resolved ? "line-through text-muted-foreground" : "text-foreground"}`}>
                      {alert.student_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {alert.story_title} • {new Date(alert.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {alert.is_resolved ? (
                    <Badge variant="secondary" className="rounded-full">Talked</Badge>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={resolvingAlertId === alert.id}
                      onClick={() => handleResolveAlert(alert.id)}
                    >
                      <CheckCircle2 className="h-4 w-4" /> Cross Out
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Stories */}
      <Card className="border-0 shadow-card">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-lg">Recent Stories</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/ngo/my-stories">View All</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3 py-1">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="grid grid-cols-4 gap-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full hidden sm:block" />
                  <Skeleton className="h-4 w-full hidden md:block" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          ) : recentStories.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No stories yet. Create your first one!</p>
              <Button asChild>
                <Link to="/ngo/create-story">
                  <BookPlus className="h-4 w-4" />
                  Create Story
                </Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-3 font-medium text-muted-foreground">Title</th>
                    <th className="pb-3 font-medium text-muted-foreground hidden sm:table-cell">Topic</th>
                    <th className="pb-3 font-medium text-muted-foreground hidden md:table-cell">Age Group</th>
                    <th className="pb-3 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentStories.map((story) => (
                    <tr key={story.id} className="border-b border-border/50 last:border-0">
                      <td className="py-3 font-medium text-foreground">{story.title}</td>
                      <td className="py-3 text-muted-foreground hidden sm:table-cell">{story.topic || "N/A"}</td>
                      <td className="py-3 text-muted-foreground hidden md:table-cell">{story.age_group || "N/A"}</td>
                      <td className="py-3">
                        <Badge variant={story.status === "published" ? "default" : "secondary"} className="rounded-full text-xs">
                          {story.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
