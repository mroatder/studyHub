# Stackup (เดิมชื่อ Study Hub) — คู่มือสำหรับ Claude Code

เว็บเรียนรู้ส่วนตัว (คนเดียว) เรียบเรียงบทเรียน IT / Cyber Security จากคอร์สอังกฤษเป็นภาษาไทย มีสื่อโต้ตอบ
ก่อนทำอะไรให้อ่านตามลำดับ: **[PROGRESS.md](PROGRESS.md)** (ทำถึงไหน/ต้องทำอะไรต่อ) → [REQUIREMENTS.md](REQUIREMENTS.md) (ความต้องการต้นฉบับ)

## คำสั่งที่ใช้บ่อย (Windows)

```bash
npm install --legacy-peer-deps          # npm ธรรมดาติดบั๊ก edgesOut ต้องใส่ flag นี้เสมอ
$env:NODE_OPTIONS="--use-system-ca"     # PowerShell: ต้องตั้งก่อน dev/build ไม่งั้นโหลดฟอนต์ Google ไม่ได้ (ติด certificate)
npm run dev -- --port 3100              # หรือ npx nuxt dev --port 3100
npm run build
npm run typecheck                       # ต้องผ่านทุกครั้งก่อนรายงานงานเสร็จ
```

- เพิ่มไฟล์ component ใหม่ตอน dev รันอยู่ → Tailwind ไม่ rescan สไตล์เพี้ยน **ต้องรีสตาร์ต dev server** (เปลี่ยน `content.config.ts` ก็เช่นกัน)
- Bash tool ของ Claude Code อาจ error กับสคริปต์ที่มี heredoc หลายอัน ให้ใช้เครื่องมือ Write/Edit สร้างไฟล์แทน

## สถาปัตยกรรม

- Nuxt 4 + TypeScript + Tailwind 4 + Nuxt Content 3 (MDC) + `@nuxtjs/color-mode` + `@nuxt/fonts`
- **โมดูล `@nuxtjs/supabase` ติดตั้งแล้วแต่ปิดไว้** ใน [nuxt.config.ts](nuxt.config.ts) (มี TODO) เพราะยังไม่มี key เปิดเมื่อทำขั้นที่ 2 (Auth)
- เนื้อหา: `content/<source>/<course>/<NN-module>/<NN-lesson>.md` + `_course.yml` + `_module.yml` (นิยามคอลเลกชันใน [content.config.ts](content.config.ts): `lessons`, `courses`, `modules`, `roadmaps`)
- path บทเรียนใน URL **มีเลขนำหน้า** เช่น `/roadmap-sh/fundamental-it-skills/01-computer-hardware-and-os/01-understanding-hardware-components`
- หน้า: `/` (คอร์ส), `/<source>/<course>` (ภาพรวมคอร์ส), `/<source>/<course>/<module>/<lesson>`, `/roadmap` และ `/roadmap/<slug>` (แผนที่ตำแหน่งงาน)
- เมนูซ้ายแบบ roadmap.sh: [CourseShell.vue](app/components/CourseShell.vue) + [CourseSidebar.vue](app/components/CourseSidebar.vue) อ่านข้อมูลจาก [useCourse.ts](app/composables/useCourse.ts) (`_module.yml` มีฟิลด์ `planned` = ชื่อบทที่ยังไม่ได้เขียน)
- Roadmap: ไฟล์ `content/roadmap/<slug>.yml` ต่อ 1 ตำแหน่ง (วิธีเพิ่มดูคอมเมนต์หัวไฟล์) หัวข้อมี `lesson: <path>` เมื่อเขียนบทแล้ว

## ดีไซน์ (ผู้ใช้อนุมัติแล้ว ห้ามเปลี่ยนโดยไม่ถาม)

- **minimal ขาว-ดำล้วน** ใช้โทเคน `paper / ink / mute / line / soft` ใน [main.css](app/assets/css/main.css) (สลับโหมดมืดด้วยตัวแปร ไม่ต้องใช้ `dark:`) ห้ามใช้สีสัน
- ฟอนต์ IBM Plex Sans Thai (Google Fonts) ทุกสื่อโต้ตอบต้องเคารพ `prefers-reduced-motion`, ใช้ได้บนมือถือ, มีปุ่มควบคุมตามข้อ 5.3 ของ REQUIREMENTS

## มาตรฐานการเขียนบทเรียน (ต้องทำตามทุกบท แบบ Lesson 1–2)

1. อ่านบทต้นฉบับผ่าน **Claude in Chrome** (แท็บใหม่ ผู้ใช้ล็อกอินไว้แล้ว) ถ้าเปิดไม่ได้ให้ผู้ใช้วางข้อความ/ภาพหน้าจอ
2. **ละเอียดแบบอาจารย์มหาวิทยาลัย:** ครอบคลุมทุกหัวข้อของต้นฉบับ อธิบายกลไกภายใน เสริมเองเมื่อต้นฉบับตื้น **เรียบเรียงใหม่ ห้ามคัดลอกประโยค** (repo เป็น **public**)
3. **ทุกแนวคิดหลักต้องมีภาพ/สื่อโต้ตอบเฉพาะเรื่อง** (จำลองทีละขั้น, ให้กดลองเอง, เทียบข้างใน, แผนผังกดดูรายละเอียด) ไม่ใช่แค่การ์ดข้อความ ถ้าไม่มี component เหมาะ ให้สร้างใหม่ใน `app/components/content/` (SVG/CSS)
4. โครงบท: วัตถุประสงค์การเรียนรู้ → TL;DR → อุปมาชีวิตจริง → เนื้อหาหลัก + สื่อ → มุมมอง Security → ตัวอย่างวิเคราะห์ปัญหา IT Support (ตาราง) → ศัพท์สำคัญ (ตาราง English / คำอ่าน-คำไทย / ความหมาย) → ตรวจความเข้าใจ (`::reveal` พร้อมเฉลย) → สรุป → ลิงก์ต้นทาง
5. ภาษา: ไทยง่ายๆ ประโยคสั้น คงศัพท์เทคนิคอังกฤษในวงเล็บเสมอ เช่น "หน่วยความจำ (RAM)"
6. ตัวเลขที่ไม่ได้มาจากต้นฉบับ (เช่น ความเร็ว ns/µs) ต้องติดหมายเหตุว่าเป็นค่าประมาณ
7. frontmatter ตามข้อ 6.1 ของ REQUIREMENTS: `title, titleEn, module, lesson, sourceUrl, summary, tags, createdAt`
8. หลังเขียนบท: ลบชื่อบทนั้นออกจาก `planned` ใน `_module.yml`, ใส่ `lesson:` ในหัวข้อที่ตรงกันใน `content/roadmap/*.yml`, รัน dev เปิดดูในเบราว์เซอร์ว่า **ทุกสื่อทำงานจริง**, รัน `npm run build` + `npm run typecheck`, สรุปให้ผู้ใช้ แล้วรอยืนยันก่อน commit/push

## Component สื่อการสอนที่มีแล้ว (ใช้ใน Markdown แบบ MDC `::ชื่อ-kebab-case{...}` ... `::`)

กลาง: `step-diagram`, `flow-animation`, `layer-stack`, `compare-cards`, `reveal` (คำถามกดดูเฉลย)
ของบทฮาร์ดแวร์ (ใช้ซ้ำได้ถ้าเหมาะ): `cpu-cycle`, `latency-scale`, `ram-swap`, `drive-internals`, `motherboard-diagram`, `psu-flow`, `cpu-vs-gpu`, `internal-cables`, `sata-vs-nvme`, `port-gallery`, `transfer-race`, `multi-monitor`
ของบทติดตั้ง OS: `install-planner`, `disk-layout`, `fs-lab`, `install-flow`, `post-install-order` (Windows), `linux-mounts`, `ufw-lockout`
**`terminal-sim{title="..." prompt="..." :commands='[{"cmd","out","note"}]'}`** เทอร์มินัลจำลองใช้ซ้ำได้ทุกบทที่มีคำสั่ง: ใน `out` ใช้ `⏎` แทนการขึ้นบรรทัดใหม่ (MDC กลืน `\n`), ใช้ `⧵` แทน `\` (MDC กลืน backslash แม้เขียน `\\` หรือ `\`), ห้ามมีเครื่องหมาย `'` และ `"` ใน JSON
ของบท CRUD: `fs-ops-lab` (คำสั่งไฟล์กระทบรายการไดเรกทอรี/บล็อกดิสก์อย่างไร ก่อน-หลัง), `redirect-lab` (`>` เทียบ `>>`), `crud-map{:groups='[...]'}` (ตารางเทียบคำสั่งแยกแท็บ ใช้ `⧵` แทน `\`)
ของบท GUI/CLI: `path-navigator` (กดเลือกตำแหน่งปัจจุบัน+ปลายทางในต้นไม้ แสดง absolute/relative path สลับ Linux/Windows)
การควบคุมกลางอยู่ที่ [useStepper.ts](app/composables/useStepper.ts) และ [AnimControls.vue](app/components/AnimControls.vue)

## การเลือกโมเดลเพื่อประหยัด token (ผู้ใช้ขอให้ทำ)

หลัก: งานที่ผิดแล้วแก้ยากหรือต้องออกแบบ → โมเดลแรง; งานตามขั้นตอนตายตัวที่ตรวจผลง่าย → โมเดลเล็ก
Claude เป็นคนเลือกโมเดลให้ subagent (พารามิเตอร์ `model` ของ Agent tool) แล้วบอกผู้ใช้สั้นๆ ว่าใช้ตัวไหนกับงานไหน ส่วนโมเดลของ session หลักผู้ใช้สลับเองด้วย `/model`

| งาน | โมเดล |
|---|---|
| อ่านบทต้นฉบับจาก roadmap.sh แล้วเขียนโน้ตลงไฟล์ (ต้องดึงครบทุกหัวข้อ + คำถามท้ายบท ไม่ใช่สรุปสั้น) | haiku |
| รัน `typecheck` / `build` แล้วรายงานเฉพาะ error | haiku |
| แก้ไฟล์ config เล็กๆ (`_module.yml`, roadmap yml, PROGRESS.md) | haiku |
| เขียนเนื้อหาบท (ไทย ลึกแบบอาจารย์) | sonnet |
| เขียนสื่อที่ใช้ component กลางเดิม (ใส่แค่ข้อมูล) | sonnet |
| ตรวจความถูกต้องทางเทคนิคของบทที่เสร็จ | sonnet ขึ้นไป |
| ออกแบบสื่อใหม่ / รีแฟกเตอร์ component กลาง / บั๊กหาสาเหตุยาก | โมเดลหลัก |
| งานความปลอดภัย (Auth, RLS, ตรวจ secret ก่อน push) | โมเดลหลัก |

- subagent ที่เปิด roadmap.sh ต้องทำตามกฎ "อ่านอย่างเดียว ห้ามกดปุ่ม" ด้านล่างเช่นกัน
- ตารางเป็นการประเมินยังไม่ได้วัดจริง (ทดลองกับบทที่ 4) ถ้าโมเดลเล็กทำงานตกคุณภาพตรงไหน ให้ย้ายงานนั้นขึ้นระดับแล้วแก้ตารางนี้
- ประหยัดอีกทาง: ตรวจสื่อในเบราว์เซอร์ด้วย `javascript_tool` แบบข้อความ ถ่ายภาพหน้าจอเฉพาะสื่อใหม่ชิ้นเดียว และไม่อ่านบทเก่าทั้งไฟล์เพื่อดูรูปแบบ (ใช้โครงบทใน "มาตรฐานการเขียนบทเรียน")

## ข้อควรระวังกับผู้ใช้และบริการภายนอก

- **roadmap.sh:** อ่านอย่างเดียว ห้ามกด Continue / Mark complete / ปุ่มที่เปลี่ยนสถานะการเรียน การเปิด URL บทที่ยังไม่เคยเรียนอาจทำให้ขึ้น "Completed" ให้แจ้งผู้ใช้ก่อนเปิดบทที่ยังไม่เคยเรียน
- ห้าม commit `.env` หรือ secret (repo public) ห้ามใส่ service_role key ใน repo เด็ดขาด
- commit/push เมื่อผู้ใช้ยืนยันเท่านั้น (ผู้ใช้เป็นเจ้าของ repo `mroatder/studyHub`, สาขา `main`)
- ตอบผู้ใช้เป็นภาษาไทย สรุปสั้นและตรงไปตรงมา ระบุสิ่งที่ยังไม่ได้ทดสอบให้ชัด
