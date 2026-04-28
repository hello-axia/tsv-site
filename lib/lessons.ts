import fs from 'fs'
import path from 'path'

export function getLessonHTML(unit: number, lessonNumber: number): string | null {
  const filePath = path.join(process.cwd(), 'content', 'lessons', `u${unit}-l${lessonNumber}.html`)
  if (!fs.existsSync(filePath)) return null
  return fs.readFileSync(filePath, 'utf-8')
}