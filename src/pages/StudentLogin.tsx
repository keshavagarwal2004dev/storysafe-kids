import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { avatars, ageGroups } from "@/data/mockData";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { upsertStudentProfile } from "@/lib/supabaseStudentProfileService";
import logo from "@/assets/safe_story_logo.png";

const StudentLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn, signUp, isLoading } = useAuth();
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup state
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!loginEmail || !loginPassword) {
      toast({
        title: "Missing fields",
        description: "Please fill in email and password.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await signIn(loginEmail, loginPassword, "student");
      console.info("[SafeStory][Student] Logged in successfully");
      toast({
        title: "Welcome back!",
        description: "Let's read some stories! 📚",
      });
      navigate("/student/home");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Login failed";
      toast({
        title: "Login failed",
        description: errorMessage,
        variant: "destructive",
      });
      console.error("[SafeStory][Student] Login failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!signupEmail || !signupPassword || !signupName || !ageGroup) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please ensure both passwords are the same.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { user } = await signUp(signupEmail, signupPassword, "student");

      try {
        await upsertStudentProfile({
          userId: user.id,
          email: signupEmail,
          name: signupName,
          ageGroup,
          avatar: selectedAvatar,
        });
      } catch (profileError) {
        console.warn("[SafeStory][Student] Failed to save profile to Supabase, using local fallback.", profileError);
      }
      
      console.info("[SafeStory][Student] Signed up successfully");
      toast({
        title: "Account created",
        description: "Welcome to SafeStory! Let's read some stories! 📚",
      });
      navigate("/student/home");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Sign up failed";
      toast({
        title: "Sign up failed",
        description: errorMessage,
        variant: "destructive",
      });
      console.error("[SafeStory][Student] Sign up failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-warm p-4">
      <Card className="w-full max-w-md border-0 shadow-soft">
        <CardHeader className="text-center pb-2">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 self-start"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <div className="mx-auto mb-4">
            <img src={logo} alt="SafeStory" className="h-14 w-14 mx-auto rounded-xl" />
          </div>
          <CardTitle className="text-2xl">Welcome, Young Reader! 📚</CardTitle>
          <CardDescription>Sign in or create an account to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={(v) => setTab(v as "login" | "signup")} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            {/* Login Tab */}
            <TabsContent value="login" className="space-y-4">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="your@email.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="rounded-xl"
                    disabled={isSubmitting || isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="rounded-xl"
                    disabled={isSubmitting || isLoading}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  variant="secondary"
                  disabled={isSubmitting || isLoading}
                >
                  {isSubmitting || isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <BookOpen className="h-4 w-4" />
                      Sign In
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>

            {/* Signup Tab */}
            <TabsContent value="signup" className="space-y-4">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">What's your name?</Label>
                  <Input
                    id="signup-name"
                    placeholder="Enter your name"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    className="rounded-xl text-base"
                    disabled={isSubmitting || isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="your@email.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    className="rounded-xl"
                    disabled={isSubmitting || isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label>How old are you?</Label>
                  <Select value={ageGroup} onValueChange={setAgeGroup} disabled={isSubmitting || isLoading}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select your age group" />
                    </SelectTrigger>
                    <SelectContent>
                      {ageGroups.map((ag) => (
                        <SelectItem key={ag} value={ag}>
                          {ag}
                        </SelectItem>
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
                        disabled={isSubmitting || isLoading}
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
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    className="rounded-xl"
                    disabled={isSubmitting || isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm">Confirm Password</Label>
                  <Input
                    id="signup-confirm"
                    type="password"
                    placeholder="••••••••"
                    value={signupConfirmPassword}
                    onChange={(e) => setSignupConfirmPassword(e.target.value)}
                    className="rounded-xl"
                    disabled={isSubmitting || isLoading}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  variant="secondary"
                  disabled={isSubmitting || isLoading}
                >
                  {isSubmitting || isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      <BookOpen className="h-4 w-4" />
                      Let's Go!
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentLogin;
