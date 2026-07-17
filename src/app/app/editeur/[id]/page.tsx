import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Editeur } from "./_editeur";

export default async function EditeurPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: project } = await supabase
    .from("projects")
    .select("id, title")
    .eq("id", id)
    .single();
  if (!project) notFound();

  return <Editeur projectId={project.id} projectTitle={project.title} />;
}
