"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Trophy, ArrowLeft, Loader2, TrendingUp, TrendingDown, Award, ShieldAlert } from "lucide-react";

interface LeaderboardRecord {
  id: string;
  user_id: string;
  roi_percent: number;
  final_amount: number;
  starting_amount: number;
  timeframe: number;
  charges_paid: number;
  tax_paid: number;
  mode: string;
  created_at: string;
}

export default function LeaderboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [leaders, setLeaders] = useState<LeaderboardRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { router.push("/login"); return; }

        const { data, error: fetchError } = await supabase
          .from("game_results")
          .select("*")
          .order("roi_percent", { ascending: false })
          .limit(10);

        if (fetchError) throw fetchError;
        setLeaders(data || []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 min-h-screen bg-gray-950 text-white">

      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="text-amber-400 h-6 w-6" /> Leaderboard
          </h1>
          <p className="text-xs text-gray-400 mt-1">Top 10 traders by ROI</p>
        </div>
        <button onClick={() => router.push("/game")}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-emerald-400 border border-gray-800 px-3 py-1.5 rounded-lg transition">
          <ArrowLeft size={14} /> Back to Game
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-rose-950/20 border border-rose-500/20 rounded-xl p-4 flex gap-3 text-xs text-rose-400">
          <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Empty */}
      {!error && leaders.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <Award className="h-12 w-12 text-gray-700" />
          <h3 className="text-sm font-bold text-gray-300">No results yet</h3>
          <p className="text-xs text-gray-500">Play the trading game to appear here!</p>
          <button onClick={() => router.push("/game")}
            className="mt-2 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold text-xs px-4 py-2 rounded-lg transition-colors">
            Play Now
          </button>
        </div>
      )}

      {/* Table */}
      {!error && leaders.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-800">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400">Top 10 Traders</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-800 text-[10px] font-bold text-gray-500 uppercase tracking-wider bg-gray-950/40">
                  <th className="py-3 px-4 text-center w-12">Rank</th>
                  <th className="py-3 px-4">Trader</th>
                  <th className="py-3 px-4 text-right">Started</th>
                  <th className="py-3 px-4 text-right">Final</th>
                  <th className="py-3 px-4 text-right">Charges+Tax</th>
                  <th className="py-3 px-4 text-right pr-6">ROI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50 font-mono text-xs">
                {leaders.map((record, index) => {
                  const isPositive = record.roi_percent >= 0;
                  return (
                    <tr key={record.id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="py-4 px-4 text-center">
                        {index === 0
                          ? <span className="inline-flex items-center justify-center bg-amber-500 text-gray-950 font-extrabold text-[10px] h-6 w-6 rounded-full">1</span>
                          : index === 1
                          ? <span className="inline-flex items-center justify-center bg-gray-300 text-gray-950 font-extrabold text-[10px] h-6 w-6 rounded-full">2</span>
                          : index === 2
                          ? <span className="inline-flex items-center justify-center bg-orange-400 text-gray-950 font-extrabold text-[10px] h-6 w-6 rounded-full">3</span>
                          : <span className="text-gray-600">#{index + 1}</span>
                        }
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-gray-300 font-sans text-xs block">
                          ...{record.user_id.slice(-8)}
                        </span>
                        <span className="text-[10px] text-gray-600 font-sans">
                          {record.timeframe}d · {record.mode || "swing"}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right text-gray-400">
                        ₹{record.starting_amount?.toLocaleString("en-IN") || "—"}
                      </td>
                      <td className="py-4 px-4 text-right text-gray-200 font-medium">
                        ₹{record.final_amount?.toLocaleString("en-IN", { maximumFractionDigits: 0 }) || "—"}
                      </td>
                      <td className="py-4 px-4 text-right text-rose-400">
                        ₹{((record.charges_paid || 0) + (record.tax_paid || 0)).toFixed(0)}
                      </td>
                      <td className="py-4 px-4 text-right pr-6">
                        <div className="inline-flex items-center gap-1">
                          {isPositive
                            ? <TrendingUp size={12} className="text-emerald-400" />
                            : <TrendingDown size={12} className="text-rose-400" />
                          }
                          <span className={`font-bold ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
                            {isPositive ? "+" : ""}{record.roi_percent.toFixed(2)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}