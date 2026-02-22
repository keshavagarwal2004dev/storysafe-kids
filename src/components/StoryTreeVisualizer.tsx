import { useState } from "react";
import { ChevronDown, ChevronRight, CheckCircle, AlertCircle } from "lucide-react";
import { GeneratedStorySlide } from "@/lib/generatedStoryStorage";
import { Card, CardContent } from "@/components/ui/card";

interface StoryNodeProps {
  slide: GeneratedStorySlide;
  level: number;
  onSelectSlide: (slideId: string) => void;
  selectedSlideId: string;
}

const StoryNode = ({ slide, level, onSelectSlide, selectedSlideId }: StoryNodeProps) => {
  const [expanded, setExpanded] = useState(level === 0);
  const isSelected = selectedSlideId === slide.id;
  const hasChoices = slide.choices && slide.choices.length > 0;

  return (
    <div className="ml-4">
      <div
        className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all mb-3 ${
          isSelected
            ? "border-primary bg-primary/10"
            : "border-muted hover:border-primary/50 hover:bg-muted/50"
        }`}
        onClick={() => onSelectSlide(slide.id)}
      >
        {/* Expand toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
          className="mt-1 p-0 hover:bg-muted rounded flex-shrink-0"
        >
          {hasChoices ? (
            expanded ? (
              <ChevronDown className="h-5 w-5" />
            ) : (
              <ChevronRight className="h-5 w-5" />
            )
          ) : (
            <div className="h-5 w-5" />
          )}
        </button>

        {/* Slide content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-bold text-sm text-foreground">Slide {slide.id}</h4>
            {hasChoices && (
              <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full">
                Decision
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">{slide.text}</p>
        </div>
      </div>

      {/* Choices expanded view */}
      {expanded && hasChoices && (
        <div className="ml-2 border-l-2 border-muted pl-4 space-y-4">
          {slide.choices.map((choice, idx) => (
            <div key={idx} className="relative">
              {/* Choice indicator */}
              <div
                className={`flex items-center gap-2 mb-3 p-3 rounded-lg border-l-4 ${
                  choice.isCorrect
                    ? "border-l-green-500 bg-green-50 dark:bg-green-950/20"
                    : "border-l-orange-500 bg-orange-50 dark:bg-orange-950/20"
                }`}
              >
                {choice.isCorrect ? (
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{choice.label}</p>
                  <p className={`text-xs font-bold mt-1 ${
                    choice.isCorrect ? "text-green-700 dark:text-green-400" : "text-orange-700 dark:text-orange-400"
                  }`}>
                    {choice.isCorrect ? "✓ Safe Choice" : "⚠ Learning Moment"}
                  </p>
                </div>
              </div>

              {/* Next slide reference */}
              {choice.nextSlide && (
                <div className="text-xs text-muted-foreground ml-7 mb-3 italic">
                  → continues to Slide {choice.nextSlide}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

interface StoryTreeVisualizerProps {
  slides: GeneratedStorySlide[];
  selectedSlideId: string;
  onSelectSlide: (slideId: string) => void;
}

export const StoryTreeVisualizer = ({ slides, selectedSlideId, onSelectSlide }: StoryTreeVisualizerProps) => {
  const rootSlide = slides.find((s) => s.id === "1");

  if (!rootSlide) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          No story structure found
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="mb-4">
          <h3 className="font-bold text-foreground mb-2">📊 Story Flow Map</h3>
          <div className="flex gap-4 text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Safe Choice</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <span>Learning Moment</span>
            </div>
          </div>
        </div>

        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          <StoryNode
            slide={rootSlide}
            level={0}
            onSelectSlide={onSelectSlide}
            selectedSlideId={selectedSlideId}
          />

          {/* Render remaining slides not yet visited in tree */}
          {slides.map((slide) => {
            if (slide.id === "1") return null;
            
            // Check if this slide is already referenced in the tree
            const isReferencedInTree = slides.some(
              (s) => s.choices?.some((c) => c.nextSlide === slide.id)
            );
            
            if (isReferencedInTree) return null;

            return (
              <div key={slide.id} className="mt-6 pt-6 border-t border-muted">
                <div className="text-xs text-muted-foreground mb-3 italic">Orphaned slide:</div>
                <StoryNode
                  slide={slide}
                  level={0}
                  onSelectSlide={onSelectSlide}
                  selectedSlideId={selectedSlideId}
                />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
