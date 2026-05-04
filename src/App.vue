<script setup lang="ts">
import { onMounted, ref } from 'vue';

import VrmCanvas from '@/components/VrmCanvas.vue';

const isDocsDemo = __DEMO_BUILD__;
const modelData = ref<ArrayBuffer | null>(null);
const animationData = ref<ArrayBuffer | ArrayBuffer[] | null>(null);
const showGrid = ref(true);
const bgTransparent = ref(false);
const isLoading = ref(false);

async function loadAvatarSample(): Promise<void> {
  isLoading.value = true;
  try {
    const response = await fetch('/assets/AvatarSample_A.vrm');
    if (!response.ok) {
      throw new Error(`Failed to load sample VRM: ${response.status}`);
    }
    modelData.value = await response.arrayBuffer();
  } finally {
    isLoading.value = false;
  }
}

async function onModelFile(e: Event): Promise<void> {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  modelData.value = await file.arrayBuffer();
}

async function onAnimationFile(e: Event): Promise<void> {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  animationData.value = await file.arrayBuffer();
}

function onLoading(): void {
  isLoading.value = true;
}

function onLoaded(): void {
  isLoading.value = false;
}

function onError(err: Error): void {
  isLoading.value = false;
  console.error(err);
  alert(err.message);
}

onMounted(() => {
  if (isDocsDemo) {
    void loadAvatarSample().catch(onError);
  }
});
</script>

<template>
  <div class="app">
    <header class="header">
      <h1>vue-vrm demo</h1>
      <div class="controls">
        <button v-if="isDocsDemo" type="button" @click="loadAvatarSample">Sample VRM</button>
        <label>
          VRM:
          <input type="file" accept=".vrm,.glb" @change="onModelFile" />
        </label>
        <label>
          VRMA:
          <input type="file" accept=".vrma,.glb" @change="onAnimationFile" />
        </label>
        <label>
          <input v-model="showGrid" type="checkbox" />
          Grid
        </label>
        <label>
          <input v-model="bgTransparent" type="checkbox" />
          Transparent
        </label>
        <span v-if="isLoading">Loading…</span>
      </div>
    </header>
    <main class="stage">
      <VrmCanvas
        :model-data="modelData"
        :animation-data="animationData"
        :show-grid="showGrid"
        :bg-transparent="bgTransparent"
        @model:loading="onLoading"
        @model:loaded="onLoaded"
        @model:error="onError"
        @animation:error="onError"
      />
    </main>
  </div>
</template>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.header {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #333;
}

.header h1 {
  margin: 0 0 0.5rem;
  font-size: 1.2rem;
}

.controls {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  align-items: center;
  font-size: 0.9rem;
}

.controls button {
  border: 1px solid #777;
  background: #222;
  color: #fff;
  border-radius: 4px;
  padding: 0.35rem 0.6rem;
  cursor: pointer;
}

.stage {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1a1a1a;
}
</style>
