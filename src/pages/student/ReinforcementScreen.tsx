import { Link } from "react-router-dom";
import { Star, ArrowLeft, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const ReinforcementScreen = () => {
  return (
    <div className="min-h-[calc(100vh-60px)] flex items-center justify-center p-4 bg-gradient-hero">
      <Card className="w-full max-w-md border-0 shadow-soft text-center">
        <CardContent className="p-8 md:p-10">
          {/* Celebration */}
          <div className="text-7xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Amazing Job!</h1>
          <p className="text-muted-foreground mb-6">
            You completed "Rani and the Playground" and learned how to stay safe from strangers!
          </p>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-2xl bg-accent/10 px-5 py-3 mb-6">
            <Trophy className="h-6 w-6 text-accent" />
            <span className="font-bold text-foreground">Safety Star Badge Earned!</span>
          </div>

          {/* Lesson */}
          <div className="rounded-2xl bg-primary/5 p-5 mb-6 text-left">
            <h3 className="font-bold text-foreground mb-2">📝 What You Learned</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <Star className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                Never go with strangers, even if they offer gifts
              </li>
              <li className="flex items-start gap-2">
                <Star className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                Always say "No!" firmly and run to a trusted adult
              </li>
              <li className="flex items-start gap-2">
                <Star className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                Tell a parent, teacher, or police officer right away
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
