import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // Served from the root of digibi-admin.vercel.app (no /admin/ path prefix).
  // If this later moves back behind a reverse proxy at /admin, restore base:"/admin/".
  plugins: [react()],
});
 
