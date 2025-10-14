import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "../components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function LogsPanel() {
  const { data: logs = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/logs"],
  });

  const { data: failedLogs = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/logs/failed"],
  });

  const exportLogs = (format: 'json' | 'csv') => {
    if (format === 'json') {
      const dataStr = JSON.stringify(logs, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      const exportFileDefaultName = `admin-logs-${new Date().toISOString()}.json`;
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    } else if (format === 'csv') {
      const csvContent = [
        ['ID', 'Action', 'Details', 'IP', 'User Agent', 'Success', 'Created At'].join(','),
        ...logs.map(log => [
          log.id,
          log.action,
          log.details || '',
          log.ipAddress || '',
          log.userAgent || '',
          log.success,
          new Date(log.createdAt).toISOString()
        ].join(','))
      ].join('\n');
      
      const dataUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);
      const exportFileDefaultName = `admin-logs-${new Date().toISOString()}.csv`;
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Logs</h1>
            <p className="text-muted-foreground">Track admin activities and failed logins</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => exportLogs('json')}
              data-testid="button-export-json"
            >
              <Download className="h-4 w-4 mr-2" />
              Export JSON
            </Button>
            <Button
              variant="outline"
              onClick={() => exportLogs('csv')}
              data-testid="button-export-csv"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Failed Login Attempts ({failedLogs.length})
            </CardTitle>
            <CardDescription>Recent failed authentication attempts</CardDescription>
          </CardHeader>
          <CardContent>
            {failedLogs.length > 0 ? (
              <div className="space-y-2">
                {failedLogs.slice(0, 10).map((log: any) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-md border border-destructive/20 bg-destructive/5"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{log.action}</p>
                        {log.details && (
                          <p className="text-xs text-muted-foreground mt-1">{log.details}</p>
                        )}
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {log.ipAddress && (
                            <Badge variant="outline" className="text-xs">
                              IP: {log.ipAddress}
                            </Badge>
                          )}
                          {log.userAgent && (
                            <Badge variant="outline" className="text-xs max-w-xs truncate">
                              {log.userAgent}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground ml-4 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No failed login attempts</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>All Activity Logs ({logs.length})</CardTitle>
            <CardDescription>Complete admin activity history</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center text-muted-foreground py-8">Loading logs...</p>
            ) : logs.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {logs.map((log: any) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-md border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`h-2 w-2 rounded-full mt-2 ${
                          log.success ? "bg-green-500" : "bg-red-500"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{log.action}</p>
                        {log.details && (
                          <p className="text-xs text-muted-foreground mt-1">{log.details}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(log.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No logs found</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
