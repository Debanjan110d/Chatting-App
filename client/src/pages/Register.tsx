import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useUser } from "@/contexts/UserContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/ui/theme-provider";

export default function Register() {
  const { register, isAuthenticated, isLoading } = useUser();
  const [, navigate] = useLocation();
  const { theme, setTheme } = useTheme();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
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
      name: "",
      email: "",
      password: "",
      confirmPassword: ""
    };

    if (formData.name.length < 2) {
      newErrors.name = "Name must be at least 2 characters";
      valid = false;
    }

    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      newErrors.email = "Please enter a valid email address";
      valid = false;
    }

    if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
      valid = false;
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords don't match";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        await register(formData.name, formData.email, formData.password);
      } catch (error) {
        console.error("Registration error:", error);
        setErrors(prev => ({
          ...prev,
          confirmPassword: "Registration failed. Please try again."
        }));
      }
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
          <h1 className="text-3xl font-bold text-primary mb-2">Create Account</h1>
          <p className="text-muted-foreground">Join the secure messenger</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Full Name
            </label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Enter your full name"
              autoComplete="name"
              value={formData.name}
              onChange={handleChange}
              disabled={isLoading}
            />
            {errors.name && <p className="text-sm font-medium text-destructive">{errors.name}</p>}
          </div>
          
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
              placeholder="Create a password"
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
              disabled={isLoading}
            />
            {errors.password && <p className="text-sm font-medium text-destructive">{errors.password}</p>}
          </div>
          
          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Confirm Password
            </label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              autoComplete="new-password"
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={isLoading}
            />
            {errors.confirmPassword && <p className="text-sm font-medium text-destructive">{errors.confirmPassword}</p>}
          </div>
          
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Create Account
          </Button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-muted-foreground">
            Already have an account?{" "}
            <a
              href="/login"
              className="text-primary font-medium hover:underline"
            >
              Log In
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
