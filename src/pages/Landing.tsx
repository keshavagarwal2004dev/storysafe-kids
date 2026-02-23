import { Link } from "react-router-dom";
import { BookOpen, Shield, Users, Sparkles, Heart, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import logo from "@/assets/safe_story_logo.png";
import heroImage from "@/assets/hero-illustration.png";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-4 py-4 md:px-12">
        <div className="flex items-center gap-3">
          <img src={logo} alt="SafeStory" className="h-10 w-10 rounded-xl" />
          <span className="text-xl font-bold text-foreground">SafeStory</span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" asChild>
            <Link to="/ngo-login">NGO Login</Link>
          </Button>
          <Button variant="default" asChild>
            <Link to="/student-login">Student Login</Link>
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-4 py-12 md:py-20 md:px-12">
        <div className="mx-auto max-w-6xl flex flex-col-reverse md:flex-row items-center gap-10">
          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
              <Sparkles className="h-4 w-4" />
              AI-Powered Safety Education
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
              Teaching Children <br />
              <span className="text-primary">Safety Through Stories</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg mb-8">
              Interactive AI-generated storybooks that empower children with essential safety knowledge through engaging, branching narratives.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Button variant="default" size="xl" asChild className="shadow-md hover:shadow-lg hover:-translate-y-0.5">
                <Link to="/ngo-login">
                  <Shield className="h-5 w-5" />
                  NGO Login
                </Link>
              </Button>
              <Button variant="secondary" size="xl" asChild className="shadow-md hover:shadow-lg hover:-translate-y-0.5">
                <Link to="/student-login">
                  <BookOpen className="h-5 w-5" />
                  Student Login
                </Link>
              </Button>
            </div>
          </div>
          <div className="flex-1">
            <img
              src={heroImage}
              alt="Children reading together"
              className="w-full max-w-lg mx-auto rounded-3xl shadow-soft"
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-4 py-16 md:px-12 bg-gradient-hero">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="text-3xl font-bold text-foreground mb-3">How It Works</h2>
          <p className="text-muted-foreground mb-12 max-w-2xl mx-auto">
            A simple 3-step process to create impactful safety education stories
          </p>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                icon: Users,
                step: "1",
                title: "NGO Creates Context",
                desc: "Choose a safety topic, age group, language, and cultural context for the story.",
              },
              {
                icon: Sparkles,
                step: "2",
                title: "AI Generates Story",
                desc: "Our AI creates an illustrated, branching storybook with age-appropriate lessons.",
              },
              {
                icon: Heart,
                step: "3",
                title: "Children Learn Safely",
                desc: "Kids make choices in the story and learn vital safety skills through experience.",
              },
            ].map((item) => (
              <Card key={item.step} className="border-0 shadow-soft bg-card">
                <CardContent className="p-8 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                    <item.icon className="h-7 w-7 text-primary" />
                  </div>
                  <div className="text-xs font-bold text-primary mb-2">STEP {item.step}</div>
                  <h3 className="text-lg font-bold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Sample Story Preview */}
      <section className="px-4 py-16 md:px-12">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-foreground text-center mb-3">Sample Story Preview</h2>
          <p className="text-muted-foreground text-center mb-10">
            See how children interact with safety scenarios
          </p>
          <Card className="overflow-hidden shadow-soft border-0">
            <div className="bg-primary/5 p-6 md:p-10">
              <div className="flex items-start gap-4 mb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20 text-2xl">
                  📖
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">Rani and the Playground</h3>
                  <p className="text-sm text-muted-foreground">Topic: Stranger Danger · Ages 7-9</p>
                </div>
              </div>
              <div className="rounded-2xl bg-card p-6 shadow-card">
                <p className="text-foreground mb-6 leading-relaxed">
                  "A man Rani had never seen before walked up to her. 'Hello little girl! Would you like some candy?' he said with a big smile."
                </p>
                <p className="text-sm font-semibold text-primary mb-4">What should Rani do?</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Button variant="choice" className="justify-start text-left h-auto py-3 px-4">
                    🙅 Say "No!" and run to a trusted adult
                  </Button>
                  <Button variant="choice" className="justify-start text-left h-auto py-3 px-4">
                    🍬 Take the candy
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Trust Section */}
      <section className="px-4 py-16 md:px-12 bg-gradient-warm">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="text-3xl font-bold text-foreground mb-10">Built for Trust & Safety</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Shield, label: "POCSO Compliant" },
              { icon: Heart, label: "Trauma-Informed" },
              { icon: CheckCircle, label: "Expert Reviewed" },
              { icon: Users, label: "NGO Trusted" },
            ].map((item) => (
              <div key={item.label} className="flex flex-col items-center gap-3 rounded-2xl bg-card p-6 shadow-card">
                <item.icon className="h-8 w-8 text-primary" />
                <span className="text-sm font-semibold text-foreground">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-8 md:px-12 text-center border-t border-border">
        <div className="flex items-center justify-center gap-2 mb-3">
          <img src={logo} alt="SafeStory" className="h-6 w-6 rounded-md" />
          <span className="font-semibold text-foreground">SafeStory</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Empowering children through stories. © 2026 SafeStory Platform.
        </p>
      </footer>
    </div>
  );
};

export default Landing;
