<script setup lang="ts">
// SHA-256 / HMAC-SHA256 จริงด้วย WebCrypto: avalanche effect + ทำไมแฮชเปล่าๆ ไม่พอกันผู้โจมตีที่คำนวณแฮชใหม่ได้
const original = ref('Transfer $50.00 to Account #10442')
const edited = ref('Transfer $500.00 to Account #99103')
const mode = ref<'hash' | 'hmac'>('hash')
const secretKey = 'k-shared-bank-secret' // ตัวอย่าง รู้เฉพาะผู้ส่งกับผู้รับ

const enc = new TextEncoder()
const toBytes = (b: ArrayBuffer) => new Uint8Array(b)
const hex = (u: Uint8Array) => Array.from(u, x => x.toString(16).padStart(2, '0')).join('')

async function sha(msg: string) {
  return toBytes(await crypto.subtle.digest('SHA-256', enc.encode(msg)))
}
async function hmac(key: string, msg: string) {
  const k = await crypto.subtle.importKey('raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return toBytes(await crypto.subtle.sign('HMAC', k, enc.encode(msg)))
}

const hA = ref<Uint8Array>(new Uint8Array(32))
const hB = ref<Uint8Array>(new Uint8Array(32))
const tagSender = ref<Uint8Array>(new Uint8Array(32))
const tagForged = ref<Uint8Array>(new Uint8Array(32))
const ready = ref(false)
let seq = 0

watchEffect(async () => {
  const a = original.value
  const b = edited.value
  const m = mode.value
  const my = ++seq
  if (!import.meta.client || !crypto?.subtle) return
  const [x, y, s, f] = await Promise.all([
    sha(a), sha(b),
    m === 'hash' ? sha(a) : hmac(secretKey, a),
    sha(b), // ผู้โจมตีไม่รู้คีย์ จึงคำนวณได้แค่แฮชเปล่าของข้อความที่แก้
  ])
  if (my !== seq) return
  hA.value = x; hB.value = y; tagSender.value = s; tagForged.value = f; ready.value = true
})

const diffBits = computed(() => {
  let d = 0
  for (let i = 0; i < 32; i++) { let v = hA.value[i]! ^ hB.value[i]!; while (v) { d += v & 1; v >>= 1 } }
  return d
})
const hexA = computed(() => hex(hA.value))
const hexB = computed(() => hex(hB.value))
const nibbles = computed(() => hexB.value.split('').map((c, i) => ({ c, diff: c !== hexA.value[i] })))
const diffNibbles = computed(() => nibbles.value.filter(n => n.diff).length)

// ผู้รับเทียบ tag ที่แนบมากับข้อความที่ถูกแก้ กับค่าที่ตนคำนวณเอง (ผู้รับรู้กุญแจ)
const expected = ref<Uint8Array>(new Uint8Array(32))
watchEffect(async () => {
  const b = edited.value
  const m = mode.value
  if (!import.meta.client || !crypto?.subtle) return
  expected.value = m === 'hash' ? await sha(b) : await hmac(secretKey, b)
})
const verifyOk = computed(() => hex(expected.value) === hex(tagForged.value))

const same = computed(() => original.value === edited.value)

function flipOneBit() {
  const s = original.value
  if (!s) return
  const last = s.charCodeAt(s.length - 1) ^ 1
  edited.value = s.slice(0, -1) + String.fromCharCode(last)
}
function reset() {
  original.value = 'Transfer $50.00 to Account #10442'
  edited.value = 'Transfer $500.00 to Account #99103'
}
</script>

<template>
  <figure class="not-prose my-8 rounded-xl border border-line bg-soft p-4 sm:p-6">
    <div class="grid gap-3 md:grid-cols-2">
      <label class="block text-xs font-semibold">① ข้อความต้นฉบับ (ผู้ส่ง)
        <input v-model="original" type="text" class="mt-1 w-full rounded-md border border-line bg-paper px-2 py-1.5 font-mono text-xs font-normal" />
      </label>
      <label class="block text-xs font-semibold">② ข้อความที่ถูกแก้ระหว่างทาง
        <input v-model="edited" type="text" class="mt-1 w-full rounded-md border border-line bg-paper px-2 py-1.5 font-mono text-xs font-normal" />
      </label>
    </div>
    <div class="mt-2 flex flex-wrap gap-1.5">
      <button type="button" class="rounded-md border border-line px-2 py-1 text-xs hover:border-ink" @click="flipOneBit">แก้แค่ 1 บิต (ตัวอักษรสุดท้าย)</button>
      <button type="button" class="rounded-md border border-line px-2 py-1 text-xs hover:border-ink" @click="reset">คืนค่าตัวอย่างธนาคาร</button>
    </div>

    <p v-if="!ready" class="mt-3 text-xs text-mute">กำลังคำนวณ SHA-256 ในเบราว์เซอร์…</p>
    <template v-else>
      <div class="mt-4 grid gap-3">
        <div>
          <p class="text-xs font-semibold">SHA-256 ของ ① (256 บิต = 64 ตัวฐานสิบหก)</p>
          <p class="mt-1 break-all rounded-md border border-line bg-paper p-2 font-mono text-[11px]">{{ hexA }}</p>
        </div>
        <div>
          <p class="text-xs font-semibold">SHA-256 ของ ② (ตัวที่ต่างจาก ① ขีดเส้นใต้)</p>
          <p class="mt-1 break-all rounded-md border border-line bg-paper p-2 font-mono text-[11px]">
            <span v-for="(n, i) in nibbles" :key="i" :class="n.diff ? 'font-bold underline' : 'text-mute'">{{ n.c }}</span>
          </p>
        </div>
      </div>

      <div class="mt-3 rounded-lg border-2 border-ink bg-paper p-3 text-xs" aria-live="polite">
        <template v-if="same">ข้อความเหมือนกันทุกตัวอักษร → แฮชเหมือนกัน (0 บิตต่างกัน) ลองแก้ ② สักตัวอักษร</template>
        <template v-else>
          ต่างกัน <b>{{ diffBits }} / 256 บิต</b> ({{ (diffBits / 256 * 100).toFixed(0) }}%) · ตัวฐานสิบหกที่ต่าง {{ diffNibbles }} / 64 ตัว
          — ถ้าแฮชไม่สุ่มพอ ค่าที่ต่างน้อยจะเห็นแฮชใกล้กัน แต่ SHA-256 ที่ดีให้ผลต่างราว 50% เสมอ (avalanche effect) จึงเดาไม่ได้ว่า "แก้เล็กน้อย" ทำให้แฮชเปลี่ยนไปทางไหน
        </template>
      </div>

      <div class="mt-5 border-t border-line pt-4">
        <p class="text-xs font-semibold">③ ผู้โจมตีแก้ข้อความ ② แล้วแนบ "ป้ายตรวจ (tag)" ที่ตัวเองคำนวณ — ผู้รับจะจับได้ไหม</p>
        <div class="mt-2 flex flex-wrap gap-1.5">
          <button type="button" class="rounded-md border px-2 py-1 text-xs transition" :class="mode === 'hash' ? 'border-ink bg-ink text-paper' : 'border-line hover:border-ink'" @click="mode = 'hash'">tag = SHA-256(ข้อความ) · ไม่มีกุญแจ</button>
          <button type="button" class="rounded-md border px-2 py-1 text-xs transition" :class="mode === 'hmac' ? 'border-ink bg-ink text-paper' : 'border-line hover:border-ink'" @click="mode = 'hmac'">tag = HMAC-SHA256(กุญแจลับ, ข้อความ)</button>
        </div>
        <div class="mt-3 rounded-lg border-2 bg-paper p-3 text-xs" :class="verifyOk && !same ? 'border-ink' : 'border-mute'" aria-live="polite">
          <template v-if="same">ยังไม่มีการแก้ข้อความ</template>
          <template v-else-if="mode === 'hash'">
            <b>ผู้รับยอมรับ ✕ (ตรวจไม่พบการแก้ไข)</b><br />
            ผู้โจมตีรู้อัลกอริทึมแฮช จึง <i>คำนวณแฮชของข้อความใหม่ แล้วแนบแทนของเดิม</i> ได้เอง ผู้รับคำนวณแล้วตรงกัน แฮชเปล่าๆ จึงตรวจได้แค่ "เสียหายโดยบังเอิญ" (bit rot, ส่งผิดพลาด) ไม่ได้กัน "การแก้ไขโดยตั้งใจ"
          </template>
          <template v-else>
            <b>ผู้รับปฏิเสธ ✓ (จับได้)</b><br />
            HMAC ต้องใช้กุญแจลับที่ผู้โจมตีไม่มี เขาจึงทำได้แค่แนบแฮชเปล่า ซึ่งไม่ตรงกับ HMAC ที่ผู้รับคำนวณด้วยกุญแจ
            <span class="mt-1 block font-mono text-[11px] text-mute">tag ผู้ส่ง (ต้นฉบับ): {{ hex(tagSender).slice(0, 24) }}…<br />tag ที่ผู้โจมตีแนบ: {{ hex(tagForged).slice(0, 24) }}…</span>
          </template>
        </div>
      </div>
    </template>
    <figcaption class="mt-2 text-xs text-mute">คำนวณจริงด้วย WebCrypto ในเบราว์เซอร์ (ไม่ส่งข้อมูลออกไปไหน) · กุญแจ HMAC ในสื่อนี้เป็นค่าตัวอย่างฝังไว้ · HMAC พิสูจน์ว่า "ผู้ที่รู้กุญแจเป็นผู้สร้าง" แต่ผู้รับกับผู้ส่งรู้กุญแจเดียวกัน จึงปฏิเสธไม่ได้ว่าใครสร้าง (ถ้าต้องการ non-repudiation ใช้ลายเซ็นดิจิทัล)</figcaption>
  </figure>
</template>
