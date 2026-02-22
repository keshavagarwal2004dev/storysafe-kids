import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Pencil, RefreshCw, Check, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { sampleStorySlides } from "@/data/mockData";
import { useToast } from "@/hooks/use-toast";

const StoryEditor = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [editing, setEditing] = useState(false);
  const [slides, setSlides] = useState(sampleStorySlides);
  const [editText, setEditText] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const slide = slides[currentSlide];

  const bgColors = [
    "bg-primary/5", "bg-secondary/5", "bg-accent/5", "bg-primary/10", "bg-secondary/10"
  ];

  const startEdit = () => {
    setEditText(slide.text);
    setEditing(true);
  };

  const saveEdit = () => {
    const updated = [...slides];
    updated[currentSlide] = { ...slide, text: editText };
    setSlides(updated);
    setEditing(false);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Story Preview Editor</h1>
          <p className="text-muted-foreground">Review and edit the AI-generated story</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { toast({ title: "Draft saved!" }); }}>
            <Save className="h-4 w-4" /> Save Draft
          </Button>
          <Button onClick={() => { toast({ title: "Story approved!" }); navigate("/ngo/my-stories"); }}>
            <Check className="h-4 w-4" /> Approve
          </Button>
        </div>
      </div>

      {/* Progress */}
      <div className="flex gap-2 mb-6">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => { setCurrentSlide(i); setEditing(false); }}
            className={`h-2 flex-1 rounded-full transition-colors ${
              i === currentSlide ? "bg-primary" : i < currentSlide ? "bg-primary/40" : "bg-muted"
            }`}
          />
        ))}
      </div>

      {/* Slide */}
      <Card className="border-0 shadow-soft overflow-hidden">
        <div className={`${bgColors[currentSlide % bgColors.length]} p-8 md:p-12 min-h-[300px] flex flex-col items-center justify-center text-center`}>
          <div className="text-6xl mb-6">
            {["🏞️", "🍬", "🤔", "🌟", "💡"][currentSlide] || "📖"}
          </div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
            Slide {currentSlide + 1} of {slides.length}
          </p>

          {editing ? (
            <div className="w-full max-w-lg space-y-3">
              <Textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={4} className="rounded-xl resize-none text-center" />
              <div className="flex gap-2 justify-center">
                <Button size="sm" onClick={saveEdit}><Check className="h-3 w-3" /> Save</Button>
                <Button size="sm" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <p className="text-lg text-foreground leading-relaxed max-w-lg">{slide.text}</p>
          )}

          {slide.choices && !editing && (
            <div className="mt-6 grid gap-3 w-full max-w-md">
              {slide.choices.map((c, i) => (
                <Button key={i} variant="choice" className="justify-start text-left h-auto py-3 px-4">
                  {c.label}
                </Button>
              ))}
            </div>
          )}
        </div>

        <CardContent className="p-4 flex items-center justify-between border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setCurrentSlide(Math.max(0, currentSlide - 1)); setEditing(false); }}
            disabled={currentSlide === 0}
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={startEdit}>
              <Pencil className="h-3 w-3" /> Edit Text
            </Button>
            <Button variant="outline" size="sm">
              <RefreshCw className="h-3 w-3" /> Regenerate Image
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setCurrentSlide(Math.min(slides.length - 1, currentSlide + 1)); setEditing(false); }}
            disabled={currentSlide === slides.length - 1}
          >
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default StoryEditor;
