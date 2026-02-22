import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { Star, ArrowLeft, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const ReinforcementScreen = () => {
  const location = useLocation();
  const state = (location.state || {}) as {
    outcome?: "positive" | "educational";
    storyTitle?: string;
    moralLesson?: string;
  };

  const isPositive = state.outcome !== "educational";
  const storyTitle = state.storyTitle || "Rani and the Playground";

  return (
    <div className="min-h-[calc(100vh-60px)] flex items-center justify-center p-4 bg-gradient-hero">
      <Card className="w-full max-w-md border-0 shadow-soft text-center">
        <CardContent className="p-8 md:p-10">
          {/* Celebration */}
          <div className="text-7xl mb-4">{isPositive ? "🎉" : "💛"}</div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {isPositive ? "Amazing Job!" : "Let's Learn Together"}
          </h1>
          <p className="text-muted-foreground mb-6">
            {isPositive
              ? `You completed "${storyTitle}" and made a safe choice!`
              : `You completed "${storyTitle}". That choice was not safe, and now you know what to do next time.`}
          </p>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-2xl bg-accent/10 px-5 py-3 mb-6">
            <Trophy className="h-6 w-6 text-accent" />
            <span className="font-bold text-foreground">
              {isPositive ? "Safety Star Badge Earned!" : "Safety Practice Complete!"}
            </span>
          </div>

          {/* Lesson */}
          <div className="rounded-2xl bg-primary/5 p-5 mb-6 text-left">
            <h3 className="font-bold text-foreground mb-2">📝 {isPositive ? "What You Did Right" : "What To Do Next Time"}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <Star className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                {isPositive
                  ? "You chose to stay with safe adults and protected yourself."
                  : "Pause, move away, and go to a trusted adult right away."}
              </li>
              <li className="flex items-start gap-2">
                <Star className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                {isPositive
                  ? "Saying no and asking for help is brave and smart."
                  : "Say no firmly and tell a parent, teacher, or guardian."}
              </li>
              <li className="flex items-start gap-2">
                <Star className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                {state.moralLesson || "Always choose safety and speak up when something feels wrong."}
              </li>
            </ul>
          </div>

          {/* Stars */}
          <div className="flex justify-center gap-1 mb-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className="h-8 w-8 fill-accent text-accent" />
            ))}
          </div>

          <Button asChild className="w-full" size="lg">
            <Link to="/student/home">
              <ArrowLeft className="h-4 w-4" /> Back to Library
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReinforcementScreen;
