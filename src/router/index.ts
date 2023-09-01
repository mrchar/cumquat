import { createRouter, createWebHashHistory, RouteRecordRaw } from "vue-router";
import Loading from "../pages/Loading.vue";
import Button from "../pages/Button.vue";

const routes: RouteRecordRaw[] = [
  { path: "/", redirect: "/button" },
  { path: "/loading", component: Loading },
  { path: "/button", component: Button },
];

const router = createRouter({
  routes: routes,
  history: createWebHashHistory(),
});

export default router;
