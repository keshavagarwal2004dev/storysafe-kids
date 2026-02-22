import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Volume2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const [currentSlide, setCurrentSlide] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const navigate = useNavigate();
  const slide = sampleStorySlides[currentSlide];
  const generatedStory = loadGeneratedStory();

  const goToOutcome = (isCorrect: boolean) => {
    navigate("/student/reinforcement", {
      state: {
        outcome: isCorrect ? "positive" : "educational",
        storyTitle: generatedStory?.title || "Rani and the Playground",
        moralLesson: generatedStory?.moralLesson,
      },
    });
  };

  const goToSlide = (index: number) => {
    setTransitioning(true);
    setTimeout(() => {
      if (index >= sampleStorySlides.length) {
        navigate("/student/reinforcement");
      } else {
        setCurrentSlide(index);
      }
      setTransitioning(false);
    }, 300);
  };

  const handleChoice = (nextSlide: number) => {
    const selected = slide.choices?.find((choice) => choice.nextSlide === nextSlide);
    goToOutcome(!!selected?.isCorrect);
  };

  return (
    <div className={`min-h-[calc(100vh-60px)] flex flex-col bg-gradient-to-b ${bgGradients[currentSlide % bgGradients.length]}`}>
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
        {sampleStorySlides.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
              i <= currentSlide ? "bg-primary" : "bg-muted"
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
        <div className="text-8xl mb-8">{emojis[currentSlide] || "📖"}</div>

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
            onClick={() => goToSlide(currentSlide + 1)}
          >
            Continue →
          </Button>
        )}
      </div>
    </div>
  );
};

export default StoryViewer;
