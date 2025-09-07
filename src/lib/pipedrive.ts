import axios from 'axios'
import { PipedriveDeal, PipedriveUser, PipedrivePipeline, PipedriveStage, PipedriveStageHistory } from '@/types'

const PIPEDRIVE_BASE_URL = process.env.PIPEDRIVE_BASE_URL || 'https://api.pipedrive.com/v1'
const PIPEDRIVE_API_TOKEN = process.env.PIPEDRIVE_API_TOKEN

if (!PIPEDRIVE_API_TOKEN) {
  throw new Error('PIPEDRIVE_API_TOKEN is required')
}

const pipedriveApi = axios.create({
  baseURL: PIPEDRIVE_BASE_URL,
  params: {
    api_token: PIPEDRIVE_API_TOKEN
  }
})

// Rate limiting
const RATE_LIMIT_DELAY = 100 // ms between requests

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export class PipedriveService {
  // Get all users
  static async getUsers(): Promise<PipedriveUser[]> {
    const response = await pipedriveApi.get('/users')
    return response.data.data || []
  }

  // Get all pipelines
  static async getPipelines(): Promise<PipedrivePipeline[]> {
    const response = await pipedriveApi.get('/pipelines')
    return response.data.data || []
  }

  // Get stages for a pipeline
  static async getStages(pipelineId: number): Promise<PipedriveStage[]> {
    const response = await pipedriveApi.get(`/pipelines/${pipelineId}/stages`)
    return response.data.data || []
  }

  // Get deals with pagination
  static async getDeals(start: number = 0, limit: number = 100, ownerId?: number): Promise<PipedriveDeal[]> {
    const params: any = {
      start,
      limit,
      include_fields: 'custom_fields'
    }
    
    if (ownerId) {
      params.user_id = ownerId
    }

    const response = await pipedriveApi.get('/deals', { params })
    const deals = response.data.data || []
    
    // Add link_url to each deal
    return deals.map((deal: any) => ({
      ...deal,
      link_url: `https://app.pipedrive.com/deal/${deal.id}`
    }))
  }

  // Get all deals for an owner
  static async getAllDealsForOwner(ownerId: number): Promise<PipedriveDeal[]> {
    const allDeals: PipedriveDeal[] = []
    let start = 0
    const limit = 100
    
    while (true) {
      await delay(RATE_LIMIT_DELAY)
      const deals = await this.getDeals(start, limit, ownerId)
      
      if (deals.length === 0) break
      
      allDeals.push(...deals)
      start += limit
      
      // Safety check to prevent infinite loops
      if (start > 10000) break
    }
    
    return allDeals
  }

  // Get stage history for a deal (Path A - if available)
  static async getDealStageHistory(dealId: number): Promise<PipedriveStageHistory[]> {
    try {
      const response = await pipedriveApi.get(`/deals/${dealId}/flow`)
      return response.data.data || []
    } catch (error) {
      console.warn(`Stage history not available for deal ${dealId}:`, error)
      return []
    }
  }

  // Get user by name (case insensitive)
  static async getUserByName(name: string): Promise<PipedriveUser | null> {
    const users = await this.getUsers()
    const normalizedName = name.toLowerCase().trim()
    
    return users.find(user => 
      user.name.toLowerCase().trim() === normalizedName
    ) || null
  }

  // Get pipeline by name (case insensitive)
  static async getPipelineByName(name: string): Promise<PipedrivePipeline | null> {
    const pipelines = await this.getPipelines()
    const normalizedName = name.toLowerCase().trim()
    
    return pipelines.find(pipeline => 
      pipeline.name.toLowerCase().trim() === normalizedName
    ) || null
  }

  // Get stage by name and pipeline (case insensitive)
  static async getStageByName(pipelineId: number, stageName: string): Promise<PipedriveStage | null> {
    const stages = await this.getStages(pipelineId)
    const normalizedStageName = stageName.toLowerCase().trim()
    
    return stages.find(stage => 
      stage.name.toLowerCase().trim() === normalizedStageName
    ) || null
  }

  // Get deals updated since a specific time
  static async getDealsSince(since: string, ownerId?: number): Promise<PipedriveDeal[]> {
    const params: any = {
      since: since,
      include_fields: 'custom_fields'
    }
    
    if (ownerId) {
      params.user_id = ownerId
    }

    const response = await pipedriveApi.get('/deals', { params })
    const deals = response.data.data || []
    
    return deals.map((deal: any) => ({
      ...deal,
      link_url: `https://app.pipedrive.com/deal/${deal.id}`
    }))
  }
}

