<template>
  <aside class="sidebar" :class="{ 'is-open': menuOpen }">
    <div class="sidebar__brand">
      <span class="sidebar__eyebrow">Office Toolkit</span>
      <h1>직장인 도구 모음</h1>
      <p>일정, 계산, 문서 작업을 한 곳에서.</p>
    </div>

    <nav class="nav" aria-label="주요 메뉴">
      <button
        v-for="item in items"
        :key="item.route"
        class="nav__button"
        :class="{ 'is-active': currentRoute === item.route }"
        type="button"
        @click="$emit('navigate', item.route)"
      >
        <span class="nav__icon">{{ item.icon }}</span>
        <span class="nav__meta">
          <span class="nav__title">{{ item.title }}</span>
          <span class="nav__desc">{{ item.desc }}</span>
        </span>
      </button>
    </nav>

    <div class="sidebar__footer">Work tools for everyday office tasks.</div>
  </aside>
</template>

<script setup>
defineProps({
  items: { type: Array, required: true },
  currentRoute: { type: String, required: true },
  menuOpen: { type: Boolean, required: true },
});

defineEmits(["navigate"]);
</script>
