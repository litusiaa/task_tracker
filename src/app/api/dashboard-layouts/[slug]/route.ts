import { NextRequest, NextResponse } from 'next/server'
import { DatabaseService } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params
    
    const layout = await DatabaseService.getDashboardLayout(slug)
    
    if (!layout) {
      return NextResponse.json({ layout: null })
    }

    return NextResponse.json({ layout: layout.layout })

  } catch (error) {
    console.error('Get layout error:', error)
    return NextResponse.json(
      { error: 'Failed to get layout' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params
    const body = await request.json()
    
    if (!body.layout) {
      return NextResponse.json(
        { error: 'Layout data is required' },
        { status: 400 }
      )
    }

    await DatabaseService.upsertDashboardLayout({
      dashboardSlug: slug,
      layout: body.layout
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Save layout error:', error)
    return NextResponse.json(
      { error: 'Failed to save layout' },
      { status: 500 }
    )
  }
}

