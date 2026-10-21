<script setup lang="ts">
// จำลองสิ่งที่เชลล์แบบ Bash ทำก่อนส่งคำสั่งให้โปรแกรม: แยกคำ → ถอดเครื่องหมายคำพูด → ขยายตัวแปร → ขยาย * (glob)
// โปรแกรมปลายทางไม่เคยเห็นบรรทัดที่พิมพ์ เห็นแต่รายการอาร์กิวเมนต์ (argv) ที่เชลล์ประกอบให้
const files = ['a.txt', 'b.txt', 'notes.md', 'My Docs']
const vars: Record<string, string> = { USER: 'alex', DIR: 'My Docs' }

const presets = [
  { line: 'ls My Docs', note: 'ช่องว่างคือตัวแบ่งคำ โปรแกรม ls จึงได้ 2 ชื่อ คือ My กับ Docs ไม่ใช่โฟลเดอร์เดียว' },
  { line: 'ls "My Docs"', note: 'เครื่องหมายคำพูดทำให้ช่องว่างเป็นส่วนของชื่อ ได้ 1 อาร์กิวเมนต์' },
  { line: 'ls My\\ Docs', note: 'แบ็กสแลชหน้าช่องว่างก็ได้ผลเหมือนกัน (escape)' },
  { line: 'echo *.txt', note: 'เชลล์เป็นผู้ขยาย * เป็นชื่อไฟล์ที่ตรงกัน ก่อนที่ echo จะเริ่มทำงาน echo ไม่เคยเห็นเครื่องหมาย *' },
  { line: 'echo "*.txt"', note: 'ในเครื่องหมายคำพูด * ไม่ถูกขยาย ส่งต่อเป็นตัวอักษร * ตรงๆ' },
  { line: "echo '$USER' \"$USER\"", note: 'ในเครื่องหมายคำพูดเดี่ยว ทุกอย่างเป็นตัวอักษรตรงๆ ส่วนเครื่องหมายคำพูดคู่ยังขยายตัวแปรให้' },
  { line: 'rm $DIR', note: 'อันตราย: $DIR มีค่า "My Docs" และไม่ได้ครอบด้วยเครื่องหมายคำพูด ค่าถูกแยกเป็น 2 คำ rm จะพยายามลบ My และ Docs แยกกัน' },
  { line: 'rm "$DIR"', note: 'ครอบตัวแปรด้วยเครื่องหมายคำพูดเสมอ จึงได้ 1 อาร์กิวเมนต์ตามที่ตั้งใจ' },
  { line: 'rm *', note: 'เชลล์ขยาย * เป็นไฟล์ทุกชื่อในโฟลเดอร์ (รวม My Docs เป็นอาร์กิวเมนต์เดียว) ตรวจด้วย echo * ก่อนลบทุกครั้ง' },
]
const line = ref(presets[0]!.line)

type Ch = { c: string; glob: boolean }

const result = computed(() => {
  const s = line.value
  const fields: Ch[][] = []
  let cur: Ch[] | null = null
  const start = () => { if (!cur) cur = [] }
  const flush = () => { if (cur) { fields.push(cur); cur = null } }
  let i = 0
  while (i < s.length) {
    const ch = s[i]!
    if (ch === ' ' || ch === '\t') { flush(); i++; continue }
    if (ch === '\\' && i + 1 < s.length) { start(); cur!.push({ c: s[i + 1]!, glob: false }); i += 2; continue }
    if (ch === "'") {
      start()
      const end = s.indexOf("'", i + 1)
      const stop = end === -1 ? s.length : end
      for (const x of s.slice(i + 1, stop)) cur!.push({ c: x, glob: false })
      i = stop + 1
      continue
    }
    if (ch === '"') {
      start()
      i++
      while (i < s.length && s[i] !== '"') {
        if (s[i] === '$') {
          const m = /^\$([A-Za-z_]\w*)/.exec(s.slice(i))
          if (m) { for (const x of vars[m[1]!] ?? '') cur!.push({ c: x, glob: false }); i += m[0].length; continue }
        }
        cur!.push({ c: s[i]!, glob: false })
        i++
      }
      i++
      continue
    }
    if (ch === '$') {
      const m = /^\$([A-Za-z_]\w*)/.exec(s.slice(i))
      if (m) {
        const parts = (vars[m[1]!] ?? '').split(/\s+/).filter(Boolean)
        const val = vars[m[1]!] ?? ''
        start()
        if (/^\s/.test(val)) flush()
        parts.forEach((p: string, idx: number) => {
          start()
          for (const x of p) cur!.push({ c: x, glob: false })
          if (idx < parts.length - 1) flush()
        })
        if (/\s$/.test(val) && parts.length) flush()
        i += m[0].length
        continue
      }
    }
    start()
    cur!.push({ c: ch, glob: ch === '*' || ch === '?' })
    i++
  }
  flush()

  const argv: { text: string; from: 'plain' | 'glob' }[] = []
  for (const f of fields) {
    const text = f.map((x) => x.c).join('')
    if (f.some((x) => x.glob)) {
      const re = new RegExp('^' + f.map((x) => (x.glob ? (x.c === '*' ? '.*' : '.') : x.c.replace(/[.+^${}()|[\]\\]/g, '\\$&'))).join('') + '$')
      const hits = files.filter((n) => !n.startsWith('.') && re.test(n)).sort()
      if (hits.length) { hits.forEach((h) => argv.push({ text: h, from: 'glob' })); continue }
    }
    argv.push({ text, from: 'plain' })
  }
  return argv
})
const note = computed(() => presets.find((p) => p.line === line.value)?.note ?? 'ลองเทียบกับตัวอย่างสำเร็จรูปด้านบน')
</script>

<template>
  <figure class="not-prose my-8 rounded-xl border border-line bg-soft p-4 sm:p-6">
    <p class="text-xs text-mute">ในโฟลเดอร์มี: <span class="font-mono">a.txt  b.txt  notes.md  "My Docs"</span> · ตัวแปร <span class="font-mono">USER=alex  DIR="My Docs"</span></p>
    <div class="mt-3 flex flex-wrap gap-2">
      <button v-for="p in presets" :key="p.line" type="button" class="rounded-md border px-2.5 py-1.5 font-mono text-xs transition" :class="line === p.line ? 'border-ink bg-ink text-paper' : 'border-line bg-paper hover:border-ink'" @click="line = p.line">{{ p.line }}</button>
    </div>
    <label class="mt-4 block text-sm text-mute" for="shell-parse-in">หรือพิมพ์เอง (ใช้ได้: ช่องว่าง, ' ', " ", \, $USER, $DIR, * ?)</label>
    <input id="shell-parse-in" v-model="line" type="text" spellcheck="false" class="mt-1 w-full rounded-md border border-line bg-paper px-3 py-2 font-mono text-sm outline-none focus:border-ink" />

    <div class="mt-4 rounded-lg border border-line bg-paper p-3 text-sm" aria-live="polite">
      <p class="text-xs text-mute">สิ่งที่โปรแกรมได้รับจริง (argv) · มี {{ result.length }} ตัว (ตัวแรกคือชื่อคำสั่ง)</p>
      <ol class="mt-2 flex flex-wrap gap-2">
        <li v-for="(a, idx) in result" :key="idx" class="rounded-md border px-2 py-1 font-mono text-xs" :class="a.from === 'glob' ? 'border-ink' : 'border-line'">
          <span class="text-mute">[{{ idx }}]</span> {{ a.text }}<span v-if="a.from === 'glob'" class="ml-1 text-mute">(จาก *)</span>
        </li>
      </ol>
    </div>
    <p class="mt-3 text-sm leading-7">{{ note }}</p>
    <figcaption class="mt-3 text-sm text-mute">จำลองแบบย่อของ Bash: ไม่ครอบคลุมทุกกฎ (เช่น {} หรือ $(...)) และ PowerShell มีกฎการแยกคำต่างออกไป</figcaption>
  </figure>
</template>
