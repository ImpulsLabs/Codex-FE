import type { ReactNode } from 'react'

export type NavItem = {
  label: string
  path: string
}

export type StatItem = {
  label: string
  value: string
  sub: string
}

export type QuickActionItem = {
  label: string
  path: string
  icon: () => ReactNode
}
