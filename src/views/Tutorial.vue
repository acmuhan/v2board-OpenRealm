<script setup lang="ts">
const tutorials = [
  { platform: 'Windows', icon: 'windows', steps: ['下载 Clash Verge Rev 客户端', '复制订阅链接', '打开客户端 → 配置 → 导入订阅链接', '开启系统代理'] },
  { platform: 'iOS', icon: 'apple', steps: ['App Store 搜索 Shadowrocket (需海外ID)', '复制订阅链接', '打开 Shadowrocket → 添加节点 → 粘贴订阅', '连接节点'] },
  { platform: 'Android', icon: 'android', steps: ['下载 Clash Meta for Android', '复制订阅链接', '打开应用 → 配置 → 从URL导入', '选择节点并连接'] },
  { platform: 'macOS', icon: 'macos', steps: ['下载 Clash Verge Rev 客户端', '复制订阅链接', '打开客户端 → 配置 → 导入订阅链接', '开启系统代理'] },
]
</script>

<template>
  <div class="tutorial-page">
    <h1 class="page-title">使用教程</h1>
    <div class="tutorial-grid">
      <div v-for="t in tutorials" :key="t.platform" class="tutorial-card glass-card">
        <h3>{{ t.platform }}</h3>
        <ol class="steps">
          <li v-for="(step, i) in t.steps" :key="i">
            <span class="step-num">{{ i + 1 }}</span>
            <span>{{ step }}</span>
          </li>
        </ol>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '../assets/styles/variables' as *;
.page-title { font-size: 22px; font-weight: 700; margin-bottom: $gap-lg; }
.tutorial-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: $gap-md; }
.tutorial-card { padding: $gap-lg; h3 { font-size: 18px; font-weight: 700; margin-bottom: $gap-md; } }
.steps { list-style: none; display: flex; flex-direction: column; gap: $gap-sm; }
.steps li { display: flex; align-items: flex-start; gap: $gap-sm; font-size: 14px; color: var(--text-2); line-height: 1.5; }
.step-num {
  flex-shrink: 0; width: 24px; height: 24px; border-radius: 8px;
  background: var(--brand); color: #fff; font-size: 12px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}
</style>
