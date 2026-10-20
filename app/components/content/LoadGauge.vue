<script setup lang="ts">
// อ่าน load average (1/5/15 นาที) เทียบกับจำนวนแกน CPU (จำลอง)
const cores = ref(4)
const l1 = ref(6.2)
const l5 = ref(4.1)
const l15 = ref(2.0)

const coreOptions = [1, 2, 4, 8]
const loads = computed(() => [
  { label: '1 นาที', model: l1 },
  { label: '5 นาที', model: l5 },
  { label: '15 นาที', model: l15 },
])
const ratio = computed(() => l1.value / cores.value)
const verdict = computed(() => {
  if (ratio.value < 0.7) return { t: 'สบาย', d: 'โปรเซสแทบไม่ต้องรอคิว CPU' }
  if (ratio.value <= 1) return { t: 'ใกล้เต็ม', d: 'ใช้ CPU เกือบเต็มกำลัง ยังไม่มีคิวยาว' }
  return { t: 'โอเวอร์โหลด', d: `มีงานมากกว่า ${cores.value} แกน จึงมีโปรเซสรอคิวเฉลี่ย ${(l1.value - cores.value).toFixed(1)} ตัว เครื่องจะรู้สึกช้า` }
})
const trend = computed(() => {
  if (l1.value > l5.value * 1.15 && l5.value > l15.value * 1.15) return 'กำลังเพิ่มขึ้นเรื่อยๆ (1 นาที > 5 นาที > 15 นาที) ปัญหาเพิ่งเกิดและยังแย่ลง'
  if (l1.value < l5.value * 0.85 && l5.value < l15.value * 0.85) return 'กำลังลดลง (1 นาที < 5 นาที < 15 นาที) ช่วงหนักผ่านไปแล้ว'
  return 'ค่อนข้างคงที่ ไม่มีแนวโน้มชัดเจน'
})
</script>

<template>
  <figure class="not-prose my-8 rounded-xl border border-line bg-soft p-4 sm:p-6">
    <p class="font-mono text-sm">$ top <span class="text-mute">→ load average: {{ l1.toFixed(2) }}, {{ l5.toFixed(2) }}, {{ l15.toFixed(2) }}</span></p>

    <div class="mt-3 flex flex-wrap items-center gap-2 text-sm">
      <span>CPU:</span>
      <button v-for="c in coreOptions" :key="c" type="button" class="rounded-md border px-3 py-1.5 transition" :class="cores === c ? 'border-ink bg-ink text-paper' : 'border-line hover:border-ink'" :aria-pressed="cores === c" @click="cores = c">{{ c }} แกน</button>
    </div>

    <div class="mt-4 grid gap-3">
      <label v-for="l in loads" :key="l.label" class="text-sm">
        <span class="flex justify-between"><span>load {{ l.label }}</span><span class="font-mono">{{ l.model.value.toFixed(1) }}</span></span>
        <input v-model.number="l.model.value" type="range" min="0" max="12" step="0.1" class="mt-1 w-full accent-current" />
      </label>
    </div>

    <div class="mt-4" role="img" :aria-label="`load 1 นาที ${l1.toFixed(1)} จาก ${cores} แกน`">
      <div class="flex gap-1">
        <div v-for="i in cores" :key="i" class="h-6 flex-1 rounded border border-line" :class="i <= Math.floor(l1) ? 'bg-ink' : i - l1 < 1 && l1 > i - 1 ? 'bg-mute/50' : 'bg-paper'" />
      </div>
      <p class="mt-1 text-xs text-mute">แต่ละช่อง = 1 แกน CPU · ช่องเต็ม = มีงานให้ทำครบ · load {{ l1.toFixed(1) }} เทียบ {{ cores }} แกน = {{ (ratio * 100).toFixed(0) }}%</p>
    </div>

    <div class="mt-3 rounded-lg border border-line bg-paper p-3 text-sm leading-7" aria-live="polite">
      <p><strong>{{ verdict.t }}:</strong> {{ verdict.d }}</p>
      <p class="mt-1"><strong>แนวโน้ม:</strong> {{ trend }}</p>
    </div>
    <figcaption class="mt-3 text-sm text-mute">กฎจำง่าย: load เท่ากับจำนวนแกน ≈ ใช้เต็ม 100% (เกณฑ์ 0.7 เป็นแนวทางทั่วไป ไม่ใช่ค่าตายตัว) จำลองในหน้าเว็บ</figcaption>
  </figure>
</template>
