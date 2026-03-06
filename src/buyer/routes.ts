// Autonomous Buyer — Express Router (mountable on any Express app)

import { Router, Request, Response } from 'express'
import type { BudgetManager } from './budget.js'
import type { DiscoveredAgent, AgentScore } from './types.js'

export interface BuyerState {
  budget: BudgetManager
  getDiscoveredAgents: () => DiscoveredAgent[]
  getAgentScores: () => Map<string, AgentScore>
  getIsRunning: () => boolean
  getLastDiscovery: () => string
  getLastPurchase: () => string
  getCycleCount: () => number
  triggerDiscover: () => Promise<any>
  triggerBuyCycle: () => Promise<{ newPurchases: number; status: any }>
}

export function createBuyerRouter(state: BuyerState): Router {
  const router = Router()

  // Status overview
  router.get('/status', (_req: Request, res: Response) => {
    const status = state.budget.getStatus()
    const purchases = state.budget.getPurchases()

    // Compute repeat purchases
    const agentPurchaseCounts = new Map<string, number>()
    for (const p of purchases) {
      if (p.success) {
        agentPurchaseCounts.set(p.agentId, (agentPurchaseCounts.get(p.agentId) || 0) + 1)
      }
    }
    const hasRepeatPurchases = [...agentPurchaseCounts.values()].some(count => count >= 2)

    res.json({
      ...status,
      isRunning: state.getIsRunning(),
      lastDiscovery: state.getLastDiscovery(),
      lastPurchase: state.getLastPurchase(),
      cycleCount: state.getCycleCount(),
      discoveredAgentCount: state.getDiscoveredAgents().length,
      criteria: {
        minTransactions: 3,
        minUniqueAgents: 2,
        transactionsMet: status.totalTransactions >= 3,
        uniqueAgentsMet: status.uniqueAgents >= 2,
        hasRepeatPurchases,
        budgetEnforced: status.remaining >= 0,
        roiDecisions: status.totalTransactions > 0,
      },
    })
  })

  // Purchase history
  router.get('/purchases', (_req: Request, res: Response) => {
    res.json({
      purchases: state.budget.getPurchases(),
      total: state.budget.getStatus().totalTransactions,
    })
  })

  // Discovered agents with scores
  router.get('/agents', (_req: Request, res: Response) => {
    const agents = state.getDiscoveredAgents()
    const scores = state.getAgentScores()
    const agentsWithScores = agents.map(a => ({
      ...a,
      score: scores.get(a.agentId) || null,
      purchaseHistory: state.budget.getPurchasesForAgent(a.agentId),
    }))
    res.json({ agents: agentsWithScores, total: agentsWithScores.length })
  })

  // Trigger manual discovery
  router.post('/discover', async (_req: Request, res: Response) => {
    if (state.getIsRunning()) {
      res.json({ message: 'Cycle already running' })
      return
    }
    const result = await state.triggerDiscover()
    res.json(result)
  })

  // Trigger manual purchase cycle
  router.post('/buy', async (_req: Request, res: Response) => {
    if (state.getIsRunning()) {
      res.json({ message: 'Cycle already running' })
      return
    }
    const result = await state.triggerBuyCycle()
    res.json(result)
  })

  return router
}
