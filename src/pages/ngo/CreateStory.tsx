import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { topics, ageGroups, languages } from "@/data/mockData";

const CreateStory = () => {
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      navigate("/ngo/story-editor");
    }, 2000);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Create New Story</h1>
        <p className="text-muted-foreground">Define the context and let AI generate an interactive safety story.</p>
      </div>

      <Card className="border-0 shadow-card">
        <CardContent className="p-6">
          <form onSubmit={handleGenerate} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Safety Topic</Label>
                <Select>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select topic" /></SelectTrigger>
                  <SelectContent>
                    {topics.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Age Group</Label>
                <Select>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select age group" /></SelectTrigger>
                  <SelectContent>
                    {ageGroups.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Language</Label>
                <Select>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select language" /></SelectTrigger>
                  <SelectContent>
                    {languages.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Number of Characters</Label>
                <Input type="number" placeholder="2" min={1} max={5} className="rounded-xl" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Region / Cultural Context</Label>
              <Input placeholder="e.g. Urban India, Rural Maharashtra" className="rounded-xl" />
            </div>

            <div className="space-y-2">
              <Label>Story Description</Label>
              <Textarea
                placeholder="Describe the scenario you want the AI to create a story about..."
                rows={4}
                className="rounded-xl resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label>Moral Lesson <span className="text-muted-foreground">(optional)</span></Label>
              <Input placeholder="e.g. Always tell a trusted adult" className="rounded-xl" />
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={isGenerating}>
              <Sparkles className="h-4 w-4" />
              {isGenerating ? "Generating Story..." : "Generate Story with AI"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateStory;
