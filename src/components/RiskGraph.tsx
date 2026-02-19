import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface RiskGraphProps {
  before: number;
  after: number;
  drug: string;
}

export default function RiskGraph({ before, after, drug }: RiskGraphProps) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 300);
    return () => clearTimeout(t);
  }, []);

  const data = [
    { label: "Standard Risk", value: animated ? before * 100 : 0 },
    { label: "After Adjustment", value: animated ? after * 100 : 0 },
  ];

  // Crimson Red #D11A2A for Standard (High Risk), Emerald #10B981 for Adjusted (Safe)
  const colors = ["#D11A2A", "#10B981"];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="w-full"
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Risk Mitigation Projection</p>
        <span className="text-[10px] text-zinc-500 font-mono">{drug}</span>
      </div>

      <div className="h-[140px] w-full rounded-xl bg-white/5 p-2 border border-white/5">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, bottom: 5, left: 0 }} barCategoryGap="25%">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" horizontal={true} vertical={false} />
            <XAxis
              type="number"
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
              tick={{ fontSize: 10, fill: "#71717a" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="label"
              tick={{ fontSize: 11, fill: "#a1a1aa", fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              width={110}
            />
            <Tooltip
              cursor={{ fill: 'rgba(255,255,255,0.05)' }}
              formatter={(v: number) => [`${v.toFixed(1)}%`, "Risk Score"]}
              contentStyle={{
                backgroundColor: "#09090b",
                borderColor: "#27272a",
                borderRadius: "8px",
                color: "#f4f4f5",
                fontSize: "12px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.5)"
              }}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} animationDuration={1500} animationEasing="ease-out">
              {data.map((_, i) => (
                <Cell key={i} fill={colors[i]} strokeWidth={0} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
