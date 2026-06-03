import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Report, ReportType } from '../types'
import { generateReports } from '../data/generateReports'

const STORAGE_KEY = 'living-lot-reports-v1'
const DEVICE_KEY = 'living-lot-device-id'

function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_KEY)
  if (!id) {
    id = 'me-' + Math.random().toString(36).slice(2, 9)
    localStorage.setItem(DEVICE_KEY, id)
  }
  return id
}

function loadReports(): Report[] {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw) {
    try {
      return JSON.parse(raw) as Report[]
    } catch {
      /* fallthrough */
    }
  }
  const seeded = generateReports(500)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded))
  return seeded
}

interface StoreValue {
  reports: Report[]
  deviceId: string
  addReport: (input: { zoneId: string; type: ReportType; note: string }) => void
  resetData: () => void
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [reports, setReports] = useState<Report[]>(() => loadReports())
  const deviceId = useMemo(() => getDeviceId(), [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports))
  }, [reports])

  const value: StoreValue = {
    reports,
    deviceId,
    addReport: ({ zoneId, type, note }) => {
      const r: Report = {
        id: 'u' + Date.now().toString(36),
        zoneId,
        type,
        note,
        createdAt: new Date().toISOString(),
        deviceId,
      }
      setReports((prev) => [...prev, r])
    },
    resetData: () => {
      const seeded = generateReports(500)
      setReports(seeded)
    },
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
