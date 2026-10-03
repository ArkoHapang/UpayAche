"use client";

import React from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
} from "recharts";
import { RiskSummaryData, RiskTrendPoint } from "@/lib/api";

const TOOLTIP_STYLE = {
  backgroundColor: "#FFFFFF",
  border: "1px solid #CED4DA",
  borderRadius: "12px",
  color: "#000000",
  fontSize: "11px",
  boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
  fontFamily: "monospace",
};

interface RiskDistributionChartProps {
  summary: RiskSummaryData;
}

export const RiskDistributionChart: React.FC<RiskDistributionChartProps> = ({
  summary,
}) => {
  const data = [
    { name: "Low Risk", value: summary.low_risk_count, color: "#10B981" },
    { name: "Medium Risk", value: summary.medium_risk_count, color: "#F59E0B" },
    { name: "High Risk", value: summary.high_risk_count, color: "#EA580C" },
    { name: "Critical Risk", value: summary.critical_risk_count, color: "#DC2626" },
  ];

  return (
    <div className="w-full h-64 flex flex-col items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <RechartsTooltip
            formatter={(val: unknown, name: unknown) => {
              const numericVal = typeof val === "number" ? val : Number(val || 0);
              const labelName = typeof name === "string" ? name : String(name || "");
              return [
                `${numericVal} txs (${(
                  (numericVal / (summary.total_analyzed || 1)) *
                  100
                ).toFixed(1)}%)`,
                labelName,
              ];
            }}
            contentStyle={TOOLTIP_STYLE}
          />
          <Legend
            iconType="circle"
            wrapperStyle={{
              fontSize: "11px",
              fontFamily: "monospace",
              paddingTop: "8px",
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

interface RiskTrendChartProps {
  points: RiskTrendPoint[];
}

export const RiskTrendChart: React.FC<RiskTrendChartProps> = ({ points }) => {
  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={points}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#DC2626" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#DC2626" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="txGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#007BFF" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#007BFF" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#EDF0F3" vertical={false} />
          <XAxis
            dataKey="period"
            tick={{ fontSize: 10, fill: "#4E4E50", fontFamily: "monospace" }}
            axisLine={{ stroke: "#CED4DA" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#4E4E50", fontFamily: "monospace" }}
            axisLine={{ stroke: "#CED4DA" }}
            tickLine={false}
          />
          <RechartsTooltip contentStyle={TOOLTIP_STYLE} />
          <Legend
            iconType="circle"
            wrapperStyle={{
              fontSize: "11px",
              fontFamily: "monospace",
              paddingTop: "6px",
            }}
          />
          <Area
            type="monotone"
            dataKey="high_risk_count"
            name="High-Risk Volume"
            stroke="#DC2626"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#riskGradient)"
          />
          <Area
            type="monotone"
            dataKey="transaction_count"
            name="Total Activity"
            stroke="#007BFF"
            strokeWidth={1.5}
            fillOpacity={1}
            fill="url(#txGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

interface TransactionVolumeChartProps {
  points: RiskTrendPoint[];
}

export const TransactionVolumeChart: React.FC<TransactionVolumeChartProps> = ({
  points,
}) => {
  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={points}
          margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#EDF0F3" vertical={false} />
          <XAxis
            dataKey="period"
            tick={{ fontSize: 10, fill: "#4E4E50", fontFamily: "monospace" }}
            axisLine={{ stroke: "#CED4DA" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#4E4E50", fontFamily: "monospace" }}
            axisLine={{ stroke: "#CED4DA" }}
            tickLine={false}
          />
          <RechartsTooltip
            formatter={(val: unknown) => {
              const numericVal = typeof val === "number" ? val : Number(val || 0);
              return [`৳ ${numericVal.toLocaleString()}`, "Transferred BDT"];
            }}
            contentStyle={TOOLTIP_STYLE}
          />
          <Bar
            dataKey="total_amount_bdt"
            name="Total BDT Volume"
            fill="#0054A6"
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

interface AnomalyTrendChartProps {
  points: RiskTrendPoint[];
}

export const AnomalyTrendChart: React.FC<AnomalyTrendChartProps> = ({ points }) => {
  // Compute behavioral anomaly rate based on average risk and high risk volume
  const anomalyData = points.map((p) => {
    const anomalyRate = p.transaction_count > 0
      ? Number(((p.high_risk_count / p.transaction_count) * 100).toFixed(2))
      : 0;
    return {
      period: p.period,
      anomalyRate,
      averageRiskScore: Number((p.average_risk * 100).toFixed(1)),
      flaggedCount: p.high_risk_count,
    };
  });

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={anomalyData}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#EDF0F3" vertical={false} />
          <XAxis
            dataKey="period"
            tick={{ fontSize: 10, fill: "#4E4E50", fontFamily: "monospace" }}
            axisLine={{ stroke: "#CED4DA" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#4E4E50", fontFamily: "monospace" }}
            axisLine={{ stroke: "#CED4DA" }}
            tickLine={false}
          />
          <RechartsTooltip
            formatter={(val: unknown, name: unknown) => {
              const numericVal = typeof val === "number" ? val : Number(val || 0);
              const labelName = typeof name === "string" ? name : String(name || "");
              return [`${numericVal}%`, labelName];
            }}
            contentStyle={TOOLTIP_STYLE}
          />
          <Legend
            iconType="circle"
            wrapperStyle={{
              fontSize: "11px",
              fontFamily: "monospace",
              paddingTop: "6px",
            }}
          />
          <Line
            type="monotone"
            dataKey="anomalyRate"
            name="Anomaly Rate (%)"
            stroke="#7C3AED"
            strokeWidth={2}
            dot={{ r: 3, fill: "#7C3AED" }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="averageRiskScore"
            name="Avg Risk Score (%)"
            stroke="#FFD602"
            strokeWidth={2}
            dot={{ r: 3, fill: "#FFD602" }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
