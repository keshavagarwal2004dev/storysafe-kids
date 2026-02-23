import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
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
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/ngo-login" element={<NGOLogin />} />
            <Route path="/student-login" element={<StudentLogin />} />
            {/* Legacy routes */}
            <Route path="/login/ngo" element={<Navigate to="/ngo-login" replace />} />
            <Route path="/login/student" element={<Navigate to="/student-login" replace />} />

            {/* NGO Portal - Protected */}
            <Route
              path="/ngo"
              element={
                <ProtectedRoute requiredRole="ngo">
                  <NGOLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="create-story" element={<CreateStory />} />
              <Route path="story-editor/:id" element={<StoryEditor />} />
              <Route path="my-stories" element={<MyStories />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* Student Portal - Protected */}
            <Route
              path="/student"
              element={
                <ProtectedRoute requiredRole="student">
                  <StudentLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="home" replace />} />
              <Route path="home" element={<StudentHome />} />
              <Route path="story/:id" element={<StoryViewer />} />
              <Route path="reinforcement" element={<ReinforcementScreen />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
