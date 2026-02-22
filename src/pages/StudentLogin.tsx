import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { avatars, ageGroups } from "@/data/mockData";
import logo from "@/assets/safe_story_logo.png";

const StudentLogin = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("");

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/student/home");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-warm p-4">
      <Card className="w-full max-w-md border-0 shadow-soft">
        <CardHeader className="text-center pb-2">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 self-start">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <div className="mx-auto mb-4">
            <img src={logo} alt="SafeStory" className="h-14 w-14 mx-auto rounded-xl" />
          </div>
          <CardTitle className="text-2xl">Welcome, Young Reader! 📚</CardTitle>
          <CardDescription>Tell us about yourself to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleContinue} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">What's your name?</Label>
              <Input
                id="name"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-xl text-base"
              />
            </div>
            <div className="space-y-2">
              <Label>How old are you?</Label>
              <Select value={ageGroup} onValueChange={setAgeGroup}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select your age group" />
                </SelectTrigger>
                <SelectContent>
                  {ageGroups.map((ag) => (
                    <SelectItem key={ag} value={ag}>{ag}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Pick your avatar</Label>
              <div className="grid grid-cols-4 gap-3">
                {avatars.map((av) => (
                  <button
                    key={av}
                    type="button"
                    onClick={() => setSelectedAvatar(av)}
                    className={`flex h-14 items-center justify-center rounded-xl text-2xl transition-all ${
                      selectedAvatar === av
                        ? "bg-primary/15 ring-2 ring-primary scale-110"
                        : "bg-muted hover:bg-muted/80"
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>
            <Button type="submit" className="w-full" size="lg" variant="secondary">
              <BookOpen className="h-4 w-4" />
              Let's Go!
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentLogin;
