<script setup lang="ts">
// ตารางเทียบคำสั่ง CRUD แยกแท็บตามการกระทำ ใช้ ⧵ แทน \ เพราะ MDC กลืน backslash
type Row = { what: string; ps: string; sh: string; cmd?: string; note: string }
type Group = { key: string; label: string; rows: Row[] }
const props = defineProps<{ groups: Group[] }>()

const bs = (s?: string) => (s ?? '').replaceAll('⧵', '\\')
const sel = ref(0)
const g = computed(() => props.groups[sel.value]!)
</script>

<template>
  <figure class="not-prose my-8 rounded-xl border border-line bg-soft p-4 sm:p-6">
    <div class="flex flex-wrap gap-2" role="tablist" aria-label="หมวดการกระทำ">
      <button v-for="(x, i) in groups" :key="x.key" type="button" role="tab" class="rounded-md border px-3 py-1.5 text-sm transition" :class="sel === i ? 'border-ink bg-ink text-paper' : 'border-line hover:border-ink'" :aria-selected="sel === i" @click="sel = i">{{ x.label }}</button>
    </div>
    <div class="mt-4 space-y-3" role="tabpanel">
      <div v-for="r in g.rows" :key="r.what" class="rounded-lg border border-line bg-paper p-3 text-sm">
        <p class="font-semibold">{{ r.what }}</p>
        <div class="mt-2 grid gap-2 md:grid-cols-2">
          <p class="rounded border border-line px-2 py-1.5 font-mono text-xs"><span class="mr-2 font-sans text-[11px] text-mute">PowerShell</span>{{ bs(r.ps) }}</p>
          <p class="rounded border border-line px-2 py-1.5 font-mono text-xs"><span class="mr-2 font-sans text-[11px] text-mute">Bash</span>{{ bs(r.sh) }}</p>
        </div>
        <p v-if="r.cmd" class="mt-2 font-mono text-xs text-mute"><span class="mr-2 font-sans text-[11px]">cmd.exe</span>{{ bs(r.cmd) }}</p>
        <p class="mt-2 text-xs leading-6 text-ink/80">{{ r.note }}</p>
      </div>
    </div>
    <figcaption class="mt-3 text-sm text-mute">คำสั่ง PowerShell มีชื่อย่อ (alias) เช่น ni, gc, mi, cpi, ri และใน Windows มี alias ชื่อเดียวกับ Linux (ls, cat, cp, mv, rm) ด้วย แต่แฟลกต่างกัน</figcaption>
  </figure>
</template>
