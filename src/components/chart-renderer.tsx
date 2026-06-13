import React, { Suspense } from 'react';

// Use lazy loading to defer importing mammoth Recharts library until requested
const RechartsComp = React.lazy(async () => {
  const recharts = await import('recharts');
  return {
    default: ({
      chartData,
      chartType,
      xAxisKey,
      yAxisKey,
      title
    }: {
      chartData: any[];
      chartType: 'line' | 'bar' | 'pie';
      xAxisKey: string;
      yAxisKey: string;
      title?: string;
    }) => {
      const {
        ResponsiveContainer,
        BarChart,
        Bar,
        LineChart,
        Line,
        PieChart,
        Pie,
        Cell,
        XAxis,
        YAxis,
        CartesianGrid,
        Tooltip,
        Legend
      } = recharts;

      // Access colors matching the "EduMentor" deep blue theme
      const COLORS = ['#1e3a8a', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

      return (
        <div id="chart-container" className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-5 mt-4 shadow-sm">
          {title && (
            <h4 id="chart-title" className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4 tracking-tight">
              {title}
            </h4>
          )}
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'bar' ? (
                <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey={xAxisKey} stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', borderColor: '#e2e8f0' }}
                    labelStyle={{ fontWeight: 'bold' }}
                  />
                  <Bar dataKey={yAxisKey} fill="#1e3a8a" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : chartType === 'line' ? (
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey={xAxisKey} stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', borderColor: '#e2e8f0' }}
                  />
                  <Line type="monotone" dataKey={yAxisKey} stroke="#1e3a8a" strokeWidth={2.5} activeDot={{ r: 6 }} />
                </LineChart>
              ) : (
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey={yAxisKey}
                    nameKey={xAxisKey}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {chartData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      );
    }
  };
});

interface ChartRendererProps {
  chartData: any[];
  chartType: 'line' | 'bar' | 'pie';
  xAxisKey: string;
  yAxisKey: string;
  title?: string;
}

export default function ChartRenderer(props: ChartRendererProps) {
  return (
    <Suspense
      fallback={
        <div id="chart-skeleton" className="w-full h-72 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-lg flex items-center justify-center animate-pulse mt-4">
          <div className="text-xs text-slate-400 dark:text-slate-500 font-mono">Dynamic charting loading...</div>
        </div>
      }
    >
      <RechartsComp {...props} />
    </Suspense>
  );
}
