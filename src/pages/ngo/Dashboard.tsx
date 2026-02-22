import { Link } from "react-router-dom";
import { BookPlus, Users, BookOpen, TrendingUp, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { dashboardStats, mockStories } from "@/data/mockData";
import { Badge } from "@/components/ui/badge";

const statCards = [
  { label: "Stories Created", value: dashboardStats.storiesCreated, icon: BookOpen, color: "text-primary" },
  { label: "Students Reached", value: dashboardStats.studentsReached.toLocaleString(), icon: Users, color: "text-secondary" },
  { label: "Completion Rate", value: `${dashboardStats.completionRate}%`, icon: TrendingUp, color: "text-accent" },
  { label: "Active Stories", value: dashboardStats.activeStories, icon: BarChart3, color: "text-primary" },
];

const Dashboard = () => {
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-3 font-medium text-muted-foreground">Title</th>
                  <th className="pb-3 font-medium text-muted-foreground hidden sm:table-cell">Topic</th>
                  <th className="pb-3 font-medium text-muted-foreground hidden md:table-cell">Age Group</th>
                  <th className="pb-3 font-medium text-muted-foreground">Status</th>
                  <th className="pb-3 font-medium text-muted-foreground text-right">Students</th>
                </tr>
              </thead>
              <tbody>
                {mockStories.slice(0, 5).map((story) => (
                  <tr key={story.id} className="border-b border-border/50 last:border-0">
                    <td className="py-3 font-medium text-foreground">{story.title}</td>
                    <td className="py-3 text-muted-foreground hidden sm:table-cell">{story.topic}</td>
                    <td className="py-3 text-muted-foreground hidden md:table-cell">{story.ageGroup}</td>
                    <td className="py-3">
                      <Badge variant={story.status === "published" ? "default" : "secondary"} className="rounded-full text-xs">
                        {story.status}
                      </Badge>
                    </td>
                    <td className="py-3 text-right text-muted-foreground">{story.studentsReached}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
