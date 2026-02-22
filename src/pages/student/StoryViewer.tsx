import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Volume2, ArrowLeft, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { sampleStorySlides } from "@/data/mockData";
import { loadGeneratedStory } from "@/lib/generatedStoryStorage";

const bgGradients = [
  "from-primary/5 to-secondary/5",
  "from-secondary/5 to-accent/5",
  "from-accent/5 to-primary/5",
  "from-primary/10 to-primary/5",
  "from-accent/5 to-secondary/5",
];

const emojis = ["🏞️", "🍬", "🤔", "🌟", "💡"];

const StoryViewer = () => {
  const [currentSlideId, setCurrentSlideId] = useState("1");
  const [transitioning, setTransitioning] = useState(false);
  const [showLearningCard, setShowLearningCard] = useState(false);
  const navigate = useNavigate();
  const generatedStory = loadGeneratedStory();
  const allSlides = generatedStory?.slides || sampleStorySlides;
  const currentSlideIndex = allSlides.findIndex((s) => s.id === currentSlideId);
  const slide = currentSlideIndex >= 0 ? allSlides[currentSlideIndex] : allSlides[0];

  const goToOutcome = (isCorrect: boolean) => {
    navigate("/student/reinforcement", {
      state: {
        outcome: isCorrect ? "positive" : "educational",
        storyTitle: generatedStory?.title || "Rani and the Playground",
        moralLesson: generatedStory?.moralLesson,
      },
    });
  };

  const goToSlide = (slideId: string) => {
    setTransitioning(true);
    setTimeout(() => {
      const targetIndex = allSlides.findIndex((s) => s.id === slideId);
      if (targetIndex < 0) {
        // Slide not found, story is complete
        goToOutcome(true);
      } else {
        setCurrentSlideId(slideId);
      }
      setTransitioning(false);
    }, 300);
  };

  const handleChoice = (nextSlide: string) => {
    const selected = slide.choices?.find((choice) => choice.nextSlide === nextSlide);
    const isCorrect = !!selected?.isCorrect;

    if (!isCorrect) {
      // Bad choice: show learning card instead of ending story
      setShowLearningCard(true);
    } else {
      // Good choice: continue story normally
      goToSlide(nextSlide);
    }
  };

  const handleContinueAfterLearning = () => {
    setShowLearningCard(false);
    // Continue to next slide regardless of choice
    const selected = slide.choices?.[0];
    if (selected) {
      goToSlide(selected.nextSlide);
    }
  };

  return (
    <div className={`min-h-[calc(100vh-60px)] flex flex-col bg-gradient-to-b ${bgGradients[currentSlideIndex % bgGradients.length]}`}>
      {/* Top bar */}
      <div className="flex items-center justify-between p-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/student/home")}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Button variant="ghost" size="icon">
          <Volume2 className="h-5 w-5" />
        </Button>
      </div>

      {/* Progress */}
      <div className="flex gap-1.5 px-6">
        {allSlides.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
              i <= currentSlideIndex ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>

      {/* Content */}
      <div
        className={`flex-1 flex flex-col items-center justify-center p-6 md:p-12 text-center transition-opacity duration-300 ${
          transitioning ? "opacity-0" : "opacity-100"
        }`}
      >
        <div className="text-8xl mb-8">{emojis[currentSlideIndex] || "📖"}</div>

        <p className="text-lg md:text-xl text-foreground leading-relaxed max-w-2xl mb-8">
          {slide.text}
        </p>

        {slide.choices ? (
          <div className="w-full max-w-md space-y-4">
            {slide.choices.map((choice, i) => (
              <Button
                key={i}
                variant="choice"
                size="xl"
                className="w-full justify-start text-left h-auto py-4 px-6"
                onClick={() => handleChoice(choice.nextSlide)}
              >
                {choice.label}
              </Button>
            ))}
          </div>
        ) : (
          <Button
            size="xl"
            onClick={() => {
              const nextIndex = currentSlideIndex + 1;
              if (nextIndex < allSlides.length) {
                goToSlide(allSlides[nextIndex].id);
              } else {
                goToOutcome(true);
              }
            }}
          >
            Continue →
          </Button>
        )}
      </div>

      {/* Learning Card Dialog */}
      <Dialog open={showLearningCard} onOpenChange={setShowLearningCard}>
        <DialogContent className="max-w-md border-0 shadow-soft">
          <Card className="border-0">
            <CardContent className="p-8 text-center">
              <div className="text-6xl mb-4">💛</div>
              <h2 className="text-2xl font-bold text-foreground mb-3">
                Let's Learn Together
              </h2>
              <p className="text-muted-foreground mb-6">
                That choice might not keep you safe. Let's think about what to do instead.
              </p>

              {/* Learning Points */}
              <div className="rounded-2xl bg-primary/5 p-5 mb-6 text-left">
                <h3 className="font-bold text-foreground mb-3">💡 What To Do Next Time</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Star className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    Pause and move away from the unsafe situation.
                  </li>
                  <li className="flex items-start gap-2">
                    <Star className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    Go to a trusted adult like a parent, teacher, or guardian right away.
                  </li>
                  <li className="flex items-start gap-2">
                    <Star className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    Say no firmly and speak up about what happened.
                  </li>
                </ul>
              </div>

              {/* Buttons */}
              <div className="space-y-3">
                <Button
                  variant="default"
                  size="lg"
                  className="w-full"
                  onClick={handleContinueAfterLearning}
                >
                  I Understand, Let's Continue →
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full"
                  onClick={() => setShowLearningCard(false)}
                >
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StoryViewer;
