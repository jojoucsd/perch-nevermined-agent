import 'dotenv/config'
import { Payments } from '@nevermined-io/payments'

const PLAN_ID = process.env.NVM_PLAN_ID!
const AGENT_ID = process.env.NVM_AGENT_ID!
const SELLER_URL = process.env.SELLER_URL || 'http://localhost:3000'

async function main() {
  const payments = Payments.getInstance({
    nvmApiKey: process.env.BUYER_API_KEY!,
    environment: 'sandbox'
  })

  // Check if buyer already has credits before ordering
  console.log('1. Checking existing balance...')
  const balance = await payments.plans.getPlanBalance(PLAN_ID)
  console.log(`   Balance: ${balance.balance} credits`)

  if (Number(balance.balance) === 0) {
    console.log('2. No credits found. Initiating fiat checkout...')
    const { result } = await payments.plans.orderFiatPlan(PLAN_ID)
    console.log(`\n   Open this URL in your browser to complete payment:`)
    console.log(`   ${result.url}\n`)
    console.log('   After payment, re-run this script to continue.')
    return
  }

  console.log('2. Getting access token...')
  const { accessToken } = await payments.x402.getX402AccessToken(PLAN_ID, AGENT_ID)
  console.log(`   Token: ${accessToken.slice(0, 40)}...`)

  console.log(`3. Calling seller at ${SELLER_URL}/query...`)
  const response = await fetch(`${SELLER_URL}/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'payment-signature': accessToken
    },
    body: JSON.stringify({ prompt: 'Hello from the buyer!' })
  })

  const data = await response.json()
  console.log(`\n✅ Response (${response.status}):`, JSON.stringify(data, null, 2))
}

main().catch(console.error)
