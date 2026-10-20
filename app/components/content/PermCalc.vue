<script setup lang="ts">
// สลับสิทธิ์ r/w/x ของ 3 กลุ่ม แล้วดูตัวเลขฐานแปด สตริง และคำสั่ง chmod พร้อมความหมายบนไฟล์/โฟลเดอร์
const who = ['เจ้าของ (user)', 'กลุ่ม (group)', 'คนอื่น (others)']
const names = ['r', 'w', 'x']
const bits = ref<boolean[]>([true, true, false, true, false, false, true, false, false])
const kind = ref<'file' | 'dir'>('file')
const octalInput = ref('')

const digit = (g: number) => (bits.value[g * 3] ? 4 : 0) + (bits.value[g * 3 + 1] ? 2 : 0) + (bits.value[g * 3 + 2] ? 1 : 0)
const octal = computed(() => `${digit(0)}${digit(1)}${digit(2)}`)
const symbolic = computed(() => bits.value.map((b, i) => (b ? names[i % 3] : '-')).join(''))
const typeChar = computed(() => (kind.value === 'dir' ? 'd' : '-'))

const meaning: Record<'file' | 'dir', Record<string, string>> = {
  file: { r: 'อ่านเนื้อหาไฟล์', w: 'แก้ไขหรือล้างเนื้อหาไฟล์', x: 'สั่งรันเป็นโปรแกรม/สคริปต์' },
  dir: { r: 'ดูรายชื่อรายการข้างใน (ls)', w: 'เพิ่ม/ลบ/เปลี่ยนชื่อรายการข้างใน (ต้องมี x ด้วยจึงใช้ได้)', x: 'เข้าโฟลเดอร์ (cd) และเข้าถึงรายการข้างใน' },
}
const presets = ['644', '600', '640', '755', '750', '700', '777']
function setOctal(s: string) {
  if (!/^[0-7]{3}$/.test(s)) return
  bits.value = [...s].flatMap((ch) => {
    const n = Number(ch)
    return [!!(n & 4), !!(n & 2), !!(n & 1)]
  })
}
function onInput() {
  setOctal(octalInput.value)
}
watch(octal, (v) => (octalInput.value = v), { immediate: true })

const warns = computed(() => {
  const w: string[] = []
  if (bits.value[7]) w.push('กลุ่มเขียนได้ ทุกคนในกลุ่มแก้ไขได้')
  if (bits.value[8]) w.push('คนอื่นทุกคนเขียนได้ (world-writable) ควรหลีกเลี่ยง')
  if (octal.value === '777') w.push('777 = ทุกคนอ่าน เขียน รันได้ ไม่ควรใช้เป็นทางแก้ปัญหา Permission denied')
  if (kind.value === 'dir') {
    for (let g = 0; g < 3; g++) if (bits.value[g * 3 + 1] && !bits.value[g * 3 + 2]) w.push(`${who[g]}: มี w แต่ไม่มี x บนโฟลเดอร์ ใช้ w ไม่ได้จริง`)
  }
  return w
})
</script>

<template>
  <figure class="not-prose my-8 rounded-xl border border-line bg-soft p-4 sm:p-6">
    <div class="flex flex-wrap items-center gap-2 text-sm">
      <button v-for="k in (['file', 'dir'] as const)" :key="k" type="button" class="rounded-md border px-3 py-1.5 transition" :class="kind === k ? 'border-ink bg-ink text-paper' : 'border-line hover:border-ink'" :aria-pressed="kind === k" @click="kind = k">
        {{ k === 'file' ? 'ไฟล์' : 'โฟลเดอร์' }}
      </button>
      <span class="text-mute">เลือกชนิด แล้วความหมายของ r / w / x จะเปลี่ยนตาม</span>
    </div>

    <div class="mt-4 grid grid-cols-[minmax(0,1fr)_repeat(3,2.75rem)] items-center gap-x-2 gap-y-2 text-sm sm:grid-cols-[10rem_repeat(3,3rem)]">
      <span />
      <span v-for="n in names" :key="n" class="text-center font-mono text-xs text-mute">{{ n }}</span>
      <template v-for="(w, g) in who" :key="w">
        <span class="truncate text-xs sm:text-sm">{{ w }}</span>
        <button v-for="(n, i) in names" :key="n" type="button" class="h-11 rounded-md border font-mono text-sm transition sm:h-10" :class="bits[g * 3 + i] ? 'border-ink bg-ink text-paper' : 'border-line bg-paper hover:border-ink'" :aria-pressed="bits[g * 3 + i]" :aria-label="`${w} ${n}`" @click="bits[g * 3 + i] = !bits[g * 3 + i]">
          {{ bits[g * 3 + i] ? n : '-' }}
        </button>
      </template>
    </div>

    <div class="mt-4 grid gap-3 sm:grid-cols-3" aria-live="polite">
      <div class="rounded-lg border border-line bg-paper p-3">
        <p class="text-xs text-mute">ผลของ ls -l</p>
        <p class="mt-1 break-all font-mono text-sm">{{ typeChar }}{{ symbolic }}</p>
      </div>
      <div class="rounded-lg border border-line bg-paper p-3">
        <p class="text-xs text-mute">เลขฐานแปด (r=4 w=2 x=1)</p>
        <p class="mt-1 font-mono text-sm font-semibold">{{ octal }}</p>
        <p class="mt-1 font-mono text-xs text-mute">{{ digit(0) }} + {{ digit(1) }} + {{ digit(2) }} = เจ้าของ / กลุ่ม / คนอื่น</p>
      </div>
      <div class="rounded-lg border border-line bg-paper p-3">
        <p class="text-xs text-mute">คำสั่ง</p>
        <p class="mt-1 break-all font-mono text-sm">chmod {{ octal }} {{ kind === 'file' ? 'deploy.sh' : 'shared' }}</p>
      </div>
    </div>

    <div class="mt-3 flex flex-wrap items-center gap-2 text-sm">
      <label for="perm-octal" class="text-mute">พิมพ์เลขเอง</label>
      <input id="perm-octal" v-model="octalInput" type="text" inputmode="numeric" maxlength="3" class="w-20 rounded-md border border-line bg-paper px-2 py-1.5 text-center font-mono text-sm outline-none focus:border-ink" @input="onInput" />
      <span class="text-mute">หรือเลือก:</span>
      <button v-for="p in presets" :key="p" type="button" class="rounded-md border border-line bg-paper px-2.5 py-1.5 font-mono text-xs transition hover:border-ink" @click="setOctal(p)">{{ p }}</button>
    </div>

    <ul class="mt-4 space-y-1 text-sm leading-7">
      <li v-for="(n, i) in names" :key="n"><span class="mr-2 inline-block w-5 font-mono font-semibold">{{ n }}</span>{{ meaning[kind][n] }}</li>
    </ul>
    <ul v-if="warns.length" class="mt-3 space-y-1 rounded-lg border border-dashed border-ink p-3 text-sm leading-7">
      <li v-for="w in warns" :key="w">ข้อสังเกต: {{ w }}</li>
    </ul>
    <figcaption class="mt-3 text-sm text-mute">จำลองในหน้าเว็บ ไม่ได้เปลี่ยนสิทธิ์ไฟล์จริง</figcaption>
  </figure>
</template>
