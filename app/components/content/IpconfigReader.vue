<script setup lang="ts">
// อ่านผลลัพธ์ ipconfig ทีละบรรทัด สลับ 3 สถานการณ์ แล้วกดดูว่าแต่ละค่าบอกอะไร
type Row = { k: string; v: string; tip: string }
type Case = { label: string; verdict: string; rows: Row[] }

const cases: Case[] = [
  {
    label: 'ปกติ',
    verdict: 'ได้ IP จากเราเตอร์ครบ มีเกตเวย์ ออกนอกวงเครือข่ายได้',
    rows: [
      { k: 'IPv4 Address', v: '192.168.1.45', tip: 'ที่อยู่ของเครื่องในเครือข่ายนี้ ได้มาจากเซิร์ฟเวอร์ DHCP (ปกติคือเราเตอร์) ช่วง 192.168.x.x เป็นที่อยู่ภายใน (private)' },
      { k: 'Subnet Mask', v: '255.255.255.0', tip: 'บอกขอบเขตเครือข่ายเดียวกัน: เลขสามชุดแรกเหมือนกันแปลว่าอยู่วงเดียวกัน คุยกันตรงๆ ได้ (เรื่อง subnet จะเรียนละเอียดในโมดูลเครือข่าย)' },
      { k: 'Default Gateway', v: '192.168.1.1', tip: 'ประตูออกสู่เครือข่ายอื่น/อินเทอร์เน็ต คือเราเตอร์ ถ้าปลายทางอยู่นอกวง เครื่องจะส่งให้ค่านี้ช่วยส่งต่อ' },
    ],
  },
  {
    label: 'ได้ 169.254 (APIPA)',
    verdict: 'หา DHCP ไม่เจอ Windows ตั้ง IP ชั่วคราวให้เอง คุยได้แค่เครื่องในสายเดียวกันที่ได้ 169.254 เหมือนกัน ออกอินเทอร์เน็ตไม่ได้',
    rows: [
      { k: 'IPv4 Address', v: '169.254.37.201', tip: 'ขึ้นต้น 169.254 คือ APIPA (Automatic Private IP Addressing) แปลว่าเครื่องร้องขอ IP แล้วไม่มีใครตอบ ไม่ใช่ค่าที่ใครตั้งให้ ให้สงสัย DHCP, สายหลวม หรือ Wi-Fi ไม่ได้เชื่อมจริง' },
      { k: 'Subnet Mask', v: '255.255.0.0', tip: 'มาสก์มาตรฐานของ APIPA ต่างจากเครือข่ายจริงที่เคยใช้ ยิ่งยืนยันว่าเป็นค่าชั่วคราว' },
      { k: 'Default Gateway', v: '(ว่าง)', tip: 'APIPA ไม่มีเกตเวย์ จึงไม่มีทางออกนอกวง ผู้ใช้จะบอกว่า "ต่อ Wi-Fi อยู่แต่เน็ตไม่ขึ้น"' },
    ],
  },
  {
    label: 'ไม่มีเกตเวย์',
    verdict: 'ได้ IP แล้วแต่ไม่รู้ทางออก คุยกับเครื่องในวงเดียวกันได้ แต่เข้าเว็บภายนอกไม่ได้',
    rows: [
      { k: 'IPv4 Address', v: '192.168.1.45', tip: 'IP ปกติ แสดงว่าขั้นขอ IP ผ่านแล้ว ไม่ต้องไปไล่ที่ DHCP' },
      { k: 'Subnet Mask', v: '255.255.255.0', tip: 'ปกติ' },
      { k: 'Default Gateway', v: '(ว่าง)', tip: 'จุดผิดปกติ: ไม่รู้ว่าจะส่งแพ็กเก็ตออกนอกวงทางไหน อาจตั้ง IP แบบ static โดยลืมใส่เกตเวย์ หรือเราเตอร์ส่งค่ามาไม่ครบ' },
    ],
  },
]

const ci = ref(0)
const sel = ref(0)
const cur = computed(() => cases[ci.value]!)
const row = computed(() => cur.value.rows[sel.value]!)
const flag = (r: Row) => r.v.startsWith('169.254') || r.v === '(ว่าง)'
function pick(i: number) {
  ci.value = i
  sel.value = 0
}
</script>

<template>
  <figure class="not-prose my-8 rounded-xl border border-line bg-soft p-4 sm:p-6">
    <div class="flex flex-wrap gap-2 text-sm">
      <button v-for="(c, i) in cases" :key="c.label" type="button" class="rounded-md border px-3 py-1.5 transition" :class="ci === i ? 'border-ink bg-ink text-paper' : 'border-line hover:border-ink'" :aria-pressed="ci === i" @click="pick(i)">
        {{ c.label }}
      </button>
    </div>

    <div class="mt-4 rounded-lg border border-line bg-paper p-3 font-mono text-xs leading-7 sm:text-sm">
      <p class="text-mute">C:\&gt; ipconfig</p>
      <p class="text-mute">Ethernet adapter Ethernet0:</p>
      <button v-for="(r, i) in cur.rows" :key="r.k" type="button" class="flex w-full flex-wrap gap-x-2 rounded px-2 text-left transition" :class="sel === i ? 'bg-ink text-paper' : 'hover:bg-soft'" :aria-pressed="sel === i" @click="sel = i">
        <span>{{ r.k }} :</span>
        <span class="font-semibold">{{ r.v }}</span>
        <span v-if="flag(r)" class="ml-auto text-xs">⚠ ผิดปกติ</span>
      </button>
    </div>

    <div class="mt-3 rounded-lg border border-line bg-paper p-3 text-sm leading-7" aria-live="polite">
      <p class="text-xs text-mute">{{ row.k }}</p>
      <p>{{ row.tip }}</p>
    </div>
    <p class="mt-3 rounded-lg border-2 border-ink bg-paper p-3 text-sm font-semibold">สรุป: {{ cur.verdict }}</p>
    <figcaption class="mt-3 text-sm text-mute">กดแต่ละบรรทัดเพื่อดูความหมาย ค่าในภาพเป็นตัวอย่างสมมติ</figcaption>
  </figure>
</template>
