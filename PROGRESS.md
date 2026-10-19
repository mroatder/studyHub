# Study Hub — Checklist ความคืบหน้า

> ไฟล์นี้ไว้ส่งต่องานระหว่าง session (เช่น token หมด หรือเปิด session ใหม่) **อัปเดตทุกครั้งที่ทำงานเสร็จหนึ่งส่วน**
> อัปเดตล่าสุด: 2026-10-19 · อ่านคู่กับ [CLAUDE.md](CLAUDE.md) และ [REQUIREMENTS.md](REQUIREMENTS.md)

## 🚦 สถานะตอนนี้ (อ่านก่อน)

- **งานที่ทำแล้วแต่ยังไม่ได้ commit/push:** ทั้งหมดหลัง commit `43e08ff` (บท 1–2, สื่อโต้ตอบ, ดีไซน์ minimal, เมนูซ้าย, แผนที่ roadmap, CLAUDE.md/PROGRESS.md) → รอผู้ใช้ยืนยันก่อน commit + push
  ตรวจด้วย `git status` และ `git log --oneline`
- `npm run build` และ `npm run typecheck` ผ่านล่าสุดก่อนเขียนไฟล์ docs นี้
- GitHub: https://github.com/mroatder/studyHub (public, สาขา `main`) · **ยังไม่ได้เชื่อม Vercel/Supabase**
- ผู้ใช้เลือกลำดับ: ทำหน้าเว็บให้พร้อมก่อน แล้วค่อยเชื่อม Vercel/Auth

## ✅ Checklist ตามลำดับพัฒนา (REQUIREMENTS ข้อ 10)

### ขั้น 1 — Setup
- [x] Nuxt 4 + Tailwind 4 + Nuxt Content + fonts + color-mode, robots.txt, noindex
- [x] git init, push ขึ้น GitHub (`mroatder/studyHub`)
- [ ] เชื่อม **Vercel** (ผู้ใช้ต้องทำเอง: Add New Project → import repo → Deploy; ไม่ต้องตั้ง `NODE_OPTIONS`)

### ขั้น 2 — Auth (ยังไม่เริ่ม)
- [ ] ผู้ใช้สร้างโปรเจกต์ **Supabase** แล้วใส่ `NUXT_PUBLIC_SUPABASE_URL` / `NUXT_PUBLIC_SUPABASE_KEY` ใน `.env` และ Vercel (ห้ามส่ง key ในแชท / ห้าม commit)
- [ ] เปิดโมดูล `@nuxtjs/supabase` กลับใน `nuxt.config.ts` (มี TODO) ปิดการสมัครสมาชิกใหม่ใน Supabase
- [ ] หน้า Login + middleware ป้องกัน **ทุก route** + endpoint ของ Nuxt Content (`/__nuxt_content/...`) ต้องไม่เปิดสาธารณะ
- [ ] ทดสอบว่าไม่ล็อกอินแล้วเข้าไม่ได้ทั้งหน้าเว็บและ API

### ขั้น 3 — เนื้อหา + หน้าเว็บ + สื่อ (ส่วนใหญ่เสร็จ)
- [x] โครงสร้าง content, หน้าแรก / คอร์ส / บทเรียน, TOC, ปุ่มก่อนหน้า/ถัดไป
- [x] component กลาง 4 ตัว + `reveal` + ตัวควบคุม `useStepper` (เคารพ reduced-motion)
- [x] ดีไซน์ minimal ขาวดำ โหมดมืด/สว่าง
- [x] เมนูซ้ายแบบ roadmap.sh (ภาพรวมคอร์ส + 5 โมดูลพับได้ + บทที่ยังไม่เขียนเป็น "เร็วๆ นี้")
- [x] หน้า Roadmap หลายตำแหน่ง (`/roadmap`, `/roadmap/<slug>`) ข้อมูลใน `content/roadmap/*.yml`
- [ ] ตรวจบนมือถือจริง (เมนูซ้ายแบบลิ้นชัก, สื่อโต้ตอบทุกตัว) — **ยังไม่เคยทดสอบบน viewport มือถือ**
- [ ] ทดสอบโหมดสว่างทุกหน้า (ที่ผ่านมาดูโหมดมืดเป็นหลัก)

### ขั้น 4 — Progress + Notes (ยังไม่เริ่ม ต้องทำหลังขั้น 2)
- [ ] migration SQL ใน repo: `lesson_progress`, `notes` + RLS ตามข้อ 6.2 (เฉพาะแถวของ `auth.uid()`)
- [ ] สถานะบท (ยังไม่เริ่ม/กำลังเรียน/จบ) เปลี่ยนเป็น "กำลังเรียน" อัตโนมัติเมื่อเปิด + ปุ่ม "เรียนจบแล้ว"
- [ ] ปุ่ม "เรียนต่อจากครั้งล่าสุด" หน้าแรก, % คอร์ส/Module, เครื่องหมายถูกในเมนูซ้าย, สถานะต่อหัวข้อใน Roadmap
- [ ] กล่องโน้ตต่อบท (บันทึกอัตโนมัติ debounce + "บันทึกแล้ว") + หน้ารวมโน้ตจัดกลุ่มตามคอร์ส

### ขั้น 5 — ปุ่ม "ถาม Claude" (ยังไม่เริ่ม ไม่ต้องพึ่งฐานข้อมูล ทำก่อนขั้น 2 ได้)
- [ ] ปุ่มในหน้าบทเรียน + กล่องพิมพ์คำถาม
- [ ] เลือกข้อความแล้วมีปุ่มลอย "ถามเรื่องนี้"
- [ ] สร้าง prompt (ชื่อคอร์ส/บท, summary, ข้อความที่เลือก, คำถาม, สั่งให้อธิบายไทยง่ายๆ คงศัพท์อังกฤษ) → คัดลอกลง clipboard + เปิด claude.ai แท็บใหม่

### ขั้น 6 — คำสั่ง `/new-lesson` + CLAUDE.md
- [x] `CLAUDE.md` มี style guide และมาตรฐานบทเรียนแล้ว
- [ ] สร้าง project command/skill `.claude/commands/new-lesson.md` (ขั้นตอนตามข้อ 7 ของ REQUIREMENTS + มาตรฐานใน CLAUDE.md)
- [x] ทดสอบสร้างบทแรกด้วยมือแล้ว (Lesson 1–2)

### ขั้น 7 — ตรวจบนมือถือจริง + เก็บรายละเอียด
- [ ] ทดสอบมือถือจริง · [ ] ตรวจ endpoint/ความปลอดภัย · [ ] ตรวจลิขสิทธิ์ (ไม่มีข้อความต้นฉบับ) · [ ] ตรวจใบอนุญาตเนื้อหา roadmap.sh ก่อนเผยแพร่ roadmap แบบ public

## 📚 เนื้อหาบทเรียน (คอร์ส Fundamental IT Skills, 25 บท, 5 โมดูล)

แหล่ง: `https://roadmap.sh/ai/course/fundamental-it-skills-1787945504624?module=<m>&lesson=<l>` (ต้องล็อกอิน)

| โมดูล | บท | สถานะ |
|---|---|---|
| 1 Computer Hardware and Operating Systems | 1 Understanding Computer Hardware Components | ✅ เสร็จ (สื่อโต้ตอบ 7 ชิ้น) |
| | 2 Connection Types and Their Functions | ✅ เสร็จ (สื่อโต้ตอบ 5 ชิ้น) |
| | 3 Installing and Configuring Windows Operating Systems | ✅ เสร็จ (สื่อโต้ตอบ 5 ชิ้น: install-planner, disk-layout, fs-lab, install-flow, post-install-order) |
| | 4 Installing and Configuring Linux Operating Systems | ✅ เสร็จ (สื่อใหม่ 3: linux-mounts, terminal-sim, ufw-lockout + ใช้ layer-stack/compare-cards/step-diagram) ทดลองให้ haiku อ่านต้นฉบับ → `notes/lesson-04.md` ได้ผลดี ครบ |
| | 5 Navigating Operating Systems Using GUI and CLI | ✅ เสร็จ (สื่อใหม่ 1: path-navigator + terminal-sim 3 ชุด, step-diagram 2, compare-cards, layer-stack, reveal 6) โน้ตต้นฉบับ `notes/lesson-05.md` · **รอผู้ใช้ตรวจ** · `terminal-sim` รองรับ `⧵` แทน `\` แล้ว |
| 2 File Management and Troubleshooting | 1 Performing CRUD Operations on Files in Windows and Linux | ✅ เสร็จ (สื่อใหม่ 3: fs-ops-lab, redirect-lab, crud-map + terminal-sim 5 ชุด, step-diagram, compare-cards, reveal 7) โน้ต `notes/lesson-06.md` (โน้ต Haiku มีข้อผิดพลาดหลายจุด เช่น `-Backup` ที่ไม่มีจริง ตรวจและเขียนแก้ในบทแล้ว) · **รอผู้ใช้ตรวจ** |
| | 2 Understanding File and Directory Permissions | ⏭️ **บทถัดไป** (ยังต้องขออนุญาตเปิดอ่านจาก roadmap.sh) |
| | 3 OS-Independent Troubleshooting Methodology / 4 Windows Troubleshooting Commands / 5 Linux Troubleshooting Commands | ⬜ (อยู่ใน `planned` แล้ว) |
| 3 Core Computer Networking | ⬜ | ⬜ |
| 4 Advanced Network Configuration and Analysis | ⬜ | ⬜ |
| 5 Identity, Access, and Basic Security | ⬜ | ⬜ |

บทถัดๆ ไปทำตาม "มาตรฐานการเขียนบทเรียน" ใน [CLAUDE.md](CLAUDE.md) ข้อ 1–8
เมื่อเปิดอ่านโมดูลใหม่ แล้วรู้ชื่อบทย่อย → เพิ่มชื่อที่ `planned` ใน `_module.yml` ของโมดูลนั้น

## 🗺️ Roadmap (แผนที่ตำแหน่งงาน)
- [x] `content/roadmap/cyber-security.yml` (7 กลุ่ม ~90 หัวข้อ แปลชื่อไทยเอง) มีบทเรียน 2 หัวข้อ
- [ ] เพิ่มตำแหน่งอื่นเมื่อผู้ใช้ต้องการ (คัดลอกไฟล์เป็น `<slug>.yml` ตามคอมเมนต์หัวไฟล์)
- [ ] เมื่อเขียนบทใหม่ ใส่ `lesson:` ในหัวข้อที่ตรงกัน

## ⚠️ ข้อควรรู้ / ปัญหาที่เจอมาแล้ว
- `npm install` ต้องมี `--legacy-peer-deps`; ก่อน dev/build ใน PowerShell ตั้ง `$env:NODE_OPTIONS="--use-system-ca"`
- เพิ่ม component/แก้ `content.config.ts` ระหว่าง dev ต้องรีสตาร์ต dev server
- ปิดโมดูล Supabase ไว้ ถ้าเปิดโดยไม่มี key ทุกหน้า error 500
- บทเรียนอ้างลิงก์ต้นทางที่ผูกกับบัญชีผู้ใช้ (`...-1787945504624`) และ repo เป็น public — ถ้าไม่อยากให้เห็น ให้เปลี่ยนเป็นลิงก์คอร์สกลาง
- ตัวเลขประสิทธิภาพในสื่อ (ns/µs/MB/s) เป็นค่าประมาณจากผู้เขียน ไม่ได้มาจากต้นฉบับ
- Roadmap.sh: เปิด URL บทที่ยังไม่เคยเรียนอาจขึ้น "Completed" อัตโนมัติ (ยังไม่ยืนยัน) — แจ้งผู้ใช้ก่อนเปิดบทใหม่

## ▶️ วิธีเริ่ม session ใหม่ (คัดลอกข้อความนี้ไปวางได้)

> อ่าน CLAUDE.md และ PROGRESS.md ในโปรเจกต์ แล้วสรุปให้ฟังว่าทำถึงไหน จากนั้นทำ "<งานถัดไป>" ตามมาตรฐานใน CLAUDE.md

ตัวอย่าง `<งานถัดไป>`:
- `บทที่ 3 (Installing and Configuring Windows) ของคอร์ส Fundamental IT Skills` — ผู้ใช้ต้องเปิดแท็บ roadmap.sh ที่ล็อกอินไว้ และเปิด Claude in Chrome
- `ขั้นที่ 5 ปุ่มถาม Claude`
- `ขั้นที่ 2 Auth` — ต้องมี key Supabase ใน `.env` ก่อน
- `commit + push งานที่ค้าง` (ตรวจ `git status` ก่อน)

## 🧭 ลำดับงานที่แนะนำต่อไป
1. commit + push งานที่ค้าง (ถ้าผู้ใช้ยืนยัน)
2. บทที่ 3–5 ของโมดูล 1 ให้ครบโมดูล
3. ขั้น 5 (ปุ่มถาม Claude) — ไม่ต้องพึ่งบริการภายนอก
4. ผู้ใช้เตรียม Supabase + Vercel → ขั้น 2 (Auth) → ขั้น 4 (Progress/Notes)
5. สร้าง `/new-lesson` และตรวจบนมือถือจริง
