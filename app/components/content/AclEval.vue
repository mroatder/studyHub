<script setup lang="ts">
// จำลองการประเมิน ACL ของ NTFS: เรียงลำดับ explicit deny, explicit allow, inherited deny, inherited allow แล้วรายการแรกที่ครอบคลุมสิทธิ์ที่ขอเป็นผู้ตัดสิน
type Right = 'read' | 'write'
type Ace = { id: string; who: string; type: 'allow' | 'deny'; label: string; rights: Right[]; inherited: boolean; canToggle: boolean }

const member = reactive<Record<string, boolean>>({ Developers: true, Contractors: true, Auditors: false })
const want = ref<Right>('write')
const aces = reactive<Ace[]>([
  { id: 'a1', who: 'Developers', type: 'allow', label: 'Allow Modify', rights: ['read', 'write'], inherited: false, canToggle: true },
  { id: 'a2', who: 'Contractors', type: 'deny', label: 'Deny Write', rights: ['write'], inherited: false, canToggle: true },
  { id: 'a3', who: 'Auditors', type: 'allow', label: 'Allow Read', rights: ['read'], inherited: true, canToggle: false },
])

const priority = (a: Ace) => (a.type === 'deny' ? (a.inherited ? 2 : 0) : a.inherited ? 3 : 1)
const prioLabel = (a: Ace) => `${a.inherited ? 'Inherited' : 'Explicit'} ${a.type === 'deny' ? 'Deny' : 'Allow'}`
const ordered = computed(() => [...aces].sort((x, y) => priority(x) - priority(y)))

const evaluation = computed(() => {
  let decided = false
  let allowed = false
  const rows = ordered.value.map((a) => {
    const mine = member[a.who]
    const covers = a.rights.includes(want.value)
    if (decided) return { a, state: 'ไม่ถูกตรวจ (มีรายการก่อนหน้าตัดสินแล้ว)' }
    if (!mine) return { a, state: 'ข้าม: คุณไม่ได้อยู่ในกลุ่มนี้' }
    if (!covers) return { a, state: 'ข้าม: ไม่ครอบคลุมสิทธิ์ที่ขอ' }
    decided = true
    allowed = a.type === 'allow'
    return { a, state: a.type === 'allow' ? 'ตัดสินที่นี่: อนุญาต' : 'ตัดสินที่นี่: ปฏิเสธ' }
  })
  return { rows, decided, allowed }
})
</script>

<template>
  <figure class="not-prose my-8 rounded-xl border border-line bg-soft p-4 sm:p-6">
    <p class="text-sm text-mute">โฟลเดอร์ C:\Projects มีรายการสิทธิ์ (ACE) 3 รายการ ลองเปลี่ยนว่าคุณอยู่กลุ่มไหน และรายการไหนเป็น explicit หรือ inherited</p>

    <div class="mt-3 flex flex-wrap items-center gap-2 text-sm">
      <span class="text-mute">คุณอยู่ในกลุ่ม:</span>
      <button v-for="g in Object.keys(member)" :key="g" type="button" class="min-h-9 rounded-md border px-3 transition" :class="member[g] ? 'border-ink bg-ink text-paper' : 'border-line bg-paper hover:border-ink'" :aria-pressed="member[g]" @click="member[g] = !member[g]">{{ g }}</button>
    </div>
    <div class="mt-2 flex flex-wrap items-center gap-2 text-sm">
      <span class="text-mute">สิทธิ์ที่ขอ:</span>
      <button v-for="r in (['read', 'write'] as const)" :key="r" type="button" class="min-h-9 rounded-md border px-3 transition" :class="want === r ? 'border-ink bg-ink text-paper' : 'border-line bg-paper hover:border-ink'" :aria-pressed="want === r" @click="want = r">{{ r === 'read' ? 'อ่าน (Read)' : 'เขียน (Write)' }}</button>
    </div>

    <ul class="mt-4 space-y-2 text-sm">
      <li v-for="a in aces" :key="a.id" class="flex flex-wrap items-center gap-2 rounded-lg border border-line bg-paper px-3 py-2">
        <span class="font-semibold">{{ a.who }}</span>
        <span class="font-mono text-xs">{{ a.label }}</span>
        <button v-if="a.canToggle" type="button" class="ml-auto min-h-9 rounded-md border border-line px-3 text-xs transition hover:border-ink" @click="a.inherited = !a.inherited">{{ a.inherited ? 'inherited (สืบจากโฟลเดอร์แม่)' : 'explicit (ตั้งตรงที่โฟลเดอร์นี้)' }} · กดสลับ</button>
        <span v-else class="ml-auto text-xs text-mute">inherited (ตายตัว)</span>
      </li>
    </ul>

    <p class="mt-4 text-xs text-mute">ลำดับที่ Windows ตรวจ (บนลงล่าง)</p>
    <ol class="mt-1 space-y-2 text-sm" aria-live="polite">
      <li v-for="(r, i) in evaluation.rows" :key="r.a.id" class="rounded-lg border bg-paper px-3 py-2" :class="r.state.startsWith('ตัดสิน') ? 'border-ink' : 'border-line opacity-80'">
        <p class="font-mono text-xs text-mute">{{ i + 1 }}. {{ prioLabel(r.a) }} · {{ r.a.who }} · {{ r.a.label }}</p>
        <p class="mt-1" :class="r.state.startsWith('ตัดสิน') ? 'font-semibold' : 'text-mute'">{{ r.state }}</p>
      </li>
    </ol>
    <p class="mt-3 rounded-lg px-3 py-2 text-sm font-semibold" :class="evaluation.decided && evaluation.allowed ? 'bg-ink text-paper' : 'border border-ink'">
      {{ evaluation.decided ? (evaluation.allowed ? 'ผลลัพธ์: ทำได้' : 'ผลลัพธ์: Access is denied') : 'ผลลัพธ์: ไม่มีรายการอนุญาต จึงถูกปฏิเสธโดยปริยาย (implicit deny)' }}
    </p>
    <p class="mt-3 text-sm leading-7 text-mute">ลองสลับ Deny Write ของ Contractors ให้เป็น inherited ขณะที่ Developers เป็น explicit Allow จะเห็นว่าคุณเขียนได้ เพราะ explicit Allow ถูกตรวจก่อน inherited Deny แปลว่า "Deny ชนะเสมอ" จริงเฉพาะเมื่อ Deny อยู่ระดับเดียวกันหรือเป็น explicit</p>
    <figcaption class="mt-1 text-sm text-mute">แบบจำลองย่อ: มีสิทธิ์ที่ขอเพียงอย่างเดียว ส่วน Windows จริงรวมสิทธิ์ที่ได้จากหลาย ACE และมีการเรียงลำดับตามระยะห่างของโฟลเดอร์แม่ด้วย</figcaption>
  </figure>
</template>
