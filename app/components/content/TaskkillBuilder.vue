<script setup lang="ts">
// ประกอบคำสั่ง taskkill จากตัวเลือก แล้วดูว่าโปรเซสไหนถูกปิดบ้าง (จำลอง)
type Proc = { name: string; pid: number; parent?: number }
const procs: Proc[] = [
  { name: 'explorer.exe', pid: 3812 },
  { name: 'report_generator.exe', pid: 7104 },
  { name: 'report_worker.exe', pid: 7188, parent: 7104 },
  { name: 'report_worker.exe', pid: 7216, parent: 7104 },
  { name: 'notepad.exe', pid: 5520 },
]

const by = ref<'PID' | 'IM'>('PID')
const force = ref(false)
const tree = ref(false)

const target = computed(() => (by.value === 'PID' ? '7104' : 'report_generator.exe'))
const cmd = computed(() => {
  const flags = [force.value ? '/F' : '', tree.value ? '/T' : ''].filter(Boolean).join(' ')
  return `taskkill /${by.value} ${target.value}${flags ? ' ' + flags : ''}`
})

// โปรเซสที่ถูกปิด: ตัวหลักเสมอ ลูกต้องมี /T
const killed = computed(() => procs.filter((p) => p.pid === 7104 || (tree.value && p.parent === 7104)).map((p) => p.pid))
const orphans = computed(() => procs.filter((p) => p.parent === 7104 && !killed.value.includes(p.pid)))
</script>

<template>
  <figure class="not-prose my-8 rounded-xl border border-line bg-soft p-4 sm:p-6">
    <div class="flex flex-wrap items-center gap-2 text-sm">
      <button v-for="o in (['PID', 'IM'] as const)" :key="o" type="button" class="rounded-md border px-3 py-1.5 transition" :class="by === o ? 'border-ink bg-ink text-paper' : 'border-line hover:border-ink'" :aria-pressed="by === o" @click="by = o">
        /{{ o }} {{ o === 'PID' ? '(ระบุเลขโปรเซส)' : '(ระบุชื่อไฟล์)' }}
      </button>
      <label class="ml-auto flex items-center gap-2"><input v-model="force" type="checkbox" class="accent-current" /> /F บังคับ</label>
      <label class="flex items-center gap-2"><input v-model="tree" type="checkbox" class="accent-current" /> /T รวมโปรเซสลูก</label>
    </div>

    <p class="mt-4 break-all rounded-lg border border-line bg-paper p-3 font-mono text-sm">C:\&gt; {{ cmd }}</p>

    <ul class="mt-3 grid gap-2 text-sm" aria-live="polite">
      <li v-for="p in procs" :key="p.pid" class="flex flex-wrap items-center gap-2 rounded-lg border p-2 font-mono transition" :class="killed.includes(p.pid) ? 'border-ink bg-ink text-paper' : 'border-line bg-paper'">
        <span :class="p.parent ? 'pl-5' : ''">{{ p.parent ? '└ ' : '' }}{{ p.name }}</span>
        <span class="text-xs opacity-70">PID {{ p.pid }}</span>
        <span class="ml-auto text-xs">{{ killed.includes(p.pid) ? 'ถูกปิด' : 'ยังรันอยู่' }}</span>
      </li>
    </ul>

    <div class="mt-3 rounded-lg border border-line bg-paper p-3 text-sm leading-7">
      <p v-if="!force"><strong>ไม่มี /F:</strong> Windows ขอให้โปรแกรมปิดตัวเองอย่างสุภาพ ถ้าโปรแกรมค้างจริงอาจไม่ตอบรับ (คำสั่งอาจรายงานว่าปิดไม่ได้หรือโปรแกรมยังอยู่) ข้อดีคือโปรแกรมมีโอกาสเซฟและเก็บกวาดก่อนปิด</p>
      <p v-else><strong>มี /F:</strong> บังคับยุติทันที งานที่ยังไม่เซฟและข้อมูลในแคชหายได้ ใช้เมื่อปิดแบบปกติไม่ได้ผลเท่านั้น</p>
      <p v-if="orphans.length" class="mt-2"><strong>ระวัง:</strong> โปรเซสลูก {{ orphans.map((o) => o.pid).join(', ') }} ยังรันค้างและอาจกินทรัพยากรต่อ เติม /T เพื่อปิดทั้งต้น</p>
      <p v-else-if="tree" class="mt-2"><strong>/T:</strong> ปิดโปรเซสหลักพร้อมลูกทั้งหมดในครั้งเดียว</p>
    </div>
    <figcaption class="mt-3 text-sm text-mute">จำลองในหน้าเว็บ ไม่ได้ปิดโปรแกรมจริงในเครื่องของคุณ</figcaption>
  </figure>
</template>
