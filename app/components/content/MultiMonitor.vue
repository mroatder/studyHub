<script setup lang="ts">
// ต่อสองจอ: HDMI ต้องใช้พอร์ตแยกต่อจอ ส่วน DisplayPort ต่อพ่วงจอผ่าน MST ได้ (daisy-chain)
const mode = ref<'hdmi' | 'dp'>('hdmi')
</script>

<template>
  <figure class="not-prose my-8 rounded-xl border border-line bg-soft p-4 sm:p-6">
    <div class="flex gap-2">
      <button v-for="m in (['hdmi', 'dp'] as const)" :key="m" type="button" class="rounded-md border px-3 py-1.5 text-sm transition" :class="mode === m ? 'border-ink bg-ink text-paper' : 'border-line hover:border-ink'" @click="mode = m">
        {{ m === 'hdmi' ? 'HDMI' : 'DisplayPort (MST)' }}
      </button>
    </div>
    <svg viewBox="0 0 420 180" class="mt-3 w-full" role="img" :aria-label="mode === 'hdmi' ? 'HDMI สองสายต่อสองจอ' : 'DisplayPort ต่อพ่วงสองจอ'">
      <rect x="10" y="50" width="90" height="90" rx="6" class="fill-ink" />
      <text x="55" y="100" text-anchor="middle" font-size="13" class="fill-paper" font-weight="600">คอมพิวเตอร์</text>
      <!-- จอ -->
      <g v-for="(m, i) in [0, 1]" :key="i">
        <rect :x="250" :y="14 + i * 90" width="110" height="62" rx="4" class="fill-paper stroke-ink" stroke-width="2" />
        <text :x="305" :y="50 + i * 90" text-anchor="middle" font-size="12" class="fill-ink">จอ {{ i + 1 }}</text>
      </g>
      <template v-if="mode === 'hdmi'">
        <path d="M100 75 H175 V45 H250" fill="none" class="stroke-ink cable" stroke-width="3" />
        <path d="M100 115 H175 V135 H250" fill="none" class="stroke-ink cable" stroke-width="3" />
        <text x="140" y="68" font-size="10" class="fill-mute" text-anchor="middle">HDMI #1</text>
        <text x="140" y="130" font-size="10" class="fill-mute" text-anchor="middle">HDMI #2</text>
      </template>
      <template v-else>
        <path d="M100 95 H175 V45 H250" fill="none" class="stroke-ink cable" stroke-width="3" />
        <path d="M305 76 V104" fill="none" class="stroke-ink cable" stroke-width="3" />
        <text x="137" y="88" font-size="10" class="fill-mute" text-anchor="middle">DisplayPort สายเดียว</text>
        <text x="318" y="95" font-size="10" class="fill-mute">ต่อพ่วง (MST)</text>
      </template>
    </svg>
    <p class="mt-2 leading-8 text-ink/80" aria-live="polite">
      <template v-if="mode === 'hdmi'">HDMI ต่อ <strong>หนึ่งพอร์ตต่อหนึ่งจอ</strong> ถ้าอยากใช้สองจอต้องมีพอร์ต HDMI บนเครื่องอย่างน้อยสองช่อง</template>
      <template v-else>DisplayPort รองรับ <strong>MST (Multi-Stream Transport)</strong> ต่อสายเส้นเดียวไปจอแรก แล้วต่อพ่วงต่อไปจอที่สองได้ ลดจำนวนสายและพอร์ตที่ใช้ ทั้งนี้จอต้องรองรับ DisplayPort ขาออกและการ์ดจอต้องรองรับ MST</template>
    </p>
    <figcaption class="text-sm text-mute">ภาพแสดงหลักการ การ daisy-chain ขึ้นกับรุ่นของจอและการ์ดจอ ตรวจสเปกก่อนซื้อ</figcaption>
  </figure>
</template>

<style scoped>
.cable {
  stroke-dasharray: 9 5;
  animation: run 0.9s linear infinite;
}
@keyframes run {
  to {
    stroke-dashoffset: -14;
  }
}
@media (prefers-reduced-motion: reduce) {
  .cable {
    animation: none;
  }
}
</style>
