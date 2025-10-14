import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/services/queryClient";

export default function LoginStep2() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast({
        variant: "destructive",
        title: "Invalid email",
        description: "Please enter a valid email address",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/admin/auth/step2", { email });
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Step 2 complete",
          description: "Proceeding to backup code verification",
        });
        navigate("/admin/login/step3");
      } else {
        toast({
          variant: "destructive",
          title: "Authentication failed",
          description: data.error || "Email not recognized",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to authenticate",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-gray-950 dark:to-purple-950">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-2">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Admin Portal</CardTitle>
          <CardDescription>
            Step 2 of 3: Verify secret email
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Secret Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter one of your secret emails"
                  className="pl-10"
                  data-testid="input-secret-email"
                  autoFocus
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Enter one of the pre-configured secret emails
              </p>
            </div>

            <div className="space-y-2">
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || !email}
                data-testid="button-submit-email"
              >
                {isLoading ? "Verifying..." : "Continue to Step 3"}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => navigate("/admin/login/step1")}
                data-testid="button-back"
              >
                Back to Step 1
              </Button>
            </div>
          </form>

          <div className="mt-4 text-center text-xs text-muted-foreground">
            <p>Multi-layer security verification</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
