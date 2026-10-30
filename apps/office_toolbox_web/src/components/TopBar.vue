<template>
  <header class="topbar">
    <div class="topbar__left">
      <button class="menu-toggle" type="button" aria-label="메뉴 열기" @click="$emit('toggle-menu')">
        <span class="menu-toggle__bar"></span>
        <span class="menu-toggle__bar"></span>
        <span class="menu-toggle__bar"></span>
      </button>
      <div class="title-block">
        <span class="title-block__eyebrow">{{ meta.eyebrow }}</span>
        <h2>{{ meta.title }}</h2>
      </div>
    </div>

    <div class="topbar__right">
      <div class="topbar__sync">
        <div v-if="syncMessage" class="locale-pill">{{ syncMessage }}</div>
      </div>
      <div class="topbar__actions">
        <template v-if="currentUser">
          <div ref="accountMenu" class="account-menu" :class="{ 'is-open': accountMenuOpen }">
            <button
              class="account-menu__trigger"
              type="button"
              aria-label="계정 메뉴"
              @click="toggleAccountMenu"
            >
              <span class="account-menu__avatar" aria-hidden="true">
                <span class="account-menu__head"></span>
                <span class="account-menu__body"></span>
              </span>
            </button>
            <div v-if="accountMenuOpen" class="account-menu__dropdown">
              <button class="account-menu__item" type="button" @click="handleOpenAccount">내 정보</button>
              <button class="account-menu__item" type="button" @click="handleLogout">로그아웃</button>
            </div>
          </div>
        </template>
        <button v-else class="button button--accent topbar-button" type="button" @click="$emit('login')">로그인</button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";

const props = defineProps({
  meta: { type: Object, required: true },
  currentUser: { type: Object, default: null },
  route: { type: String, required: true },
});

const emit = defineEmits(["toggle-menu", "login", "logout", "open-account"]);

const accountMenuOpen = ref(false);
const accountMenu = ref(null);

const syncMessage = computed(() => {
  if (props.route !== "routine") {
    return "";
  }
  return props.currentUser ? "클라우드 동기화 사용 중" : "로그인하면 루틴 스케줄을 다른 브라우저에서도 이어서 볼 수 있습니다.";
});

function toggleAccountMenu() {
  accountMenuOpen.value = !accountMenuOpen.value;
}

function handleOpenAccount() {
  accountMenuOpen.value = false;
  emit("open-account");
}

function handleLogout() {
  accountMenuOpen.value = false;
  emit("logout");
}

function handleDocumentClick(event) {
  if (!accountMenu.value?.contains(event.target)) {
    accountMenuOpen.value = false;
  }
}

onMounted(() => {
  document.addEventListener("click", handleDocumentClick);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleDocumentClick);
});
</script>
