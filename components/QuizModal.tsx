"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle, XCircle, Loader2, Brain } from "lucide-react";

interface Question {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  moduleTitle: string;
  moduleDescription?: string;
}

export default function QuizModal({ isOpen, onClose, moduleTitle, moduleDescription }: QuizModalProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [error, setError] = useState("");

  async function generateQuiz() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: moduleTitle, description: moduleDescription }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setQuestions(data.questions);
      setStarted(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to generate quiz. Try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit() {
    if (selected === null) return;
    if (selected === questions[currentQ].correctIndex) {
      setScore(s => s + 1);
    }
    setSubmitted(true);
  }

  function handleNext() {
    if (currentQ < questions.length - 1) {
      setCurrentQ(q => q + 1);
      setSelected(null);
      setSubmitted(false);
    } else {
      setFinished(true);
    }
  }

  function handleClose() {
    setQuestions([]);
    setStarted(false);
    setCurrentQ(0);
    setSelected(null);
    setSubmitted(false);
    setScore(0);
    setFinished(false);
    setError("");
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-gray-900 border-gray-800 text-gray-100 max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-emerald-400">
            <Brain size={18} /> Quiz: {moduleTitle}
          </DialogTitle>
        </DialogHeader>

        {/* Start Screen */}
        {!started && !loading && (
          <div className="space-y-4 py-2">
            <p className="text-sm text-gray-400">
              Test your understanding with 5 AI-generated questions about this module.
              You can take this quiz without watching the video too!
            </p>
            {error && (
              <div className="text-rose-400 text-xs bg-rose-500/10 border border-rose-500/20 rounded-lg p-3">
                {error}
              </div>
            )}
            <button
              onClick={generateQuiz}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold py-2.5 rounded-lg text-sm transition-colors"
            >
              Generate Quiz with AI
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <Loader2 className="animate-spin text-emerald-400" size={32} />
            <p className="text-sm text-gray-400">Generating questions with Gemini AI...</p>
          </div>
        )}

        {/* Quiz Questions */}
        {started && !finished && questions.length > 0 && (
          <div className="space-y-4 py-2">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Question {currentQ + 1} of {questions.length}</span>
              <span>Score: {score}/{currentQ}</span>
            </div>

            <div className="w-full bg-gray-800 rounded-full h-1.5">
              <div
                className="bg-emerald-500 h-1.5 rounded-full transition-all"
                style={{ width: `${((currentQ) / questions.length) * 100}%` }}
              />
            </div>

            <p className="text-sm font-medium text-gray-200 bg-gray-950 p-3 rounded-xl border border-gray-800 leading-relaxed">
              {questions[currentQ].question}
            </p>

            <div className="space-y-2">
              {questions[currentQ].options.map((option, i) => {
                let style = "bg-gray-950 border-gray-800 text-gray-400 hover:bg-gray-800";
                if (submitted) {
                  if (i === questions[currentQ].correctIndex) style = "bg-emerald-500/10 border-emerald-500/40 text-emerald-400";
                  else if (i === selected) style = "bg-rose-500/10 border-rose-500/40 text-rose-400";
                  else style = "bg-gray-950 border-gray-800 text-gray-600";
                } else if (selected === i) {
                  style = "bg-emerald-950/20 border-emerald-500/30 text-emerald-400";
                }
                return (
                  <button key={i} onClick={() => !submitted && setSelected(i)}
                    className={`w-full text-left p-3 rounded-xl border text-xs transition-all ${style}`}>
                    {option}
                  </button>
                );
              })}
            </div>

            {submitted && (
              <div className="bg-gray-950 border border-gray-800 rounded-xl p-3 text-xs text-gray-400 leading-relaxed">
                {questions[currentQ].explanation}
              </div>
            )}

            <div className="flex justify-end">
              {!submitted ? (
                <button onClick={handleSubmit} disabled={selected === null}
                  className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-gray-800 disabled:text-gray-600 text-gray-950 font-bold px-5 py-2 rounded-lg text-sm transition-colors">
                  Submit Answer
                </button>
              ) : (
                <button onClick={handleNext}
                  className="bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold px-5 py-2 rounded-lg text-sm transition-colors">
                  {currentQ < questions.length - 1 ? "Next Question" : "See Results"}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Results */}
        {finished && (
          <div className="space-y-4 py-2 text-center">
            <div className={`text-5xl font-bold ${score >= 3 ? "text-emerald-400" : "text-rose-400"}`}>
              {score}/{questions.length}
            </div>
            <div className="flex items-center justify-center gap-2">
              {score >= 3
                ? <><CheckCircle className="text-emerald-400" size={20} /><span className="text-emerald-400 font-semibold">Passed!</span></>
                : <><XCircle className="text-rose-400" size={20} /><span className="text-rose-400 font-semibold">Try again after reviewing the video</span></>
              }
            </div>
            <p className="text-xs text-gray-500">
              {score >= 3
                ? "Great understanding of this topic!"
                : "Watch the video again and retry — you'll get it!"}
            </p>
            <button onClick={handleClose}
              className="w-full bg-gray-800 hover:bg-gray-700 text-gray-200 font-semibold py-2.5 rounded-lg text-sm transition-colors">
              Close
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}