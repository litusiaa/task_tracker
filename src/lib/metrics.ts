import { zonedTimeToUtc, utcToZonedTime, format } from 'date-fns-tz'
import { differenceInDays, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns'
import { DatabaseService } from './db'
import { PIPELINE_NAMES, STAGE_NAMES } from '@/types'

const TIMEZONE = process.env.APP_TIMEZONE || 'Europe/Moscow'

export class MetricsService {
  // Convert date to MSK timezone
  static toMsk(date: Date): Date {
    return utcToZonedTime(date, TIMEZONE)
  }

  // Convert MSK date to UTC
  static fromMsk(date: Date): Date {
    return zonedTimeToUtc(date, TIMEZONE)
  }

  // Get signed deals (transition from Sales CIS: A – Purchase to Clients CIS: Integration)
  static async getSignedDeals(ownerId: number, fromDate: Date, toDate: Date) {
    const integrationStage = await DatabaseService.getStageByName(
      await this.getPipelineIdByName(PIPELINE_NAMES.CLIENTS_CIS),
      STAGE_NAMES.INTEGRATION
    )

    if (!integrationStage) {
      throw new Error('Integration stage not found')
    }

    // Get deals that entered Integration stage in the period
    const stageEvents = await DatabaseService.prisma.pdStageEvent.findMany({
      where: {
        stageId: integrationStage.id,
        enteredAt: {
          gte: this.fromMsk(fromDate),
          lte: this.fromMsk(toDate)
        },
        deal: {
          ownerId: ownerId
        }
      },
      include: {
        deal: true
      }
    })

    return stageEvents.map(event => event.deal)
  }

  // Get launched deals (currently in Active stage)
  static async getLaunchedDeals(signedDealIds: number[]) {
    const activeStage = await DatabaseService.getStageByName(
      await this.getPipelineIdByName(PIPELINE_NAMES.CLIENTS_CIS),
      STAGE_NAMES.ACTIVE
    )

    if (!activeStage) {
      throw new Error('Active stage not found')
    }

    // Get deals that are currently in Active stage
    const activeDeals = await DatabaseService.prisma.pdDeal.findMany({
      where: {
        id: { in: signedDealIds },
        stageId: activeStage.id
      }
    })

    return activeDeals
  }

  // Calculate missed deadlines
  static async calculateMissedDeadlines(signedDealIds: number[]) {
    const today = this.toMsk(new Date())
    const missedDeals: any[] = []

    for (const dealId of signedDealIds) {
      const deal = await DatabaseService.prisma.pdDeal.findUnique({
        where: { id: dealId }
      })

      if (!deal) continue

      // Get plan date from stage events
      const planDate = await this.getPlanDate(dealId)
      if (!planDate) continue

      // Get fact launch date (entry to Active)
      const factLaunchDate = await this.getFactLaunchDate(dealId)

      let overdueDays = 0
      let isMissed = false

      if (factLaunchDate) {
        // Deal was launched
        overdueDays = differenceInDays(factLaunchDate, planDate)
        isMissed = overdueDays > 0
      } else {
        // Deal not launched yet
        overdueDays = differenceInDays(today, planDate)
        isMissed = overdueDays > 0
      }

      if (isMissed) {
        missedDeals.push({
          deal_id: dealId,
          deal_title: deal.title,
          org_name: deal.orgName,
          plan_date: planDate,
          fact_launch_date: factLaunchDate,
          overdue_days: overdueDays,
          owner_name: deal.ownerName,
          pd_link: `https://app.pipedrive.com/deal/${dealId}`
        })
      }
    }

    return missedDeals
  }

  // Calculate average time from Integration to Pilot
  static async calculateAvgIntegrationToPilot(signedDealIds: number[]) {
    const integrationStage = await DatabaseService.getStageByName(
      await this.getPipelineIdByName(PIPELINE_NAMES.CLIENTS_CIS),
      STAGE_NAMES.INTEGRATION
    )

    const pilotStage = await DatabaseService.getStageByName(
      await this.getPipelineIdByName(PIPELINE_NAMES.CLIENTS_CIS),
      STAGE_NAMES.PILOT
    )

    if (!integrationStage || !pilotStage) {
      throw new Error('Integration or Pilot stage not found')
    }

    const integrationToPilotTimes: number[] = []

    for (const dealId of signedDealIds) {
      const stageEvents = await DatabaseService.getStageEventsForDeal(dealId)
      
      const integrationEvent = stageEvents.find(event => event.stageId === integrationStage.id)
      const pilotEvent = stageEvents.find(event => event.stageId === pilotStage.id)

      if (integrationEvent && pilotEvent) {
        const days = differenceInDays(
          this.toMsk(pilotEvent.enteredAt),
          this.toMsk(integrationEvent.enteredAt)
        )
        integrationToPilotTimes.push(days)
      }
    }

    if (integrationToPilotTimes.length === 0) {
      return 0
    }

    const avgDays = integrationToPilotTimes.reduce((sum, days) => sum + days, 0) / integrationToPilotTimes.length
    return Math.round(avgDays * 10) / 10 // Round to 1 decimal place
  }

  // Calculate trend data by months
  static async calculateTrend(ownerId: number, fromDate: Date, toDate: Date) {
    const months = eachMonthOfInterval({ start: fromDate, end: toDate })
    const trend: any[] = []

    for (const month of months) {
      const monthStart = startOfMonth(month)
      const monthEnd = endOfMonth(month)

      const signedDeals = await this.getSignedDeals(ownerId, monthStart, monthEnd)
      const signedIds = signedDeals.map(deal => deal.id)
      const launchedDeals = await this.getLaunchedDeals(signedIds)

      const launchPct = signedDeals.length > 0 
        ? Math.round((launchedDeals.length / signedDeals.length) * 1000) / 10
        : 0

      trend.push({
        month: format(month, 'yyyy-MM'),
        launchPct,
        signed: signedDeals.length,
        launched: launchedDeals.length
      })
    }

    return trend
  }

  // Get plan date for a deal
  private static async getPlanDate(dealId: number): Promise<Date | null> {
    // First try to get from stage events snapshot
    const stageEvent = await DatabaseService.prisma.pdStageEvent.findFirst({
      where: {
        dealId,
        snapshotExpectedCloseDate: { not: null }
      },
      orderBy: { enteredAt: 'desc' }
    })

    if (stageEvent?.snapshotExpectedCloseDate) {
      return this.toMsk(stageEvent.snapshotExpectedCloseDate)
    }

    // Fallback to current expected close date
    const deal = await DatabaseService.prisma.pdDeal.findUnique({
      where: { id: dealId }
    })

    return deal?.expectedCloseDate ? this.toMsk(deal.expectedCloseDate) : null
  }

  // Get fact launch date (entry to Active)
  private static async getFactLaunchDate(dealId: number): Promise<Date | null> {
    const activeStage = await DatabaseService.getStageByName(
      await this.getPipelineIdByName(PIPELINE_NAMES.CLIENTS_CIS),
      STAGE_NAMES.ACTIVE
    )

    if (!activeStage) return null

    const stageEvent = await DatabaseService.prisma.pdStageEvent.findFirst({
      where: {
        dealId,
        stageId: activeStage.id
      },
      orderBy: { enteredAt: 'asc' }
    })

    return stageEvent ? this.toMsk(stageEvent.enteredAt) : null
  }

  // Helper to get pipeline ID by name
  private static async getPipelineIdByName(pipelineName: string): Promise<number> {
    const pipeline = await DatabaseService.getPipelineByName(pipelineName)
    if (!pipeline) {
      throw new Error(`Pipeline ${pipelineName} not found`)
    }
    return pipeline.id
  }

  // Main method to calculate all metrics
  static async calculateMetrics(ownerId: number, fromDate: Date, toDate: Date) {
    const signedDeals = await this.getSignedDeals(ownerId, fromDate, toDate)
    const signedIds = signedDeals.map(deal => deal.id)
    
    const launchedDeals = await this.getLaunchedDeals(signedIds)
    const missedDeals = await this.calculateMissedDeadlines(signedIds)
    const avgIntegrationToPilotDays = await this.calculateAvgIntegrationToPilot(signedIds)
    const trend = await this.calculateTrend(ownerId, fromDate, toDate)

    const launchPct = signedDeals.length > 0 
      ? Math.round((launchedDeals.length / signedDeals.length) * 1000) / 10
      : 0

    const missedPct = signedDeals.length > 0
      ? Math.round((missedDeals.length / signedDeals.length) * 1000) / 10
      : 0

    return {
      launchPct,
      signedCount: signedDeals.length,
      launchedCount: launchedDeals.length,
      missedPct,
      missedCount: missedDeals.length,
      avgIntegrationToPilotDays,
      trend,
      overdueDeals: missedDeals
    }
  }
}

