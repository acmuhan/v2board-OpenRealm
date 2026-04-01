<script setup lang="ts">
import { useUserStore } from '../stores/user'

const userStore = useUserStore()
</script>

<template>
  <div class="traffic-page">
    <h1 class="page-title stagger-1">流量记录</h1>

    <div class="traffic-overview">
      <div class="traffic-stat card-accent stagger-2" style="padding: 24px; text-align: center;">
        <span class="stat-label">总流量</span>
        <span class="stat-value">{{ userStore.formatBytes(userStore.totalTraffic) }}</span>
      </div>
      <div class="traffic-stat card stagger-3" style="padding: 24px; text-align: center;">
        <span class="stat-label">已用上行</span>
        <span class="stat-value brand">{{ userStore.formatBytes(userStore.info?.u || 0) }}</span>
      </div>
      <div class="traffic-stat card stagger-4" style="padding: 24px; text-align: center;">
        <span class="stat-label">已用下行</span>
        <span class="stat-value accent">{{ userStore.formatBytes(userStore.info?.d || 0) }}</span>
      </div>
      <div class="traffic-stat card stagger-5" style="padding: 24px; text-align: center;">
        <span class="stat-label">剩余流量</span>
        <span class="stat-value">{{ userStore.formatBytes(Math.max(0, userStore.totalTraffic - userStore.usedTraffic)) }}</span>
      </div>
    </div>

    <div class="traffic-bar-card card-glow stagger-6" style="padding: 24px;">
      <h3>使用概览</h3>
      <div class="bar-outer">
        <div class="bar-inner" :style="{ width: userStore.trafficPercent + '%' }">
          <div class="bar-shimmer"></div>
        </div>
      </div>
      <div class="bar-labels">
        <span>已用 <strong>{{ userStore.trafficPercent }}%</strong></span>
        <span>{{ userStore.formatBytes(userStore.usedTraffic) }} / {{ userStore.formatBytes(userStore.totalTraffic) }}</span>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '../assets/styles/variables' as *;
.page-title { font-size: 24px; font-weight: 700; margin-bottom: $gap-lg; letter-spacing: -0.5px; }
.traffic-overview { display: grid; grid-template-columns: repeat(4, 1fr); gap: $gap-md; margin-bottom: $gap-lg; }
.stat-label { font-size: 12px; color: var(--text-3); display: block; margin-bottom: $gap-xs; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
.stat-value {
  font-size: 22px; font-weight: 700; font-family: 'Space Grotesk', sans-serif;
  &.brand { color: var(--brand); }
  &.accent { color: var(--accent); }
}
.traffic-bar-card { h3 { font-size: 15px; font-weight: 600; margin-bottom: $gap-md; } }
.bar-outer { width: 100%; height: 14px; background: rgba(255,255,255,0.04); border-radius: 7px; overflow: hidden; }
.bar-inner {
  height: 100%; background: var(--grad-brand); border-radius: 7px;
  transition: width 0.8s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative; overflow: hidden;
}
.bar-shimmer {
  position: absolute; inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  animation: shimmer 2s ease infinite;
}
.bar-labels { display: flex; justify-content: space-between; margin-top: $gap-sm; font-size: 13px; color: var(--text-2); }

@media (max-width: $bp-tablet) { .traffic-overview { grid-template-columns: repeat(2, 1fr); } }
</style>
