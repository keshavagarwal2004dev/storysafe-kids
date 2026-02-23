import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { getUserStories } from "@/lib/supabaseStoryService";
import { getChildrenCount } from "@/lib/supabaseStudentProfileService";

interface Story {
  id: string;
  title: string;
  topic?: string;
  status: string;
  language?: string;
}

const Analytics = () => {
  const { user } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [childrenCount, setChildrenCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStories = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const [storiesData, childrenTotal] = await Promise.all([
        getUserStories(user.id),
        getChildrenCount().catch(() => 0),
      ]);

      setStories(storiesData || []);
      setChildrenCount(childrenTotal);
      setLoading(false);
    };

    loadStories();
  }, [user]);

  const summary = useMemo(() => {
    const total = stories.length;
    const published = stories.filter((story) => story.status === "published").length;
    const drafts = total - published;
    const publishRate = total > 0 ? Math.round((published / total) * 100) : 0;
    const uniqueTopics = new Set(stories.map((story) => story.topic).filter(Boolean)).size;
    const uniqueLanguages = new Set(stories.map((story) => story.language).filter(Boolean)).size;

    const topicCounts = stories.reduce<Record<string, number>>((acc, story) => {
      const topic = story.topic || "Uncategorized";
      acc[topic] = (acc[topic] ?? 0) + 1;
      return acc;
    }, {});

    const topTopics = Object.entries(topicCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);

    return {
      total,
      published,
      drafts,
      publishRate,
      uniqueTopics,
      uniqueLanguages,
      topTopics,
    };
  }, [stories]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-2">Analytics</h1>
      <p className="text-muted-foreground mb-8">Track publishing and content coverage from your real stories</p>

      {loading ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-0 shadow-card">
            <CardHeader><CardTitle className="text-lg">Publishing Overview</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "Total Stories", value: summary.total },
                { label: "No. of Children", value: childrenCount },
                { label: "Published Stories", value: summary.published },
                { label: "Draft Stories", value: summary.drafts },
                { label: "Publish Rate", value: `${summary.publishRate}%` },
                { label: "Topics Covered", value: summary.uniqueTopics },
                { label: "Languages Covered", value: summary.uniqueLanguages },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <span className="text-lg font-bold text-foreground">{item.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="border-0 shadow-card">
            <CardHeader><CardTitle className="text-lg">Status & Topic Distribution</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Published</span>
                    <span className="font-semibold text-primary">{summary.publishRate}%</span>
                  </div>
                  <div className="h-3 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${summary.publishRate}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Draft</span>
                    <span className="font-semibold text-secondary">{100 - summary.publishRate}%</span>
                  </div>
                  <div className="h-3 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-secondary" style={{ width: `${100 - summary.publishRate}%` }} />
                  </div>
                </div>

                {summary.topTopics.map(([topic, count]) => {
                  const percent = summary.total > 0 ? Math.round((count / summary.total) * 100) : 0;
                  return (
                    <div key={topic}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">{topic}</span>
                        <span className="font-semibold text-foreground">{count} ({percent}%)</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-accent" style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Analytics;
