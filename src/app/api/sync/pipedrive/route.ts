import { NextRequest, NextResponse } from 'next/server'
import { PipedriveService } from '@/lib/pipedrive'
import { DatabaseService } from '@/lib/db'
import { MetricsService } from '@/lib/metrics'
import { PIPELINE_NAMES, STAGE_NAMES } from '@/types'

const SYNC_SECRET = process.env.SYNC_SECRET

// Validate sync secret
function validateSyncSecret(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false
  }
  
  const token = authHeader.substring(7)
  return token === SYNC_SECRET
}

export async function POST(request: NextRequest) {
  try {
    // Validate sync secret
    if (!validateSyncSecret(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const mode = searchParams.get('mode') || 'inc'
    
    const syncLog = await DatabaseService.createSyncLog({
      source: 'pipedrive',
      startedAt: new Date(),
      finishedAt: new Date(), // Will be updated at the end
      status: 'ok'
    })

    try {
      // Step 1: Update reference data (users, pipelines, stages)
      console.log('Updating reference data...')
      await updateReferenceData()

      // Step 2: Get target user (Евгения Попова)
      const targetUser = await PipedriveService.getUserByName('Евгения Попова')
      if (!targetUser) {
        throw new Error('Target user "Евгения Попова" not found')
      }

      // Step 3: Sync deals
      console.log('Syncing deals...')
      await syncDeals(targetUser.id, mode)

      // Step 4: Recalculate metrics cache
      console.log('Recalculating metrics...')
      const fromDate = new Date('2025-01-01T00:00:00+03:00')
      const toDate = new Date()
      
      const metrics = await MetricsService.calculateMetrics(
        targetUser.id,
        fromDate,
        toDate
      )

      await DatabaseService.upsertMetricsCache({
        ownerId: targetUser.id,
        fromDate,
        toDate,
        signedCount: metrics.signedCount,
        launchedCount: metrics.launchedCount,
        launchPct: metrics.launchPct,
        missedDeadlineCount: metrics.missedCount,
        missedDeadlinePct: metrics.missedPct,
        avgDaysIntegrationToPilot: metrics.avgIntegrationToPilotDays
      })

      // Update sync log as successful
      await DatabaseService.prisma.syncLog.update({
        where: { id: syncLog.id },
        data: {
          finishedAt: new Date(),
          status: 'ok',
          info: {
            mode,
            dealsProcessed: metrics.signedCount,
            targetUser: targetUser.name
          }
        }
      })

      return NextResponse.json({
        success: true,
        mode,
        dealsProcessed: metrics.signedCount,
        targetUser: targetUser.name
      })

    } catch (error) {
      console.error('Sync error:', error)
      
      // Update sync log as failed
      await DatabaseService.prisma.syncLog.update({
        where: { id: syncLog.id },
        data: {
          finishedAt: new Date(),
          status: 'error',
          info: {
            error: error instanceof Error ? error.message : 'Unknown error',
            mode
          }
        }
      })

      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Sync failed' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function updateReferenceData() {
  // Update users
  const users = await PipedriveService.getUsers()
  for (const user of users) {
    await DatabaseService.upsertUser({
      id: user.id,
      name: user.name,
      email: user.email,
      raw: user
    })
  }

  // Update pipelines and stages
  const pipelines = await PipedriveService.getPipelines()
  for (const pipeline of pipelines) {
    await DatabaseService.upsertPipeline({
      id: pipeline.id,
      name: pipeline.name,
      raw: pipeline
    })

    const stages = await PipedriveService.getStages(pipeline.id)
    for (const stage of stages) {
      await DatabaseService.upsertStage({
        id: stage.id,
        pipelineId: pipeline.id,
        name: stage.name,
        orderNo: stage.order_no,
        raw: stage
      })
    }
  }
}

async function syncDeals(ownerId: number, mode: string) {
  let deals: any[] = []

  if (mode === 'full') {
    // Full sync: get all deals for the owner
    deals = await PipedriveService.getAllDealsForOwner(ownerId)
  } else {
    // Incremental sync: get deals updated since last sync
    const lastSync = await DatabaseService.getLastSyncLog('pipedrive')
    if (lastSync && lastSync.status === 'ok') {
      const since = lastSync.started_at.toISOString()
      deals = await PipedriveService.getDealsSince(since, ownerId)
    } else {
      // If no successful sync, do full sync
      deals = await PipedriveService.getAllDealsForOwner(ownerId)
    }
  }

  // Get pipeline and stage mappings
  const salesCisPipeline = await DatabaseService.getPipelineByName(PIPELINE_NAMES.SALES_CIS)
  const clientsCisPipeline = await DatabaseService.getPipelineByName(PIPELINE_NAMES.CLIENTS_CIS)
  
  if (!salesCisPipeline || !clientsCisPipeline) {
    throw new Error('Required pipelines not found')
  }

  const recognizeStage = await DatabaseService.getStageByName(salesCisPipeline.id, STAGE_NAMES.E_RECOGNIZE)
  const integrationStage = await DatabaseService.getStageByName(clientsCisPipeline.id, STAGE_NAMES.INTEGRATION)

  if (!recognizeStage || !integrationStage) {
    throw new Error('Required stages not found')
  }

  // Process each deal
  for (const deal of deals) {
    // Upsert deal
    await DatabaseService.upsertDeal({
      id: deal.id,
      title: deal.title,
      orgId: deal.org_id,
      orgName: deal.org_name,
      ownerId: deal.owner_id,
      ownerName: deal.owner_name,
      pipelineId: deal.pipeline_id,
      stageId: deal.stage_id,
      status: deal.status,
      addTime: new Date(deal.add_time),
      updateTime: new Date(deal.update_time),
      wonTime: deal.won_time ? new Date(deal.won_time) : undefined,
      expectedCloseDate: deal.expected_close_date ? new Date(deal.expected_close_date) : undefined,
      raw: deal
    })

    // Get stage history (Path A)
    const stageHistory = await PipedriveService.getDealStageHistory(deal.id)
    
    for (const historyItem of stageHistory) {
      // Check if this event already exists
      const existingEvent = await DatabaseService.prisma.pdStageEvent.findFirst({
        where: {
          dealId: deal.id,
          stageId: historyItem.stage_id,
          enteredAt: new Date(historyItem.entered_at)
        }
      })

      if (!existingEvent) {
        // Create stage event
        await DatabaseService.createStageEvent({
          dealId: deal.id,
          pipelineId: historyItem.pipeline_id,
          stageId: historyItem.stage_id,
          enteredAt: new Date(historyItem.entered_at),
          source: 'flow_api',
          // Snapshot expected close date when entering Recognize stage
          snapshotExpectedCloseDate: historyItem.stage_id === recognizeStage.id 
            ? (deal.expected_close_date ? new Date(deal.expected_close_date) : undefined)
            : undefined
        })
      }
    }
  }
}

