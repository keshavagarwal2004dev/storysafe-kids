import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { LayoutDashboard, BookPlus, Library, BarChart3, Settings, LogOut, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/safe_story_logo.png";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/ngo/dashboard" },
  { icon: BookPlus, label: "Create Story", path: "/ngo/create-story" },
  { icon: Library, label: "My Stories", path: "/ngo/my-stories" },
  { icon: BarChart3, label: "Analytics", path: "/ngo/analytics" },
  { icon: Settings, label: "Settings", path: "/ngo/settings" },
];

const NGOLayout = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-foreground/20 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-card border-r border-border shadow-soft transition-transform duration-300 md:static md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-3 p-5 border-b border-border">
          <img src={logo} alt="SafeStory" className="h-10 w-10 rounded-lg" />
          <span className="text-lg font-bold text-foreground">SafeStory</span>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border">
          <Link
            to="/"
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center gap-4 p-4 border-b border-border bg-card md:hidden">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <img src={logo} alt="SafeStory" className="h-8 w-8 rounded-lg" />
          <span className="font-bold text-foreground">SafeStory</span>
        </header>
        <main className="flex-1 p-4 md:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default NGOLayout;
