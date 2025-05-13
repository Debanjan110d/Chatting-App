import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useUser } from "@/contexts/UserContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/ui/theme-provider";

export default function Login() {
  const { login, isAuthenticated, isLoading } = useUser();
  const [, navigate] = useLocation();
  const { theme, setTheme } = useTheme();
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [errors, setErrors] = useState({
    email: "",
    password: ""
  });

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    let valid = true;
    const newErrors = {
      email: "",
      password: ""
    };

    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      newErrors.email = "Please enter a valid email address";
      valid = false;
    }

    if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      await login(formData.email, formData.password);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
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
      
      <div className="bg-card rounded-xl shadow-lg p-8 w-full max-w-md border border-border">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">P2P Messenger</h1>
          <p className="text-muted-foreground">Connect directly with friends</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Enter your email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              disabled={isLoading}
            />
            {errors.email && <p className="text-sm font-medium text-destructive">{errors.email}</p>}
          </div>
          
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Password
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Enter your password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              disabled={isLoading}
            />
            {errors.password && <p className="text-sm font-medium text-destructive">{errors.password}</p>}
          </div>
          
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Log In
          </Button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-muted-foreground">
            Don't have an account?{" "}
            <a
              href="/register"
              className="text-primary font-medium hover:underline"
            >
              Sign Up
            </a>
          </p>
        </div>
        
        <div className="mt-4 text-center">
          <a
            href="/admin"
            className="text-sm text-muted-foreground/60 hover:text-muted-foreground"
          >
            Admin Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
