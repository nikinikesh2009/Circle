import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { KeyRound, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/services/queryClient";
import { useAdminAuth } from "../hooks/useAdminAuth";

export default function LoginStep3() {
  const [, navigate] = useLocation();
  const [code1, setCode1] = useState("");
  const [code2, setCode2] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { login, isAuthenticated } = useAdminAuth();

  // Navigate to dashboard after successful authentication
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/admin/dashboard");
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (code1.length !== 4 || code2.length !== 4) {
      toast({
        variant: "destructive",
        title: "Invalid codes",
        description: "Both codes must be exactly 4 digits",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/admin/auth/step3", { 
        codes: [code1, code2] 
      });
      const data = await response.json();
      
      if (data.success) {
        login(data.token);
        toast({
          title: "Authentication successful",
          description: "Welcome to the admin dashboard",
        });
        // Navigation will happen via useEffect when isAuthenticated becomes true
      } else {
        toast({
          variant: "destructive",
          title: "Authentication failed",
          description: data.error || "Invalid backup codes",
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

  const handleCodeInput = (value: string, setter: (val: string) => void) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 4);
    setter(cleaned);
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
            Step 3 of 3: Enter backup codes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code1">Backup Code 1</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="code1"
                    type="text"
                    value={code1}
                    onChange={(e) => handleCodeInput(e.target.value, setCode1)}
                    placeholder="0000"
                    className="pl-10 text-center text-lg tracking-widest font-mono"
                    maxLength={4}
                    data-testid="input-backup-code-1"
                    autoFocus
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {code1.length}/4 digits
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="code2">Backup Code 2</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="code2"
                    type="text"
                    value={code2}
                    onChange={(e) => handleCodeInput(e.target.value, setCode2)}
                    placeholder="0000"
                    className="pl-10 text-center text-lg tracking-widest font-mono"
                    maxLength={4}
                    data-testid="input-backup-code-2"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {code2.length}/4 digits
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || code1.length !== 4 || code2.length !== 4}
                data-testid="button-submit-codes"
              >
                {isLoading ? "Verifying..." : "Access Dashboard"}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => navigate("/admin/login/step2")}
                data-testid="button-back"
              >
                Back to Step 2
              </Button>
            </div>
          </form>

          <div className="mt-4 text-center text-xs text-muted-foreground">
            <p>Final verification step</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
