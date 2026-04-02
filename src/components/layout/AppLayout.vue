<script setup lang="ts">
import { onMounted } from 'vue'
import Sidebar from './Sidebar.vue'
import { useUserStore } from '../../stores/user'

const userStore = useUserStore()

onMounted(async () => {
  if (userStore.isLoggedIn && !userStore.info) {
    try {
      await Promise.all([
        userStore.fetchInfo(),
        userStore.fetchSubscribe(),
      ])
    } catch { /* handled by interceptor */ }
    // getStat may not exist on all v2board forks — already handles errors internally
    userStore.fetchStat()
  }
})
</script>

<template>
  <div class="app-layout">
    <Sidebar />
    <main class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="fade-slide" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<style lang="scss" scoped>
@use '../../assets/styles/variables' as *;

.app-layout {
  display: flex;
  min-height: 100vh;
}

.main-content {
  flex: 1;
  margin-left: $sidebar-width;
  padding: $gap-lg $gap-xl;
  min-height: 100vh;
  max-width: calc(100vw - #{$sidebar-width});

  @media (max-width: $bp-tablet) {
    margin-left: 0;
    max-width: 100vw;
    padding: $gap-md;
    padding-top: 62px; // leave room for hamburger button
  }
}
</style>
