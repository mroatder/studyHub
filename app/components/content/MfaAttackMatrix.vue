<script setup lang="ts">
// เมทริกซ์ "วิธียืนยันตัวตน × รูปแบบการโจมตี" เลือกการโจมตีแล้วดูว่าแต่ละวิธีกันได้หรือไม่ พร้อมเหตุผลเชิงกลไก
type S = 'block' | 'partial' | 'fail'
interface Cell { s: S; why: string }
const methods = [
  { key: 'pw', label: 'รหัสผ่านอย่างเดียว' },
  { key: 'sms', label: 'รหัส SMS' },
  { key: 'totp', label: 'แอป TOTP (6 หลัก)' },
  { key: 'push', label: 'Push กดอนุมัติ' },
  { key: 'num', label: 'Push + number matching' },
  { key: 'fido', label: 'กุญแจ FIDO2 / passkey' },
]
interface Attack { key: string; label: string; story: string; cells: Cell[]; note: string }
const attacks: Attack[] = [
  {
    key: 'stuff', label: 'รหัสผ่านรั่วจากเว็บอื่น (credential stuffing)',
    story: 'ผู้โจมตีมีอีเมล+รหัสผ่านที่ผู้ใช้ใช้ซ้ำจากฐานข้อมูลที่รั่ว แล้วลองล็อกอินบริษัทอัตโนมัติ',
    cells: [
      { s: 'fail', why: 'รหัสผ่านถูก → เข้าได้ทันที ไม่มีด่านอื่น' },
      { s: 'block', why: 'ผู้โจมตีไม่มีโทรศัพท์ของเหยื่อ จึงไม่ได้รับ SMS' },
      { s: 'block', why: 'ไม่มี shared secret จึงคำนวณรหัสไม่ได้ (เดา 1 ใน 10⁶ ต่อครั้ง และถูกจำกัดครั้ง)' },
      { s: 'partial', why: 'ระบบส่ง push ไปหาเหยื่อ ถ้าเหยื่อกดอนุมัติเพราะงงหรือรำคาญ ก็เข้าได้ (ดู MFA fatigue)' },
      { s: 'block', why: 'ต้องพิมพ์เลขที่เห็นบนหน้าล็อกอิน แต่ผู้โจมตีเป็นคนเห็นเลขนั้น เหยื่อไม่ได้เห็น จึงตอบไม่ได้' },
      { s: 'block', why: 'ไม่มีกุญแจจริงในมือ ลายเซ็นปลอมไม่ได้' },
    ],
    note: 'นี่คือเหตุผลหลักที่ MFA ลดการยึดบัญชีได้มาก: รหัสผ่านที่รั่วอย่างเดียวไม่พอ',
  },
  {
    key: 'key', label: 'มัลแวร์ดักแป้นพิมพ์ในเครื่องเหยื่อ (keylogger)',
    story: 'มัลแวร์บันทึกทุกตัวอักษรที่เหยื่อพิมพ์ รวมรหัสผ่านและรหัส 6 หลักที่พิมพ์ตามหลัง',
    cells: [
      { s: 'fail', why: 'ได้รหัสผ่านไปครบ' },
      { s: 'partial', why: 'ถ้าใช้รหัส SMS ที่ดักได้ภายในอายุรหัส (นาทีเดียว) จะเข้าได้ ถ้ามาช้าก็หมดอายุ' },
      { s: 'partial', why: 'รหัสใช้ซ้ำไม่ได้หลังถูกใช้ และหมดใน 30–90 วินาที แต่ถ้าผู้โจมตีใช้ทันที (relay แบบเรียลไทม์) ก็ผ่าน' },
      { s: 'block', why: 'ไม่มีอะไรให้พิมพ์ การกดอนุมัติบนโทรศัพท์ไม่ผ่านแป้นพิมพ์ (แต่มัลแวร์อาจขโมยคุกกี้ session ทีหลัง)' },
      { s: 'block', why: 'เช่นเดียวกัน ตัวเลขถูกพิมพ์บนมือถือ ไม่ใช่เครื่องที่ติดมัลแวร์' },
      { s: 'block', why: 'ไม่มีความลับให้พิมพ์ กุญแจส่วนตัวอยู่ในชิป ออกมาไม่ได้' },
    ],
    note: 'สังเกตว่าวิธีที่ "พิมพ์โค้ดเข้าไป" (SMS/TOTP) อ่อนต่อการดักแบบเรียลไทม์ ส่วนวิธีที่ไม่ต้องพิมพ์ทนกว่า',
  },
  {
    key: 'aitm', label: 'หน้าล็อกอินปลอมแบบกลาง (AiTM / reverse-proxy phishing)',
    story: 'เหยื่อกดลิงก์ในอีเมลไปยังเว็บปลอมที่ส่งต่อทุกอย่างไปยังเว็บจริงทันที เหยื่อกรอกรหัส+MFA บนเว็บปลอม ผู้โจมตีได้ทั้งรหัสและคุกกี้ session ที่ออกให้',
    cells: [
      { s: 'fail', why: 'ได้รหัสผ่านทันที' },
      { s: 'fail', why: 'เหยื่อพิมพ์รหัส SMS ลงเว็บปลอม ถูกส่งต่อไปเว็บจริงในไม่กี่วินาที' },
      { s: 'fail', why: 'รหัส 6 หลักยังอยู่ในหน้าต่างเวลา จึงถูก relay ไปเว็บจริงทัน และผู้โจมตีได้คุกกี้ session' },
      { s: 'fail', why: 'เหยื่อเห็น push ที่เกิดจากการล็อกอิน "จริง" ของผู้โจมตี ซึ่งดูสมเหตุสมผลเพราะเพิ่งกรอกรหัสบนเว็บปลอม' },
      { s: 'fail', why: 'เลขที่เว็บจริงแสดงถูกส่งต่อมายังหน้าเว็บปลอม เหยื่อจึงพิมพ์เลขตรงๆ ในแอป number matching ไม่ช่วยกรณีนี้' },
      { s: 'block', why: 'กุญแจเซ็น challenge ผูกกับโดเมนที่เบราว์เซอร์แสดง (origin) โดเมนปลอมจึงได้ลายเซ็นที่เว็บจริงใช้ไม่ได้ หรือไม่มี credential ให้ใช้เลย' },
    ],
    note: 'นี่คือจุดที่ FIDO2 ต่างจากทุกวิธีอื่นอย่างเป็นหลักการ: ไม่ใช่เพราะรหัสยาวกว่า แต่เพราะ "ผูกกับโดเมน"',
  },
  {
    key: 'fatigue', label: 'ยิง push ถี่ๆ (MFA fatigue / bombing)',
    story: 'ผู้โจมตีมีรหัสผ่านแล้ว สั่งล็อกอินซ้ำๆ ตอนกลางคืนจนมือถือเหยื่อสั่นไม่หยุด รอให้เหยื่อกด Approve',
    cells: [
      { s: 'fail', why: 'ไม่มีด่านที่สอง' },
      { s: 'block', why: 'ไม่มี prompt ให้กด' },
      { s: 'block', why: 'ไม่มี prompt ให้กด' },
      { s: 'fail', why: 'กดเดียวจบ ผู้ใช้ที่ง่วงหรือรำคาญกด Approve ได้ง่าย' },
      { s: 'block', why: 'ต้องพิมพ์เลขที่เห็นบนหน้าล็อกอิน ผู้โจมตีเป็นคนเห็นเลขนั้น เหยื่อไม่เห็น จึงกดมั่วไม่ได้ (ยังมีโอกาสที่เหยื่อเดาเลขหรือถูกโทรหลอกให้อ่านเลข)' },
      { s: 'block', why: 'ไม่มี push' },
    ],
    note: 'ข้อควรระวัง: ถ้าผู้โจมตีโทรไปบอกเหยื่อว่า "ฉันคือ IT ช่วยพิมพ์เลขนี้หน่อย" number matching ก็แพ้วิศวกรรมสังคม',
  },
  {
    key: 'sim', label: 'ย้ายซิม (SIM swap)',
    story: 'ผู้โจมตีหลอกผู้ให้บริการมือถือให้โอนเบอร์ของเหยื่อมาที่ซิมของตน SMS และสายเข้าจึงมาที่ผู้โจมตี',
    cells: [
      { s: 'fail', why: 'ไม่เกี่ยวกับ SMS แต่ไม่มีด่านที่สองอยู่แล้ว' },
      { s: 'fail', why: 'SMS ทุกฉบับไปถึงผู้โจมตี รวมรหัสรีเซ็ตรหัสผ่าน' },
      { s: 'block', why: 'secret เก็บในแอปบนเครื่องเหยื่อ ไม่ได้ส่งผ่านเครือข่ายมือถือ' },
      { s: 'block', why: 'push ผูกกับแอปที่ลงทะเบียนไว้ ไม่ใช่เบอร์โทร' },
      { s: 'block', why: 'เช่นเดียวกัน' },
      { s: 'block', why: 'ไม่เกี่ยวกับเครือข่ายมือถือ' },
    ],
    note: 'อย่าลืมเส้นทาง "ลืมรหัสผ่าน": ถ้ากู้บัญชีด้วย SMS ได้ ความแข็งแรงของ MFA ก็เท่ากับด่านที่อ่อนที่สุด',
  },
  {
    key: 'cookie', label: 'ขโมยคุกกี้ session หลังล็อกอินแล้ว (infostealer)',
    story: 'มัลแวร์อ่านคุกกี้/token ที่เบราว์เซอร์เก็บไว้ หลังเหยื่อผ่าน MFA เรียบร้อย แล้วนำไปใช้ในเครื่องผู้โจมตี',
    cells: [
      { s: 'fail', why: 'คุกกี้ใช้ได้โดยไม่ต้องล็อกอินอีก' },
      { s: 'fail', why: 'ผ่านด่านที่สองไปแล้ว คุกกี้คือหลักฐานว่าผ่านแล้ว' },
      { s: 'fail', why: 'เหมือนกัน' },
      { s: 'fail', why: 'เหมือนกัน' },
      { s: 'fail', why: 'เหมือนกัน' },
      { s: 'partial', why: 'FIDO2 เองไม่ได้ผูก session กับกุญแจ แต่มาตรการเสริม (อายุ session สั้น, ผูก session กับอุปกรณ์, ตรวจพฤติกรรมผิดปกติ) ช่วยได้' },
    ],
    note: 'MFA ปกป้องช่วง "ล็อกอิน" ไม่ใช่ช่วง "หลังล็อกอิน" จึงต้องมีอายุ session สั้นและการเพิกถอน',
  },
]
const ai = ref(0)
const atk = computed(() => attacks[ai.value]!)
const sym: Record<S, string> = { block: '✓ กันได้', partial: '△ ขึ้นกับเงื่อนไข', fail: '✕ ไม่กัน' }
const count = computed(() => ({
  block: atk.value.cells.filter(c => c.s === 'block').length,
  partial: atk.value.cells.filter(c => c.s === 'partial').length,
  fail: atk.value.cells.filter(c => c.s === 'fail').length,
}))
</script>

<template>
  <figure class="not-prose my-8 rounded-xl border border-line bg-soft p-4 sm:p-6">
    <p class="text-xs font-semibold">เลือกการโจมตี</p>
    <div class="mt-2 flex flex-wrap gap-1.5">
      <button v-for="(a, i) in attacks" :key="a.key" type="button" class="rounded-md border px-2 py-1 text-left text-xs transition" :class="ai === i ? 'border-ink bg-ink text-paper' : 'border-line hover:border-ink'" @click="ai = i">{{ a.label }}</button>
    </div>
    <p class="mt-3 rounded-lg border border-line bg-paper px-3 py-2 text-xs">{{ atk.story }}</p>

    <ul class="mt-3 space-y-1.5" aria-live="polite">
      <li v-for="(m, i) in methods" :key="m.key" class="grid gap-1 rounded-lg border bg-paper px-3 py-2 text-xs sm:grid-cols-[11rem_8rem_1fr] sm:gap-3" :class="atk.cells[i]!.s === 'fail' ? 'border-mute' : atk.cells[i]!.s === 'block' ? 'border-ink' : 'border-line border-dashed'">
        <span class="font-semibold">{{ m.label }}</span>
        <span class="font-mono font-bold">{{ sym[atk.cells[i]!.s] }}</span>
        <span class="text-mute">{{ atk.cells[i]!.why }}</span>
      </li>
    </ul>
    <p class="mt-3 text-xs"><b>สรุปการโจมตีนี้:</b> กันได้ {{ count.block }} · ขึ้นกับเงื่อนไข {{ count.partial }} · ไม่กัน {{ count.fail }} จาก 6 วิธี</p>
    <p class="mt-1 text-xs text-mute">{{ atk.note }}</p>
    <figcaption class="mt-2 text-xs text-mute">เป็นการประเมินเชิงกลไกแบบกว้างๆ ผลจริงขึ้นกับการตั้งค่าและผลิตภัณฑ์ (เช่น passkey ที่ซิงก์ผ่านคลาวด์ปลอดภัยเท่าบัญชีคลาวด์ที่ซิงก์)</figcaption>
  </figure>
</template>
