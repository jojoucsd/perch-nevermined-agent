import 'dotenv/config'
import { Payments } from '@nevermined-io/payments'

async function main() {
  const payments = Payments.getInstance({
    nvmApiKey: process.env.NVM_API_KEY!,
    environment: 'sandbox'
  })

  const { agentId, planId } = await payments.agents.registerAgentAndPlan(
    {
      name: 'My AI Assistant',
      description: 'A paid service',
      tags: ['ai', 'payments'],
      dateCreated: new Date()
    },
    {
      endpoints: [{ POST: 'https://your-api.com/query' }],
      agentDefinitionUrl: 'https://your-api.com/openapi.json'
    },
    {
      name: 'Starter Plan',
      description: '100 requests for $10',
      dateCreated: new Date()
    },
    payments.plans.getFiatPriceConfig(
      1000n, // $10.00 in cents
      process.env.BUILDER_ADDRESS! as `0x${string}`
    ),
    payments.plans.getFixedCreditsConfig(100n, 1n)
  )

  console.log(`Agent ID: ${agentId}`)
  console.log(`Plan ID: ${planId}`)
}

main().catch(console.error)
