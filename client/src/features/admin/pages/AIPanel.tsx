import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "../components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bot } from "lucide-react";

export default function AIPanel() {
  const { data: logs = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/logs"],
  });

  const aiLogs = logs.filter(log => log.action.includes('ai')).slice(0, 20);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">AI Settings</h1>
          <p className="text-muted-foreground">Configure AI assistant behavior</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              AI Activity Logs
            </CardTitle>
            <CardDescription>Last 20 AI-related actions</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center text-muted-foreground py-8">Loading logs...</p>
            ) : aiLogs.length > 0 ? (
              <div className="space-y-2">
                {aiLogs.map((log: any) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-md border border-border hover:bg-muted/50 transition-colors"
                  >
                    <p className="text-sm font-medium">{log.action}</p>
                    {log.details && (
                      <p className="text-xs text-muted-foreground mt-1">{log.details}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(log.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No AI logs found</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
