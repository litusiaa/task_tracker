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

    // Check cache first
    const cachedMetrics = await DatabaseService.getMetricsCache(
      user.id,
      from,
      to
    )

    if (cachedMetrics) {
      return NextResponse.json({
        launchPct: Number(cachedMetrics.launchPct),
        signedCount: cachedMetrics.signedCount,
        launchedCount: cachedMetrics.launchedCount,
        missedPct: Number(cachedMetrics.missedDeadlinePct),
        missedCount: cachedMetrics.missedDeadlineCount,
        avgIntegrationToPilotDays: Number(cachedMetrics.avgDaysIntegrationToPilot),
        trend: [] // Trend is calculated on-demand
      })
    }

    // Calculate metrics
    const metrics = await MetricsService.calculateMetrics(user.id, from, to)

    return NextResponse.json({
      launchPct: metrics.launchPct,
      signedCount: metrics.signedCount,
      launchedCount: metrics.launchedCount,
      missedPct: metrics.missedPct,
      missedCount: metrics.missedCount,
      avgIntegrationToPilotDays: metrics.avgIntegrationToPilotDays,
      trend: metrics.trend
    })

  } catch (error) {
    console.error('Metrics API error:', error)
    return NextResponse.json(
      { error: 'Failed to calculate metrics' },
      { status: 500 }
    )
  }
}

