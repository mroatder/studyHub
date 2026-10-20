<script setup lang="ts">
// ความพร้อมใช้ (availability): "จำนวนเก้า", ระบบอนุกรม (ต้องทำงานทุกตัว) เทียบขนาน (ตัวสำรอง) และ MTBF/MTTR
const nines = ref(3) // ความพร้อมของแต่ละชิ้น = 1 - 10^-nines (เช่น 3 → 99.9%)
const tiers = ref(3) // จำนวนชั้นที่ต่อกันเป็นอนุกรม (เช่น LB → เว็บ → DB)
const replicas = ref(1) // จำนวนสำเนาขนานต่อชั้น
const independent = ref(true)

const a = computed(() => 1 - Math.pow(10, -nines.value))
// ถ้าความล้มเหลวไม่อิสระ (ตัวสำรองพังพร้อมกัน เช่น ไฟดับห้องเดียวกัน) ชั้นนั้นดีเท่าชิ้นเดียว = a
const tierA = computed(() => independent.value ? 1 - Math.pow(1 - a.value, replicas.value) : a.value)
const sys = computed(() => Math.pow(tierA.value, tiers.value))
const downYear = computed(() => (1 - sys.value) * 365 * 24 * 60) // นาทีต่อปี

function fmt(min: number) {
  if (min < 1) return `${(min * 60).toFixed(1)} วินาที`
  if (min < 120) return `${min.toFixed(1)} นาที`
  if (min < 60 * 48) return `${(min / 60).toFixed(1)} ชั่วโมง`
  return `${(min / 60 / 24).toFixed(1)} วัน`
}
const pct = (x: number) => (x * 100).toFixed(x > 0.9999 ? 5 : 3) + '%'

// MTBF / MTTR
const mtbf = ref(1000)
const mttr = ref(4)
const aMt = computed(() => mtbf.value / (mtbf.value + mttr.value))
const downMt = computed(() => (1 - aMt.value) * 365 * 24)
</script>

<template>
  <figure class="not-prose my-8 rounded-xl border border-line bg-soft p-4 sm:p-6">
    <p class="text-xs font-semibold">ระบบเว็บที่มี <b>{{ tiers }}</b> ชั้นต่อกัน (ต้องทำงานครบทุกชั้นผู้ใช้จึงเข้าได้)</p>
    <div class="mt-3 grid gap-4 md:grid-cols-3">
      <label class="block text-xs">ความพร้อมของ "ชิ้นเดียว"
        <select v-model.number="nines" class="mt-1 w-full rounded-md border border-line bg-paper px-2 py-1.5">
          <option :value="2">99% (สองเก้า)</option>
          <option :value="3">99.9% (สามเก้า)</option>
          <option :value="4">99.99% (สี่เก้า)</option>
          <option :value="5">99.999% (ห้าเก้า)</option>
        </select>
      </label>
      <label class="block text-xs">จำนวนชั้นต่ออนุกรม: {{ tiers }}
        <input v-model.number="tiers" type="range" min="1" max="6" class="mt-2 w-full" />
      </label>
      <label class="block text-xs">สำเนาขนานต่อชั้น: {{ replicas }}
        <input v-model.number="replicas" type="range" min="1" max="3" class="mt-2 w-full" />
      </label>
    </div>
    <label class="mt-2 flex items-center gap-2 text-xs">
      <input v-model="independent" type="checkbox" /> ความล้มเหลวของสำเนาเป็นอิสระต่อกัน (เอาออก = สำเนาอยู่ในห้อง/ไฟ/สวิตช์เดียวกัน พังพร้อมกัน)
    </label>

    <div class="mt-4 flex flex-wrap items-stretch justify-center gap-2" aria-hidden="true">
      <div v-for="t in tiers" :key="t" class="flex items-center gap-2">
        <div class="flex flex-col gap-1 rounded-lg border border-line bg-paper p-2">
          <span v-for="r in (independent ? replicas : 1)" :key="r" class="rounded border border-ink px-2 py-0.5 text-center text-[11px]">ชั้น {{ t }}{{ replicas > 1 && independent ? `.${r}` : '' }}</span>
        </div>
        <span v-if="t < tiers" class="text-mute">→</span>
      </div>
    </div>

    <div class="mt-4 grid gap-3 sm:grid-cols-3" aria-live="polite">
      <div class="rounded-lg border border-line bg-paper p-3 text-xs"><p class="text-mute">ความพร้อมต่อชั้น</p><p class="mt-1 font-mono text-sm font-bold">{{ pct(tierA) }}</p></div>
      <div class="rounded-lg border-2 border-ink bg-paper p-3 text-xs"><p class="text-mute">ทั้งระบบ = (ต่อชั้น)<sup>{{ tiers }}</sup></p><p class="mt-1 font-mono text-sm font-bold">{{ pct(sys) }}</p></div>
      <div class="rounded-lg border border-line bg-paper p-3 text-xs"><p class="text-mute">ล่มรวมต่อปี (เฉลี่ย)</p><p class="mt-1 font-mono text-sm font-bold">{{ fmt(downYear) }}</p></div>
    </div>
    <p class="mt-2 text-xs text-mute">
      ลองทำ: ตั้ง 99.9% × 3 ชั้น × 1 สำเนา (ได้ ≈ 99.70%, ล่ม ≈ 26 ชม./ปี) แล้วเพิ่มสำเนาเป็น 2 → ดูว่าได้กี่เก้า · แล้วติ๊ก "ไม่อิสระ" ออก จะเห็นว่าสำเนาไม่ช่วยอะไรเลยถ้าพังด้วยสาเหตุร่วม
    </p>

    <div class="mt-5 border-t border-line pt-4">
      <p class="text-xs font-semibold">อีกมุม: ความพร้อม = MTBF ÷ (MTBF + MTTR)</p>
      <div class="mt-2 grid gap-3 sm:grid-cols-2">
        <label class="block text-xs">MTBF (ชั่วโมงเฉลี่ยระหว่างเสีย): {{ mtbf }}
          <input v-model.number="mtbf" type="range" min="100" max="100000" step="100" class="mt-2 w-full" />
        </label>
        <label class="block text-xs">MTTR (ชั่วโมงเฉลี่ยในการซ่อม): {{ mttr }}
          <input v-model.number="mttr" type="range" min="0.1" max="48" step="0.1" class="mt-2 w-full" />
        </label>
      </div>
      <p class="mt-2 rounded-lg border border-line bg-paper p-3 text-xs">
        ความพร้อม <b class="font-mono">{{ pct(aMt) }}</b> · ล่มรวม ≈ <b>{{ downMt.toFixed(1) }} ชม./ปี</b>
        — ปรับ MTTR ลง (ซ่อมเร็วขึ้น, มีอะไหล่/แผนกู้คืนที่ซ้อมแล้ว) ได้ผลใกล้เคียงกับการทำให้ของเสียยากขึ้น และมักถูกกว่า
      </p>
    </div>
    <figcaption class="mt-2 text-xs text-mute">แบบจำลองง่าย: สมมติความล้มเหลวอิสระ (ยกเว้นเมื่อติ๊กออก) และไม่นับเวลาสลับไปตัวสำรอง (failover) ระบบจริงมักต่ำกว่าค่าที่คำนวณได้ · ตัวเลขทั้งหมดเป็นค่าตัวอย่าง</figcaption>
  </figure>
</template>
