import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Home, Library, Star, LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/safe_story_logo.png";

const StudentLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { toast } = useToast();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      toast({
        title: "See you next time!",
        description: "You have been signed out.",
      });
      navigate("/");
    } catch (error) {
      toast({
        title: "Sign out failed",
        description: error instanceof Error ? error.message : "Failed to sign out",
        variant: "destructive",
      });
    } finally {
      setIsSigningOut(false);
    }
  };

  const navItems = [
    { icon: Home, label: "Home", path: "/student/home" },
    { icon: Library, label: "Stories", path: "/student/home" },
    { icon: Star, label: "Badges", path: "/student/home" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-card border-b border-border shadow-card md:px-8">
        <div className="flex items-center gap-3">
          <img src={logo} alt="SafeStory" className="h-9 w-9 rounded-lg" />
          <span className="text-lg font-bold text-foreground">SafeStory</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="text-muted-foreground hover:text-destructive"
        >
          {isSigningOut ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="hidden sm:inline ml-2">Exiting...</span>
            </>
          ) : (
            <>
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline ml-2">Exit</span>
            </>
          )}
        </Button>
      </header>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>

      {/* Bottom Nav - Mobile */}
      <nav className="flex items-center justify-around border-t border-border bg-card py-2 md:hidden">
        {navItems.map((item) => (
          <Link
            key={item.label}
            to={item.path}
            className="flex flex-col items-center gap-1 p-2 text-xs text-muted-foreground"
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default StudentLayout;
