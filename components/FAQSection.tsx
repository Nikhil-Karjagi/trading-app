"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { HelpCircle, Loader2 } from "lucide-react";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export default function FAQSection() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");

  const categories = ["All", "General", "Trading", "Investing", "Forex", "Tax & Regulations"];

  useEffect(() => {
    supabase
      .from("faqs")
      .select("*")
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        setFaqs(data || []);
        setLoading(false);
      });
  }, []);

  const filtered = faqs.filter(f =>
    activeCategory === "All" ? true : f.category === activeCategory
  );

  return (
    <div className="w-full bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-6">
      <div className="flex items-center gap-2 border-b border-gray-800 pb-4">
        <HelpCircle className="w-5 h-5 text-emerald-400" />
        <h2 className="text-xl font-bold text-gray-100">Frequently Asked Questions</h2>
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map(cat => (
          <Button key={cat} size="sm"
            onClick={() => setActiveCategory(cat)}
            className={`text-xs ${activeCategory === cat ? "bg-emerald-500 text-gray-950 hover:bg-emerald-600" : "border-gray-800 hover:bg-gray-800 text-gray-300 bg-transparent border"}`}>
            {cat}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin text-emerald-400" size={24} />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-gray-500 py-8 text-sm">No FAQs in this category yet.</p>
      ) : (
        <Accordion type="single" collapsible className="space-y-2">
          {filtered.map(faq => (
            <AccordionItem key={faq.id} value={faq.id}
              className="border border-gray-800 rounded-lg px-4 bg-gray-950/50">
              <AccordionTrigger className="text-sm font-medium text-gray-200 hover:text-emerald-400 hover:no-underline py-4">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-gray-400 pb-4 leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}