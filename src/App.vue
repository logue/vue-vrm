<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import type { VrmCanvasExposed } from '@/lib';
import { resetVrmCanvasCamera } from '@/lib';

import ToggleTheme from './components/ToggleTheme.vue';
import VrmCanvas from './components/VrmCanvas.vue';

const isDocsDemo = __DEMO_BUILD__;
const modelData = ref<ArrayBuffer | null>(null);
const animationData = ref<ArrayBuffer | ArrayBuffer[] | null>(null);
const showGrid = ref(true);
const bgTransparent = ref(false);
const isLoading = ref(false);
const vrmCanvasRef = ref<VrmCanvasExposed | null>(null);

const cameraInteractionEnabled = ref(false);
const cameraRotate = ref(true);
const cameraPan = ref(true);
const cameraZoom = ref(true);
const cameraRoll = ref(true);

const cameraInteraction = computed(() => {
  if (!cameraInteractionEnabled.value) return null;
  return {
    enabled: true,
    rotate: cameraRotate.value,
    pan: cameraPan.value,
    zoom: cameraZoom.value,
    roll: cameraRoll.value,
    damping: true,
    dampingFactor: 0.08,
    rotateSpeed: 1,
    panSpeed: 1,
    zoomSpeed: 1,
    minDistance: 0.5,
    maxDistance: 20,
    rollSpeed: 0.03
  };
});

async function loadAvatarSample(): Promise<void> {
  isLoading.value = true;
  try {
    const response = await fetch('./assets/AvatarSample_A.vrm');
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
  console.log('onLoading');
  isLoading.value = true;
}

function onLoaded(): void {
  console.log('onLoaded');
  isLoading.value = false;
}

function onError(err: Error): void {
  isLoading.value = false;
  console.error(err);
  alert(err.message);
}

function onResetCamera(): void {
  resetVrmCanvasCamera(vrmCanvasRef.value);
}

onMounted(() => {
  if (isDocsDemo) {
    loadAvatarSample().catch(onError);
  }
});
</script>

<template>
  <nav class="navbar navbar-expand-md navbar-dark fixed-top bg-dark">
    <div class="container-fluid">
      <a class="navbar-brand" href="#">Vue VRM Demo</a>

      <div id="navbarCollapse" class="collapse navbar-collapse flex-grow-0">
        <ul class="navbar-nav">
          <li class="nav-item">
            <a class="nav-link" href="https://github.com/logue/vue-vrm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                class="bi bi-github"
                viewBox="0 0 16 16"
              >
                <path
                  d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"
                />
              </svg>
            </a>
          </li>
          <li class="nav-item">
            <toggle-theme class="nav-link" attribute="data-bs-theme" />
          </li>
        </ul>
      </div>
    </div>
  </nav>
  <header class="bg-body-tertiary mt-5">
    <div class="container py-3">
      <h1>Vue VRM Demo</h1>
      <p class="lead">
        A simple demo of loading and displaying VRM models in Vue.js. You can load your own VRM
        files using the file input on the left, or use the sample VRM provided by clicking the
        "Sample VRM" button.
      </p>
    </div>
  </header>
  <main class="flex-shrink-0 my-5">
    <div class="container">
      <div class="row">
        <div class="col">
          <div class="mb-3">
            <label for="fileVrm" class="form-label">VRM file:</label>
            <div class="input-group">
              <input
                id="fileVrm"
                class="form-control"
                type="file"
                accept=".vrm,.glb"
                @change="onModelFile"
              />
              <button
                v-if="isDocsDemo"
                type="button"
                class="btn btn-secondary"
                @click="loadAvatarSample"
              >
                Sample VRM
              </button>
            </div>
          </div>
          <div class="mb-3">
            <label for="fileVrma" class="form-label">VRMA (VRM Animation) file:</label>
            <input
              id="fileVrma"
              class="form-control"
              type="file"
              accept=".vrma,.glb"
              @change="onAnimationFile"
            />
            <div class="form-text">
              Due to licensing restrictions, a VRMA file is not available. Please download it from
              <a
                href="https://vroid.booth.pm/items/5512385"
                target="_blank"
                rel="noopener noreferrer"
              >
                here
              </a>
              and load it yourself.
            </div>
          </div>
          <div class="form-check form-switch">
            <input
              v-model="showGrid"
              class="form-check-input"
              type="checkbox"
              id="checkGrid"
              switch
            />
            <label class="form-check-label" for="checkGrid">Show grid</label>
          </div>
          <div class="form-check form-switch">
            <input
              v-model="bgTransparent"
              class="form-check-input"
              type="checkbox"
              id="checkBgTransparent"
              switch
            />
            <label class="form-check-label" for="checkBgTransparent">Transparent Background</label>
          </div>

          <fieldset class="border p-2">
            <legend class="w-auto">Camera Control</legend>
            <div class="form-check form-switch">
              <input
                v-model="cameraInteractionEnabled"
                class="form-check-input"
                type="checkbox"
                id="checkCameraInteraction"
                switch
              />
              <label class="form-check-label" for="checkCameraInteraction">
                Enable Interaction
              </label>
            </div>
            <div class="form-check form-switch">
              <input
                v-model="cameraRotate"
                :disabled="!cameraInteractionEnabled"
                class="form-check-input"
                type="checkbox"
                id="checkCameraRotate"
                switch
              />
              <label class="form-check-label" for="checkCameraRotate">Orbit Rotate</label>
              <div class="form-text">Drag.</div>
            </div>
            <div class="form-check form-switch">
              <input
                v-model="cameraPan"
                :disabled="!cameraInteractionEnabled"
                class="form-check-input"
                type="checkbox"
                id="checkCameraPan"
                switch
              />
              <label class="form-check-label" for="checkCameraPan">Pan</label>
              <div class="form-text">
                Right mouse button and drag or
                <kbd>Ctrl</kbd>
                + Left mouse button and drag.
              </div>
            </div>
            <div class="form-check form-switch">
              <input
                v-model="cameraZoom"
                :disabled="!cameraInteractionEnabled"
                class="form-check-input"
                type="checkbox"
                id="checkCameraZoom"
                switch
              />
              <label class="form-check-label" for="checkCameraZoom">Zoom</label>
              <div class="form-text">Mouse wheel.</div>
            </div>
            <div class="form-check form-switch mb-2">
              <input
                v-model="cameraRoll"
                :disabled="!cameraInteractionEnabled"
                class="form-check-input"
                type="checkbox"
                id="checkCameraRoll"
                switch
              />
              <label class="form-check-label" for="checkCameraRoll">Roll</label>
              <div class="form-text">
                Click the canvas to focus, then press
                <kbd>Q</kbd>
                /
                <kbd>E</kbd>
                for roll.
              </div>
            </div>
            <button type="button" class="btn btn-outline-secondary btn-sm" @click="onResetCamera">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                class="bi bi-arrow-clockwise"
                viewBox="0 0 16 16"
              >
                <path
                  fill-rule="evenodd"
                  d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2z"
                />
                <path
                  d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466"
                />
              </svg>
              Reset Camera
            </button>
          </fieldset>
        </div>
        <div class="col">
          <div v-if="isLoading" class="alert alert-primary" role="alert">Loading...</div>
          <figure class="mx-auto">
            <VrmCanvas
              ref="vrmCanvasRef"
              :model-data="modelData"
              :animation-data="animationData"
              :show-grid="showGrid"
              :bg-transparent="bgTransparent"
              :camera-interaction="cameraInteraction"
              class="img-fluid img-thumbnail"
              @model:loading="onLoading"
              @model:loaded="onLoaded"
              @model:error="onError"
              @animation:error="onError"
            />
            <figcaption class="figure-caption text-center">VRM Model Preview</figcaption>
          </figure>
        </div>
      </div>
    </div>
  </main>
  <footer class="footer mt-auto py-3 mb-0 bg-body-tertiary">
    <div class="container mb-0">
      &copy; 2026 by
      <a href="https://logue.dev/">Logue</a>
      . Licensed under the
      <a href="https://opensource.org/licenses/mit-license.php">MIT License</a>
      .
    </div>
  </footer>
</template>
