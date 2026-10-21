# Stackup (เดิมชื่อ Study Hub) — Checklist ความคืบหน้า

> ไฟล์นี้ไว้ส่งต่องานระหว่าง session (เช่น token หมด หรือเปิด session ใหม่) **อัปเดตทุกครั้งที่ทำงานเสร็จหนึ่งส่วน**
> อัปเดตล่าสุด: 2026-10-21 · อ่านคู่กับ [CLAUDE.md](CLAUDE.md) และ [REQUIREMENTS.md](REQUIREMENTS.md)

## 🚦 สถานะตอนนี้ (อ่านก่อน)

- **โหมดโปรเจกต์ (ผู้ใช้ตกลง 2026-10-21):** ไม่ขยายเว็บให้ครอบคลุมทั้ง roadmap.sh แล้ว เพราะหัวข้ออื่นนอกจาก Fundamental IT Skills เป็นบทเรียน+แล็บที่ต้องลงมือทำ ซึ่งเว็บทำแทนไม่ได้ ผู้ใช้เรียนต่อบน roadmap.sh เป็นหลัก
  เว็บนี้เป็นคู่มืออ่านภาษาไทยของ 25 บทที่มีแล้ว และ **เขียนบทเสริมเฉพาะหัวข้อที่ผู้ใช้ขอ** (หัวข้อที่อ่านอังกฤษแล้วไม่เข้าใจ) ตามมาตรฐานใน CLAUDE.md ไม่ต้องเขียนล่วงหน้าทั้งคอร์ส
- ล่าสุด commit/push แล้วถึง `8f5e5a3` (บท 3–8 รื้อเป็นระดับ MIT, สื่อ HypothesisLab/ShellParse, สคริปต์ backup) · build/typecheck ไม่ได้รันก่อน commit รอบนั้น
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
| 1 Computer Hardware and Operating Systems | 1 Understanding Computer Hardware Components | ✅ **รื้อใหม่ระดับ MIT แล้ว (2026-10-20)** สื่อใหม่ 5: bit-lab, amdahl-lab, cache-sim, page-translate, nand-ftl + สื่อเดิม · **รอผู้ใช้ตรวจ / ยังไม่ได้เปิดกดทดสอบในเบราว์เซอร์** |
| | 2 Connection Types and Their Functions | ✅ **รื้อใหม่ระดับ MIT แล้ว (2026-10-20)** สื่อใหม่ 2: `link-rate` (อัตราดิบ×การเข้ารหัส→MB/s+เวลาโอน), `display-bandwidth` + seq-diagram 5 (NVMe, USB enumeration, USB-C PD, Ethernet auto-negotiation), step-diagram, terminal-sim 2, reveal 11 + สื่อเดิม · **รอผู้ใช้ตรวจ / ยังไม่ได้เปิดกดทดสอบในเบราว์เซอร์ (ต้องรีสตาร์ต dev server)** |
| | 3 Installing and Configuring Windows Operating Systems | ✅ เสร็จ (สื่อโต้ตอบ 5 ชิ้น: install-planner, disk-layout, fs-lab, install-flow, post-install-order) |
| | 4 Installing and Configuring Linux Operating Systems | ✅ เสร็จ (สื่อใหม่ 3: linux-mounts, terminal-sim, ufw-lockout + ใช้ layer-stack/compare-cards/step-diagram) ทดลองให้ haiku อ่านต้นฉบับ → `notes/lesson-04.md` ได้ผลดี ครบ |
| | 5 Navigating Operating Systems Using GUI and CLI | ✅ เสร็จ (สื่อใหม่ 1: path-navigator + terminal-sim 3 ชุด, step-diagram 2, compare-cards, layer-stack, reveal 6) โน้ตต้นฉบับ `notes/lesson-05.md` · **รอผู้ใช้ตรวจ** · `terminal-sim` รองรับ `⧵` แทน `\` แล้ว |
| 2 File Management and Troubleshooting | 1 Performing CRUD Operations on Files in Windows and Linux | ✅ เสร็จ (สื่อใหม่ 3: fs-ops-lab, redirect-lab, crud-map + terminal-sim 5 ชุด, step-diagram, compare-cards, reveal 7) โน้ต `notes/lesson-06.md` (โน้ต Haiku มีข้อผิดพลาดหลายจุด เช่น `-Backup` ที่ไม่มีจริง ตรวจและเขียนแก้ในบทแล้ว) · **รอผู้ใช้ตรวจ** |
| | 2 Understanding File and Directory Permissions | ✅ เสร็จ (สื่อใหม่ 4: perm-calc, umask-lab, perm-trace, acl-eval + terminal-sim 4, step-diagram, compare-cards, reveal 9) โน้ตจาก Gemini `notes/lesson-07.md` · **รื้อใหม่ระดับ MIT/Harvard แล้ว (2026-10-21)**: เพิ่ม first principles (access control matrix→9 บิต vs ACL), กลไก open()/credential/inode mode, umask AND-NOT (คำนวณด้วย node), setuid ruid/euid, Windows token/ACE walk/access mask (Modify ต่าง Full Control 3 บิต), ข้อจำกัด DAC, ตารางแมปการโจมตี, errno แยก EACCES/EPERM/EROFS, reveal ใหม่ 8, แลบอ่านอย่างเดียว · `seq-diagram` ใหม่ 4 (open() ตามพาธ, credential ถ่ายสำเนาตอนล็อกอิน, setuid passwd, Windows access check) ไม่มี component ใหม่ · typecheck ผ่าน · **รอผู้ใช้ตรวจ / ยังไม่ได้กดทดสอบสื่อในเบราว์เซอร์** |
| | 3 OS-Independent Troubleshooting Methodology | ✅ เสร็จ (สื่อใหม่ 2: trouble-loop, fault-finder + terminal-sim 2, step-diagram, compare-cards 2, reveal 8) โน้ตจาก Gemini `notes/lesson-08.md` · **รื้อใหม่ระดับ MIT/Harvard แล้ว (2026-10-21)**: first principles (การแก้ปัญหา=ค้นหา, สมมุติฐานพิสูจน์ผิดได้, แมปวิธีวิทยาศาสตร์↔6 ขั้น), ข้อจำกัดแบบจำลอง (กู้บริการก่อนหาสาเหตุราก, 5 Whys), ต้นทุนคาดหวังของลำดับทดสอบ E=Σp·ΣC เรียงตาม p÷c (5.35 vs 15.50 นาที), binary search ⌈log₂n⌉ + bisect การเปลี่ยนแปลง, Bayes (10%→33.3%/1.4%), ปัญหาเป็นๆ หายๆ (p=0.1 ต้อง 29 ครั้ง), 2ᵏ−1 กรณี, MTTR→availability, ตารางความย้อนกลับได้ของ rollback, ตารางแมปการโจมตี + order of volatility (RFC 3227), ตาราง IT Support แยกด้วยการทดสอบ, แลบอ่านอย่างเดียว · ตัวเลขคำนวณด้วย node · สื่อใหม่ 1: `hypothesis-lab` (เรียงลำดับทดสอบ เทียบค่าคาดหวัง + สุ่มปัญหา + รัน 2,000 รอบ) + `seq-diagram` 3 (escalate, วงจรเต็ม, ยืนยันตัวตนกัน vishing) + `step-diagram` 2 · reveal 14 · **รอผู้ใช้ตรวจ / ยังไม่ได้กดทดสอบสื่อในเบราว์เซอร์ (ต้องรีสตาร์ต dev server เพราะเพิ่ม component)** |
| | 4 Windows Troubleshooting Commands | ✅ เสร็จ (สื่อใหม่ 2: ipconfig-reader, taskkill-builder + terminal-sim 6, step-diagram, compare-cards, reveal 8) โน้ต `notes/lesson-09.md` · **รอผู้ใช้ตรวจ / ยังไม่ได้เปิดดูในเบราว์เซอร์** | · **รื้อใหม่ระดับ MIT/Harvard แล้ว (2026-10-21)**: DHCP DORA + T1/T2 (50%/87.5%) + APIPA (ชนกัน 100 เครื่อง 7.3%), DNS cache/TTL/hosts, WM_CLOSE เทียบ TerminateProcess, sfc/component store/DISM, NTFS journal+dirty bit+5 stage ของ chkdsk, เวลา /r (1TB HDD ~2.31 ชม. ค่าประมาณ), ตารางวินิจฉัยเชิงกลไก, แมป ATT&CK, แลบอ่านอย่างเดียว · seq-diagram ใหม่ 4 · reveal 15 · ไม่มี component ใหม่ · typecheck ผ่าน · **ยังไม่ได้กดทดสอบสื่อในเบราว์เซอร์**
| | 5 Linux Troubleshooting Commands | ✅ เสร็จ (สื่อใหม่ 4: free-reader, inode-lab, signal-lab, load-gauge + terminal-sim 6, step-diagram, compare-cards, reveal 8) โน้ต `notes/lesson-10.md` · **รอผู้ใช้ตรวจ / ยังไม่ได้เปิดดูในเบราว์เซอร์ (ต้องรีสตาร์ต dev server ก่อนเพราะเพิ่ม component ใหม่)** · จบโมดูล 2 · roadmap หัวข้อ "Common Commands" ยังไม่ใส่ `lesson:` (มี 2 บท Windows/Linux) | · **รื้อใหม่ระดับ MIT/Harvard แล้ว (2026-10-21)**: /proc เป็นแหล่งข้อมูล, systemd (start/enable=symlink, start-limit), สถานะโปรเซส R/S/D/Z, สัญญาณ+รหัสออก 143/137, page cache→swap→OOM killer, load average แบบเอ็กซ์โปเนนเชียล (4 งาน 60 วิ = 2.53/0.72/0.26), inode 100GiB=6,553,600 (ไฟล์เล็กกิน 25GiB), df≠du (lsof +L1), journald priority, tail -F, bind/EADDRINUSE, refused เทียบ timeout, ephemeral port 28,232, แมป ATT&CK · seq-diagram ใหม่ 5 · reveal 14 · ตัวเลขคำนวณด้วย node · ไม่มี component ใหม่ · typecheck ผ่าน · **ยังไม่ได้กดทดสอบสื่อในเบราว์เซอร์**
| 3 Core Computer Networking | 1 Understanding the OSI Model and Network Layers | ✅ เสร็จ **ระดับ MIT/Harvard** (สื่อใหม่ 1: encap-lab + layer-stack, step-diagram, compare-cards, terminal-sim, reveal 10) โน้ต `notes/lesson-11.md` · **รอผู้ใช้ตรวจ / ยังไม่ได้เปิดกดทดสอบในเบราว์เซอร์** |
| | 2 Exploring Common Network Protocols and Their Uses | ✅ เสร็จ **ระดับ MIT/Harvard** เน้นแอนิเมชัน: สื่อใหม่ 3 (`seq-diagram` ใช้ซ้ำ 10 ครั้ง = แผนภาพลำดับข้อความเคลื่อนไหวใส่แค่ข้อมูล, `tcp-transfer`, `sniff-view`) + terminal-sim 5, compare-cards, reveal 20 · โน้ต `notes/lesson-12.md` · **รอผู้ใช้ตรวจ / ยังไม่ได้เปิดกดทดสอบในเบราว์เซอร์** |
| | 3 Identifying Common Ports and Their Associated Services | ✅ เสร็จ **ระดับ MIT/Harvard** (สื่อใหม่ 1: `port-demux` จำลองเคอร์เนลส่งแพ็กเก็ตเข้า socket/4-tuple/refused-timeout/bind ซ้ำ + `seq-diagram` 4, compare-cards, terminal-sim 2, reveal 11) โน้ต `notes/lesson-13.md` · **รอผู้ใช้ตรวจ / ยังไม่ได้เปิดกดทดสอบในเบราว์เซอร์ (ต้องรีสตาร์ต dev server เพราะเพิ่ม component)** |
| | 4 Differentiating Between Public and Private IP Addresses | ✅ เสร็จ **ระดับ MIT/Harvard** (สื่อใหม่ 2: `ip-classify` จำแนกช่วงพิเศษด้วย prefix จริง, `nat-lab` จำลอง PAT/ตารางแปลง/port forward + `seq-diagram` 3, compare-cards, terminal-sim 2, reveal 12) โน้ต `notes/lesson-14.md` · **รอผู้ใช้ตรวจ / ยังไม่ได้เปิดกดทดสอบในเบราว์เซอร์ (ต้องรีสตาร์ต dev server)** |
| | 5 Understanding Subnetting, Subnet Masks, and CIDR Notation | ✅ เสร็จ **ระดับ MIT/Harvard** (สื่อใหม่ 2: `subnet-calc` AND ระดับบิต+ตัดสินใจส่งตรง/เกตเวย์, `subnet-split` ยืมบิต; + `seq-diagram`, step-diagram, terminal-sim 2, reveal 12) โน้ต `notes/lesson-15.md` · **รอผู้ใช้ตรวจ / ยังไม่ได้เปิดกดทดสอบในเบราว์เซอร์** · จบโมดูล 3 · typecheck+build ผ่าน · roadmap ใส่ `lesson:` แล้ว (Public vs Private, Basics of Subnetting)
| 4 Advanced Network Configuration and Analysis | 1 Configuring Localhost, Loopback, and Default Gateways | ✅ เสร็จ **ระดับ MIT/Harvard** (สื่อใหม่ 1: `route-lookup` จำลองตารางเส้นทาง/longest prefix match/ไม่มี default route + `seq-diagram` 2, step-diagram, compare-cards, terminal-sim 2, reveal 10) โน้ต `notes/lesson-16.md` (แก้คำกล่าวอ้างของโน้ตว่า loopback ข้ามสแต็ก TCP/IP ทั้งหมด เป็น: ข้ามเฉพาะการ์ด/สาย) · **รอผู้ใช้ตรวจ / ยังไม่ได้เปิดกดทดสอบในเบราว์เซอร์ (ต้องรีสตาร์ต dev server)** · typecheck+build ผ่าน · roadmap ใส่ `lesson:` ที่ "IP Terminology" · `_module.yml` โมดูล 4 เพิ่ม `planned` บท 17–20 |
| | 2 Implementing DHCP, DNS, and NAT in Network Environments | ✅ เสร็จ **ระดับ MIT/Harvard** (สื่อใหม่ 2: `dhcp-lease` เส้นเวลา T1/T2/หมดอายุ, `dns-resolver` จำลอง root→TLD→authoritative + แคช/NXDOMAIN + `seq-diagram` 4 (DORA, relay, DNS trace, ภาพรวมเสียบสาย→เปิดเว็บ), terminal-sim 2, reveal 14) โน้ต `notes/lesson-17.md` (NAT/PAT ย่อ ลิงก์ไปบท 14 ไม่ซ้ำ เน้น conntrack/SNAT/DNAT/hairpin/split-horizon) · **รอผู้ใช้ตรวจ / SSR render ผ่านแล้วแต่ยังไม่ได้กดทดสอบสื่อในเบราว์เซอร์ (ต้องรีสตาร์ต dev server)** · typecheck+build ผ่าน · roadmap ใส่ `lesson:` ที่ "Network Services" |
| | 3 Exploring Routing, Switching, VLANs, and DMZs | ✅ เสร็จ **ระดับ MIT/Harvard** (สื่อใหม่ 2: `switch-lab` จำลองสวิตช์ เรียนรู้ MAC/flood/ส่งตรง/VLAN/MAC flooding, `dmz-rules` เทียบเว็บใน LAN กับ DMZ ด้วยกฎ first-match + กรณีถูกยึด; `seq-diagram` 4 (switch learning, router hop, 802.1Q trunk, router-on-a-stick), step-diagram, compare-cards 2, terminal-sim 2 (Linux/Cisco), reveal ~20) โน้ต `notes/lesson-18.md` · **รอผู้ใช้ตรวจ / ยังไม่ได้กดทดสอบสื่อในเบราว์เซอร์ (ต้องรีสตาร์ต dev server เพราะเพิ่ม component)** · roadmap ใส่ `lesson:` ที่ "Understand the Terminology" และ "Perimeter vs DMZ vs Segmentation" |
| | 4 Utilizing Ping, Traceroute, and Nslookup | ✅ เสร็จ **ระดับ MIT/Harvard** (สื่อใหม่ 1: `diag-ladder` รันบันไดวินิจฉัยกับ 7 โจทย์สุ่ม + ทายสาเหตุ; `seq-diagram` 2 (ping+ARP, traceroute TTL), terminal-sim 2 (Linux/Windows), reveal 10) โน้ต `notes/lesson-19.md` (เพิ่ม: RTT ต่ำสุดตามฟิสิกส์คำนวณด้วย node, อ่าน `*` ใน traceroute, nslookup ไม่ผ่าน resolver ของระบบ, PMTUD กับการบล็อก ICMP) · **รอผู้ใช้ตรวจ / ยังไม่ได้กดทดสอบสื่อในเบราว์เซอร์ (ต้องรีสตาร์ต dev server)** · roadmap ใส่ `lesson:` ที่ "Troubleshooting Tools" · ลำดับ: บทนี้ = ไฟล์ 04 (บท 19), Wireshark = ไฟล์ 05 (บท 20) |
| | 5 Capturing and Analyzing Packets with Wireshark | ✅ เสร็จ **ระดับ MIT/Harvard** (สื่อใหม่ 1: `filter-lab` capture filter vs display filter + กับดัก `!=` สลับรุ่น Wireshark; `seq-diagram` 4 (เส้นทางเฟรมสู่ GUI, TCP handshake, SYN timeout/backoff), ถอด hex เฟรม SYN + ตรวจ checksum ด้วยมือ (คำนวณด้วย node), terminal-sim 1 (tcpdump/tshark), reveal 11) โน้ต `notes/lesson-20.md` (แก้: promiscuous บนสวิตช์ไม่พอ, `!=` ขึ้นกับรุ่น ≥3.6, ถอด TLS ด้วย SSLKEYLOGFILE ไม่ใช่ pre-master เฉยๆ) · **รอผู้ใช้ตรวจ / ยังไม่ได้กดทดสอบสื่อในเบราว์เซอร์ (ต้องรีสตาร์ต dev server)** · roadmap ใส่ `lesson:` ที่ "Tools for Incident Response and Discovery" · จบเนื้อหาโมดูล 4 ยกเว้นบท 19 |
| 5 Identity, Access, and Basic Security | 1 Differentiating Authentication from Authorization | ✅ เสร็จ **ระดับ MIT/Harvard** (สื่อใหม่ 1: `authz-gate` จำลองลำดับตรวจเซิร์ฟเวอร์ 401/403/200 + สวิตช์ช่องโหว่ IDOR; `seq-diagram` 2 (401→403, ssh→Permission denied), step-diagram, compare-cards DAC/MAC/RBAC/ABAC, terminal-sim 2, ตาราง entropy คำนวณด้วย node, reveal 10) โน้ต `notes/lesson-21.md` (แก้: กุญแจส่วนตัว ssh ไม่ถูกส่งออก, SELinux ส่วนใหญ่คือ type enforcement ไม่ใช่ Confidential/Secret) · **รอผู้ใช้ตรวจ / ยังไม่ได้กดทดสอบสื่อในเบราว์เซอร์ (ต้องรีสตาร์ต dev server)** · roadmap ใส่ `lesson:` ที่ "Authentication vs Authorization" · `_module.yml` โมดูล 5 เพิ่ม `planned` บท 22–25 |
| | 2 Implementing Multi-Factor Authentication and SSO | ✅ เสร็จ **ระดับ MIT/Harvard** (สื่อใหม่ 2: `totp-lab` คำนวณ HMAC-SHA1 TOTP จริงด้วย WebCrypto + จำลองนาฬิกาเพี้ยน/หน้าต่าง ±1, `mfa-attack-matrix` เมทริกซ์วิธี MFA × การโจมตี 6 แบบ; `seq-diagram` 3 (TOTP, FIDO2, OIDC code flow), compare-cards 2, terminal-sim 1, ตัวอย่างถอด RFC vector (T=59 → 287082) และเลขความน่าจะเป็นคำนวณด้วย node, reveal 13) โน้ต `notes/lesson-22.md` (แก้: โน้ตว่าปิดบัญชีที่ IdP แล้วเสียสิทธิ์ทันที ไม่จริงเสมอ — session ของ SP อยู่ต่อได้; HMAC-SHA1 ยังปลอดภัย; OAuth≠OIDC; server ต้องเก็บ secret TOTP แบบกู้ได้) · **รอผู้ใช้ตรวจ / ยังไม่ได้กดทดสอบสื่อในเบราว์เซอร์ (ต้องรีสตาร์ต dev server)** · roadmap ใส่ `lesson:` ที่ "MFA & 2FA" · `_module.yml` เหลือ `planned` บท 23–25 |
| | 3 Understanding the CIA Triad in Information Security | ✅ เสร็จ **ระดับ MIT/Harvard** (สื่อใหม่ 2: `hash-lab` SHA-256/HMAC จริงด้วย WebCrypto + ผลถล่ม + แฮชเปล่า vs HMAC กับผู้โจมตีที่คำนวณแฮชใหม่, `avail-calc` จำนวนเก้า/อนุกรม/ขนาน/ล้มเหลวไม่อิสระ/MTBF-MTTR; `seq-diagram` 2 (ลายเซ็นดิจิทัล, SYN flood), compare-cards, terminal-sim 1, ตาราง STRIDE, trade-off/fail-open, reveal 13) ตัวเลขคำนวณด้วย node (แฮช 129/256 บิต, 26.25 ชม./ปี, 1.6 นาที/ปี, SYN ≈16/วิ) โน้ต `notes/lesson-23.md` (เพิ่ม/แก้: แรนซัมแวร์กระทบ I และมัก C ไม่ใช่ A อย่างเดียว, แฮชเปล่ากันการแก้โดยตั้งใจไม่ได้, RAID ไม่ใช่ backup, สูตรความพร้อมเป็นเพดาน) · **รอผู้ใช้ตรวจ / SSR render ผ่าน, typecheck+build ผ่าน แต่ยังไม่ได้กดทดสอบสื่อในเบราว์เซอร์ (ต้องรีสตาร์ต dev server เพราะเพิ่ม component)** · roadmap ใส่ `lesson:` ที่ "Understand CIA Triad" · `_module.yml` เหลือ `planned` บท 24–25 |
| | 4 Exploring SSL and TLS Basics for Secure Communication | ✅ เสร็จ **ระดับ MIT/Harvard** (สื่อใหม่ 2: `dh-lab` Diffie-Hellman คำนวณจริงด้วย BigInt + ผู้ดักฟังไล่เดา + สวิตช์ MITM/เซ็นยืนยัน, `cert-chain` ตรวจใบรับรองทีละข้อ 7 สถานการณ์; `seq-diagram` handshake TLS 1.3, terminal-sim `openssl s_client` 4 คำสั่ง, ตาราง RTT 1.2/1.3/0-RTT, forward secrecy, แมปการโจมตี, ตาราง IT Support 9 แถว, reveal 10) ตัวเลขตรวจด้วย node (DH 23/5 → 8,19,2; RTT 4 vs 3 vs 2; 2¹²⁸ ≈ 1.1×10¹⁹ ปี) โน้ต `notes/lesson-24.md` (แก้ต้นฉบับ: TLS ไม่ให้ non-repudiation จริง, Heartbleed เป็นบั๊ก OpenSSL ไม่ใช่โปรโตคอล, DV ไม่ได้แปลว่าเว็บปลอดภัย) · **รอผู้ใช้ตรวจ / SSR render ผ่าน, typecheck+build ผ่าน แต่ยังไม่ได้กดทดสอบสื่อในเบราว์เซอร์ (ต้องรีสตาร์ต dev server เพราะเพิ่ม component)** · roadmap ใส่ `lesson:` ที่ "SSL and TLS Basics" · `_module.yml` เหลือ `planned` บท 25 |
| | 5 Applying Operating System Hardening Principles | ✅ เสร็จ **ระดับ MIT/Harvard** (สื่อใหม่ 1: `hardening-lab` กดมาตรการทีละข้อ เห็นพื้นผิวโจมตีลด + กับดักล็อกตัวเองออกของไฟร์วอลล์; `seq-diagram` 3 (SSH key, ดิสก์ไม่เข้ารหัส/เข้ารหัส), `step-diagram` 2, `terminal-sim` 2, `ufw-lockout` ใช้ซ้ำ, reveal 9; โน้ต `notes/lesson-25.md`) · **รอผู้ใช้ตรวจ** · **จบคอร์ส Fundamental IT Skills ครบ 25 บท** |

บทถัดๆ ไปทำตาม "มาตรฐานการเขียนบทเรียน" ใน [CLAUDE.md](CLAUDE.md) ข้อ 1–8
ทางเลือกอ่านต้นฉบับ: ให้ Gemini ทำโน้ตตาม `notes/gemini-reader.md` (ไฟล์ local ไม่ขึ้น repo มีรายการ 25 บท กฎห้ามกดปุ่ม และรูปแบบโน้ต) แล้วให้ Claude เขียนบทต่อจาก `notes/lesson-NN.md`
เมื่อเปิดอ่านโมดูลใหม่ แล้วรู้ชื่อบทย่อย → เพิ่มชื่อที่ `planned` ใน `_module.yml` ของโมดูลนั้น

### 🔁 งานรื้อบทเรียนให้ลึกระดับมหาวิทยาลัย (ผู้ใช้สั่ง 2026-10-20: รื้อทั้ง 10 บท ทำทีละบท เริ่มบท 1)
**กฎเพิ่ม (2026-10-20):** ทุกบทต้องเพิ่มคำอธิบายเป็นแอนิเมชันให้มากที่สุดในส่วนที่ทำได้ (บันทึกใน CLAUDE.md แล้ว) · แก้บั๊กแสดงผล `encap-lab` (แถบสัดส่วนเพี้ยน) แล้ว รอผู้ใช้ตรวจ
**อัปเดต:** ผู้ใช้ให้ **พักบท 2–10 ไว้ก่อน** ไปทำบท 11+ ด้วยมาตรฐาน MIT/Harvard (ดู CLAUDE.md หัวข้อใหม่) แล้วค่อยกลับมารื้อ
มาตรฐานใหม่ (แบบบท 1): เริ่มจากหลักการพื้นฐาน อธิบายกลไกภายใน มีสูตร/โจทย์คำนวณพร้อมเฉลย (reveal) ตัวเลขประมาณต้องติดหมายเหตุ มีสื่อโต้ตอบที่ให้ทดลองจนเห็นกลไก มีแบบฝึกหัดลงมือทำบนเครื่องจริง ตารางวินิจฉัย IT Support เชิงกลไก และ Security เชิงลึก
- [x] บท 1 · [x] บท 2 (รอผู้ใช้ตรวจ) · [ ] 3 · [ ] 4 · [ ] 5 · [ ] 6 · [ ] 7 · [ ] 8 · [ ] 9 · [ ] 10 (ถ้าผู้ใช้ OK ระดับบท 1 แล้วจึงทำบทถัดไป)

## 🗺️ Roadmap (แผนที่ตำแหน่งงาน)
- [x] `content/roadmap/cyber-security.yml` (7 กลุ่ม 90 หัวข้อ) ทุกหัวข้อมี `note` (คำอธิบายไทย 1 ประโยค เขียนเอง) และ `level` 1/2/3 (พื้นฐาน/แกนหลัก/เสริม ประเมินสำหรับสาย SOC)
- [x] หน้า `/roadmap/<slug>` เป็นแผนภาพแบบ roadmap.sh (`RoadmapMap.vue`, `RoadmapTopic.vue`): เส้นทึบแกนกลาง, เส้นประไปหัวข้อ/หัวข้อย่อย, กิ่งข้าง (ฝึกฝน/ใบรับรอง), กดหัวข้อเปิดแผงรายละเอียด, กรองตามระดับ
- **ตัดสินใจ (2026-10-20):** เนื้อหาหัวข้อใน roadmap แยกจากคอร์สหลัก ไม่ผูก `lesson:` กับบทเดิม (ตอนนี้ 0/90) เพิ่มทีหลังเมื่อเขียนเนื้อหาของหัวข้อนั้นโดยเฉพาะ · กล่องกลุ่ม "ทักษะ IT พื้นฐาน" กดเข้าคอร์สหลักได้ผ่าน `course:`
- roadmap.sh: แต่ละหัวข้อมีแค่แผงสั้นๆ + คอร์สย่อย AI สร้างตามสั่ง (ตื้น แบบทีละขั้น) ไม่เลียนแบบ · เว็บเราคงเป็นบทลึกเชิงอธิบาย เป้าหมายคือเวอร์ชันไทยไว้เรียนเอง
- [ ] เพิ่มคำอธิบายสั้นให้หัวข้อย่อย (children ~230 รายการ ต้องขยาย schema ให้ children มี note/ลิงก์)
- [ ] บทใหม่ตามแผน (รวมหัวข้อเล็กไว้บทเดียว ~12–15 บท): ไร้สาย → virtualization → เครื่องมือวินิจฉัย (nmap/tcpdump ฯลฯ) → logs/SIEM → แนวคิด security หลัก → Kerberos/LDAP/RADIUS → cryptography → การโจมตี/OWASP → incident response · งบจำกัด (Claude Pro) ทำทีละบทต่อแชต ข้อเสนอมาตรฐาน "Lite" (ครึ่งขนาด ใช้ component เดิม) ยังไม่ได้ใส่ใน CLAUDE.md รอผู้ใช้อนุมัติ
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
