import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { ExternalLink } from 'lucide-react'

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

interface OverdueTableProps {
  data: OverdueDeal[]
  className?: string
}

export function OverdueTable({ data, className }: OverdueTableProps) {
  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), 'dd.MM.yyyy', { locale: ru })
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Просроченные сделки</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2 font-medium">Сделка</th>
                <th className="text-left p-2 font-medium">Клиент</th>
                <th className="text-left p-2 font-medium">План-дата</th>
                <th className="text-left p-2 font-medium">Факт запуска</th>
                <th className="text-left p-2 font-medium">Просрочка (дни)</th>
                <th className="text-left p-2 font-medium">Ответственный</th>
                <th className="text-left p-2 font-medium">Ссылка</th>
              </tr>
            </thead>
            <tbody>
              {data.map((deal) => (
                <tr key={deal.deal_id} className="border-b hover:bg-gray-50">
                  <td className="p-2 font-medium">{deal.deal_title}</td>
                  <td className="p-2">{deal.org_name}</td>
                  <td className="p-2">{formatDate(deal.plan_date)}</td>
                  <td className="p-2">
                    {deal.fact_launch_date ? formatDate(deal.fact_launch_date) : '-'}
                  </td>
                  <td className="p-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      deal.overdue_days > 30 ? 'bg-red-100 text-red-800' :
                      deal.overdue_days > 7 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-orange-100 text-orange-800'
                    }`}>
                      {deal.overdue_days}
                    </span>
                  </td>
                  <td className="p-2">{deal.owner_name}</td>
                  <td className="p-2">
                    <a
                      href={deal.pd_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 inline-flex items-center"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Просроченных сделок не найдено
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

