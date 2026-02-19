import { motion } from "framer-motion";

export default function LoadingSkeleton() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.15 }}
          className="glass-card p-6 space-y-5 relative overflow-hidden"
        >
          {/* Shimmer overlay */}
          <div className="absolute inset-0 animate-shimmer pointer-events-none" />

          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-white/[0.04] animate-pulse" />
            <div className="space-y-2 flex-1">
              <div className="h-4 w-32 rounded-lg bg-white/[0.06] animate-pulse" />
              <div className="h-3 w-20 rounded-lg bg-white/[0.04] animate-pulse" />
            </div>
            <div className="h-8 w-24 rounded-full bg-white/[0.04] animate-pulse" />
          </div>

          {/* Safety bar skeleton */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <div className="h-3 w-28 rounded bg-white/[0.04] animate-pulse" />
              <div className="h-3 w-10 rounded bg-white/[0.04] animate-pulse" />
            </div>
            <div className="h-2 w-full rounded-full bg-white/[0.03] overflow-hidden">
              <motion.div
                initial={{ width: "0%" }}
                animate={{ width: "60%" }}
                transition={{ duration: 1.5, delay: i * 0.2, ease: "easeOut" }}
                className="h-full rounded-full bg-white/[0.06]"
              />
            </div>
          </div>

          {/* Recommendation skeleton */}
          <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-4 space-y-2">
            <div className="h-4 w-40 rounded bg-white/[0.05] animate-pulse" />
            <div className="h-3 w-full rounded bg-white/[0.03] animate-pulse" />
            <div className="h-3 w-3/4 rounded bg-white/[0.03] animate-pulse" />
          </div>
        </motion.div>
      ))}

      {/* Analyzing text */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center pt-4"
      >
        <div className="inline-flex items-center gap-3 text-zinc-500 text-sm">
          <div className="flex gap-1">
            <div className="h-1.5 w-1.5 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="h-1.5 w-1.5 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <div className="h-1.5 w-1.5 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
          <span className="text-xs uppercase tracking-widest font-medium animate-breathe">Analyzing pharmacogenomic data</span>
        </div>
      </motion.div>
    </motion.div>
  );
}
