"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Smartphone } from "lucide-react";

export default function MobileWarning() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const checkScreenSize = () => {
      // Trigger below 768px
      if (window.innerWidth < 768) {
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    };

    // Run on initial mount
    checkScreenSize();

    // Listen for resize events
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Prevent SSR hydration mismatch
  if (!mounted) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      // Prevent closing by clicking outside or pressing Escape unless they bypass
      if (!open) return;
    }}>
      <DialogContent className="bg-gray-900 border-gray-800 text-gray-100 max-w-sm sm:max-w-md pointer-events-auto [&>button]:hidden">
        <DialogHeader className="flex flex-col items-center justify-center text-center space-y-3">
          <div className="p-3 bg-yellow-500/10 text-yellow-500 rounded-full">
            <Smartphone className="h-8 w-8" />
          </div>
          <DialogTitle className="text-xl font-bold tracking-tight">
            Desktop Experience Recommended
          </DialogTitle>
          <DialogDescription className="text-gray-400 text-sm">
            This Educational Algorithmic Trading Platform features complex interactive charts, market data matrix setups, and data-dense sandboxes optimized for larger screens.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-2 mt-4">
          <Button 
            onClick={() => setIsOpen(false)}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-gray-950 font-semibold"
          >
            Continue Anyway
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}