import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { Category } from '@/types'
import { CATEGORY_META } from './itemOptions'

interface IconSvgOptions {
  size?: number
  color?: string
  strokeWidth?: number
}

const cache = new Map<string, string>()

export function categoryIconSvg(
  category: Category,
  opts: IconSvgOptions = {},
): string {
  const size = opts.size ?? 16
  const color = opts.color ?? 'currentColor'
  const strokeWidth = opts.strokeWidth ?? 2
  const key = `${category}:${size}:${color}:${strokeWidth}`
  const hit = cache.get(key)
  if (hit) return hit
  const { Icon } = CATEGORY_META[category]
  const svg = renderToStaticMarkup(
    createElement(Icon, { size, color, strokeWidth }),
  )
  cache.set(key, svg)
  return svg
}
