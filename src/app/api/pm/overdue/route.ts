import { NextRequest, NextResponse } from 'next/server'
import { DatabaseService } from '@/lib/db'
import { MetricsService } from '@/lib/metrics'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fromDate = searchParams.get('from')
    const toDate = searchParams.get('to')
    const ownerName = searchParams.get('ownerName') || 'Евгения Попова'

    // Validate required parameters
    if (!fromDate || !toDate) {
      return NextResponse.json(
        { error: 'from and to dates are required' },
        { status: 400 }
      )
    }

    // Parse dates
    const from = new Date(fromDate)
    const to = new Date(toDate)

    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      )
    }

    // Get user by name
    const user = await DatabaseService.getUserByName(ownerName)
    if (!user) {
      return NextResponse.json(
        { error: `User "${ownerName}" not found` },
        { status: 404 }
      )
    }

    // Calculate metrics to get overdue deals
    const metrics = await MetricsService.calculateMetrics(user.id, from, to)

    return NextResponse.json(metrics.overdueDeals)

  } catch (error) {
    console.error('Overdue API error:', error)
    return NextResponse.json(
      { error: 'Failed to get overdue deals' },
      { status: 500 }
    )
  }
}

