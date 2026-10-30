<template>
  <div class="shell">
    <SidebarNav :items="navItems" :current-route="state.route" :menu-open="state.menuOpen" @navigate="navigate" />
    <div class="overlay" :class="{ 'is-open': overlayOpen }" @click="closeOverlay"></div>

    <div class="workspace">
      <TopBar
        :meta="currentMeta"
        :current-user="state.currentUser"
        :route="state.route"
        :menu-open="state.menuOpen"
        @toggle-menu="toggleMenu"
        @login="login"
        @logout="logout"
        @open-account="openAccount"
      />

      <component :is="currentView" />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from "vue";
import SidebarNav from "./components/SidebarNav.vue";
import TopBar from "./components/TopBar.vue";
import HomeView from "./views/HomeView.vue";
import RoutineView from "./views/RoutineView.vue";
import InterestView from "./views/InterestView.vue";
import SalaryToolsView from "./views/SalaryToolsView.vue";
import DateToolsView from "./views/DateToolsView.vue";
import AgeToolsView from "./views/AgeToolsView.vue";
import PdfToolsView from "./views/PdfToolsView.vue";
import ImageToolsView from "./views/ImageToolsView.vue";
import WritingToolsView from "./views/WritingToolsView.vue";
import ExpenseToolsView from "./views/ExpenseToolsView.vue";
import PrivacyView from "./views/PrivacyView.vue";
import TermsView from "./views/TermsView.vue";
import PlaceholderView from "./views/PlaceholderView.vue";

const {
  ROUTE_META,
  closeMenuAndModal,
  initCore,
  loginWithGoogle,
  logoutCurrentUser,
  navItems,
  navigate,
  openAccount,
  state,
} = window.__OFFICE_TOOLBOX_CORE__;

const viewMap = {
  home: HomeView,
  routine: RoutineView,
  interest: InterestView,
  salary: SalaryToolsView,
  "date-tools": DateToolsView,
  age: AgeToolsView,
  pdf: PdfToolsView,
  image: ImageToolsView,
  writing: WritingToolsView,
  expense: ExpenseToolsView,
  privacy: PrivacyView,
  terms: TermsView,
  "coming-soon": PlaceholderView,
};

const currentMeta = computed(() => ROUTE_META[state.route] || ROUTE_META.home);
const overlayOpen = computed(() => state.menuOpen || state.modalOpen);
const currentView = computed(() => viewMap[state.route] || HomeView);

function toggleMenu() {
  state.menuOpen = !state.menuOpen;
}

function closeOverlay() {
  closeMenuAndModal();
}

async function login() {
  await loginWithGoogle();
}

async function logout() {
  await logoutCurrentUser();
}

onMounted(async () => {
  await initCore();
});
</script>
