// lib/lesson-content.ts
// Loads lesson content HTML files from disk. Server-side only.

import fs from 'fs'
import path from 'path'

/**
 * Read a lesson's content HTML by slug. Returns null if the file doesn't exist
 * (so unwritten lessons fail gracefully). Called from server components only.
 */
export function getLessonContentHtml(slug: string): string | null {
  const filePath = path.join(process.cwd(), 'content', 'lessons', `${slug}.html`)
  if (!fs.existsSync(filePath)) return null
  return fs.readFileSync(filePath, 'utf-8')
}