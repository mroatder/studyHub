<script setup lang="ts">
// คำนวณแบนด์วิดท์ที่จอต้องการ = กว้าง × สูง × Hz × บิตต่อพิกเซล เทียบกับความจุข้อมูลจริงของแต่ละมาตรฐาน (หักการเข้ารหัสแล้ว)
const modes = [
  { label: '1080p', w: 1920, h: 1080 },
  { label: '1440p', w: 2560, h: 1440 },
  { label: '4K', w: 3840, h: 2160 },
  { label: '8K', w: 7680, h: 4320 },
]
const mode = ref(2)
const hz = ref(60)
const bpc = ref(8)
const blank = ref(true)
const hzOpts = [30, 60, 120, 144, 240]
const links = [
  { name: 'HDMI 1.4', cap: 10.2 * 0.8, how: '10.2 Gbps × 8/10' },
  { name: 'HDMI 2.0', cap: 18 * 0.8, how: '18 Gbps × 8/10' },
  { name: 'HDMI 2.1', cap: 48 * 16 / 18, how: '48 Gbps × 16/18' },
  { name: 'DisplayPort 1.2', cap: 21.6 * 0.8, how: '21.6 Gbps × 8/10' },
  { name: 'DisplayPort 1.4', cap: 32.4 * 0.8, how: '32.4 Gbps × 8/10' },
  { name: 'DisplayPort 2.1 (UHBR20)', cap: 80 * 128 / 132, how: '80 Gbps × 128/132' },
]
const need = computed(() => {
  const m = modes[mode.value]!
  return ((m.w * m.h * hz.value * bpc.value * 3) / 1e9) * (blank.value ? 1.12 : 1)
})
</script>

<template>
  <figure class="not-prose my-8 rounded-xl border border-line bg-soft p-4 sm:p-6">
    <div class="grid gap-3 text-sm sm:grid-cols-3">
      <label class="grid gap-1"><span class="text-xs text-mute">ความละเอียด</span>
        <select v-model.number="mode" class="rounded-md border border-line bg-paper px-2 py-1.5"><option v-for="(m, i) in modes" :key="i" :value="i">{{ m.label }} ({{ m.w }}×{{ m.h }})</option></select>
      </label>
      <label class="grid gap-1"><span class="text-xs text-mute">อัตรารีเฟรช (Hz)</span>
        <select v-model.number="hz" class="rounded-md border border-line bg-paper px-2 py-1.5"><option v-for="h in hzOpts" :key="h" :value="h">{{ h }} Hz</option></select>
      </label>
      <label class="grid gap-1"><span class="text-xs text-mute">ความลึกสีต่อช่อง</span>
        <select v-model.number="bpc" class="rounded-md border border-line bg-paper px-2 py-1.5"><option :value="8">8 บิต (24 บิต/พิกเซล)</option><option :value="10">10 บิต HDR (30 บิต/พิกเซล)</option></select>
      </label>
    </div>
    <label class="mt-2 flex items-center gap-2 text-xs"><input v-model="blank" type="checkbox" class="accent-current" /> บวกช่วง blanking โดยประมาณ ~12% (ค่าประมาณ ขึ้นกับ timing จริง)</label>

    <p class="mt-4 rounded-lg border border-line bg-paper p-3 text-sm" aria-live="polite">
      ต้องการ ≈ <b class="font-mono">{{ need.toFixed(1) }} Gbps</b>
      <span class="block font-mono text-xs text-mute">{{ modes[mode]!.w }} × {{ modes[mode]!.h }} × {{ hz }} × {{ bpc * 3 }} บิต{{ blank ? ' × 1.12' : '' }}</span>
    </p>
    <ul class="mt-3 grid gap-1.5 text-sm">
      <li v-for="l in links" :key="l.name" class="grid grid-cols-[1fr_auto] items-center gap-2 rounded-md border px-3 py-1.5" :class="l.cap >= need ? 'border-ink bg-paper' : 'border-line text-mute'">
        <span>{{ l.name }} <span class="font-mono text-xs text-mute">({{ l.how }} = {{ l.cap.toFixed(1) }} Gbps)</span></span>
        <b>{{ l.cap >= need ? '✓ พอ' : '✗ ไม่พอ' }}</b>
      </li>
    </ul>
    <p class="mt-3 text-xs text-mute">ถ้าไม่พอ ระบบจะลดสี (chroma subsampling 4:2:0), ลดรีเฟรช หรือใช้การบีบอัด DSC (Display Stream Compression) ซึ่งบีบแบบแทบไม่เห็นความต่าง ผลลัพธ์จริงขึ้นกับอุปกรณ์ทั้งสองฝั่งและสาย</p>
  </figure>
</template>
