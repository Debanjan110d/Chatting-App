import { useEffect } from "react";
import { useLocation } from "wouter";
import { useUser } from "@/contexts/UserContext";
import ChatInterface from "@/components/ChatInterface";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/ui/theme-provider";

export default function Home() {
  const { user, isAuthenticated, isLoading } = useUser();
  const [, navigate] = useLocation();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="absolute top-4 right-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="rounded-full"
          >
            {theme === "light" ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
        
        <Card className="w-full max-w-md p-6 text-center bg-card">
          <h1 className="text-2xl font-bold mb-4">P2P Messenger</h1>
          <p className="mb-6 text-muted-foreground">
            You need to be logged in to access the messenger.
          </p>
          <Button onClick={() => navigate("/login")}>
            Go to Login
          </Button>
        </Card>
      </div>
    );
  }

  return <ChatInterface />;
}
