"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; 

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function getEducationalModules() {
  const { data, error } = await supabaseAdmin
    .from("educational_modules")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function createEducationalModule(formData: { title: string; description: string; youtube_url: string; userId: string }) {
  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("is_admin")
    .eq("id", formData.userId)
    .single();

  if (profileError || !profile?.is_admin) {
    throw new Error("Unauthorized: Access denied.");
  }

  const { error } = await supabaseAdmin.from("educational_modules").insert([{
    title: formData.title,
    description: formData.description,
    youtube_url: formData.youtube_url,
  }]);

  if (error) throw new Error(error.message);

  revalidatePath("/learn");
  return { success: true };
}