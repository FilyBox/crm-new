import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from 'recharts';
import { Label } from 'recharts';

import { transformDataForMultiLineChart } from '@documenso/ui/lib/rechart-format';
import type { Config, Result } from '@documenso/ui/lib/types';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@documenso/ui/primitives/chart';

function toTitleCase(str: string): string {
  return str
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
const colors = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--chart-6))',
  'hsl(var(--chart-7))',
  'hsl(var(--chart-8))',
];

export function DynamicChart({
  chartData,
  chartConfig,
}: {
  chartData: Result[];
  chartConfig: Config;
}) {
  const renderChart = () => {
    if (!chartData || !chartConfig) return <div>No chart data</div>;
    const parsedChartData = chartData.map((item) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const parsedItem: { [key: string]: any } = {};
      for (const [key, value] of Object.entries(item)) {
        parsedItem[key] = isNaN(Number(value)) ? value : Number(value);
      }
      return parsedItem;
    });

    chartData = parsedChartData;

    const processChartData = (data: Result[], chartType: string) => {
      if (chartType === 'bar' || chartType === 'pie') {
        if (data.length <= 8) {
          return data;
        }

        const subset = data.slice(0, 20);
        return subset;
      }
      return data;
    };

    chartData = processChartData(chartData, chartConfig.type);
    // console.log({ chartData, chartConfig });

    switch (chartConfig.type) {
      case 'bar':
        return (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={chartConfig.xKey}>
              <Label value={toTitleCase(chartConfig.xKey)} offset={0} position="insideBottom" />
            </XAxis>
            <YAxis>
              <Label value={toTitleCase(chartConfig.yKeys[0])} angle={-90} position="insideLeft" />
            </YAxis>
            <ChartTooltip content={<ChartTooltipContent />} />
            {chartConfig.legend && <Legend />}
            {chartConfig.yKeys.map((key, index) => (
              <Bar key={key} dataKey={key} fill={colors[index % colors.length]} />
            ))}
          </BarChart>
        );
      case 'line': {
        // Convert any Date objects to strings to ensure compatibility with InputDataPoint
        const processedData = chartData.map((item) => {
          const newItem: Record<string, string | number> = {};
          Object.entries(item).forEach(([key, value]) => {
            newItem[key] = value instanceof Date ? value.toISOString() : value;
          });
          return newItem;
        });

        const { data, xAxisField, lineFields } = transformDataForMultiLineChart(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          processedData as any,
          chartConfig,
        );
        const useTransformedData =
          chartConfig.multipleLines &&
          chartConfig.measurementColumn &&
          chartConfig.yKeys.includes(chartConfig.measurementColumn);
        // console.log(useTransformedData, "useTransformedData");
        // const useTransformedData = false;
        return (
          <LineChart data={useTransformedData ? data : chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={useTransformedData ? chartConfig.xKey : chartConfig.xKey}>
              <Label
                value={toTitleCase(useTransformedData ? xAxisField : chartConfig.xKey)}
                offset={0}
                position="insideBottom"
              />
            </XAxis>
            <YAxis>
              <Label value={toTitleCase(chartConfig.yKeys[0])} angle={-90} position="insideLeft" />
            </YAxis>
            <ChartTooltip content={<ChartTooltipContent />} />
            {chartConfig.legend && <Legend />}
            {useTransformedData
              ? lineFields.map((key, index) => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={colors[index % colors.length]}
                  />
                ))
              : chartConfig.yKeys.map((key, index) => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={colors[index % colors.length]}
                  />
                ))}
          </LineChart>
        );
      }
      case 'area':
        return (
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={chartConfig.xKey} />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            {chartConfig.legend && <Legend />}
            {chartConfig.yKeys.map((key, index) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                fill={colors[index % colors.length]}
                stroke={colors[index % colors.length]}
              />
            ))}
          </AreaChart>
        );
      case 'pie':
        return (
          <PieChart>
            <Pie
              data={chartData}
              dataKey={chartConfig.yKeys[0]}
              nameKey={chartConfig.xKey}
              cx="50%"
              cy="50%"
              outerRadius={120}
            >
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <ChartTooltip content={<ChartTooltipContent />} />
            {chartConfig.legend && <Legend />}
          </PieChart>
        );
      default:
        return <div>Unsupported chart type: {chartConfig.type}</div>;
    }
  };

  return (
    <div className="flex w-full flex-col items-center justify-center">
      <h2 className="mb-2 text-lg font-bold">{chartConfig.title}</h2>
      {chartConfig && chartData.length > 0 && (
        <ChartContainer
          config={chartConfig.yKeys.reduce(
            (acc, key, index) => {
              acc[key] = {
                label: key,
                color: colors[index % colors.length],
              };
              return acc;
            },
            {} as Record<string, { label: string; color: string }>,
          )}
          className="h-[320px] w-full"
        >
          {renderChart()}
        </ChartContainer>
      )}
      <div className="w-full">
        <p className="mt-4 text-sm">{chartConfig.description}</p>
        <p className="mt-4 text-sm">{chartConfig.takeaway}</p>
      </div>
    </div>
  );
}
