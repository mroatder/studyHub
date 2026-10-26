# Stackup

แพลตฟอร์มเรียน IT และ Cyber Security ภาษาไทย เน้นสื่อโต้ตอบที่ให้ผู้เรียนลองปรับค่าและดูผลทันที สร้างด้วย Nuxt 4 และ TypeScript

เนื้อหาชุดแรกเรียบเรียงจากหลักสูตร *Fundamental IT Skills* ของ [roadmap.sh](https://roadmap.sh) เป็นภาษาไทย รวม 5 โมดูล 25 บทเรียน

![หน้าบทเรียน](docs/screenshots/lesson.png)

<table>
  <tr>
    <td width="50%"><img src="docs/screenshots/seq-diagram-dark.png" alt="แผนภาพลำดับข้อความ (โหมดมืด)"><br><sub><b>Sequence diagram</b> เล่นทีละขั้น แสดงการตัดสินใจส่งตรงหรือผ่านเกตเวย์</sub></td>
    <td width="50%"><img src="docs/screenshots/subnet-calc.png" alt="เครื่องคิดแบ่งซับเน็ต"><br><sub><b>Subnet calculator</b> ปรับจำนวนบิตที่ยืม ตารางซับเน็ตเปลี่ยนตามทันที</sub></td>
  </tr>
</table>

![Roadmap ตำแหน่ง Cyber Security](docs/screenshots/roadmap.png)

---

## ภาพรวม

| | |
|---|---|
| เนื้อหา | 5 โมดูล 25 บทเรียน ครอบคลุมฮาร์ดแวร์ ระบบปฏิบัติการ ไฟล์และสิทธิ์ เครือข่าย และความปลอดภัยเบื้องต้น |
| สื่อโต้ตอบ | Vue component ที่เขียนเอง 70+ ตัว (เครื่องคิด, ตัวจำลอง, แผนภาพเคลื่อนไหว, เทอร์มินัลจำลอง) |
| Roadmap | หน้าแผนที่ตำแหน่งงาน เชื่อมแต่ละหัวข้อเข้ากับบทเรียนที่มีในเว็บ |
| การแสดงผล | โหมดสว่าง/มืด, responsive, เคารพ `prefers-reduced-motion` |

## เนื้อหา

| โมดูล | หัวข้อ |
|---|---|
| 1. ฮาร์ดแวร์และระบบปฏิบัติการ | ชิ้นส่วนคอมพิวเตอร์, ชนิดการเชื่อมต่อ, ติดตั้ง Windows และ Linux, GUI และ CLI |
| 2. การจัดการไฟล์และแก้ปัญหา | CRUD, สิทธิ์ไฟล์ (permissions/ACL), ระเบียบวิธีแก้ปัญหา, คำสั่งวินิจฉัยบน Windows และ Linux |
| 3. พื้นฐานเครือข่าย | OSI, โปรโตคอล, พอร์ต, IP สาธารณะ/ส่วนตัว, ซับเน็ตและ CIDR |
| 4. เครือข่ายขั้นสูง | loopback/gateway, DHCP/DNS/NAT, routing/switching/VLAN/DMZ, ping/traceroute/nslookup, Wireshark |
| 5. ตัวตนและความปลอดภัย | Authentication vs Authorization, MFA/SSO, CIA Triad, TLS, OS hardening |

แต่ละบทมีโครงเดียวกัน: วัตถุประสงค์การเรียนรู้ → อุปมา → เนื้อหาพร้อมสื่อโต้ตอบ → มุมมองด้าน Security → ตารางวิเคราะห์ปัญหา IT Support → ศัพท์สำคัญ (อังกฤษ / คำอ่าน / ความหมาย) → คำถามตรวจความเข้าใจพร้อมเฉลย → สรุป → ลิงก์ต้นทาง

## สื่อโต้ตอบ

| หมวด | ตัวอย่าง |
|---|---|
| ฮาร์ดแวร์ | วงจรการทำงานของ CPU, cache simulator, RAM/swap, โครงสร้าง SSD (NAND/FTL), เทียบ SATA กับ NVMe |
| ระบบปฏิบัติการ | ตัวจำลองการติดตั้ง, การจัดพาร์ทิชัน, inode, เทอร์มินัลจำลอง |
| สิทธิ์ไฟล์ | เครื่องคิด `rwx` ↔ ฐานแปด, umask, การตรวจสิทธิ์ตามพาธ, ลำดับ ACL ของ NTFS |
| เครือข่าย | sequence diagram ของ DNS/DHCP/TCP, เครื่องคิด subnet/CIDR, NAT, การเรียนรู้ MAC ของ switch, route lookup |
| ความปลอดภัย | hash, Diffie-Hellman, TOTP, ห่วงโซ่ใบรับรอง TLS, เทียบการดักฟังแบบเข้ารหัสและไม่เข้ารหัส |
| วิธีแก้ปัญหา | วงจรแก้ปัญหา 6 ขั้น, การหาจุดเสียของเครือข่าย (top-down / bottom-up / divide and conquer) |

ทุกสื่อมีปุ่มเล่น หยุด ทีละขั้น และรีเซ็ต ใช้ตัวควบคุมกลางร่วมกัน ([useStepper.ts](app/composables/useStepper.ts), [AnimControls.vue](app/components/AnimControls.vue))

## สถาปัตยกรรม

| ส่วน | เทคโนโลยี |
|---|---|
| Framework | Nuxt 4, Vue 3, TypeScript |
| เนื้อหา | Nuxt Content 3 (Markdown + MDC) |
| สไตล์ | Tailwind CSS 4, `@nuxtjs/color-mode`, `@nuxt/fonts` (IBM Plex Sans Thai) |
| ฐานข้อมูลและ Auth | Supabase (`@nuxtjs/supabase` ติดตั้งแล้ว ปิดไว้ รอเปิดใช้) |

```
content/
  <source>/<course>/<NN-module>/<NN-lesson>.md   บทเรียน (Markdown + MDC)
  <source>/<course>/_course.yml, _module.yml      ข้อมูลคอร์สและโมดูล
  roadmap/<slug>.yml                              แผนที่ตำแหน่งงาน 1 ไฟล์ต่อ 1 ตำแหน่ง
app/
  components/content/                             สื่อโต้ตอบที่เรียกจาก Markdown
  composables/                                    useCourse, useStepper
```

เนื้อหาเป็นไฟล์ Markdown ธรรมดา สื่อโต้ตอบเรียกด้วยไวยากรณ์ MDC โดยใส่เฉพาะข้อมูล เช่น

```md
::seq-diagram{:actors='[{"label":"Client"},{"label":"Server"}]' :messages='[{"from":0,"to":1,"label":"SYN"},{"from":1,"to":0,"label":"SYN-ACK"},{"from":0,"to":1,"label":"ACK"}]'}
::
```

## สถานะ

- เสร็จแล้ว: เนื้อหา 25 บท, สื่อโต้ตอบ, หน้า Roadmap, โหมดสว่าง/มืด
- ยังไม่ทำ: deploy, ระบบล็อกอิน, บันทึกความคืบหน้าและโน้ตต่อบท (วางแผนใช้ Supabase พร้อม Row Level Security)
- ยังไม่ได้ทดสอบ: การใช้งานสื่อโต้ตอบทุกตัวบนมือถือจริง
- เว็บตั้งค่า `noindex` เพราะตั้งใจใช้ส่วนตัว

แผนงานและความต้องการแบบละเอียดอยู่ใน [PROGRESS.md](PROGRESS.md) และ [REQUIREMENTS.md](REQUIREMENTS.md)

## เริ่มใช้งาน

ต้องใช้ Node.js

```bash
npm install --legacy-peer-deps
npm run dev -- --port 3100
```

```bash
npm run build       # build production
npm run typecheck   # ตรวจชนิดข้อมูล
```

บน Windows หากโหลดฟอนต์ Google ไม่ได้เพราะปัญหา certificate ให้ตั้ง `NODE_OPTIONS=--use-system-ca` ก่อนรัน

## หมายเหตุเรื่องลิขสิทธิ์เนื้อหา

บทเรียนเรียบเรียงใหม่ด้วยภาษาของผู้เขียน ไม่ได้คัดลอกข้อความจากต้นฉบับ แต่ละบทระบุลิงก์ต้นทาง ตัวเลขที่ไม่ได้มาจากต้นฉบับติดหมายเหตุว่าเป็นค่าประมาณ ยังไม่ได้กำหนดสัญญาอนุญาต (license) ของโปรเจกต์
