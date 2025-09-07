'use client'

import { useState, useEffect, useCallback } from 'react'
import { Responsive, WidthProvider } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-grid-layout/css/responsive.css'
import { KPICard } from '@/components/dashboard/KPICard'
import { TrendChart } from '@/components/dashboard/TrendChart'
import { OverdueTable } from '@/components/dashboard/OverdueTable'
import { DashboardFilters } from '@/components/dashboard/DashboardFilters'
import { Button } from '@/components/ui/button'
import { Save, AlertTriangle } from 'lucide-react'

const ResponsiveGridLayout = WidthProvider(Responsive)

interface DashboardMetrics {
  launchPct: number
  signedCount: number
  launchedCount: number
  missedPct: number
  missedCount: number
  avgIntegrationToPilotDays: number
  trend: any[]
}

interface OverdueDeal {
  deal_id: number
  deal_title: string
  org_name: string
  plan_date: string
  fact_launch_date?: string
  overdue_days: number
  owner_name: string
  pd_link: string
}

const defaultLayout = [
  { i: 'launch-pct', x: 0, y: 0, w: 4, h: 2 },
  { i: 'missed-pct', x: 4, y: 0, w: 4, h: 2 },
  { i: 'avg-days', x: 8, y: 0, w: 4, h: 2 },
  { i: 'trend', x: 0, y: 2, w: 8, h: 6 },
  { i: 'overdue', x: 8, y: 2, w: 4, h: 6 }
]

export default function PMDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [overdueDeals, setOverdueDeals] = useState<OverdueDeal[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [layout, setLayout] = useState(defaultLayout)
  const [lastSyncTime, setLastSyncTime] = useState<string>()
  const [incompleteHistory, setIncompleteHistory] = useState(false)

  // Default filters
  const [filters, setFilters] = useState({
    fromDate: '2025-01-01',
    toDate: new Date().toISOString().split('T')[0],
    ownerName: 'Евгения Попова'
  })

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams({
        from: filters.fromDate,
        to: filters.toDate,
        ownerName: filters.ownerName
      })

      const [metricsRes, overdueRes] = await Promise.all([
        fetch(`/api/pm/metrics?${params}`),
        fetch(`/api/pm/overdue?${params}`)
      ])

      if (metricsRes.ok) {
        const metricsData = await metricsRes.json()
        setMetrics(metricsData)
      }

      if (overdueRes.ok) {
        const overdueData = await overdueRes.json()
        setOverdueDeals(overdueData)
      }
    } catch (error) {
      console.error('Failed to fetch metrics:', error)
    } finally {
      setLoading(false)
    }
  }, [filters])

  const fetchLayout = useCallback(async () => {
    try {
      const response = await fetch('/api/dashboard-layouts/pm')
      if (response.ok) {
        const data = await response.json()
        if (data.layout) {
          setLayout(data.layout)
        }
      }
    } catch (error) {
      console.error('Failed to fetch layout:', error)
    }
  }, [])

  const saveLayout = async () => {
    try {
      const response = await fetch('/api/dashboard-layouts/pm', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ layout })
      })

      if (response.ok) {
        setIsEditing(false)
      }
    } catch (error) {
      console.error('Failed to save layout:', error)
    }
  }

  const handleSync = async () => {
    try {
      const response = await fetch('/api/sync/pipedrive?mode=inc', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SYNC_SECRET || 'dev-secret'}`
        }
      })

      if (response.ok) {
        await fetchMetrics()
        setLastSyncTime(new Date().toISOString())
      }
    } catch (error) {
      console.error('Sync failed:', error)
    }
  }

  const onLayoutChange = (newLayout: any) => {
    setLayout(newLayout)
  }

  useEffect(() => {
    fetchMetrics()
    fetchLayout()
  }, [fetchMetrics, fetchLayout])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка дашборда...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardFilters
        fromDate={filters.fromDate}
        toDate={filters.toDate}
        ownerName={filters.ownerName}
        onFiltersChange={setFilters}
        onSync={handleSync}
        isEditing={isEditing}
        onEditToggle={setIsEditing}
        lastSyncTime={lastSyncTime}
      />

      {incompleteHistory && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mx-4 mt-4">
          <div className="flex">
            <AlertTriangle className="w-5 h-5 text-yellow-400 mr-2" />
            <p className="text-sm text-yellow-700">
              Данные частично реконструированы
            </p>
          </div>
        </div>
      )}

      <div className="p-4">
        <ResponsiveGridLayout
          className="layout"
          layouts={{ lg: layout }}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={100}
          isDraggable={isEditing}
          isResizable={isEditing}
          onLayoutChange={onLayoutChange}
          margin={[16, 16]}
        >
          <div key="launch-pct">
            <KPICard
              title="Запуск проектов"
              value={`${metrics?.launchPct || 0}%`}
              subtitle={`${metrics?.launchedCount || 0} из ${metrics?.signedCount || 0} подписанных`}
              className="h-full"
            />
          </div>

          <div key="missed-pct">
            <KPICard
              title="Пропущенные сроки"
              value={`${metrics?.missedPct || 0}%`}
              subtitle={`${metrics?.missedCount || 0} из ${metrics?.signedCount || 0} подписанных`}
              trend={metrics?.missedPct > 0 ? 'down' : 'neutral'}
              className="h-full"
            />
          </div>

          <div key="avg-days">
            <KPICard
              title="Среднее время Integration→Pilot"
              value={`${metrics?.avgIntegrationToPilotDays || 0} дней`}
              subtitle="календарные дни"
              className="h-full"
            />
          </div>

          <div key="trend">
            <TrendChart
              data={metrics?.trend || []}
              className="h-full"
            />
          </div>

          <div key="overdue">
            <OverdueTable
              data={overdueDeals}
              className="h-full"
            />
          </div>
        </ResponsiveGridLayout>

        {isEditing && (
          <div className="fixed bottom-4 right-4 z-50">
            <Button onClick={saveLayout} className="shadow-lg">
              <Save className="w-4 h-4 mr-2" />
              Сохранить раскладку
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

