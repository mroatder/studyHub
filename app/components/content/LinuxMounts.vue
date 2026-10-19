<script setup lang="ts">
// พาร์ทิชันทางซ้าย ต้นไม้ไดเรกทอรีทางขวา กดดูว่าแต่ละพาร์ทิชันไป "ต่อ" ที่โฟลเดอร์ไหน
const kind = ref<'sata' | 'nvme'>('sata')
const sel = ref(1)

const parts = computed(() => {
  const d = kind.value === 'sata' ? '/dev/sda' : '/dev/nvme0n1'
  const p = kind.value === 'sata' ? '' : 'p'
  return [
    { dev: `${d}${p}1`, fs: 'FAT32', size: '512 MB', mount: '/boot/efi', note: 'พาร์ทิชันที่เฟิร์มแวร์ UEFI อ่านเพื่อหา bootloader (GRUB) ต้องเป็น FAT32 เพราะเฟิร์มแวร์เข้าใจเฉพาะระบบไฟล์นี้', w: 8 },
    { dev: `${d}${p}2`, fs: 'ext4', size: 'ที่เหลือ', mount: '/', note: 'รากของต้นไม้ไดเรกทอรี เก็บระบบปฏิบัติการ โปรแกรม การตั้งค่า (/etc) บันทึก (/var/log) และโฮมของผู้ใช้ (/home) ถ้าไม่แยกพาร์ทิชันอื่น', w: 78 },
    { dev: `${d}${p}3`, fs: 'swap', size: '2 GB', mount: '[SWAP]', note: 'ไม่ได้ต่อกับโฟลเดอร์ใด ใช้เป็นที่พักข้อมูลเมื่อ RAM เต็ม kernel ย้ายข้อมูลที่ไม่ค่อยใช้ออกไปไว้ที่นี่', w: 14 },
  ]
})

const tree = [
  { path: '/', ind: 0, from: 1 },
  { path: 'boot', ind: 1, from: 1 },
  { path: 'efi', ind: 2, from: 0, mounted: true, full: '/boot/efi' },
  { path: 'etc', ind: 1, from: 1, hint: 'ไฟล์ตั้งค่าระบบ' },
  { path: 'home', ind: 1, from: 1, hint: 'ไฟล์ของผู้ใช้' },
  { path: 'var', ind: 1, from: 1, hint: 'ข้อมูลที่เปลี่ยนบ่อย เช่น log' },
  { path: 'dev', ind: 1, from: 1, hint: 'ไฟล์แทนอุปกรณ์ เช่น sda' },
]
const cur = computed(() => parts.value[sel.value]!)
const isHit = (t: (typeof tree)[number]) => (cur.value.mount === '[SWAP]' ? false : t.from === sel.value)
</script>

<template>
  <figure class="not-prose my-8 rounded-xl border border-line bg-soft p-4 sm:p-6">
    <div class="flex flex-wrap items-center gap-2">
      <button v-for="k in (['sata', 'nvme'] as const)" :key="k" type="button" class="rounded-md border px-3 py-1.5 text-sm transition" :class="kind === k ? 'border-ink bg-ink text-paper' : 'border-line hover:border-ink'" @click="kind = k">
        {{ k === 'sata' ? 'ดิสก์ SATA' : 'ดิสก์ NVMe' }}
      </button>
      <span class="text-sm text-mute">ชื่ออุปกรณ์เปลี่ยนตามชนิดฮาร์ดแวร์</span>
    </div>

    <div class="mt-4 flex h-16 overflow-hidden rounded-lg border-2 border-ink bg-paper text-xs">
      <button
        v-for="(p, i) in parts"
        :key="p.dev"
        type="button"
        class="flex min-w-0 flex-col items-center justify-center border-r border-line px-1 transition last:border-r-0"
        :class="sel === i ? 'bg-ink text-paper' : 'hover:bg-soft'"
        :style="{ flexGrow: p.w, flexBasis: 0 }"
        :aria-pressed="sel === i"
        @click="sel = i"
      >
        <span class="max-w-full truncate font-mono">{{ p.dev }}</span>
        <span class="opacity-70">{{ p.fs }}</span>
      </button>
    </div>

    <div class="mt-4 grid gap-4 md:grid-cols-2">
      <div class="rounded-lg border border-line bg-paper p-3" aria-live="polite">
        <p class="font-mono text-sm font-semibold">{{ cur.dev }}</p>
        <p class="mt-1 text-sm text-mute">{{ cur.fs }} · {{ cur.size }}</p>
        <p class="mt-2 text-sm">จุดเชื่อมต่อ (mount point): <code class="rounded border border-line px-1.5 py-0.5 font-mono text-xs">{{ cur.mount }}</code></p>
        <p class="mt-2 text-sm leading-7 text-ink/80">{{ cur.note }}</p>
      </div>
      <div class="rounded-lg border border-line bg-paper p-3 font-mono text-sm">
        <p v-for="t in tree" :key="t.path + t.ind" class="rounded px-1 py-0.5 transition" :class="isHit(t) ? 'bg-ink text-paper' : ''" :style="{ paddingLeft: `${t.ind * 1.25 + 0.25}rem` }">
          {{ t.path }}<span v-if="t.hint" class="ml-2 font-sans text-xs opacity-60">{{ t.hint }}</span>
          <span v-if="t.mounted" class="ml-2 font-sans text-xs opacity-80">← ต่อพาร์ทิชันที่ 1</span>
        </p>
        <p v-if="cur.mount === '[SWAP]'" class="mt-2 border-t border-line pt-2 font-sans text-xs text-mute">swap ไม่อยู่ในต้นไม้ เพราะไม่ได้เก็บไฟล์ให้ผู้ใช้เปิด</p>
      </div>
    </div>
    <figcaption class="mt-3 text-sm text-mute">แถบไฮไลต์ในต้นไม้ = โฟลเดอร์ที่อยู่บนพาร์ทิชันที่เลือก (ขนาดแถบพาร์ทิชันเป็นภาพย่อ ไม่ตรงสัดส่วนจริง)</figcaption>
  </figure>
</template>
