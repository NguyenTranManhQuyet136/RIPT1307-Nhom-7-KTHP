import { defineConfig } from "umi";

export default defineConfig({
  routes: [
    { path: "/", component: "index" },
    { path: "/docs", component: "docs" },
    { path: "/auth", component: "auth", layout: false },
    { path: "/reset-password", component: "reset-password", layout: false },
  ],
  npmClient: 'npm',
});
