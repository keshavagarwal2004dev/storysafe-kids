import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Loader2, Sparkles, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { topics, ageGroups, languages } from "@/data/mockData";
import { useToast } from "@/hooks/use-toast";
import { GenerationProgressEvent, generateStoryWithGroqAndPuter, CharacterInput } from "@/lib/groqStoryGenerator";
import { useAuth } from "@/contexts/AuthContext";
import { saveStoryToSupabase } from "@/lib/supabaseStoryService";

const generationSteps = [
  "Preparing request",
  "Creating story blueprint JSON",
  "Generating branching story structure",
  "Generating slide images",
  "Finalizing story for NGO editor",
] as const;

const getStepIndex = (event: GenerationProgressEvent): number => {
  switch (event.stage) {
    case "initializing":
      return 0;
    case "blueprint-request":
    case "blueprint-ready":
      return 1;
    case "storytree-request":
    case "storytree-ready":
      return 2;
    case "images-start":
    case "image-progress":
    case "images-ready":
      return 3;
    case "completed":
      return 4;
    default:
      return 0;
  }
};

const CreateStory = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [topic, setTopic] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [language, setLanguage] = useState("");
  const [characterCount, setCharacterCount] = useState("2");
  const [characters, setCharacters] = useState<CharacterInput[]>([
    { name: "", description: "" },
    { name: "", description: "" },
  ]);
  const [regionContext, setRegionContext] = useState("");
  const [description, setDescription] = useState("");
  const [moralLesson, setMoralLesson] = useState("");
  const [activeStep, setActiveStep] = useState(0);
  const [statusMessage, setStatusMessage] = useState("Waiting to start...");
  const [imagesProgress, setImagesProgress] = useState<{ current: number; total: number } | null>(null);
  const [showCharacters, setShowCharacters] = useState(false);

  // Initialize characters array when characterCount changes
  useEffect(() => {
    const count = Number(characterCount);
    if (count > 0 && count <= 8) {
      setCharacters(
        Array.from({ length: count }, (_, i) => ({
          name: characters[i]?.name || "",
          description: characters[i]?.description || "",
        }))
      );
    }
  }, [characterCount]);

  const handleProgress = (event: GenerationProgressEvent) => {
    setActiveStep(getStepIndex(event));
    setStatusMessage(event.message);

    if (event.stage === "images-start" || event.stage === "image-progress") {
      setImagesProgress({
        current: event.current ?? 0,
        total: event.total ?? 0,
      });
    }

    if (event.stage === "completed") {
      setImagesProgress(null);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!topic || !ageGroup || !language || !regionContext || !description) {
      toast({
        title: "Missing fields",
        description: "Please fill all required story inputs.",
        variant: "destructive",
      });
      return;
    }

    // Validate characters
    const filledCharacters = characters.filter((c) => c.name.trim() || c.description.trim());
    if (filledCharacters.length > 0 && filledCharacters.length !== Number(characterCount)) {
      toast({
        title: "Incomplete character details",
        description: `Please fill all ${characterCount} character names and descriptions, or leave them empty.`,
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setActiveStep(0);
    setStatusMessage("Starting generation...");
    setImagesProgress(null);
    console.info("[SafeStory][NGO] Generation started from Create Story form.");

    if (!user?.id) {
      toast({
        title: "Authentication required",
        description: "Please sign in as NGO to generate and save stories.",
        variant: "destructive",
      });
      setIsGenerating(false);
      return;
    }

    try {
      const generated = await generateStoryWithGroqAndPuter({
        topic,
        ageGroup,
        language,
        characterCount: Number(characterCount),
        characters: filledCharacters.length > 0 ? characters : undefined,
        regionContext,
        description,
        moralLesson,
      }, { onProgress: handleProgress });

      const supabaseStory = await saveStoryToSupabase(
        user.id,
        {
          ...generated,
          topic,
          ageGroup,
          language,
          characterCount: Number(characterCount),
          regionContext,
          description,
          moralLesson,
        },
        "draft"
      );
      console.info("[SafeStory][NGO] Story saved to Supabase:", supabaseStory.id);

      console.info("[SafeStory][NGO] Generation completed and story saved for editor.", {
        slides: generated.slides.length,
        title: generated.title,
      });

      toast({
        title: "Story generated",
        description: `Generated ${generated.slides.length} slides with branching choices.`,
      });

      navigate(`/ngo/story-editor/${supabaseStory.id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Story generation failed.";
      toast({
        title: "Generation failed",
        description: message,
        variant: "destructive",
      });
      console.error("[SafeStory][NGO] Story generation failed.", error);
    } finally {
      setIsGenerating(false);
    }
  };

  if (isGenerating) {
    return (
      <div className="max-w-3xl mx-auto">
        <Card className="border-0 shadow-soft">
          <CardContent className="p-8 md:p-10 space-y-8">
            <div className="text-center space-y-3">
              <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
              <h1 className="text-2xl font-bold text-foreground">Generating your story...</h1>
              <p className="text-muted-foreground">This page shows exactly what is happening in the backend pipeline.</p>
              <p className="text-sm text-primary font-medium">{statusMessage}</p>
              {imagesProgress && imagesProgress.total > 0 && (
                <p className="text-sm text-muted-foreground">
                  Images: {imagesProgress.current}/{imagesProgress.total}
                </p>
              )}
            </div>

            <div className="space-y-3">
              {generationSteps.map((step, index) => {
                const isDone = index < activeStep;
                const isActive = index === activeStep;

                return (
                  <div
                    key={step}
                    className={`rounded-xl border px-4 py-3 flex items-center gap-3 ${
                      isActive ? "border-primary bg-primary/5" : "border-border bg-card"
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    ) : isActive ? (
                      <Loader2 className="h-5 w-5 text-primary animate-spin" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border border-border" />
                    )}
                    <span className={`text-sm ${isActive ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Backend logs are also printed in browser console with prefix: [SafeStory][Generation]
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

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
                <Select value={topic} onValueChange={setTopic}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select topic" /></SelectTrigger>
                  <SelectContent>
                    {topics.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Age Group</Label>
                <Select value={ageGroup} onValueChange={setAgeGroup}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select age group" /></SelectTrigger>
                  <SelectContent>
                    {ageGroups.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select language" /></SelectTrigger>
                  <SelectContent>
                    {languages.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Number of Characters</Label>
                <Input
                  type="number"
                  placeholder="2"
                  min={1}
                  max={8}
                  className="rounded-xl"
                  value={characterCount}
                  onChange={(e) => setCharacterCount(e.target.value)}
                />
              </div>
            </div>

            {/* Character Details Section */}
            <div className="border border-border rounded-xl p-4 bg-card/50">
              <button
                type="button"
                onClick={() => setShowCharacters(!showCharacters)}
                className="w-full flex items-center justify-between text-sm font-medium hover:bg-card/80 p-2 -mx-2 -my-2 px-2 py-2 rounded-lg transition"
              >
                <span>Character Details (Optional)</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${showCharacters ? "rotate-180" : ""}`}
                />
              </button>

              {showCharacters && (
                <div className="mt-4 space-y-4">
                  {characters.map((character, index) => (
                    <div
                      key={index}
                      className="p-4 bg-background rounded-lg border border-border/50 space-y-3"
                    >
                      <h4 className="font-medium text-foreground">Character {index + 1}</h4>
                      <div className="space-y-2">
                        <Label htmlFor={`char-name-${index}`} className="text-xs">
                          Name
                        </Label>
                        <Input
                          id={`char-name-${index}`}
                          type="text"
                          placeholder="e.g. Rani, Mrs. Sharma, the Teacher"
                          className="rounded-lg"
                          value={character.name}
                          onChange={(e) => {
                            const newCharacters = [...characters];
                            newCharacters[index].name = e.target.value;
                            setCharacters(newCharacters);
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`char-desc-${index}`} className="text-xs">
                          Description
                        </Label>
                        <Textarea
                          id={`char-desc-${index}`}
                          placeholder="e.g. 7-year-old girl from Mumbai, brave and curious about the world"
                          rows={2}
                          className="rounded-lg resize-none"
                          value={character.description}
                          onChange={(e) => {
                            const newCharacters = [...characters];
                            newCharacters[index].description = e.target.value;
                            setCharacters(newCharacters);
                          }}
                        />
                      </div>
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground">
                    Fill in character names and descriptions to make the story more personalized. Leave empty for generic character generation.
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Region / Cultural Context</Label>
              <Input
                placeholder="e.g. Urban India, Rural Maharashtra"
                className="rounded-xl"
                value={regionContext}
                onChange={(e) => setRegionContext(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Story Description</Label>
              <Textarea
                placeholder="Describe the scenario you want the AI to create a story about..."
                rows={4}
                className="rounded-xl resize-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Moral Lesson <span className="text-muted-foreground">(optional)</span></Label>
              <Input
                placeholder="e.g. Always tell a trusted adult"
                className="rounded-xl"
                value={moralLesson}
                onChange={(e) => setMoralLesson(e.target.value)}
              />
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={isGenerating}>
              <Sparkles className="h-4 w-4" />
              {isGenerating ? "Generating Story + Images..." : "Generate Story with AI"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateStory;
