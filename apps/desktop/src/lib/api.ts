import type {
  AgentSummary,
  AppSession,
  DailySummary,
  DayRange,
  ProjectUsage,
  Space,
  SpaceUsage,
  SpaceWithProjects,
} from '@record/types'
import { getVersion as tauriGetVersion } from '@tauri-apps/api/app'
import { invoke } from '@tauri-apps/api/core'
import {
  disable as disableAutostart,
  enable as enableAutostart,
  isEnabled as isAutostartEnabled,
} from '@tauri-apps/plugin-autostart'

function localDateStr(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function localDayRange(date: Date): DayRange {
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  end.setHours(0, 0, 0, 0)
  return {
    date: localDateStr(date),
    start: start.toISOString(),
    end: end.toISOString(),
  }
}

export { localDateStr }

export async function getSessions(start: Date, end: Date): Promise<AppSession[]> {
  return invoke<AppSession[]>('get_sessions', {
    start: start.toISOString(),
    end: end.toISOString(),
  })
}

export async function getDailySummary(date: Date): Promise<DailySummary> {
  return invoke<DailySummary>('get_daily_summary', {
    day: localDayRange(date),
  })
}

const iconCache = new Map<string, string | null>()

export async function getAppIcon(bundleId: string): Promise<string | null> {
  if (iconCache.has(bundleId)) return iconCache.get(bundleId)!
  const result = await invoke<string | null>('get_app_icon', { bundleId })
  iconCache.set(bundleId, result)
  return result
}

export async function getAutoStartEnabled(): Promise<boolean> {
  return isAutostartEnabled()
}

export async function setAutoStart(enabled: boolean): Promise<void> {
  if (enabled) {
    await enableAutostart()
  } else {
    await disableAutostart()
  }
}

export async function getAppSessions(date: Date, bundleId: string): Promise<AppSession[]> {
  return invoke<AppSession[]>('get_app_sessions', {
    day: localDayRange(date),
    bundleId,
  })
}

export async function getAppAverages(date: Date, bundleId: string): Promise<[number, number]> {
  const end = new Date(date)
  end.setHours(0, 0, 0, 0)
  const weekStart = new Date(end)
  weekStart.setDate(weekStart.getDate() - 6)
  const monthStart = new Date(end)
  monthStart.setDate(monthStart.getDate() - 29)
  return invoke<[number, number]>('get_app_averages', {
    bundleId,
    weekStart: localDayRange(weekStart).start,
    monthStart: localDayRange(monthStart).start,
    end: end.toISOString(),
  })
}

export async function addExclusion(
  bundleId: string,
  appName: string,
  expiresAt?: string,
): Promise<void> {
  await invoke('add_exclusion', { bundleId, appName, expiresAt: expiresAt ?? null })
}

export async function removeExclusion(bundleId: string): Promise<void> {
  await invoke('remove_exclusion', { bundleId })
}

export async function getExclusions(): Promise<[string, string, string | null][]> {
  return invoke('get_exclusions')
}

export async function getAppProjects(date: Date, bundleId: string): Promise<ProjectUsage[]> {
  return invoke<ProjectUsage[]>('get_app_projects', {
    day: localDayRange(date),
    bundleId,
  })
}

export async function getDailyProjects(date: Date): Promise<ProjectUsage[]> {
  return invoke<ProjectUsage[]>('get_daily_projects', {
    day: localDayRange(date),
  })
}

export async function createSpace(
  name: string,
  color: string,
  initials: string,
  emoji?: string,
): Promise<Space> {
  return invoke<Space>('create_space', { name, color, initials, emoji: emoji ?? null })
}

export async function updateSpace(
  id: number,
  name: string,
  color: string,
  initials: string,
  emoji?: string,
): Promise<void> {
  await invoke('update_space', { id, name, color, initials, emoji: emoji ?? null })
}

export async function deleteSpace(id: number): Promise<void> {
  await invoke('delete_space', { id })
}

export async function getSpaces(): Promise<SpaceWithProjects[]> {
  return invoke<SpaceWithProjects[]>('get_spaces')
}

export async function addProjectToSpace(spaceId: number, project: string): Promise<void> {
  await invoke('add_project_to_space', { spaceId, project })
}

export async function removeProjectFromSpace(spaceId: number, project: string): Promise<void> {
  await invoke('remove_project_from_space', { spaceId, project })
}

export async function getAllProjects(): Promise<[string, number][]> {
  return invoke<[string, number][]>('get_all_projects')
}

export async function addProjectExclusion(project: string, expiresAt?: string): Promise<void> {
  await invoke('add_project_exclusion', { project, expiresAt: expiresAt ?? null })
}

export async function removeProjectExclusion(project: string): Promise<void> {
  await invoke('remove_project_exclusion', { project })
}

export async function getProjectExclusions(): Promise<[string, string | null][]> {
  return invoke('get_project_exclusions')
}

export async function getDailySpaces(date: Date): Promise<SpaceUsage[]> {
  return invoke<SpaceUsage[]>('get_daily_spaces', {
    day: localDayRange(date),
  })
}

export async function getDailyAgentSummary(date: Date): Promise<AgentSummary> {
  return invoke<AgentSummary>('get_daily_agent_summary', {
    day: localDayRange(date),
  })
}

export async function exportSpaceCsv(
  spaceId: number,
  startDate: string,
  endDate: string,
  filePath: string,
): Promise<void> {
  const days: DayRange[] = []
  const current = new Date(`${startDate}T00:00:00`)
  const last = new Date(`${endDate}T00:00:00`)
  if (Number.isNaN(current.getTime()) || Number.isNaN(last.getTime())) {
    throw new Error('Invalid export date')
  }
  while (current <= last) {
    days.push(localDayRange(current))
    current.setDate(current.getDate() + 1)
    current.setHours(0, 0, 0, 0)
  }
  await invoke('export_space_csv', {
    spaceId,
    days,
    filePath,
  })
}

export async function backfillProjects(): Promise<number> {
  return invoke<number>('backfill_projects')
}

export async function checkAccessibility(): Promise<boolean> {
  return invoke<boolean>('check_accessibility')
}

export async function requestAccessibility(): Promise<boolean> {
  return invoke<boolean>('request_accessibility')
}

export async function getVersion(): Promise<string> {
  return tauriGetVersion()
}
