import { z } from 'zod'
import { prisma } from './prisma'

// Validation schemas
export const syncLogSchema = z.object({
  source: z.string(),
  startedAt: z.date(),
  finishedAt: z.date(),
  status: z.enum(['ok', 'error']),
  info: z.record(z.any()).optional()
})

export const dashboardLayoutSchema = z.object({
  dashboardSlug: z.string(),
  layout: z.record(z.any())
})

// Database service class
export class DatabaseService {
  // Sync logs
  static async createSyncLog(data: z.infer<typeof syncLogSchema>) {
    return prisma.syncLog.create({
      data: {
        source: data.source,
        started_at: data.startedAt,
        finished_at: data.finishedAt,
        status: data.status,
        info: data.info
      }
    })
  }

  static async getLastSyncLog(source: string) {
    return prisma.syncLog.findFirst({
      where: { source },
      orderBy: { started_at: 'desc' }
    })
  }

  // Users
  static async upsertUser(userData: {
    id: number
    name: string
    email?: string
    raw: any
  }) {
    return prisma.pdUser.upsert({
      where: { id: userData.id },
      update: {
        name: userData.name,
        email: userData.email,
        raw: userData.raw,
        updatedAt: new Date()
      },
      create: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        raw: userData.raw
      }
    })
  }

  static async getUserByName(name: string) {
    return prisma.pdUser.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive'
        }
      }
    })
  }

  // Pipelines
  static async upsertPipeline(pipelineData: {
    id: number
    name: string
    raw: any
  }) {
    return prisma.pdPipeline.upsert({
      where: { id: pipelineData.id },
      update: {
        name: pipelineData.name,
        raw: pipelineData.raw,
        updatedAt: new Date()
      },
      create: {
        id: pipelineData.id,
        name: pipelineData.name,
        raw: pipelineData.raw
      }
    })
  }

  static async getPipelineByName(name: string) {
    return prisma.pdPipeline.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive'
        }
      }
    })
  }

  // Stages
  static async upsertStage(stageData: {
    id: number
    pipelineId: number
    name: string
    orderNo: number
    raw: any
  }) {
    return prisma.pdStage.upsert({
      where: { id: stageData.id },
      update: {
        name: stageData.name,
        orderNo: stageData.orderNo,
        raw: stageData.raw,
        updatedAt: new Date()
      },
      create: {
        id: stageData.id,
        pipelineId: stageData.pipelineId,
        name: stageData.name,
        orderNo: stageData.orderNo,
        raw: stageData.raw
      }
    })
  }

  static async getStageByName(pipelineId: number, stageName: string) {
    return prisma.pdStage.findFirst({
      where: {
        pipelineId,
        name: {
          equals: stageName,
          mode: 'insensitive'
        }
      }
    })
  }

  // Deals
  static async upsertDeal(dealData: {
    id: number
    title: string
    orgId: number
    orgName: string
    ownerId: number
    ownerName: string
    pipelineId: number
    stageId: number
    status: string
    addTime: Date
    updateTime: Date
    wonTime?: Date
    expectedCloseDate?: Date
    raw: any
  }) {
    return prisma.pdDeal.upsert({
      where: { id: dealData.id },
      update: {
        title: dealData.title,
        orgName: dealData.orgName,
        ownerName: dealData.ownerName,
        stageId: dealData.stageId,
        status: dealData.status,
        updateTime: dealData.updateTime,
        wonTime: dealData.wonTime,
        expectedCloseDate: dealData.expectedCloseDate,
        raw: dealData.raw,
        updatedAt: new Date()
      },
      create: {
        id: dealData.id,
        title: dealData.title,
        orgId: dealData.orgId,
        orgName: dealData.orgName,
        ownerId: dealData.ownerId,
        ownerName: dealData.ownerName,
        pipelineId: dealData.pipelineId,
        stageId: dealData.stageId,
        status: dealData.status,
        addTime: dealData.addTime,
        updateTime: dealData.updateTime,
        wonTime: dealData.wonTime,
        expectedCloseDate: dealData.expectedCloseDate,
        raw: dealData.raw
      }
    })
  }

  // Stage events
  static async createStageEvent(eventData: {
    dealId: number
    pipelineId: number
    stageId: number
    enteredAt: Date
    source: string
    snapshotExpectedCloseDate?: Date
    meta?: any
  }) {
    return prisma.pdStageEvent.create({
      data: {
        dealId: eventData.dealId,
        pipelineId: eventData.pipelineId,
        stageId: eventData.stageId,
        enteredAt: eventData.enteredAt,
        source: eventData.source,
        snapshotExpectedCloseDate: eventData.snapshotExpectedCloseDate,
        meta: eventData.meta
      }
    })
  }

  static async getStageEventsForDeal(dealId: number) {
    return prisma.pdStageEvent.findMany({
      where: { dealId },
      orderBy: { enteredAt: 'asc' },
      include: {
        stage: true,
        pipeline: true
      }
    })
  }

  // Metrics cache
  static async upsertMetricsCache(cacheData: {
    ownerId: number
    fromDate: Date
    toDate: Date
    signedCount: number
    launchedCount: number
    launchPct: number
    missedDeadlineCount: number
    missedDeadlinePct: number
    avgDaysIntegrationToPilot: number
  }) {
    return prisma.pmMetricsCache.upsert({
      where: {
        ownerId_fromDate_toDate: {
          ownerId: cacheData.ownerId,
          fromDate: cacheData.fromDate,
          toDate: cacheData.toDate
        }
      },
      update: {
        signedCount: cacheData.signedCount,
        launchedCount: cacheData.launchedCount,
        launchPct: cacheData.launchPct,
        missedDeadlineCount: cacheData.missedDeadlineCount,
        missedDeadlinePct: cacheData.missedDeadlinePct,
        avgDaysIntegrationToPilot: cacheData.avgDaysIntegrationToPilot,
        computedAt: new Date()
      },
      create: {
        ownerId: cacheData.ownerId,
        fromDate: cacheData.fromDate,
        toDate: cacheData.toDate,
        signedCount: cacheData.signedCount,
        launchedCount: cacheData.launchedCount,
        launchPct: cacheData.launchPct,
        missedDeadlineCount: cacheData.missedDeadlineCount,
        missedDeadlinePct: cacheData.missedDeadlinePct,
        avgDaysIntegrationToPilot: cacheData.avgDaysIntegrationToPilot
      }
    })
  }

  static async getMetricsCache(ownerId: number, fromDate: Date, toDate: Date) {
    return prisma.pmMetricsCache.findUnique({
      where: {
        ownerId_fromDate_toDate: {
          ownerId,
          fromDate,
          toDate
        }
      }
    })
  }

  // Dashboard layouts
  static async upsertDashboardLayout(layoutData: {
    dashboardSlug: string
    layout: any
  }) {
    return prisma.dashboardLayout.upsert({
      where: { dashboardSlug: layoutData.dashboardSlug },
      update: {
        layout: layoutData.layout,
        updatedAt: new Date()
      },
      create: {
        dashboardSlug: layoutData.dashboardSlug,
        layout: layoutData.layout
      }
    })
  }

  static async getDashboardLayout(dashboardSlug: string) {
    return prisma.dashboardLayout.findUnique({
      where: { dashboardSlug }
    })
  }
}
