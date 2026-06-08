"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { createEducationalModule } from "@/app/actions/modules";
import { ShieldAlert, PlusCircle, CheckCircle, AlertCircle, LogIn } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";


interface FormState {
  title: string;
  description: string;
  youtube_url: string;
}

export default function AdminPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);
  const [form, setForm] = useState<FormState>({ title: "", description: "", youtube_url: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function checkAdmin() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setChecking(false); return; }
      setUserId(user.id);
      const { data } = await supabase
        .from("profiles").select("is_admin").eq("id", user.id).single();
      setIsAdmin(data?.is_admin ?? false);
      setChecking(false);
    }
    checkAdmin();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    setStatus("loading");
    setErrorMsg("");
    try {
      await createEducationalModule({ ...form, userId });
      setStatus("success");
      setForm({ title: "", description: "", youtube_url: "" });
      setTimeout(() => setStatus("idle"), 3000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
    }
  }

  if (checking) {
    return (
      <main className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (!userId) {
    return (
      <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center gap-4">
        <LogIn size={40} className="text-gray-600" />
        <p className="text-gray-400">You must be logged in to access this page.</p>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center gap-4">
        <ShieldAlert size={40} className="text-rose-500" />
        <p className="text-gray-300 font-medium">Access Denied</p>
        <p className="text-gray-500 text-sm">You do not have admin privileges.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="border-b border-gray-800 bg-gray-900/60 backdrop-blur px-6 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-1">
            <ShieldAlert className="text-emerald-400" size={26} />
            <h1 className="text-2xl font-bold">Admin Panel</h1>
          </div>
          <p className="text-gray-400 ml-11 text-sm">Add educational modules to the Learning Hub.</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-10">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <PlusCircle size={20} className="text-emerald-400" />
              New Module
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-300">Title *</label>
                <input required value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Introduction to Moving Averages"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-300">Description</label>
                <textarea rows={3} value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Brief description of what this module covers..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-emerald-500 transition-colors resize-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-300">YouTube URL *</label>
                <input required type="url" value={form.youtube_url}
                  onChange={e => setForm(f => ({ ...f, youtube_url: e.target.value }))}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
              {status === "error" && (
                <div className="flex items-center gap-2 text-rose-400 text-sm bg-rose-500/10 border border-rose-500/20 rounded-lg px-4 py-3">
                  <AlertCircle size={16} /> {errorMsg}
                </div>
              )}
              {status === "success" && (
                <div className="flex items-center gap-2 text-emerald-400 text-sm bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-3">
                  <CheckCircle size={16} /> Module added successfully!
                </div>
              )}
              <button type="submit" disabled={status === "loading"}
                className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-900 disabled:text-emerald-600 text-gray-950 font-semibold py-2.5 rounded-lg transition-colors text-sm">
                {status === "loading" ? "Adding..." : "Add Module"}
              </button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}