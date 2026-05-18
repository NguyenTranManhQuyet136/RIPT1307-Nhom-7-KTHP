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
    { path: "/admin", component: "admin/index", layout: false },
    { path: "/admin/users", component: "admin/users", layout: false },
    { path: "/admin/posts", component: "admin/posts", layout: false },
  ],
  npmClient: 'npm',
  favicons: [ '/favicon.png' ],
  title: 'EduForum',
});
