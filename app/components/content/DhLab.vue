<script setup lang="ts">
// Diffie-Hellman ด้วยตัวเลขเล็ก (BigInt จริง): ทั้งสองฝ่ายได้ความลับร่วมโดยไม่ส่งมันผ่านสาย + ผู้ดักฟังต้อง "เดา" เลขชี้กำลัง + MITM เมื่อไม่ยืนยันตัวตน
const primes = [23, 101, 1009, 10007, 104729, 1299709]
const pi = ref(0)
const a = ref(6) // ความลับของไคลเอนต์
const b = ref(15) // ความลับของเซิร์ฟเวอร์
const mitm = ref(false)
const authed = ref(false) // เซิร์ฟเวอร์เซ็น key share ด้วยกุญแจที่เบราว์เซอร์ตรวจกับใบรับรองได้
const g = 5n
const p = computed(() => BigInt(primes[pi.value]!))

function pw(base: bigint, e: bigint, m: bigint) {
  let r = 1n; base %= m
  while (e > 0n) { if (e & 1n) r = (r * base) % m; base = (base * base) % m; e >>= 1n }
  return r
}
const secA = computed(() => BigInt(Math.max(2, Math.min(a.value || 2, primes[pi.value]! - 2))))
const secB = computed(() => BigInt(Math.max(2, Math.min(b.value || 2, primes[pi.value]! - 2))))
const pubA = computed(() => pw(g, secA.value, p.value))
const pubB = computed(() => pw(g, secB.value, p.value))
const sharedA = computed(() => pw(pubB.value, secA.value, p.value))
const sharedB = computed(() => pw(pubA.value, secB.value, p.value))

// ผู้ดักฟังเห็น p, g, pubA จึงลองเลขชี้กำลังทีละค่าจนได้ g^x = pubA (discrete log แบบเดาสุ่ม/ไล่ตรง)
const attack = computed(() => {
  let x = 1n; let v = g % p.value; let steps = 1
  while (v !== pubA.value && steps < 2_000_000) { v = (v * g) % p.value; x++; steps++ }
  const found = v === pubA.value
  const sharedGuess = found ? pw(pubB.value, x, p.value) : 0n
  return { steps, found, sharedGuess }
})

// MITM: Mallory เลือก m1, m2 แล้วสลับ key share ของทั้งสองฝ่าย
const m1 = 9n; const m2 = 11n
const mPub1 = computed(() => pw(g, m1, p.value))
const mPub2 = computed(() => pw(g, m2, p.value))
const clientKey = computed(() => pw(mPub1.value, secA.value, p.value)) // ไคลเอนต์คิดว่าคุยกับเซิร์ฟเวอร์
const serverKey = computed(() => pw(mPub2.value, secB.value, p.value))
const malloryWithClient = computed(() => pw(pubA.value, m1, p.value))
const malloryWithServer = computed(() => pw(pubB.value, m2, p.value))
const bits = computed(() => Math.ceil(Math.log2(primes[pi.value]!)))
</script>

<template>
  <figure class="not-prose my-8 rounded-xl border border-line bg-soft p-4 sm:p-6">
    <div class="flex flex-wrap items-end gap-3 text-xs">
      <label class="font-semibold">จำนวนเฉพาะ p (สาธารณะ)
        <select v-model.number="pi" class="mt-1 block rounded-md border border-line bg-paper px-2 py-1.5 font-mono font-normal">
          <option v-for="(q, i) in primes" :key="q" :value="i">{{ q }} (~{{ Math.ceil(Math.log2(q)) }} บิต)</option>
        </select>
      </label>
      <label class="font-semibold">ความลับของไคลเอนต์ a
        <input v-model.number="a" type="number" min="2" class="mt-1 block w-24 rounded-md border border-line bg-paper px-2 py-1.5 font-mono font-normal" />
      </label>
      <label class="font-semibold">ความลับของเซิร์ฟเวอร์ b
        <input v-model.number="b" type="number" min="2" class="mt-1 block w-24 rounded-md border border-line bg-paper px-2 py-1.5 font-mono font-normal" />
      </label>
      <p class="pb-2 font-mono text-mute">g = 5</p>
    </div>

    <div class="mt-4 grid gap-3 md:grid-cols-2">
      <div class="rounded-lg border border-line bg-paper p-3 text-xs">
        <p class="font-semibold">ไคลเอนต์ (เก็บ a = {{ secA }} ไว้เอง)</p>
        <p class="mt-1 font-mono">A = g<sup>a</sup> mod p = <b>{{ pubA }}</b> <span class="text-mute">← ส่งออกสาย</span></p>
        <p class="mt-1 font-mono">รับ B → ความลับร่วม = B<sup>a</sup> mod p = <b>{{ mitm ? clientKey : sharedA }}</b></p>
      </div>
      <div class="rounded-lg border border-line bg-paper p-3 text-xs">
        <p class="font-semibold">เซิร์ฟเวอร์ (เก็บ b = {{ secB }} ไว้เอง)</p>
        <p class="mt-1 font-mono">B = g<sup>b</sup> mod p = <b>{{ pubB }}</b> <span class="text-mute">← ส่งออกสาย</span></p>
        <p class="mt-1 font-mono">รับ A → ความลับร่วม = A<sup>b</sup> mod p = <b>{{ mitm ? serverKey : sharedB }}</b></p>
      </div>
    </div>

    <label class="mt-3 flex items-center gap-2 text-xs">
      <input v-model="mitm" type="checkbox" /> มีผู้โจมตีกลางทาง (MITM) สลับ key share ของทั้งสองฝ่าย
    </label>
    <label v-if="mitm" class="mt-1 flex items-center gap-2 text-xs">
      <input v-model="authed" type="checkbox" /> เซิร์ฟเวอร์เซ็น key share ด้วยกุญแจที่ผูกกับใบรับรอง และไคลเอนต์ตรวจลายเซ็น
    </label>

    <div v-if="!mitm" class="mt-3 rounded-lg border-2 border-ink bg-paper p-3 text-xs" aria-live="polite">
      <p class="font-semibold">{{ sharedA === sharedB ? '✓ สองฝ่ายได้ความลับร่วมเท่ากัน = ' + sharedA : '✕ ไม่เท่ากัน (ไม่ควรเกิด)' }} โดยไม่เคยส่งค่านี้ผ่านสาย</p>
      <p class="mt-1">ผู้ดักฟังเห็น p, g, A = {{ pubA }}, B = {{ pubB }} แต่ต้องหา a จาก g<sup>a</sup> mod p (ปัญหาลอการิทึมไม่ต่อเนื่อง, discrete logarithm)</p>
      <p class="mt-1 font-mono">ไล่ลองทีละค่า: {{ attack.found ? 'พบ a ที่ลองครั้งที่ ' + attack.steps.toLocaleString() + ' → ได้ความลับร่วม ' + attack.sharedGuess : 'ยังไม่พบหลังลอง ' + attack.steps.toLocaleString() + ' ครั้ง' }}</p>
      <p class="mt-1 text-mute">p ขนาด {{ bits }} บิต เดาได้ในพริบตา · ของจริงใช้ p 2048 บิต หรือเส้นโค้งวงรี (X25519, ~255 บิต) ที่ไม่มีทางไล่ตรงได้ (ไม่มีอัลกอริทึมที่รู้จักแก้ได้ในเวลาที่สมเหตุสมผล)</p>
    </div>

    <div v-else class="mt-3 rounded-lg border-2 bg-paper p-3 text-xs" :class="authed ? 'border-ink' : 'border-mute'" aria-live="polite">
      <p class="font-mono">Mallory ส่ง {{ mPub1 }} ให้ไคลเอนต์ (แทน B) และ {{ mPub2 }} ให้เซิร์ฟเวอร์ (แทน A)</p>
      <template v-if="!authed">
        <p class="mt-1 font-semibold">✕ ไม่รู้ตัว: ความลับที่ไคลเอนต์ได้ = {{ clientKey }} เท่ากับที่ Mallory คิดได้ ({{ malloryWithClient }}) · ฝั่งเซิร์ฟเวอร์ได้ {{ serverKey }} = ของ Mallory ({{ malloryWithServer }})</p>
        <p class="mt-1">Mallory ถอดรหัสแล้วเข้ารหัสต่อ อ่านและแก้ได้ทุกข้อความ ทั้งที่แต่ละฝั่ง "เข้ารหัสอยู่" DH เปล่าๆ จึง <b>ไม่ยืนยันว่าคุยกับใคร</b></p>
      </template>
      <template v-else>
        <p class="mt-1 font-semibold">✓ ไคลเอนต์ตรวจลายเซ็นบน key share ไม่ผ่าน (Mallory ไม่มีกุญแจส่วนตัวของเซิร์ฟเวอร์) → ตัดการเชื่อมต่อ</p>
        <p class="mt-1">นี่คือหน้าที่ของ <b>ใบรับรอง + CertificateVerify</b> ใน TLS: ผูก key share เข้ากับตัวตนของเซิร์ฟเวอร์</p>
      </template>
    </div>
    <figcaption class="mt-2 text-xs text-mute">คำนวณจริงด้วย BigInt ในเบราว์เซอร์ ขนาดเล็กเพื่อให้เห็นตัวเลข ของจริงใช้พารามิเตอร์ใหญ่กว่านี้มาก และ a, b สุ่มใหม่ทุกการเชื่อมต่อ (ephemeral)</figcaption>
  </figure>
</template>
