<script setup lang="ts">
// รู้จักพอร์ตภายนอกจากรูปร่าง กดดูรายละเอียด หรือกด "ทายพอร์ต" เพื่อฝึกจำ
const ports = [
  { id: 'usba', name: 'USB Type-A', shape: 'M14 14 H66 V36 H14 Z M20 26 H60', hint: 'สี่เหลี่ยมแบน เสียบได้ด้านเดียว', specs: ['USB 2.0: 480 Mbps', 'USB 3.0/3.1 Gen 1: 5 Gbps', 'USB 3.1/3.2 Gen 2: 10 Gbps'], use: 'คีย์บอร์ด เมาส์ แฟลชไดรฟ์ มีในแทบทุกเครื่องมานาน' },
  { id: 'usbc', name: 'USB Type-C', shape: 'M24 16 H56 A9 9 0 0 1 56 34 H24 A9 9 0 0 1 24 16 Z M26 22 H54', hint: 'รูปวงรี เสียบกลับด้านได้', specs: ['ส่งข้อมูลความเร็วสูง', 'จ่ายไฟได้ 100W ขึ้นไปด้วย Power Delivery (PD)', 'ส่งสัญญาณภาพได้'], use: 'มาตรฐานใหม่: ชาร์จ โอนข้อมูล และต่อจอด้วยสายเส้นเดียว' },
  { id: 'tb', name: 'Thunderbolt 3 / 4', shape: 'M24 16 H56 A9 9 0 0 1 56 34 H24 A9 9 0 0 1 24 16 Z M42 19 L36 27 H42 L38 33', hint: 'หน้าตาเหมือน USB-C แต่มักมีสัญลักษณ์สายฟ้า', specs: ['ได้ถึง 40 Gbps', 'ส่งข้อมูล PCIe และ DisplayPort ผ่านสายเดียว'], use: 'การ์ดจอภายนอก (eGPU) จอ 4K ต่อพ่วงกัน และชุดเก็บข้อมูลความเร็วสูง', noQuiz: true },
  { id: 'hdmi', name: 'HDMI', shape: 'M12 15 H68 V28 L60 36 H20 L12 28 Z', hint: 'ปากสี่เหลี่ยมมีมุมล่างเฉียงสองด้าน', specs: ['ส่งภาพและเสียงในสายเดียว', 'HDMI 2.1: 8K ที่ 60Hz หรือ 4K ที่ 120Hz'], use: 'ทีวี โปรเจกเตอร์ คอนโซลเกม และจอคอมพิวเตอร์ทั่วไป' },
  { id: 'dp', name: 'DisplayPort', shape: 'M12 15 H68 V36 H26 L12 26 Z', hint: 'คล้าย HDMI แต่เฉียงมุมเดียว', specs: ['มีตัวล็อกกันหลุด', 'ต่อจอพ่วงกันได้ด้วย MST (daisy-chain)', 'DisplayPort 2.0/2.1: สูงสุด 80 Gbps'], use: 'จอคอมพิวเตอร์ระดับมืออาชีพ งานหลายจอ และเกมรีเฟรชสูง' },
  { id: 'rj45', name: 'RJ-45 (Ethernet)', shape: 'M18 18 H32 V12 H48 V18 H62 V38 H18 Z M26 38 V30 M32 38 V30 M38 38 V30 M44 38 V30 M50 38 V30 M56 38 V30', hint: 'สี่เหลี่ยมกว้างมีช่องตัวล็อกด้านบน', specs: ['8 ตำแหน่ง 8 ขา (8P8C)', 'ความเร็ว 1 Gbps ถึง 10 Gbps ขึ้นไป', 'สาย Cat5e, Cat6, Cat6a'], use: 'เชื่อมเครือข่ายแบบมีสาย (LAN) เสถียร หน่วงต่ำ ไม่โดนคลื่นรบกวน' },
] as const
type P = (typeof ports)[number]
const active = ref<string>(ports[0].id)
const cur = computed<P>(() => ports.find((p) => p.id === active.value)!)

const quiz = reactive({ on: false, target: ports[0] as P, picked: '', score: 0, total: 0 })
const choices = ports.filter((p) => !('noQuiz' in p))
function nextQ() {
  quiz.target = choices[Math.floor(Math.random() * choices.length)]!
  quiz.picked = ''
}
function startQuiz() {
  quiz.on = true
  quiz.score = quiz.total = 0
  nextQ()
}
function answer(id: string) {
  if (quiz.picked) return
  quiz.picked = id
  quiz.total++
  if (id === quiz.target.id) quiz.score++
}
</script>

<template>
  <figure class="not-prose my-8 rounded-xl border border-line bg-soft p-4 sm:p-6">
    <template v-if="!quiz.on">
      <div class="grid grid-cols-3 gap-2 sm:grid-cols-6">
        <button v-for="p in ports" :key="p.id" type="button" class="rounded-lg border-2 bg-paper p-2 text-center transition" :class="active === p.id ? 'border-ink' : 'border-line hover:border-ink'" :aria-pressed="active === p.id" @click="active = p.id">
          <svg viewBox="0 0 80 50" class="w-full"><path :d="p.shape" fill="none" class="stroke-ink" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" /></svg>
          <span class="block text-[11px] leading-4">{{ p.name }}</span>
        </button>
      </div>
      <div class="mt-4 rounded-lg border border-line bg-paper p-4" aria-live="polite">
        <p class="font-semibold">{{ cur.name }}</p>
        <p class="text-sm text-mute">จุดสังเกต: {{ cur.hint }}</p>
        <ul class="mt-2 list-disc space-y-1 pl-5 text-sm leading-7 text-ink/80"><li v-for="s in cur.specs" :key="s">{{ s }}</li></ul>
        <p class="mt-2 text-sm leading-7">ใช้กับ: {{ cur.use }}</p>
      </div>
      <button type="button" class="mt-4 rounded-lg border border-ink bg-ink px-4 py-2 text-sm font-medium text-paper" @click="startQuiz">🎯 ทายพอร์ต</button>
    </template>

    <template v-else>
      <p class="text-sm text-mute">พอร์ตนี้คืออะไร? (ถูก {{ quiz.score }} / {{ quiz.total }})</p>
      <svg viewBox="0 0 80 50" class="mx-auto my-3 w-40"><path :d="quiz.target.shape" fill="none" class="stroke-ink" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" /></svg>
      <div class="grid grid-cols-2 gap-2 sm:grid-cols-5">
        <button v-for="p in choices" :key="p.id" type="button" class="rounded-lg border-2 px-2 py-2 text-sm transition"
          :class="quiz.picked ? (p.id === quiz.target.id ? 'border-ink bg-ink text-paper' : p.id === quiz.picked ? 'border-mute line-through opacity-60' : 'border-line opacity-60') : 'border-line hover:border-ink'" @click="answer(p.id)">{{ p.name }}</button>
      </div>
      <p v-if="quiz.picked" class="mt-3 text-sm leading-7" aria-live="polite">{{ quiz.picked === quiz.target.id ? 'ถูกต้อง' : 'ยังไม่ใช่' }} · จุดสังเกต: {{ quiz.target.hint }}</p>
      <div class="mt-3 flex gap-2">
        <button v-if="quiz.picked" type="button" class="rounded-lg border border-ink bg-ink px-4 py-2 text-sm text-paper" @click="nextQ">ข้อต่อไป →</button>
        <button type="button" class="rounded-lg border border-line px-4 py-2 text-sm hover:border-ink" @click="quiz.on = false">กลับไปดูรายละเอียด</button>
      </div>
    </template>
    <figcaption class="mt-3 text-sm text-mute">ภาพเป็นเส้นสังเกตแบบย่อ ไม่ใช่รูปจริง ใช้จำรูปทรงของพอร์ต</figcaption>
  </figure>
</template>
