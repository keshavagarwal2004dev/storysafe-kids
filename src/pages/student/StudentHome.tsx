import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, Filter, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getPublishedStories } from "@/lib/supabaseStoryService";
import { getLastOpenedStoryProgress, StudentStoryProgress } from "@/lib/supabaseStudentProgressService";
import { getTranslation } from "@/lib/translations";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

interface Story {
  id: string;
  title: string;
  topic?: string;
  age_group?: string;
  language?: string;
  status: string;
  created_at: string;
}

const StudentHome = () => {
  const { user } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [lastProgress, setLastProgress] = useState<StudentStoryProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [topicFilter, setTopicFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const loadStories = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const [storiesData, progressData] = await Promise.all([
        getPublishedStories(),
        getLastOpenedStoryProgress(user.id),
      ]);
      setStories(storiesData || []);
      setLastProgress(progressData);
      setLoading(false);
    };
    loadStories();
  }, [user]);

  // Extract unique topics from stories
  const topics = Array.from(new Set(stories.map(s => s.topic).filter(Boolean))) as string[];

  const filtered = stories.filter((s) => {
    if (topicFilter !== "all" && s.topic !== topicFilter) return false;
    if (search && !s.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const continueStory =
    stories.find((story) => story.id === lastProgress?.story_id) ||
    stories[0] ||
    null;

  const continueLabel = lastProgress?.completed 
    ? getTranslation(continueStory?.language, "readAgain")
    : getTranslation(continueStory?.language, "continueYourJourney");

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">
          Welcome back! 👋
        </h1>
        <p className="text-muted-foreground">Choose a story to start learning</p>
      </div>

      {/* Continue Last Story */}
      {continueStory && (
        <Card className="border-0 shadow-soft bg-gradient-hero mb-8 overflow-hidden">
          <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-4">
            <div className="text-5xl">📖</div>
            <div className="flex-1 text-center sm:text-left">
              <p className="text-xs font-medium text-primary mb-1">{continueLabel}</p>
              <h3 className="text-lg font-bold text-foreground">{continueStory.title}</h3>
              <p className="text-sm text-muted-foreground">{continueStory.topic} · {continueStory.age_group || "All ages"}</p>
            </div>
            <Button asChild>
              <Link to={`/story/${continueStory.id}`}>
                Continue <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search stories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 rounded-xl"
          />
        </div>
        <Select value={topicFilter} onValueChange={setTopicFilter}>
          <SelectTrigger className="w-full sm:w-48 rounded-xl">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="All topics" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Topics</SelectItem>
            {topics.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Story Grid */}
      {loading ? (
        <div className="space-y-6 py-2">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <Card key={item} className="border-0 shadow-card overflow-hidden">
                <Skeleton className="h-36 w-full" />
                <CardContent className="p-5 space-y-3">
                  <Skeleton className="h-5 w-24 rounded-full" />
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No stories found</h3>
          <p className="text-muted-foreground">
            {stories.length === 0 
              ? "No stories have been published yet. Check back soon!"
              : "Try adjusting your filters"}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((story) => (
            <Link key={story.id} to={`/story/${story.id}`}>
              <Card className="border-0 shadow-card overflow-hidden group hover:shadow-soft transition-all hover:-translate-y-1 cursor-pointer">
                <div className="h-36 flex items-center justify-center text-5xl bg-gradient-warm">
                  📚
                </div>
                <CardContent className="p-5">
                  <Badge className="rounded-full text-xs mb-2">{story.topic || "General"}</Badge>
                  <h3 className="font-bold text-foreground mb-1">{story.title}</h3>
                  <p className="text-xs text-muted-foreground">{story.age_group || "All ages"} · {story.language || "English"}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentHome;
