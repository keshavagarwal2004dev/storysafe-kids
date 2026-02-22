import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { dashboardStats } from "@/data/mockData";

const Analytics = () => (
  <div>
    <h1 className="text-2xl font-bold text-foreground mb-2">Analytics</h1>
    <p className="text-muted-foreground mb-8">Track engagement and learning outcomes</p>

    <div className="grid gap-6 md:grid-cols-2">
      <Card className="border-0 shadow-card">
        <CardHeader><CardTitle className="text-lg">Engagement Overview</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {[
            { label: "Total Students Reached", value: dashboardStats.studentsReached },
            { label: "Average Completion Rate", value: `${dashboardStats.completionRate}%` },
            { label: "Stories Published", value: dashboardStats.activeStories },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between py-3 border-b border-border last:border-0">
              <span className="text-sm text-muted-foreground">{item.label}</span>
              <span className="text-lg font-bold text-foreground">{item.value}</span>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card className="border-0 shadow-card">
        <CardHeader><CardTitle className="text-lg">Choice Distribution</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Safe choices made</span>
                <span className="font-semibold text-primary">78%</span>
              </div>
              <div className="h-3 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-primary" style={{ width: "78%" }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Corrected after wrong choice</span>
                <span className="font-semibold text-secondary">89%</span>
              </div>
              <div className="h-3 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-secondary" style={{ width: "89%" }} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
);

export default Analytics;
