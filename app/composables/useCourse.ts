// โหลดคอร์สพร้อม Module และ Lesson ทั้งหมด (เรียงตามชื่อโฟลเดอร์/ไฟล์ที่ขึ้นต้นด้วยเลขลำดับ)
export async function useCourse(source: string, course: string) {
  const base = `${source}/${course}`
  return await useAsyncData(`course:${base}`, async () => {
    const courseData = await queryCollection('courses').where('stem', '=', `${base}/_course`).first()
    if (!courseData) return null

    const lessons = await queryCollection('lessons')
      .where('stem', 'LIKE', `${base}/%`)
      .select('path', 'stem', 'title', 'titleEn', 'summary', 'module', 'lesson')
      .order('stem', 'ASC')
      .all()

    const modules = await Promise.all(
      courseData.modules.map(async (folder) => {
        const meta = await queryCollection('modules').where('stem', '=', `${base}/${folder}/_module`).first()
        return {
          folder,
          title: meta?.title ?? folder,
          titleTh: meta?.titleTh ?? folder,
          description: meta?.description,
          lessons: lessons.filter((l) => l.stem.startsWith(`${base}/${folder}/`)),
        }
      }),
    )

    return { course: courseData, modules, lessonCount: lessons.length }
  })
}
