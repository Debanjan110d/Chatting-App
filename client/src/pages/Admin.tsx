import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useUser } from "@/contexts/UserContext";
import { User, Friend, Message } from "@/lib/types";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiRequest } from "@/lib/queryClient";

export default function Admin() {
  const { user, isAuthenticated } = useUser();
  const [, navigate] = useLocation();
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeTab, setActiveTab] = useState("users");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Redirect if not authenticated
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    // Check if user is admin (for example purposes, using id 1 as admin)
    if (user?.id !== 1) {
      navigate("/");
      return;
    }

    // Load data
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch users
        const usersRes = await apiRequest('GET', '/api/admin/users');
        const usersData = await usersRes.json();
        setUsers(usersData);

        // Fetch messages stats
        const messagesRes = await apiRequest('GET', '/api/admin/messages');
        const messagesData = await messagesRes.json();
        setMessages(messagesData);
      } catch (error) {
        console.error("Error fetching admin data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, navigate, user]);

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <Button onClick={() => navigate("/")}>Back to App</Button>
            <ThemeToggle />
          </div>
        </div>

        <Tabs defaultValue="users" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>View and manage all registered users</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-6">Loading users...</div>
                ) : (
                  <Table>
                    <TableCaption>List of all users registered in the system</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Seen</TableHead>
                        <TableHead>Registered</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center">No users found</TableCell>
                        </TableRow>
                      ) : (
                        users.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>{user.id}</TableCell>
                            <TableCell className="font-medium">{user.name}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              <span className={`inline-block w-3 h-3 rounded-full mr-2 ${user.status === "online" ? "bg-green-500" : "bg-gray-400"}`}></span>
                              {user.status}
                            </TableCell>
                            <TableCell>{user.lastSeen ? formatDate(user.lastSeen) : "N/A"}</TableCell>
                            <TableCell>{user.createdAt ? formatDate(user.createdAt) : "N/A"}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Message Statistics</CardTitle>
                <CardDescription>View message activity</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-6">Loading message data...</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xl">Total Messages</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-4xl font-bold">{messages.length}</p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xl">Media Shared</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-4xl font-bold">
                          {messages.filter(m => m.type !== "text").length}
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xl">24hr Activity</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-4xl font-bold">
                          {messages.filter(m => {
                            const oneDayAgo = new Date();
                            oneDayAgo.setDate(oneDayAgo.getDate() - 1);
                            return new Date(m.createdAt) >= oneDayAgo;
                          }).length}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>System Statistics</CardTitle>
                <CardDescription>Overview of system performance and metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xl">Active Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-4xl font-bold">{users.filter(u => u.status === "online").length}</p>
                      <p className="text-muted-foreground">of {users.length} total users</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xl">User Retention</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-4xl font-bold">
                        {users.length > 0 ? Math.round((users.filter(u => {
                          const oneWeekAgo = new Date();
                          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                          return u.lastSeen && new Date(u.lastSeen) >= oneWeekAgo;
                        }).length / users.length) * 100) : 0}%
                      </p>
                      <p className="text-muted-foreground">active in last 7 days</p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}