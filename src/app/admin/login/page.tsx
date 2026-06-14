'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import { useState, useEffect } from "react";

export default function AdminLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // If already authenticated, skip login and go to dashboard
  useEffect(() => {
    if (sessionStorage.getItem('isAdminAuthenticated') === 'true') {
      router.replace('/admin/dashboard');
    }
  }, [router]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check credentials (using fallback for initial setup)
    const storedAdmin = typeof window !== 'undefined' ? localStorage.getItem('adminCredentials') : null;
    const defaultAdmin = { username: 'unknownzaire94', password: 'z@!re4515' };
    const credentials = storedAdmin ? JSON.parse(storedAdmin) : defaultAdmin;

    if (username === credentials.username && password === credentials.password) {
      // Set session-only authentication flag
      sessionStorage.setItem('isAdminAuthenticated', 'true');
      
      toast({
        title: 'Admin Login Successful',
        description: 'Welcome to the Admin Panel.',
      });
      
      // Redirect to the protected dashboard
      router.push('/admin/dashboard');
    } else {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: 'Invalid username or password. Please try again.',
      });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex justify-center">
            <Logo />
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Admin Login</CardTitle>
            <CardDescription>Enter your admin credentials to continue.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input 
                  id="username" 
                  placeholder="Admin username" 
                  required 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="Admin password"
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full">Login</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
