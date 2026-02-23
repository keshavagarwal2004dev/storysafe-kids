import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Eye, Pencil, Copy, BookPlus, Trash2, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { getUserStories, deleteStory, updateStoryStatus } from "@/lib/supabaseStoryService";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Story {
  id: string;
  title: string;
  topic?: string;
  status: string;
  age_group?: string;
  language?: string;
  created_at: string;
}

const MyStories = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingStoryId, setDeletingStoryId] = useState<string | null>(null);
  const [publishingStoryId, setPublishingStoryId] = useState<string | null>(null);

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

  const duplicateStory = async (storyId: string) => {
    toast({
      title: "Coming soon",
      description: "Story duplication will be available soon",
    });
  };

  const handleDeleteStory = async (storyId: string) => {
    try {
      setDeletingStoryId(storyId);
      await deleteStory(storyId);
      setStories((prev) => prev.filter((story) => story.id !== storyId));
      toast({
        title: "Story deleted",
        description: "The story was removed successfully.",
      });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Could not delete the story.",
        variant: "destructive",
      });
    } finally {
      setDeletingStoryId(null);
    }
  };

  const handlePublishStory = async (storyId: string) => {
    try {
      setPublishingStoryId(storyId);
      await updateStoryStatus(storyId, "published");
      setStories((prev) => prev.map((story) => (story.id === storyId ? { ...story, status: "published" } : story)));
      toast({
        title: "Story published",
        description: "Students can now view this story.",
      });
    } catch (error) {
      toast({
        title: "Publish failed",
        description: error instanceof Error ? error.message : "Could not publish the story.",
        variant: "destructive",
      });
    } finally {
      setPublishingStoryId(null);
    }
  };

  const getRandomColor = () => {
    const colors = ["#FF6B6B", "#4ECDC4", "#FFE66D", "#95E1D3", "#F38181"];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Stories</h1>
          <p className="text-muted-foreground">{loading ? "Loading..." : `${stories.length} stories created`}</p>
        </div>
        <Button asChild>
          <Link to="/ngo/create-story"><BookPlus className="h-4 w-4" /> Create Story</Link>
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground">Loading your stories...</p>
        </div>
      ) : stories.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">📚</div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No stories yet</h3>
          <p className="text-muted-foreground mb-6">Create your first interactive story for children</p>
          <Button asChild>
            <Link to="/ngo/create-story"><BookPlus className="h-4 w-4" /> Create Story</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {stories.map((story) => (
            <Card key={story.id} className="border-0 shadow-card overflow-hidden group hover:shadow-soft transition-shadow">
              {/* Cover */}
              <div
                className="h-40 flex items-center justify-center text-5xl"
                style={{ background: `${getRandomColor()}20` }}
              >
                📖
              </div>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-foreground leading-snug">{story.title}</h3>
                  <Badge variant={story.status === "published" ? "default" : "secondary"} className="rounded-full text-xs ml-2 shrink-0">
                    {story.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-1">{story.topic || "General"}</p>
                <p className="text-xs text-muted-foreground mb-4">{story.age_group || "All ages"} · {story.language || "English"}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild className="flex-1">
                    <Link to={`/ngo/story-editor/${story.id}`}><Pencil className="h-3 w-3" /> Edit</Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild className="flex-1">
                    <Link to={`/story/${story.id}`}><Eye className="h-3 w-3" /> Preview</Link>
                  </Button>
                  <Button variant="ghost" size="icon" className="shrink-0" onClick={() => duplicateStory(story.id)}>
                    <Copy className="h-3 w-3" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="shrink-0" disabled={deletingStoryId === story.id}>
                        {deletingStoryId === story.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this story?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. "{story.title}" will be permanently deleted.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteStory(story.id)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
                {story.status !== "published" && (
                  <Button
                    variant="default"
                    size="sm"
                    className="w-full mt-2"
                    disabled={publishingStoryId === story.id}
                    onClick={() => handlePublishStory(story.id)}
                  >
                    {publishingStoryId === story.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-3 w-3" />
                    )}
                    Publish
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyStories;
