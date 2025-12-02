import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useDashboardStore } from '../stores/dashboardStore';

export default function MetricsPanel() {
  const { metricsData } = useDashboardStore();

  return (
    <Card className="border-border bg-card text-card-foreground">
      <CardHeader>
        <CardTitle className="font-heading text-xl text-foreground">Performance Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="throughput" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-muted">
            <TabsTrigger
              value="throughput"
              className="text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Throughput
            </TabsTrigger>
            <TabsTrigger
              value="latency"
              className="text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Latency
            </TabsTrigger>
            <TabsTrigger
              value="success"
              className="text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Success Rate
            </TabsTrigger>
          </TabsList>

          <TabsContent value="throughput" className="mt-6">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={metricsData.throughput}>
                <defs>
                  <linearGradient id="throughputGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(187, 72%, 42%)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="hsl(187, 72%, 42%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 20%)" />
                <XAxis dataKey="time" stroke="hsl(220, 9%, 68%)" style={{ fontSize: '12px' }} />
                <YAxis stroke="hsl(220, 9%, 68%)" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(220, 15%, 14%)',
                    border: '1px solid hsl(220, 13%, 20%)',
                    borderRadius: '8px',
                    color: 'hsl(220, 10%, 96%)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(187, 72%, 42%)"
                  strokeWidth={2}
                  fill="url(#throughputGradient)"
                  animationDuration={1000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="latency" className="mt-6">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metricsData.latency}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 20%)" />
                <XAxis dataKey="time" stroke="hsl(220, 9%, 68%)" style={{ fontSize: '12px' }} />
                <YAxis stroke="hsl(220, 9%, 68%)" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(220, 15%, 14%)',
                    border: '1px solid hsl(220, 13%, 20%)',
                    borderRadius: '8px',
                    color: 'hsl(220, 10%, 96%)',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(313, 75%, 55%)"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(313, 75%, 55%)', r: 4 }}
                  animationDuration={1000}
                />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="success" className="mt-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={metricsData.successRate}>
                <defs>
                  <linearGradient id="successGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(152, 58%, 42%)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="hsl(152, 58%, 42%)" stopOpacity={0.3} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 20%)" />
                <XAxis dataKey="time" stroke="hsl(220, 9%, 68%)" style={{ fontSize: '12px' }} />
                <YAxis stroke="hsl(220, 9%, 68%)" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(220, 15%, 14%)',
                    border: '1px solid hsl(220, 13%, 20%)',
                    borderRadius: '8px',
                    color: 'hsl(220, 10%, 96%)',
                  }}
                />
                <Bar
                  dataKey="value"
                  fill="url(#successGradient)"
                  radius={[8, 8, 0, 0]}
                  animationDuration={1000}
                />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
