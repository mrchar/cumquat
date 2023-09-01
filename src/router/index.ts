import { createRouter, createWebHashHistory, RouteRecordRaw } from "vue-router";
import Loading from "../pages/Loading.vue";
import Button from "../pages/Button.vue";
import Table from "../pages/Table.vue";

export const routes: RouteRecordRaw[] = [
  { name: "Home", path: "/", redirect: "/loading" },
  { name: "Loading", path: "/loading", component: Loading },
  { name: "Button", path: "/button", component: Button },
  { name: "Table", path: "/table", component: Table },
];

const router = createRouter({
  routes: routes,
  history: createWebHashHistory(),
});

export default router;
