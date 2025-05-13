import { useState } from "react";
import { useUser } from "@/contexts/UserContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/ui/theme-provider";

interface AuthFormsProps {
  initialView: "login" | "register";
}

export function AuthForms({ initialView }: AuthFormsProps) {
  const [view, setView] = useState<"login" | "register">(initialView);
  const { login, register, isLoading } = useUser();
  const { theme, setTheme } = useTheme();
  
  // Login form state
  const [loginData, setLoginData] = useState({
    email: "",
    password: ""
  });
  const [loginErrors, setLoginErrors] = useState({
    email: "",
    password: ""
  });

  // Register form state
  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [registerErrors, setRegisterErrors] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  // Handle login form input changes
  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle register form input changes
  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRegisterData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Validate login form
  const validateLoginForm = () => {
    let valid = true;
    const newErrors = {
      email: "",
      password: ""
    };

    if (!loginData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      newErrors.email = "Please enter a valid email address";
      valid = false;
    }

    if (loginData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
      valid = false;
    }

    setLoginErrors(newErrors);
    return valid;
  };

  // Validate register form
  const validateRegisterForm = () => {
    let valid = true;
    const newErrors = {
      name: "",
      email: "",
      password: "",
      confirmPassword: ""
    };

    if (registerData.name.length < 2) {
      newErrors.name = "Name must be at least 2 characters";
      valid = false;
    }

    if (!registerData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      newErrors.email = "Please enter a valid email address";
      valid = false;
    }

    if (registerData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
      valid = false;
    }

    if (registerData.password !== registerData.confirmPassword) {
      newErrors.confirmPassword = "Passwords don't match";
      valid = false;
    }

    setRegisterErrors(newErrors);
    return valid;
  };

  // Handle login form submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateLoginForm()) {
      await login(loginData.email, loginData.password);
    }
  };

  // Handle register form submission
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateRegisterForm()) {
      await register(registerData.name, registerData.email, registerData.password);
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
        {view === "login" ? (
          <>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-primary mb-2">P2P Messenger</h1>
              <p className="text-muted-foreground">Connect directly with friends</p>
            </div>
            
            <form onSubmit={handleLoginSubmit} className="space-y-4">
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
                  value={loginData.email}
                  onChange={handleLoginChange}
                  disabled={isLoading}
                />
                {loginErrors.email && <p className="text-sm font-medium text-destructive">{loginErrors.email}</p>}
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
                  value={loginData.password}
                  onChange={handleLoginChange}
                  disabled={isLoading}
                />
                {loginErrors.password && <p className="text-sm font-medium text-destructive">{loginErrors.password}</p>}
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
                <button
                  onClick={() => setView("register")}
                  className="text-primary font-medium hover:underline"
                  type="button"
                >
                  Sign Up
                </button>
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-primary mb-2">Create Account</h1>
              <p className="text-muted-foreground">Join the secure messenger</p>
            </div>
            
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
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
                  value={registerData.name}
                  onChange={handleRegisterChange}
                  disabled={isLoading}
                />
                {registerErrors.name && <p className="text-sm font-medium text-destructive">{registerErrors.name}</p>}
              </div>
              
              <div className="space-y-2">
                <label htmlFor="register-email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Email
                </label>
                <Input
                  id="register-email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  autoComplete="email"
                  value={registerData.email}
                  onChange={handleRegisterChange}
                  disabled={isLoading}
                />
                {registerErrors.email && <p className="text-sm font-medium text-destructive">{registerErrors.email}</p>}
              </div>
              
              <div className="space-y-2">
                <label htmlFor="register-password" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Password
                </label>
                <Input
                  id="register-password"
                  name="password"
                  type="password"
                  placeholder="Create a password"
                  autoComplete="new-password"
                  value={registerData.password}
                  onChange={handleRegisterChange}
                  disabled={isLoading}
                />
                {registerErrors.password && <p className="text-sm font-medium text-destructive">{registerErrors.password}</p>}
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
                  value={registerData.confirmPassword}
                  onChange={handleRegisterChange}
                  disabled={isLoading}
                />
                {registerErrors.confirmPassword && <p className="text-sm font-medium text-destructive">{registerErrors.confirmPassword}</p>}
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
                <button
                  onClick={() => setView("login")}
                  className="text-primary font-medium hover:underline"
                  type="button"
                >
                  Log In
                </button>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
