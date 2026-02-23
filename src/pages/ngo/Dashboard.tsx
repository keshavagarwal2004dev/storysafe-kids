import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { BookPlus, Users, BookOpen, TrendingUp, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { getUserStories } from "@/lib/supabaseStoryService";

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
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStories = async () => {
      if (!user?.id) return;
      setLoading(true);
      const data = await getUserStories(user.id);
      setStories(data || []);
      setLoading(false);
    };
    loadStories();
  }, [user]);

  const storiesCreated = stories.length;
  const activeStories = stories.filter(s => s.status === "published").length;
  const studentsReached = activeStories * 12; // Placeholder calculation
  const completionRate = activeStories > 0 ? Math.round((activeStories / storiesCreated) * 100) : 0;

  const statCards = [
    { label: "Stories Created", value: storiesCreated, icon: BookOpen, color: "text-primary" },
    { label: "Students Reached", value: studentsReached.toLocaleString(), icon: Users, color: "text-secondary" },
    { label: "Completion Rate", value: `${completionRate}%`, icon: TrendingUp, color: "text-accent" },
    { label: "Active Stories", value: activeStories, icon: BarChart3, color: "text-primary" },
  ];

  const recentStories = stories.slice(0, 5);

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
        {statCards.map((stat) => (
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
            <p className="text-center text-muted-foreground py-4">Loading...</p>
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
