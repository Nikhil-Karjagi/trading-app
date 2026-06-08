"use client";

import SIPSimulator from "@/components/SIPSimulator";
import InflationCalculator from "@/components/InflationCalculator";
import RiskCalculator from "@/components/RiskCalculator";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert, Shield, User, Loader2 } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [emailAlerts, setEmailAlerts] = useState({
    signals: true,
    modules: false,
  });

  useEffect(() => {
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
      } else {
        setUserEmail(session.user?.email || "User");
        setLoading(false);
      }
    }
    checkSession();
  }, [router]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-950 text-gray-400 min-h-screen">
        <Loader2 className="h-8 w-8 text-emerald-400 animate-spin mb-2" />
        <p className="text-xs tracking-wider">Verifying session...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-100">Settings</h1>
        <p className="text-xs text-gray-400 mt-1">Manage your account preferences and view legal disclaimers.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-gray-900 border border-gray-800 text-emerald-400 text-xs font-semibold tracking-wide">
            <User size={14} /> Profile & Preferences
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">

          {/* User Identity */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-200">User Identity</CardTitle>
              <CardDescription className="text-xs text-gray-400">Your registered account details.</CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-gray-400 space-y-1">
              <span className="text-gray-500 font-medium">Logged in as:</span>
              <p className="text-gray-200 font-mono text-sm bg-gray-950/60 p-2 rounded border border-gray-800 mt-1">
                {userEmail}
              </p>
            </CardContent>
          </Card>

          {/* Email Preferences */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-200">Email Preferences</CardTitle>
              <CardDescription className="text-xs text-gray-400">Choose what notifications you receive.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start justify-between pb-3 border-b border-gray-800">
                <div className="space-y-0.5">
                  <span className="text-xs font-medium text-gray-200 block">Weekly Summary</span>
                  <span className="text-[11px] text-gray-500 block">Receive weekly trading sandbox performance summary.</span>
                </div>
                <input
                  type="checkbox"
                  checked={emailAlerts.signals}
                  onChange={(e) => setEmailAlerts({ ...emailAlerts, signals: e.target.checked })}
                  className="h-4 w-4 accent-emerald-400 mt-1 cursor-pointer"
                />
              </div>
              <div className="flex items-start justify-between">
                <div className="space-y-0.5">
                  <span className="text-xs font-medium text-gray-200 block">New Module Alerts</span>
                  <span className="text-[11px] text-gray-500 block">Get notified when new learning modules are added.</span>
                </div>
                <input
                  type="checkbox"
                  checked={emailAlerts.modules}
                  onChange={(e) => setEmailAlerts({ ...emailAlerts, modules: e.target.checked })}
                  className="h-4 w-4 accent-emerald-400 mt-1 cursor-pointer"
                />
              </div>
            </CardContent>
          </Card>

          {/* Legal Disclaimer */}
          <Card className="bg-gray-900 border-yellow-600/20">
            <CardHeader className="pb-3 border-b border-gray-800 flex flex-row items-center gap-2 space-y-0">
              <ShieldAlert className="h-4 w-4 text-yellow-500" />
              <CardTitle className="text-sm font-bold text-gray-200 uppercase tracking-wide">Legal Disclaimer</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 text-[11px] text-gray-400 leading-relaxed space-y-3">
              <p>1. All pricing, indicators and data shown are simulations for educational purposes only.</p>
              <p>2. This platform is not SEBI registered. Nothing shown constitutes investment advice.</p>
              <p>3. Tax calculations shown are educational models only — do not use for actual tax filing.</p>
              <div className="p-2.5 bg-yellow-500/5 rounded border border-yellow-500/10 text-yellow-500 flex gap-2 items-start mt-2">
                <Shield className="h-4 w-4 shrink-0 mt-0.5" />
                <p className="text-[10px] leading-normal font-medium">
                  All portfolios use virtual paper money. Past performance does not guarantee future results.
                </p>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* Tools Section */}
      <div className="space-y-6 pt-4 border-t border-gray-800">
        <h2 className="text-lg font-bold text-gray-200">Financial Tools</h2>
        <SIPSimulator />
        <InflationCalculator />
        <RiskCalculator />
      </div>
    </div>
  );
}