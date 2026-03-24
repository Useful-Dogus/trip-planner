import fs from 'fs/promises'
import path from 'path'
import type { TripItem } from '@/types'

const DATA_FILE = path.join(process.cwd(), 'data', 'items.json')
const TEMP_FILE = DATA_FILE + '.tmp'

export async function readItems(): Promise<TripItem[]> {
  try {
    const content = await fs.readFile(DATA_FILE, 'utf-8')
    const data = JSON.parse(content)
    return data.items ?? []
  } catch {
    return []
  }
}

export async function writeItems(items: TripItem[]): Promise<void> {
  const content = JSON.stringify({ items }, null, 2)
  await fs.writeFile(TEMP_FILE, content, 'utf-8')
  await fs.rename(TEMP_FILE, DATA_FILE)
}
