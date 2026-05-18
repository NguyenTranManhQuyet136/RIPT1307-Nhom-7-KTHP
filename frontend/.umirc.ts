import { defineConfig } from "umi";

export default defineConfig({
  routes: [
    { path: "/", component: "index" },
    { path: "/docs", component: "docs" },
    { path: "/auth", component: "auth", layout: false },
    { path: "/forum", component: "forum/index", layout: false },
    { path: "/forum/profile", component: "forum/profile/index", layout: false },
    { path: "/forum/post/:id", component: "forum/post/[id]", layout: false },
    { path: "/reset-password", component: "reset-password", layout: false },
  ],
  npmClient: 'npm',
});
