// สร้างสำเนาเว็บแบบสถิตไว้เปิดเองบนเครื่อง (ใช้ได้แม้ Vercel/บริการโฮสต์ใดๆ หยุด)
// วิธีใช้: npm run backup  →  ได้โฟลเดอร์ backup/stackup-YYYY-MM-DD แล้วเปิดด้วย: npx serve backup/stackup-YYYY-MM-DD
import { spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs'

const env = { ...process.env, NODE_OPTIONS: `${process.env.NODE_OPTIONS ?? ''} --use-system-ca`.trim() }
const gen = spawnSync('npx', ['nuxt', 'generate'], { stdio: 'inherit', env, shell: true })
if (gen.status !== 0) {
  console.error('สร้างไฟล์สถิตไม่สำเร็จ (nuxt generate ล้มเหลว)')
  process.exit(gen.status ?? 1)
}
if (!existsSync('.output/public')) {
  console.error('ไม่พบ .output/public หลัง generate')
  process.exit(1)
}

const day = new Date().toISOString().slice(0, 10)
const dest = `backup/stackup-${day}`
mkdirSync('backup', { recursive: true })
rmSync(dest, { recursive: true, force: true })
cpSync('.output/public', dest, { recursive: true })
console.log(`\nสำรองเสร็จ: ${dest}\nเปิดดูด้วย: npx serve ${dest}`)
