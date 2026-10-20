<script setup lang="ts">
// คำนวณ TOTP (RFC 6238 / HOTP RFC 4226, HMAC-SHA1, 6 หลัก, ช่วง 30 วินาที) จริงด้วย WebCrypto ให้เห็นทุกขั้น
// แล้วจำลองมือถือที่นาฬิกาเพี้ยนเทียบกับเซิร์ฟเวอร์ที่ยอมรับ ±1 ช่วง
const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
function b32decode(s: string): Uint8Array {
  const clean = s.toUpperCase().replace(/[^A-Z2-7]/g, '')
  let bits = ''
  for (const ch of clean) bits += B32.indexOf(ch).toString(2).padStart(5, '0')
  const out: number[] = []
  for (let i = 0; i + 8 <= bits.length; i += 8) out.push(parseInt(bits.slice(i, i + 8), 2))
  return new Uint8Array(out)
}
interface Calc { counter: number; hex: number[]; offset: number; four: number[]; bin: number; code: string }
async function hotp(key: Uint8Array, counter: number): Promise<Calc> {
  const msg = new ArrayBuffer(8)
  new DataView(msg).setUint32(4, counter >>> 0)
  const k = await crypto.subtle.importKey('raw', key as BufferSource, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign'])
  const h = Array.from(new Uint8Array(await crypto.subtle.sign('HMAC', k, msg)))
  const offset = h[19]! & 0x0f
  const four = h.slice(offset, offset + 4)
  const bin = (((four[0]! & 0x7f) << 24) | (four[1]! << 16) | (four[2]! << 8) | four[3]!) >>> 0
  return { counter, hex: h, offset, four, bin, code: String(bin % 1_000_000).padStart(6, '0') }
}

const secret = ref('JBSWY3DPEHPK3PXP')
const now = ref(Math.floor(Date.now() / 1000))
const running = ref(true)
const drift = ref(0)
const supported = ref(true)
const phone = ref<Calc | null>(null)
const server = ref<Calc[]>([])
let timer: ReturnType<typeof setInterval> | undefined

const phoneT = computed(() => now.value + drift.value)
const left = computed(() => 30 - (phoneT.value % 30))
const accepted = computed(() => !!phone.value && server.value.some(s => s.code === phone.value!.code))

async function recalc() {
  if (!supported.value) return
  const key = b32decode(secret.value)
  if (!key.length) { phone.value = null; server.value = []; return }
  const pc = Math.floor(phoneT.value / 30)
  const sc = Math.floor(now.value / 30)
  phone.value = await hotp(key, pc)
  server.value = await Promise.all([sc - 1, sc, sc + 1].map(c => hotp(key, c)))
}
function start() {
  stop()
  timer = setInterval(() => { now.value += 1 }, 1000)
}
function stop() { if (timer) clearInterval(timer); timer = undefined }
function toggle() { running.value = !running.value; running.value ? start() : stop() }
function jump(sec: number) { now.value += sec }
function fmtTime(t: number) { return new Date(t * 1000).toISOString().slice(11, 19) + ' UTC' }

watch([secret, now, drift], recalc)
onMounted(() => {
  supported.value = typeof crypto !== 'undefined' && !!crypto.subtle
  recalc()
  start()
})
onBeforeUnmount(stop)
const hx = (n: number) => n.toString(16).padStart(2, '0')
</script>

<template>
  <figure class="not-prose my-8 rounded-xl border border-line bg-soft p-4 sm:p-6">
    <p v-if="!supported" class="text-xs">เบราว์เซอร์นี้ไม่มี WebCrypto (ต้องเปิดผ่าน https หรือ localhost) จึงคำนวณไม่ได้</p>
    <template v-else>
      <div class="grid gap-4 md:grid-cols-2">
        <label class="block text-xs">
          <span class="font-semibold">ความลับร่วม (shared secret, Base32) — ตัวอย่างเท่านั้น ห้ามใช้ของจริง</span>
          <input v-model="secret" type="text" spellcheck="false" autocomplete="off" class="mt-1 w-full rounded-md border border-line bg-paper px-2 py-1 font-mono text-xs" />
        </label>
        <div class="text-xs">
          <p class="font-semibold">นาฬิกามือถือเพี้ยนจากเซิร์ฟเวอร์ (drift): <span class="font-mono">{{ drift > 0 ? '+' : '' }}{{ drift }} วินาที</span></p>
          <input v-model.number="drift" type="range" min="-150" max="150" step="5" class="mt-2 w-full" aria-label="ความเพี้ยนของนาฬิกามือถือ (วินาที)" />
          <div class="mt-1 flex flex-wrap gap-1.5">
            <button v-for="d in [0, 25, 45, 120]" :key="d" type="button" class="rounded-md border px-2 py-0.5 transition" :class="drift === d ? 'border-ink bg-ink text-paper' : 'border-line hover:border-ink'" @click="drift = d">{{ d === 0 ? 'ตรงเวลา' : '+' + d + ' วิ' }}</button>
          </div>
        </div>
      </div>

      <div class="mt-4 flex flex-wrap items-center gap-2 text-xs">
        <button type="button" class="rounded-md border border-line px-2 py-1 transition hover:border-ink" @click="toggle">{{ running ? '⏸ หยุดเวลา' : '▶ เดินเวลา' }}</button>
        <button type="button" class="rounded-md border border-line px-2 py-1 transition hover:border-ink" @click="jump(30)">+30 วินาที</button>
        <button type="button" class="rounded-md border border-line px-2 py-1 transition hover:border-ink" @click="jump(-30)">−30 วินาที</button>
        <span class="font-mono text-mute">เซิร์ฟเวอร์: {{ fmtTime(now) }} · มือถือ: {{ fmtTime(phoneT) }}</span>
      </div>

      <ol v-if="phone" class="mt-4 space-y-1.5 text-xs">
        <li class="rounded-lg border border-line bg-paper px-3 py-2">
          <b>1. นับช่วงเวลา</b> (มือถือ) t = {{ phoneT }} วินาทีนับจาก 1970 → T = ⌊t ÷ 30⌋ = <span class="font-mono font-bold">{{ phone.counter }}</span>
          <div class="mt-2 h-1.5 w-full overflow-hidden rounded bg-line" role="progressbar" :aria-valuenow="left" aria-valuemin="0" aria-valuemax="30" aria-label="เวลาที่เหลือก่อนรหัสเปลี่ยน">
            <div class="h-full bg-ink motion-safe:transition-all motion-safe:duration-1000 motion-safe:ease-linear" :style="{ width: (left / 30) * 100 + '%' }"></div>
          </div>
          <span class="text-mute">เหลือ {{ left }} วินาทีก่อนรหัสเปลี่ยน</span>
        </li>
        <li class="rounded-lg border border-line bg-paper px-3 py-2">
          <b>2. HMAC-SHA1(secret, T เป็น 8 ไบต์)</b> ได้ 20 ไบต์
          <p class="mt-1 break-all font-mono leading-6">
            <span v-for="(b, i) in phone.hex" :key="i" class="mr-1 rounded px-0.5" :class="i >= phone.offset && i < phone.offset + 4 ? 'bg-ink text-paper' : ''">{{ hx(b) }}</span>
          </p>
        </li>
        <li class="rounded-lg border border-line bg-paper px-3 py-2">
          <b>3. ตัดช่วง (dynamic truncation)</b> ครึ่งไบต์ท้ายสุดของไบต์ที่ 20 คือ 0x{{ (phone.hex[19]! & 15).toString(16) }} = <span class="font-mono font-bold">offset {{ phone.offset }}</span> → หยิบ 4 ไบต์ที่แรเงา <span class="font-mono">{{ phone.four.map(hx).join(' ') }}</span>
        </li>
        <li class="rounded-lg border border-line bg-paper px-3 py-2">
          <b>4. ล้างบิตเครื่องหมาย</b> (AND 0x7fffffff) ได้จำนวนเต็ม <span class="font-mono font-bold">{{ phone.bin }}</span>
        </li>
        <li class="rounded-lg border border-line bg-paper px-3 py-2">
          <b>5. เอา 6 หลักท้าย</b> (mod 10⁶) → รหัสบนมือถือ
          <span class="ml-1 font-mono text-lg font-bold tracking-widest">{{ phone.code }}</span>
        </li>
      </ol>

      <div v-if="phone" class="mt-4 rounded-lg border-2 bg-paper p-3" :class="accepted ? 'border-ink' : 'border-mute'" aria-live="polite">
        <p class="text-xs font-semibold">เซิร์ฟเวอร์คำนวณเองด้วยนาฬิกาของมันและยอมรับ 3 ช่วง (ก่อนหน้า / ปัจจุบัน / ถัดไป)</p>
        <p class="mt-1 flex flex-wrap gap-2 font-mono text-sm">
          <span v-for="(s, i) in server" :key="s.counter" class="rounded border border-line px-2 py-0.5" :class="s.code === phone.code ? 'bg-ink text-paper' : ''">T{{ i === 0 ? '−1' : i === 1 ? '' : '+1' }} = {{ s.code }}</span>
        </p>
        <p class="mt-2 text-sm font-bold">{{ accepted ? '✓ รหัสตรงกับช่วงใดช่วงหนึ่ง → ผ่านด่านที่สอง' : '✕ ไม่ตรงทุกช่วง → ปฏิเสธ (นาฬิกาเพี้ยนเกินหน้าต่าง)' }}</p>
      </div>
    </template>
    <figcaption class="mt-2 text-xs text-mute">คำนวณจริงในเบราว์เซอร์ตามมาตรฐาน RFC 4226/6238 (ไม่มีการส่งข้อมูลออกไปไหน) หน้าต่าง ±1 ช่วงเป็นค่าตั้งต้นที่พบบ่อย ผู้ผลิตแต่ละรายตั้งต่างกัน · ลองลาก drift ไปที่ +45 และ +120 วินาที</figcaption>
  </figure>
</template>
