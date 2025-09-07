import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { RefreshCw } from 'lucide-react'

interface DashboardFiltersProps {
  fromDate: string
  toDate: string
  ownerName: string
  onFiltersChange: (filters: { fromDate: string; toDate: string; ownerName: string }) => void
  onSync: () => void
  isEditing: boolean
  onEditToggle: (editing: boolean) => void
  lastSyncTime?: string
}

export function DashboardFilters({
  fromDate,
  toDate,
  ownerName,
  onFiltersChange,
  onSync,
  isEditing,
  onEditToggle,
  lastSyncTime
}: DashboardFiltersProps) {
  const [localFromDate, setLocalFromDate] = useState(fromDate)
  const [localToDate, setLocalToDate] = useState(toDate)

  const handleApplyFilters = () => {
    onFiltersChange({
      fromDate: localFromDate,
      toDate: localToDate,
      ownerName
    })
  }

  const formatLastSync = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="bg-white border-b border-gray-200 p-4">
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
            <label className="text-sm font-medium text-gray-700">Период:</label>
            <div className="flex gap-2">
              <Input
                type="date"
                value={localFromDate}
                onChange={(e) => setLocalFromDate(e.target.value)}
                className="w-32"
              />
              <span className="text-gray-500 self-center">—</span>
              <Input
                type="date"
                value={localToDate}
                onChange={(e) => setLocalToDate(e.target.value)}
                className="w-32"
              />
            </div>
            <Button onClick={handleApplyFilters} size="sm">
              Применить
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Владелец:</label>
            <span className="text-sm text-gray-600">{ownerName}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {lastSyncTime && (
            <div className="text-xs text-gray-500">
              Последний синк: {formatLastSync(lastSyncTime)}
            </div>
          )}
          
          <Button onClick={onSync} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Синхронизировать
          </Button>
          
          <div className="flex items-center gap-2">
            <Switch
              checked={isEditing}
              onCheckedChange={onEditToggle}
            />
            <label className="text-sm font-medium text-gray-700">
              Редактировать раскладку
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}

