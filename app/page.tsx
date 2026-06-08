import HeroSection from "@/components/HeroSection";
import TradingSandbox from "@/components/TradingSandbox";
import NewsSection from "@/components/NewsSection";
import MarketHours from "@/components/MarketHours"; // 🚀 1. Added the Market Hours import

export default function Home() {
  return (
    <div className="flex flex-col w-full min-h-screen">
      {/* 📍 This line mounts your exact code right here */}
      <HeroSection />

      {/* Main Workspace Layout */}
      <div className="max-w-7xl mx-auto px-4 py-8 w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <TradingSandbox />
        </div>
        
        {/* Right Sidebar Container */}
        <div className="lg:col-span-1 space-y-6"> {/* 🚀 2. Added space-y-6 to separate the components cleanly */}
          <MarketHours /> {/* 🚀 3. Placed MarketHours right on top of the news */}
          <NewsSection />
        </div>
      </div>
    </div>
  );
}