import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, TrendingUp, MessageSquare, DollarSign, Handshake, ShoppingCart } from 'lucide-react'

const departments = [
  {
    slug: 'pm',
    name: 'PM',
    description: 'Project Management',
    icon: Users,
    active: true,
    color: 'bg-blue-500'
  },
  {
    slug: 'ds',
    name: 'DS',
    description: 'Data Science',
    icon: TrendingUp,
    active: false,
    color: 'bg-green-500'
  },
  {
    slug: 'csm',
    name: 'CSM',
    description: 'Customer Success Management',
    icon: MessageSquare,
    active: false,
    color: 'bg-purple-500'
  },
  {
    slug: 'finance',
    name: 'Finance',
    description: 'Финансы',
    icon: DollarSign,
    active: false,
    color: 'bg-yellow-500'
  },
  {
    slug: 'partner',
    name: 'Partner',
    description: 'Партнеры',
    icon: Handshake,
    active: false,
    color: 'bg-orange-500'
  },
  {
    slug: 'sales',
    name: 'Sales',
    description: 'Продажи',
    icon: ShoppingCart,
    active: false,
    color: 'bg-red-500'
  }
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Analytical Dashboard
          </h1>
          <p className="text-xl text-gray-600">
            BI-приложение с редактируемыми дашбордами по отделам
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((dept) => {
            const Icon = dept.icon
            return (
              <Link key={dept.slug} href={dept.active ? `/${dept.slug}` : '#'}>
                <Card className={`h-full transition-all duration-200 hover:shadow-lg ${
                  dept.active 
                    ? 'cursor-pointer hover:scale-105' 
                    : 'opacity-50 cursor-not-allowed'
                }`}>
                  <CardHeader className="text-center">
                    <div className={`w-16 h-16 mx-auto rounded-full ${dept.color} flex items-center justify-center mb-4`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl">{dept.name}</CardTitle>
                    <CardDescription>{dept.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    {dept.active ? (
                      <span className="text-sm text-green-600 font-medium">
                        Активен
                      </span>
                    ) : (
                      <span className="text-sm text-gray-500">
                        Скоро
                      </span>
                    )}
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>

        <div className="mt-12 text-center text-gray-500">
          <p>В MVP доступен только дашборд PM (Евгения Попова)</p>
        </div>
      </div>
    </div>
  )
}

