"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, GraduationCap, Cpu, Layers, Milestone, UserCheck } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-10 w-full space-y-12 flex-1 animate-in fade-in duration-300">
      
      {/* Editorial Header */}
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        {/* 📍 Swapped shadcn Badge out for a pure Tailwind element to kill the compile error */}
        <div className="inline-block border border-emerald-500/30 text-emerald-400 bg-emerald-500/5 px-3 py-1 text-[11px] uppercase tracking-wider font-semibold rounded-full">
          Academic Laboratory Profile
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-100 sm:text-4xl">
          The Architecture Behind the Sandbox
        </h1>
        <p className="text-sm text-gray-400 leading-relaxed">
          An engineering initiative built to demystify mathematical modeling, quantitative crossover indicators, and fiscal tax compliance friction within financial markets.
        </p>
      </div>

      <hr className="border-gray-800" />

      {/* Main Narrative Split */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        
        {/* Left Column: Academic Origins */}
        <div className="md:col-span-1 space-y-4">
          <div className="sticky top-6 space-y-4">
            <div className="p-4 rounded-xl bg-gradient-to-b from-gray-900 to-gray-950 border border-gray-800 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400">
                <Building2 className="h-5 w-5" />
                <h3 className="text-xs font-bold tracking-wider uppercase text-gray-200">Institutional Roots</h3>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                Conceived as a custom research sandbox to support high-fidelity market structure simulation, processing mock datasets alongside authenticated web data pipelines.
              </p>
              <div className="flex items-center gap-2 pt-2 border-t border-gray-800 text-[11px] text-gray-400 font-medium">
                <GraduationCap className="h-4 w-4 text-emerald-500" />
                <span>Engineering & Quantitative Focus</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Key Structural Elements */}
        <div className="md:col-span-2 space-y-6">
          <h2 className="text-lg font-bold text-gray-200 tracking-tight flex items-center gap-2">
            <Layers className="h-4 w-4 text-emerald-400" /> System Design & Capabilities
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="pb-2">
                <Cpu className="h-5 w-5 text-emerald-400 mb-1" />
                <CardTitle className="text-sm font-semibold text-gray-200">Indicator Backtesting</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-gray-400 leading-relaxed">
                Processes complex client-side calculations using variable weights for Moving Averages and Relative Strength Index (RSI) matrix components.
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="pb-2">
                <Milestone className="h-5 w-5 text-emerald-400 mb-1" />
                <CardTitle className="text-sm font-semibold text-gray-200">Tax Friction Engine</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-gray-400 leading-relaxed">
                Simulates standard statutory levies including Indian STT duties, SEBI operational fees, GST overhead charges, and Capital Gains parameters.
              </CardContent>
            </Card>
          </div>

          {/* Development Matrix Timeline */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-bold tracking-wider uppercase text-gray-400">Project Timeline</h3>
            <div className="border-l border-gray-800 pl-4 ml-2 space-y-6 text-xs">
              
              <div className="relative">
                <div className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-emerald-400 ring-4 ring-emerald-950" />
                <span className="font-mono text-[10px] text-emerald-400 font-semibold block">PHASE 3 — SYSTEM DISCLOSURES</span>
                <p className="text-gray-200 font-medium mt-0.5">Settings Configuration & Core About Subsystems</p>
                <p className="text-gray-400 text-[11px] mt-0.5">Finalizing static route components, security session checks, and full legal compliance text modules.</p>
              </div>

              <div className="relative">
                <div className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-gray-700" />
                <span className="font-mono text-[10px] text-gray-500 font-semibold block">PHASE 2 — WORKSPACE INTEGRATION</span>
                <p className="text-gray-400 font-medium mt-0.5">Sandbox Interfaces & RSS Feeds</p>
                <p className="text-gray-500 text-[11px] mt-0.5">Implemented multi-currency charts, sliding rule controls, and contextual news aggregations.</p>
              </div>

              <div className="relative">
                <div className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-gray-700" />
                <span className="font-mono text-[10px] text-gray-500 font-semibold block">PHASE 1 — SECURE TERMINAL GATEWAYS</span>
                <p className="text-gray-400 font-medium mt-0.5">Supabase Node Foundations</p>
                <p className="text-gray-500 text-[11px] mt-0.5">Assembled initial domain restriction gates, user routing loops, and database profile tables.</p>
              </div>

            </div>
          </div>

          {/* Maintainer Block */}
          <div className="p-4 bg-emerald-950/10 border border-emerald-500/10 rounded-xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-lg shrink-0">
                <UserCheck className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-200">Primary System Architect</h4>
                <p className="text-[11px] text-gray-400">Engineering Portfolio Administrator</p>
              </div>
            </div>
            {/* 📍 Swapped second badge to custom styled tag element */}
            <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] px-2.5 py-0.5 font-mono rounded">
              Active Maintainer
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}