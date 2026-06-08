"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Terminal, BookOpen, Gamepad2, X } from "lucide-react";

export default function HeroSection() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Safely check localStorage after client-side mount
    const hasVisited = localStorage.getItem("has_visited_algo_platform");
    if (!hasVisited) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem("has_visited_algo_platform", "true");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="w-full bg-gradient-to-b from-emerald-950/20 to-transparent border-b border-gray-800 px-4 py-8 relative animate-in fade-in duration-500">
      {/* Close Button X */}
      <button 
        onClick={handleDismiss}
        className="absolute top-4 right-4 text-gray-500 hover:text-gray-300 transition-colors"
        aria-label="Dismiss welcome section"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="max-w-7xl mx-auto space-y-6 text-center md:text-left">
        <div className="space-y-2 max-w-3xl">
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-gray-100">
            Welcome to the <span className="text-emerald-400">Algorithmic Trading Laboratory</span>
          </h1>
          <p className="text-gray-400 text-xs md:text-sm leading-relaxed">
            A comprehensive simulation environment designed to help you backtest systematic indicator crossovers, study market microstructures, and calculate fiscal tax metrics risk-free.
          </p>
        </div>

        {/* 3 Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Card 1 */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="flex flex-row items-center space-x-3 pb-2 space-y-0">
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-md">
                <Terminal className="h-5 w-5" />
              </div>
              <CardTitle className="text-sm font-semibold text-gray-200">1. Strategy Sandbox</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-400 leading-relaxed">
                Tweak live MA and RSI indicators using interactive sliders. Visualize generation paths, entry/exit crossover triggers, and immediate net ROI parameters.
              </p>
            </CardContent>
          </Card>

          {/* Card 2 */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="flex flex-row items-center space-x-3 pb-2 space-y-0">
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-md">
                <BookOpen className="h-5 w-5" />
              </div>
              <CardTitle className="text-sm font-semibold text-gray-200">2. Learning Modules</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-400 leading-relaxed">
                Watch structured video breakdowns, progress through modular tracks, and tackle dynamically configured quizzes built to evaluate theoretical comprehension.
              </p>
            </CardContent>
          </Card>

          {/* Card 3 */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="flex flex-row items-center space-x-3 pb-2 space-y-0">
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-md">
                <Gamepad2 className="h-5 w-5" />
              </div>
              <CardTitle className="text-sm font-semibold text-gray-200">3. Interactive Game</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-400 leading-relaxed">
                Run simulated historical timeline trades. Calculate real-world brokerages, GST, Indian STT duties, and capital gains adjustments.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-center md:justify-start pt-2">
          <Button 
            onClick={handleDismiss}
            className="bg-emerald-500 hover:bg-emerald-600 text-gray-950 font-bold px-6 shadow-lg"
          >
            Get Started
          </Button>
        </div>
      </div>
    </div>
  );
}