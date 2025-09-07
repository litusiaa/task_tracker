import { NextRequest, NextResponse } from 'next/server'
import { DatabaseService } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const source = searchParams.get('source') || 'pipedrive'
    const limit = parseInt(searchParams.get('limit') || '10')

    const logs = await DatabaseService.prisma.syncLog.findMany({
      where: { source },
      orderBy: { startedAt: 'desc' },
      take: limit
    })

    return NextResponse.json(logs)

  } catch (error) {
    console.error('Sync logs API error:', error)
    return NextResponse.json(
      { error: 'Failed to get sync logs' },
      { status: 500 }
    )
  }
}

