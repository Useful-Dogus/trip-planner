'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Input } from './Input'

export interface LocationCandidate {
  display: string
  lat: number
  lng: number
}

interface Props {
  label: string
  value: string
  onChange: (next: string) => void
  /** 후보 선택 시 좌표까지 전달. */
  onSelectCandidate?: (c: LocationCandidate) => void
  placeholder?: string
  hint?: string
  autoFocus?: boolean
  /** 디바운스 ms. 기본 300. */
  debounceMs?: number
  /** 최소 입력 길이. 기본 2. */
  minChars?: number
}

interface NominatimResult {
  display_name?: string
  lat?: string
  lon?: string
}

/**
 * Nominatim 기반 위치 자동완성 입력.
 * 입력 도중 후보를 노출해 "인식되는 표현" 가시화. 0건이면 명시적 안내.
 * 후보 선택은 선택사항 — 입력 자체는 자유 텍스트로 유지된다.
 */
export default function LocationAutocompleteInput({
  label,
  value,
  onChange,
  onSelectCandidate,
  placeholder,
  hint,
  autoFocus,
  debounceMs = 300,
  minChars = 2,
}: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [candidates, setCandidates] = useState<LocationCandidate[]>([])
  const [searched, setSearched] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const trimmed = useMemo(() => value.trim(), [value])

  useEffect(() => {
    if (!open) return
    if (trimmed.length < minChars) {
      setCandidates([])
      setSearched(false)
      return
    }
    const handle = window.setTimeout(async () => {
      abortRef.current?.abort()
      const ctrl = new AbortController()
      abortRef.current = ctrl
      setLoading(true)
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          trimmed,
        )}&format=json&limit=5&accept-language=ko`
        const res = await fetch(url, {
          signal: ctrl.signal,
          headers: { Accept: 'application/json' },
        })
        if (!res.ok) throw new Error('nominatim error')
        const data = (await res.json()) as NominatimResult[]
        const next: LocationCandidate[] = data
          .filter(
            (r) =>
              typeof r.display_name === 'string' &&
              typeof r.lat === 'string' &&
              typeof r.lon === 'string',
          )
          .map((r) => ({
            display: r.display_name as string,
            lat: parseFloat(r.lat as string),
            lng: parseFloat(r.lon as string),
          }))
        setCandidates(next)
        setSearched(true)
      } catch (e) {
        if ((e as Error).name !== 'AbortError') {
          setCandidates([])
          setSearched(true)
        }
      } finally {
        setLoading(false)
      }
    }, debounceMs)
    return () => window.clearTimeout(handle)
  }, [trimmed, open, debounceMs, minChars])

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const t = e.target as Node
      if (containerRef.current && !containerRef.current.contains(t)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  function pick(c: LocationCandidate) {
    onChange(c.display)
    onSelectCandidate?.(c)
    setOpen(false)
  }

  const showList = open && trimmed.length >= minChars
  const noResult = showList && !loading && searched && candidates.length === 0

  return (
    <div ref={containerRef} className="relative">
      <Input
        label={label}
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
          setSearched(false)
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        hint={hint}
        autoFocus={autoFocus}
        autoComplete="off"
      />
      {showList && (
        <div className="absolute z-30 mt-1 w-full rounded-lg border border-border bg-bg-elevated shadow-lg max-h-64 overflow-y-auto">
          {loading && (
            <p className="px-3 py-2 text-xs text-fg-subtle">후보 찾는 중…</p>
          )}
          {!loading && candidates.length > 0 && (
            <ul role="listbox">
              {candidates.map((c, i) => (
                <li key={`${c.lat},${c.lng},${i}`} role="option" aria-selected="false">
                  <button
                    type="button"
                    onClick={() => pick(c)}
                    className="w-full text-left px-3 py-2 text-sm text-fg hover:bg-bg-subtle focus:bg-bg-subtle focus:outline-none"
                  >
                    <span className="block truncate">{c.display}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {noResult && (
            <p className="px-3 py-2 text-xs text-warning-fg">
              인식되는 이름이 없어요. 그대로 진행해도 돼요.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
