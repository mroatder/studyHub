<script setup lang="ts">
// ยืมบิตจาก host มาเป็น subnet: เลื่อนจำนวนบิตที่ยืม เห็นว่าได้กี่ซับเน็ต ขนาดบล็อก และสูญเสียกี่ที่อยู่
const base = '192.168.10.0'
const basePrefix = 24
const borrowed = ref(2)
const newPrefix = computed(() => basePrefix + borrowed.value)
const count = computed(() => 2 ** borrowed.value)
const size = computed(() => 2 ** (32 - newPrefix.value))
const usable = computed(() => Math.max(size.value - 2, 0))
const names = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
const blocks = computed(() => {
  const n = Math.min(count.value, 8)
  return Array.from({ length: n }, (_, i) => {
    const start = i * size.value
    const end = start + size.value - 1
    return { name: names[i]!, cidr: `192.168.10.${start}/${newPrefix.value}`, range: `.${start}–.${end}`, hosts: usable.value ? `.${start + 1}–.${end - 1}` : '-' }
  })
})
const lostTotal = computed(() => count.value * 2)
</script>

<template>
  <figure class="not-prose my-8 rounded-xl border border-line bg-soft p-4 sm:p-6">
    <label class="grid gap-1 text-sm">
      <span class="text-xs text-mute">แบ่ง {{ base }}/{{ basePrefix }} โดยยืมบิตจากส่วน host มาเป็นบิต subnet: <b>{{ borrowed }}</b> บิต → prefix ใหม่ <b>/{{ newPrefix }}</b></span>
      <input v-model.number="borrowed" type="range" min="0" max="6" class="accent-current" aria-label="จำนวนบิตที่ยืม" />
    </label>
    <div class="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
      <div class="rounded-lg border border-line bg-paper p-2"><p class="text-lg font-semibold">{{ count }}</p><p class="text-xs text-mute">ซับเน็ต (2^{{ borrowed }})</p></div>
      <div class="rounded-lg border border-line bg-paper p-2"><p class="text-lg font-semibold">{{ size }}</p><p class="text-xs text-mute">ที่อยู่ต่อซับเน็ต (2^{{ 32 - newPrefix }})</p></div>
      <div class="rounded-lg border border-line bg-paper p-2"><p class="text-lg font-semibold">{{ usable }}</p><p class="text-xs text-mute">ใช้งานได้ต่อซับเน็ต (−2)</p></div>
    </div>
    <div class="mt-3 flex h-8 overflow-hidden rounded-md border border-line" role="img" :aria-label="`${count} ซับเน็ต ขนาดเท่ากัน`">
      <div v-for="(b, i) in blocks" :key="i" class="flex-1 border-r border-line bg-paper text-center text-xs leading-8 last:border-0" :class="i % 2 ? 'bg-soft' : ''">{{ b.name }}</div>
    </div>
    <p v-if="count > 8" class="mt-1 text-xs text-mute">แสดง 8 ซับเน็ตแรกจากทั้งหมด {{ count }}</p>
    <div class="mt-3 overflow-x-auto">
      <table class="w-full text-left text-xs sm:text-sm">
        <thead><tr class="text-mute"><th class="py-1 pr-2">#</th><th class="pr-2">ซับเน็ต</th><th class="pr-2">ช่วงเต็ม</th><th>ใส่ให้เครื่องได้</th></tr></thead>
        <tbody>
          <tr v-for="b in blocks" :key="b.name" class="border-t border-line font-mono"><td class="py-1 pr-2">{{ b.name }}</td><td class="pr-2">{{ b.cidr }}</td><td class="pr-2">{{ b.range }}</td><td>{{ b.hosts }}</td></tr>
        </tbody>
      </table>
    </div>
    <p class="mt-3 text-xs text-mute">ที่อยู่ที่ "เสีย" ไปกับ network + broadcast ทุกซับเน็ตรวม {{ lostTotal }} ที่อยู่ จากทั้งหมด 256 ยิ่งแบ่งเล็กยิ่งเสียสัดส่วนมาก ({{ ((lostTotal / 256) * 100).toFixed(1) }}%) · แบบนี้แบ่งเท่ากันทุกก้อน (FLSM) ส่วนการแบ่งขนาดไม่เท่ากันตามความต้องการเรียก VLSM</p>
  </figure>
</template>
