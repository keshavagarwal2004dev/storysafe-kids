import { Link } from "react-router-dom";
import { Eye, Pencil, Copy, BookPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { mockStories } from "@/data/mockData";

const MyStories = () => {
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Stories</h1>
          <p className="text-muted-foreground">{mockStories.length} stories created</p>
        </div>
        <Button asChild>
          <Link to="/ngo/create-story"><BookPlus className="h-4 w-4" /> Create Story</Link>
        </Button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {mockStories.map((story) => (
          <Card key={story.id} className="border-0 shadow-card overflow-hidden group hover:shadow-soft transition-shadow">
            {/* Cover */}
            <div
              className="h-40 flex items-center justify-center text-5xl"
              style={{ background: `${story.coverColor}20` }}
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
              <p className="text-sm text-muted-foreground mb-1">{story.topic}</p>
              <p className="text-xs text-muted-foreground mb-4">{story.ageGroup} · {story.language}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild className="flex-1">
                  <Link to="/ngo/story-editor"><Pencil className="h-3 w-3" /> Edit</Link>
                </Button>
                <Button variant="outline" size="sm" asChild className="flex-1">
                  <Link to="/student/story/1"><Eye className="h-3 w-3" /> Preview</Link>
                </Button>
                <Button variant="ghost" size="icon" className="shrink-0">
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default MyStories;
