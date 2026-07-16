import type { Metadata } from "next";
import AdminPanel from "@/components/admin/AdminPanel";

export const metadata: Metadata = {
  title: "Gestion des souvenirs",
};

export default function GestionPage() {
  return <AdminPanel />;
}
