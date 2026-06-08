"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { usePathname } from "next/navigation";
import { BarChart2, BookOpen, ShieldAlert, LogIn, Trophy, Gamepad2 } from "lucide-react";
import ProfileDropdown from "@/components/ProfileDropdown";


export default function Navbar() {
  const pathname = usePathname();
  const [email, setEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email ?? null);
      const { data } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single();
      setIsAdmin(data?.is_admin ?? false);
    }
    getUser();
  }, []);

  const links = [
    { href: "/", label: "Sandbox", icon: BarChart2 },
    { href: "/learn", label: "Learn", icon: BookOpen },
    { href: "/game", label: "Game", icon: Gamepad2 },
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
    { href: "/glossary", label: "Glossary", icon: BookOpen },
    ...(isAdmin ? [{ href: "/admin", label: "Admin", icon: ShieldAlert }] : []),
  ];

  return (
    <nav className="bg-gray-900 border-b border-gray-800 px-6 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart2 className="text-emerald-400" size={20} />
          <span className="text-white font-bold text-sm">TradingPlatform</span>
        </div>

        <div className="flex items-center gap-1">
          {links.map(({ href, label, icon: Icon }) => (
            <a key={href} href={href}
              className={
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors " +
                (pathname === href
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "text-gray-400 hover:text-white hover:bg-gray-800")
              }>
              <Icon size={15} />
              {label}
            </a>
          ))}
        </div>

        <div className="flex items-center">
          {email ? (
            <ProfileDropdown email={email} />
          ) : (
            <a href="/login"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
              <LogIn size={15} />
              Login
            </a>
          )}
        </div>
      </div>
    </nav>
  );
}