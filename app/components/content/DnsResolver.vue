<script setup lang="ts">
// จำลอง recursive resolver แปลงชื่อ: เลือกชื่อ + สถานะแคช แล้วดูว่าต้องถามกี่ครั้ง ใช้เวลาเท่าไร (ค่าเวลาเป็นค่าประมาณ)
type Cache = 'empty' | 'tld' | 'auth' | 'answer'
const names = [
  { n: 'www.example.com', tld: '.com', exists: true, ip: '93.184.216.34' },
  { n: 'mail.example.org', tld: '.org', exists: true, ip: '203.0.113.25' },
  { n: 'nope.example.com', tld: '.com', exists: false, ip: '' },
]
const caches: { id: Cache; label: string }[] = [
  { id: 'empty', label: 'แคชว่าง' },
  { id: 'tld', label: 'รู้ server ของ TLD แล้ว' },
  { id: 'auth', label: 'รู้ authoritative แล้ว' },
  { id: 'answer', label: 'มีคำตอบในแคช' },
]
const sel = ref(0)
const cache = ref<Cache>('empty')
const nm = computed(() => names[sel.value]!)

interface Step { title: string; text: string; ms: number; up: boolean }
const steps = computed<Step[]>(() => {
  const x = nm.value
  const s: Step[] = [{ title: 'Stub resolver (เครื่องเรา) → Recursive resolver', text: `ถาม A ของ ${x.n} ผ่าน UDP/53 ไปยัง resolver ที่ DHCP แจกมา (เช่น เราเตอร์ หรือ DNS ของ ISP)`, ms: 2, up: false }]
  if (cache.value === 'answer') {
    s.push({ title: 'Resolver ตอบจากแคช', text: x.exists ? `พบ ${x.n} → ${x.ip} ในแคชและ TTL ยังไม่หมด ตอบทันทีโดยไม่ถามใคร` : `พบ negative cache ว่า ${x.n} ไม่มีอยู่ (NXDOMAIN) ตอบทันที`, ms: 0, up: false })
    return s
  }
  if (cache.value === 'empty') s.push({ title: 'Resolver → Root server', text: `ถามหา ${x.n} root ไม่รู้คำตอบ แต่ตอบ referral ว่า server ของ ${x.tld} คือใคร พร้อม glue (IP ของ server นั้น)`, ms: 20, up: true })
  if (cache.value === 'empty' || cache.value === 'tld') s.push({ title: `Resolver → TLD server (${x.tld})`, text: `ถามต่อ server ของ ${x.tld} ไม่รู้ IP ของ ${x.n.split('.').slice(1).join('.')} แต่ตอบ referral ไปยัง authoritative ของโดเมนนี้`, ms: 30, up: true })
  s.push({ title: `Resolver → Authoritative (${x.n.split('.').slice(1).join('.')})`, text: x.exists ? `ถามรอบสุดท้าย server ที่ถือ zone จริงตอบ ${x.n} → ${x.ip} พร้อม TTL (เช่น 300 วินาที)` : `server ที่ถือ zone ตอบ NXDOMAIN (ไม่มีชื่อนี้) พร้อม SOA เพื่อให้ resolver จำผลลบไว้ตาม RFC 2308`, ms: 40, up: true })
  s.push({ title: 'Resolver → Stub resolver (ตอบกลับ)', text: x.exists ? `ส่ง ${x.ip} ให้เครื่องเรา และเก็บคำตอบลงแคชตามเวลา TTL เพื่อให้คนถัดไปที่ถามชื่อเดียวกันได้คำตอบเร็วขึ้น` : 'ส่ง NXDOMAIN ให้เครื่องเรา (เบราว์เซอร์จะขึ้น DNS_PROBE_FINISHED_NXDOMAIN) และจำผลลบไว้ชั่วคราว', ms: 2, up: false })
  return s
})
const s = useStepper(computed(() => steps.value.length), 2400)
watch([sel, cache], () => s.reset())
const upstream = computed(() => steps.value.filter(x => x.up).length)
const total = computed(() => steps.value.reduce((a, b) => a + b.ms, 0))
const soFar = computed(() => steps.value.slice(0, s.index.value + 1).reduce((a, b) => a + b.ms, 0))
</script>

<template>
  <figure class="not-prose my-8 rounded-xl border border-line bg-soft p-4 sm:p-6">
    <div class="flex flex-wrap items-center gap-2 text-sm">
      <span>ชื่อ:</span>
      <button v-for="(x, i) in names" :key="x.n" type="button" class="rounded-md border px-3 py-1.5 font-mono text-xs transition sm:text-sm" :class="sel === i ? 'border-ink bg-ink text-paper' : 'border-line hover:border-ink'" :aria-pressed="sel === i" @click="sel = i">{{ x.n }}</button>
    </div>
    <div class="mt-2 flex flex-wrap items-center gap-2 text-sm">
      <span>แคชของ resolver:</span>
      <button v-for="c in caches" :key="c.id" type="button" class="rounded-md border px-3 py-1.5 transition" :class="cache === c.id ? 'border-ink bg-ink text-paper' : 'border-line hover:border-ink'" :aria-pressed="cache === c.id" @click="cache = c.id">{{ c.label }}</button>
    </div>

    <ol class="mt-4 grid gap-2">
      <li v-for="(st, i) in steps" :key="st.title" class="rounded-lg border p-3 text-sm leading-7 transition-opacity duration-300 motion-reduce:transition-none" :class="[i === s.index.value ? 'border-ink bg-paper' : 'border-line', i > s.index.value ? 'opacity-30' : '']">
        <p><strong>{{ i + 1 }}. {{ st.title }}</strong> <span class="text-mute">· ≈ {{ st.ms }} ms</span></p>
        <p v-if="i <= s.index.value" class="mt-1">{{ st.text }}</p>
      </li>
    </ol>

    <p class="mt-3 rounded-lg border border-line bg-paper p-3 text-sm leading-7" aria-live="polite">
      <strong>ถึงขั้นนี้ใช้เวลาสะสม ≈ {{ soFar }} ms</strong> · ทั้งกระบวนการ ≈ {{ total }} ms · ถามเซิร์ฟเวอร์ภายนอก {{ upstream }} ครั้ง
    </p>
    <div class="mt-3">
      <AnimControls :playing="s.playing.value" :is-first="s.isFirst.value" :is-last="s.isLast.value" @toggle="s.toggle" @prev="s.prev" @next="s.next" @reset="s.reset" />
    </div>
    <figcaption class="mt-3 text-sm text-mute">ค่า ms เป็นค่าประมาณเพื่อเปรียบเทียบ ไม่ใช่การวัดจริง ในความเป็นจริง server ของ TLD มักถูกแคชนาน (NS ของ TLD มี TTL ระดับวัน) จึงหลายครั้งที่ resolver เริ่มที่ขั้น authoritative เลย ลองสลับสถานะแคชเพื่อเห็นความต่าง</figcaption>
  </figure>
</template>
