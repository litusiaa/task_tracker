// Pipedrive API types
export interface PipedriveDeal {
  id: number
  title: string
  org_id: number
  org_name: string
  owner_id: number
  owner_name: string
  pipeline_id: number
  stage_id: number
  status: 'open' | 'won' | 'lost'
  add_time: string
  update_time: string
  won_time?: string
  expected_close_date?: string
  link_url: string
  custom_fields?: Record<string, any>
}

export interface PipedriveUser {
  id: number
  name: string
  email: string
}

export interface PipedrivePipeline {
  id: number
  name: string
}

export interface PipedriveStage {
  id: number
  pipeline_id: number
  name: string
  order_no: number
}

export interface PipedriveStageHistory {
  deal_id: number
  stage_id: number
  pipeline_id: number
  entered_at: string
}

// Dashboard types
export interface DashboardMetrics {
  launchPct: number
  signedCount: number
  launchedCount: number
  missedPct: number
  missedCount: number
  avgIntegrationToPilotDays: number
  trend: TrendPoint[]
}

export interface TrendPoint {
  month: string
  launchPct: number
  signed: number
  launched: number
}

export interface OverdueDeal {
  deal_id: number
  deal_title: string
  org_name: string
  plan_date: string
  fact_launch_date?: string
  overdue_days: number
  owner_name: string
  pd_link: string
}

export interface DashboardLayout {
  id: string
  x: number
  y: number
  w: number
  h: number
  minW?: number
  minH?: number
  maxW?: number
  maxH?: number
  static?: boolean
  isDraggable?: boolean
  isResizable?: boolean
}

export interface SyncLog {
  id: number
  source: string
  started_at: string
  finished_at: string
  status: 'ok' | 'error'
  info?: Record<string, any>
}

// Filter types
export interface DashboardFilters {
  fromDate: string
  toDate: string
  ownerName: string
}

// Pipeline and stage mappings
export const PIPELINE_NAMES = {
  LEADS: 'Leads',
  SALES_CIS: 'Sales CIS',
  CLIENTS_CIS: 'Clients CIS',
  PARTNER: 'Partner'
} as const

export const STAGE_NAMES = {
  // Leads
  LEAD: 'Lead',
  LEAD_IN_PROGRESS: 'Lead in progress',
  
  // Sales CIS
  E_RECOGNIZE: 'E – Recognize',
  D_EVALUATE: 'D – Evaluate',
  C_SELECT: 'C – Select',
  B_NEGOTIATE: 'B – Negotiate',
  A_PURCHASE: 'A – Purchase',
  
  // Clients CIS
  INTEGRATION: 'Integration',
  PILOT: 'Pilot',
  ACTIVE: 'Active',
  ISSUED: 'Issued',
  DORMANT: 'Dormant',
  LOST: 'Lost',
  
  // Partner
  WANT: 'Хочу!',
  POTENTIAL: 'Potential',
  ENGAGED: 'Engaged',
  PARTNER_ACTIVE: 'Active',
  PARTNER_DORMANT: 'Dormant'
} as const

export type PipelineName = typeof PIPELINE_NAMES[keyof typeof PIPELINE_NAMES]
export type StageName = typeof STAGE_NAMES[keyof typeof STAGE_NAMES]

