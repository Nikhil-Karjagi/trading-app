"use client";

import FAQSection from "@/components/FAQSection";
import QuizModal from "@/components/QuizModal";
import { useEffect, useState } from "react";
import { getEducationalModules } from "@/app/actions/modules";
import { BookOpen, PlayCircle, Loader2, Brain } from "lucide-react";

interface Module {
  id: string;
  title: string;
  description: string;
  youtube_url: string;
  created_at: string;
}

function getYouTubeEmbedUrl(url: string): string {
  try {
    const u = new URL(url);
    let videoId = u.searchParams.get("v");
    if (!videoId) videoId = u.pathname.split("/").pop() || "";
    return `https://www.youtube.com/embed/${videoId}`;
  } catch {
    return url;
  }
}

export default function LearnPage() {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeModule, setActiveModule] = useState<Module | null>(null);
  const [quizOpen, setQuizOpen] = useState(false);

  useEffect(() => {
    getEducationalModules()
      .then((data) => {
        setModules(data);
        if (data && data.length > 0) {
          setActiveModule(data[0]);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSelectVideo = (mod: Module) => {
    setActiveModule(mod);
    setQuizOpen(false);
  };

  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col flex-1">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/60 backdrop-blur px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-1">
            <BookOpen className="text-emerald-400" size={24} />
            <h1 className="text-xl font-bold text-white">Learning Hub</h1>
          </div>
          <p className="text-xs text-gray-400 ml-9">
            Watch video modules and test your knowledge with AI-generated quizzes.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 w-full flex-1">
        {loading && (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Loader2 className="h-8 w-8 text-emerald-400 animate-spin mb-2" />
            <p className="text-xs tracking-wider font-mono">Loading modules...</p>
          </div>
        )}

        {!loading && modules.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <PlayCircle size={48} className="text-gray-700 mb-4" />
            <p className="text-gray-500 text-lg">No modules yet.</p>
            <p className="text-gray-600 text-sm mt-1">Ask an admin to add content.</p>
          </div>
        )}

        {!loading && modules.length > 0 && activeModule && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

            {/* Left — Playlist */}
            <div className="lg:col-span-1 space-y-3">
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-gray-500 px-1">
                Course Curriculum
              </h2>
              <div className="space-y-2.5 max-h-[750px] overflow-y-auto pr-2">
                {modules.map((mod) => {
                  const isSelected = mod.id === activeModule.id;
                  return (
                    <button
                      key={mod.id}
                      onClick={() => handleSelectVideo(mod)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all flex gap-3 items-start group ${
                        isSelected
                          ? "bg-emerald-950/20 border-emerald-500/40 text-emerald-400"
                          : "bg-gray-900 border-gray-800 text-gray-300 hover:border-gray-700"
                      }`}
                    >
                      <PlayCircle className={`h-4 w-4 mt-0.5 shrink-0 ${isSelected ? "text-emerald-400" : "text-gray-500 group-hover:text-gray-400"}`} />
                      <div className="space-y-1 text-left">
                        <p className="text-xs font-semibold leading-snug line-clamp-2">{mod.title}</p>
                        {mod.description && (
                          <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">{mod.description}</p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right — Player + Quiz */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
                <div className="aspect-video bg-black relative">
                  <iframe
                    key={activeModule.id}
                    src={getYouTubeEmbedUrl(activeModule.youtube_url)}
                    title={activeModule.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full border-0 absolute inset-0"
                  />
                </div>
                <div className="p-4 border-t border-gray-800 bg-gray-900/40 flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <h2 className="text-base font-bold text-white tracking-tight">
                      {activeModule.title}
                    </h2>
                    {activeModule.description && (
                      <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                        {activeModule.description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setQuizOpen(true)}
                    className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold px-4 py-2 rounded-lg text-xs transition-colors shrink-0"
                  >
                    <Brain size={14} />
                    Take Quiz
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FAQ Section */}
      <div className="max-w-7xl mx-auto px-4 pb-10 w-full">
        <FAQSection />
      </div>

      {/* Quiz Modal */}
      {activeModule && (
        <QuizModal
          isOpen={quizOpen}
          onClose={() => setQuizOpen(false)}
          moduleTitle={activeModule.title}
          moduleDescription={activeModule.description}
        />
      )}
    </main>
  );
}