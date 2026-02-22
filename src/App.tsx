import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing";
import NGOLogin from "./pages/NGOLogin";
import StudentLogin from "./pages/StudentLogin";
import NGOLayout from "./components/layout/NGOLayout";
import StudentLayout from "./components/layout/StudentLayout";
import Dashboard from "./pages/ngo/Dashboard";
import CreateStory from "./pages/ngo/CreateStory";
import StoryEditor from "./pages/ngo/StoryEditor";
import MyStories from "./pages/ngo/MyStories";
import Analytics from "./pages/ngo/Analytics";
import SettingsPage from "./pages/ngo/SettingsPage";
import StudentHome from "./pages/student/StudentHome";
import StoryViewer from "./pages/student/StoryViewer";
import ReinforcementScreen from "./pages/student/ReinforcementScreen";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login/ngo" element={<NGOLogin />} />
          <Route path="/login/student" element={<StudentLogin />} />

          {/* NGO Portal */}
          <Route path="/ngo" element={<NGOLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="create-story" element={<CreateStory />} />
            <Route path="story-editor" element={<StoryEditor />} />
            <Route path="my-stories" element={<MyStories />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Student Portal */}
          <Route path="/student" element={<StudentLayout />}>
            <Route index element={<Navigate to="home" replace />} />
            <Route path="home" element={<StudentHome />} />
            <Route path="story/:id" element={<StoryViewer />} />
            <Route path="reinforcement" element={<ReinforcementScreen />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
