<script setup lang="ts">
// กฎของ Amdahl: เพิ่มจำนวนแกนแล้วเร็วขึ้นแค่ไหน เมื่อโปรแกรมแบ่งขนานได้เพียงบางส่วน (p)
const p = ref(0.9)
const ns = [1, 2, 4, 8, 16, 32, 64]
const sel = ref(8)

const speed = (n: number) => 1 / (1 - p.value + p.value / n)
const limit = computed(() => 1 / (1 - p.value))
const ymax = computed(() => Math.max(2, Math.ceil(Math.min(limit.value * 1.05, 64))))

const W = 320
const H = 170
const L = 34
const B = 24
const T = 10
const R = 10
const x = (n: number) => L + (Math.log2(n) / 6) * (W - L - R)
const y = (v: number) => T + (1 - Math.min(v, ymax.value) / ymax.value) * (H - T - B)
const real = computed(() => ns.map((n) => `${x(n)},${y(speed(n))}`).join(' '))
const ideal = computed(() => ns.map((n) => `${x(n)},${y(n)}`).join(' '))
const cur = computed(() => speed(sel.value))
</script>

<template>
  <figure class="not-prose my-8 rounded-xl border border-line bg-soft p-4 sm:p-6">
    <label class="block text-sm">
      ส่วนของงานที่แบ่งขนานได้ (p): <strong class="font-mono">{{ Math.round(p * 100) }}%</strong> · ส่วนที่ต้องทำเรียงลำดับ: <strong class="font-mono">{{ Math.round((1 - p) * 100) }}%</strong>
      <input v-model.number="p" type="range" min="0.5" max="0.99" step="0.01" class="mt-2 w-full accent-current" />
    </label>

    <div class="mt-3 flex flex-wrap items-center gap-2 text-sm">
      <span>จำนวนแกน:</span>
      <button v-for="n in ns" :key="n" type="button" class="rounded-md border px-2.5 py-1 font-mono transition" :class="sel === n ? 'border-ink bg-ink text-paper' : 'border-line hover:border-ink'" :aria-pressed="sel === n" @click="sel = n">{{ n }}</button>
    </div>

    <svg :viewBox="`0 0 ${W} ${H}`" class="mt-3 w-full" role="img" :aria-label="`กราฟความเร็วที่เพิ่มขึ้นตามจำนวนแกน ที่ ${sel} แกนเร็วขึ้น ${cur.toFixed(1)} เท่า เพดาน ${limit.toFixed(1)} เท่า`">
      <line :x1="L" :y1="T" :x2="L" :y2="H - B" stroke="currentColor" stroke-opacity=".4" />
      <line :x1="L" :y1="H - B" :x2="W - R" :y2="H - B" stroke="currentColor" stroke-opacity=".4" />
      <polyline :points="ideal" fill="none" stroke="currentColor" stroke-opacity=".35" stroke-dasharray="3 3" />
      <line :x1="L" :x2="W - R" :y1="y(limit)" :y2="y(limit)" stroke="currentColor" stroke-opacity=".6" stroke-dasharray="6 3" />
      <polyline :points="real" fill="none" stroke="currentColor" stroke-width="2" />
      <circle v-for="n in ns" :key="n" :cx="x(n)" :cy="y(speed(n))" :r="n === sel ? 5 : 2.5" fill="currentColor" />
      <text v-for="n in ns" :key="'t' + n" :x="x(n)" :y="H - 8" font-size="9" text-anchor="middle" fill="currentColor">{{ n }}</text>
      <text :x="L - 4" :y="T + 4" font-size="9" text-anchor="end" fill="currentColor">{{ ymax }}×</text>
      <text :x="L - 4" :y="H - B" font-size="9" text-anchor="end" fill="currentColor">0</text>
      <text :x="W - R" :y="y(limit) - 3" font-size="9" text-anchor="end" fill="currentColor">เพดาน {{ limit.toFixed(1) }}×</text>
    </svg>
    <p class="text-xs text-mute">เส้นทึบ = ที่ได้จริง · เส้นประบาง = เร็วขึ้นเท่าจำนวนแกน (ในอุดมคติ) · เส้นประหนา = เพดานของ p นี้</p>

    <div class="mt-3 rounded-lg border border-line bg-paper p-3 text-sm leading-7" aria-live="polite">
      <p>สูตร: เร็วขึ้น = 1 ÷ ((1 − p) + p ÷ n) = 1 ÷ ((1 − {{ p.toFixed(2) }}) + {{ p.toFixed(2) }} ÷ {{ sel }}) = <strong>{{ cur.toFixed(2) }} เท่า</strong></p>
      <p>ใช้แกนคุ้มแค่ <strong>{{ Math.round((cur / sel) * 100) }}%</strong> ของที่ควรได้ · ต่อให้มีแกนไม่จำกัดก็ไม่เกิน <strong>{{ limit.toFixed(1) }} เท่า</strong> เพราะส่วนที่ต้องทำเรียงลำดับ ({{ Math.round((1 - p) * 100) }}%) ไม่ลดลงเลย</p>
    </div>
    <figcaption class="mt-3 text-sm text-mute">คำนวณจากสูตรตามทฤษฎี (ไม่นับต้นทุนการประสานงานระหว่างแกน ซึ่งทำให้ของจริงแย่กว่านี้)</figcaption>
  </figure>
</template>
