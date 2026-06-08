"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, Trophy, BookOpen, Settings, LogOut, ChevronDown } from "lucide-react";

interface ProfileDropdownProps {
  email: string;
}

export default function ProfileDropdown({ email }: ProfileDropdownProps) {
  const router = useRouter();
  const [stats, setStats] = useState({
    gamesPlayed: 0,
    bestRoi: 0,
    modulesWatched: 0,
  });

  useEffect(() => {
    async function fetchUserMetrics() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch game results data metrics
      const { data: games } = await supabase
        .from("game_results")
        .select("roi_percent")
        .eq("user_id", user.id);

      // 2. Fetch completed educational modules counter
      const { data: modules } = await supabase
        .from("module_progress")
        .select("id")
        .eq("user_id", user.id)
        .eq("watched", true);

      if (games) {
        const gameCount = games.length;
        const maxRoi = gameCount > 0 ? Math.max(...games.map(g => g.roi_percent)) : 0;
        
        setStats(prev => ({
          ...prev,
          gamesPlayed: gameCount,
          bestRoi: maxRoi
        }));
      }

      if (modules) {
        setStats(prev => ({
          ...prev,
          modulesWatched: modules.length
        }));
      }
    }

    fetchUserMetrics();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login"; // Force state reload across layouts
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-800 bg-gray-950 hover:bg-gray-800 text-gray-200 transition-colors focus:outline-none">
        <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
          <User className="w-3 h-3 text-emerald-400" />
        </div>
        <span className="text-xs font-medium max-w-[140px] truncate hidden sm:block">
          {email.split("@")[0]}
        </span>
        <ChevronDown className="w-3 h-3 text-gray-500" />
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56 bg-gray-900 border-gray-800 text-gray-200" align="end">
        <DropdownMenuLabel className="font-normal border-b border-gray-800 pb-2">
          <p className="text-xs text-gray-500 font-medium">Logged in as</p>
          <p className="text-xs font-semibold text-emerald-400 truncate mt-0.5">{email}</p>
        </DropdownMenuLabel>

        {/* Dynamic Metric Readouts */}
        <div className="p-2 grid grid-cols-3 gap-1 text-center bg-gray-950/40 border-b border-gray-800">
          <div className="space-y-0.5">
            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Games</p>
            <p className="text-xs font-bold text-gray-200 flex items-center justify-center gap-0.5">
              <Trophy className="w-2.5 h-2.5 text-yellow-500" /> {stats.gamesPlayed}
            </p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Best ROI</p>
            <p className={`text-xs font-bold flex items-center justify-center ${stats.bestRoi >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {stats.bestRoi.toFixed(1)}%
            </p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Learnt</p>
            <p className="text-xs font-bold text-gray-200 flex items-center justify-center gap-0.5">
              <BookOpen className="w-2.5 h-2.5 text-blue-400" /> {stats.modulesWatched}
            </p>
          </div>
        </div>

        {/* Navigation Actions */}
        <DropdownMenuItem 
          onClick={() => router.push("/settings")}
          className="text-sm font-medium focus:bg-gray-800 focus:text-white py-2 cursor-pointer mt-1 gap-2"
        >
          <Settings className="w-4 h-4 text-gray-400" /> Account Settings
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-gray-800" />

        <DropdownMenuItem 
          onClick={handleLogout}
          className="text-sm font-medium focus:bg-rose-500/10 text-rose-400 focus:text-rose-400 py-2 cursor-pointer gap-2"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}