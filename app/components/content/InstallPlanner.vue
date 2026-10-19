<script setup lang="ts">
// ตัวช่วยเลือกวิธีติดตั้ง Windows: ตอบเงื่อนไข 4 ข้อ แล้วดูว่าควรใช้วิธีไหนเพราะอะไร
const hasOs = ref(true)
const keepData = ref(false)
const damaged = ref(false)
const many = ref(false)

const result = computed(() => {
  if (many.value)
    return {
      id: 'auto',
      title: 'ติดตั้งอัตโนมัติด้วย Imaging (MDT / WDS + unattend.xml)',
      why: 'เครื่องจำนวนมากและสเปกเหมือนกัน ไม่คุ้มที่จะนั่งกดทีละเครื่อง เขียน answer file ครั้งเดียว (ภาษา, การแบ่งพาร์ทิชัน, ชื่อเครื่อง, บัญชีแรก) แล้วบูตผ่านเครือข่าย (PXE) ให้ติดตั้งเองทุกเครื่อง ได้ผลลัพธ์เหมือนกันทุกเครื่อง',
      steps: ['เตรียม image มาตรฐาน + unattend.xml', 'เครื่องปลายทางบูตผ่าน PXE / USB', 'WinPE ปรับดิสก์และคัดลอก image ตามไฟล์ตอบ', 'เข้าสู่ OOBE แบบกึ่งอัตโนมัติ'],
      risk: 'ถ้า image ต้นแบบมีมัลแวร์หรือรหัสผ่านที่ฝังไว้ จะแพร่ไปทุกเครื่อง ต้องดูแลต้นแบบอย่างเข้มงวด',
    }
  if (!hasOs.value)
    return {
      id: 'clean',
      title: 'ติดตั้งใหม่ทั้งหมด (Clean installation)',
      why: 'เครื่องยังไม่มีระบบปฏิบัติการ จึงไม่มีอะไรให้อัปเกรด ติดตั้งจากสื่อบูตแล้วสร้างพาร์ทิชันใหม่ได้เลย',
      steps: ['บูตจาก USB', 'สร้างพาร์ทิชัน GPT + NTFS', 'คัดลอกไฟล์ระบบ', 'ตั้งค่าใน OOBE'],
      risk: 'ต้องเตรียมไดรเวอร์ของเครื่องไว้ล่วงหน้า',
    }
  if (damaged.value)
    return {
      id: 'clean',
      title: 'ติดตั้งใหม่ทั้งหมด (Clean installation)',
      why: 'ระบบเดิมเสียหายหรือสงสัยว่ามีมัลแวร์ การอัปเกรดจะแบกปัญหาเดิมไปด้วย ล้างดิสก์แล้วเริ่มใหม่เป็นวิธีเดียวที่มั่นใจได้ว่าสะอาด',
      steps: ['สำรองเฉพาะไฟล์ข้อมูล (ไม่ใช่โปรแกรม) ไปที่อื่น', 'บูตจาก USB แล้วลบพาร์ทิชันเดิม', 'ติดตั้งใหม่', 'กู้ไฟล์ข้อมูลหลังสแกนไวรัสแล้ว'],
      risk: 'ข้อมูลและโปรแกรมเดิมหายหมด ต้องสำรองและติดตั้งโปรแกรมใหม่เอง ระวังไม่สำรองมัลแวร์กลับมา',
    }
  if (keepData.value)
    return {
      id: 'upgrade',
      title: 'อัปเกรดแบบคงข้อมูล (In-place upgrade)',
      why: 'ระบบเดิมยังปกติและต้องการเก็บไฟล์ โปรแกรม และการตั้งค่า ตัวติดตั้งจะย้ายสิ่งเหล่านี้ไปยังระบบใหม่ให้',
      steps: ['สำรองข้อมูลไว้ก่อนเสมอ', 'รัน setup.exe จากภายใน Windows เดิม', 'ตัวติดตั้งย้ายไฟล์ ผู้ใช้ แอป', 'รีบูตเข้าระบบใหม่'],
      risk: 'ความผิดพลาดเดิม ไดรเวอร์เก่า หรือการตั้งค่าที่ไม่ดีอาจติดมาด้วย และโปรแกรมบางตัวอาจเข้ากันไม่ได้',
    }
  return {
    id: 'clean',
    title: 'ติดตั้งใหม่ทั้งหมด (Clean installation)',
    why: 'ไม่ต้องเก็บอะไรจากระบบเดิม ล้างแล้วเริ่มใหม่ได้ระบบสะอาดและมักเร็วที่สุด',
    steps: ['บูตจาก USB', 'ลบพาร์ทิชันเดิม', 'ติดตั้งใหม่', 'ตั้งค่าใน OOBE'],
    risk: 'ข้อมูลทั้งหมดบนไดรฟ์ที่เลือกจะหาย',
  }
})

const opts = [
  { k: hasOs, label: 'เครื่องมี Windows เดิมอยู่', on: 'มีอยู่', off: 'เครื่องเปล่า' },
  { k: keepData, label: 'ต้องเก็บไฟล์และโปรแกรมเดิม', on: 'ต้องเก็บ', off: 'ไม่ต้อง' },
  { k: damaged, label: 'ระบบเดิมพัง / สงสัยมัลแวร์', on: 'ใช่', off: 'ปกติ' },
  { k: many, label: 'ติดตั้งหลายสิบเครื่องสเปกเดียวกัน', on: 'ใช่', off: 'เครื่องเดียว' },
]
</script>

<template>
  <figure class="not-prose my-8 rounded-xl border border-line bg-soft p-4 sm:p-6">
    <p class="text-sm font-medium text-mute">ลองปรับสถานการณ์ แล้วดูว่าควรติดตั้งแบบไหน</p>
    <div class="mt-3 grid gap-2 sm:grid-cols-2">
      <button
        v-for="o in opts"
        :key="o.label"
        type="button"
        class="flex items-center justify-between gap-3 rounded-lg border bg-paper px-3 py-2 text-left text-sm transition"
        :class="o.k.value ? 'border-ink' : 'border-line'"
        :aria-pressed="o.k.value"
        @click="o.k.value = !o.k.value"
      >
        <span>{{ o.label }}</span>
        <span class="shrink-0 rounded-full border px-2 py-0.5 text-xs" :class="o.k.value ? 'border-ink bg-ink text-paper' : 'border-line text-mute'">{{ o.k.value ? o.on : o.off }}</span>
      </button>
    </div>

    <Transition name="pop" mode="out-in">
      <div :key="result.id + result.title" class="mt-5 rounded-lg border-2 border-ink bg-paper p-4" aria-live="polite">
        <p class="text-xs font-medium uppercase tracking-wide text-mute">วิธีที่เหมาะ</p>
        <h4 class="mt-1 text-lg font-semibold">{{ result.title }}</h4>
        <p class="mt-2 leading-8 text-ink/80">{{ result.why }}</p>
        <ol class="mt-3 flex flex-wrap gap-2 text-sm">
          <li v-for="(s, i) in result.steps" :key="s" class="rounded-full border border-line px-3 py-1"><span class="text-mute">{{ i + 1 }}.</span> {{ s }}</li>
        </ol>
        <p class="mt-3 text-sm text-mute"><strong class="text-ink">ข้อควรระวัง:</strong> {{ result.risk }}</p>
      </div>
    </Transition>
    <figcaption class="mt-3 text-sm text-mute">เงื่อนไขหลายข้อซ้อนกันได้ ระบบเลือกข้อที่สำคัญกว่าก่อน (หลายเครื่อง → ไม่มีระบบเดิม → ระบบพัง → ต้องเก็บข้อมูล)</figcaption>
  </figure>
</template>

<style scoped>
.pop-enter-active,
.pop-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.pop-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
.pop-leave-to {
  opacity: 0;
}
@media (prefers-reduced-motion: reduce) {
  .pop-enter-active,
  .pop-leave-active {
    transition: none;
  }
}
</style>
