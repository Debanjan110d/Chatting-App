import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useLocation } from "wouter";
import { User } from "@/lib/types";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface UserContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Check if user is logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          
          // Verify user with backend
          const res = await fetch('/api/users/me', {
            headers: {
              'user-id': parsedUser.id
            }
          });
          
          if (res.ok) {
            const userData = await res.json();
            setUser(userData);
          } else {
            // If verification fails, clear local storage
            localStorage.removeItem("user");
            setUser(null);
          }
        }
      } catch (error) {
        console.error("Auth check error:", error);
        localStorage.removeItem("user");
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await apiRequest('POST', '/api/auth/login', { email, password });
      const userData = await res.json();
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      navigate("/");
      toast({
        title: "Login successful",
        description: `Welcome back, ${userData.name}!`,
      });
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Could not login. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await apiRequest('POST', '/api/auth/register', { 
        name, 
        email, 
        password,
        confirmPassword: password // Adding confirmPassword to match schema
      });
      const userData = await res.json();
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      navigate("/");
      toast({
        title: "Registration successful",
        description: `Welcome, ${userData.name}!`,
      });
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "Could not register. Please try again.",
        variant: "destructive"
      });
      throw error; // Re-throw to handle in the component
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login");
    toast({
      title: "Logged out",
      description: "You have been logged out successfully.",
    });
  };

  return (
    <UserContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
