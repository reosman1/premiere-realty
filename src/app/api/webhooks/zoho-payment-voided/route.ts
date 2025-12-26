/**
 * Zoho Payment Voided Webhook Handler
 * When a payment is voided in Zoho, update the QuickBooks bill balance to zero
 * 
 * POST /api/webhooks/zoho-payment-voided
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { voidBillInQuickBooks } from "@/lib/services/qb-bill-sync"

/**
 * Verify webhook secret
 */
function verifyWebhookSecret(request: NextRequest): boolean {
  const webhookSecret = request.headers.get("x-webhook-secret")
  if (process.env.WEBHOOK_SECRET && webhookSecret !== process.env.WEBHOOK_SECRET) {
    return false
  }
  return true
}

export async function POST(request: NextRequest) {
  try {
    if (!verifyWebhookSecret(request)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { paymentId, zohoId } = body

    // Find commission payment
    let payment
    if (paymentId) {
      payment = await prisma.commissionPayment.findUnique({
        where: { id: paymentId },
      })
    } else if (zohoId) {
      payment = await prisma.commissionPayment.findFirst({
        where: { zohoId },
      })
    }

    if (!payment) {
      return NextResponse.json(
        { error: "Commission payment not found" },
        { status: 404 }
      )
    }

    // Update payment status to CANCELLED
    await prisma.commissionPayment.update({
      where: { id: payment.id },
      data: {
        status: "CANCELLED",
      },
    })

    // If payment has a QuickBooks bill, void it
    if (payment.qbInvoiceId) {
      await voidBillInQuickBooks(payment.id)
    }

    // Log sync
    await prisma.syncLog.create({
      data: {
        source: "ZOHO",
        entityType: "commissionPayment",
        entityId: payment.id,
        externalId: payment.zohoId || undefined,
        action: "UPDATE",
        payload: {
          action: "payment_voided",
          paymentId: payment.id,
        },
        status: "SUCCESS",
      },
    })

    return NextResponse.json({ 
      success: true,
      message: "Payment voided and QuickBooks bill updated",
      paymentId: payment.id,
    })
  } catch (error) {
    console.error("Zoho Payment Voided Webhook Error:", error)
    return NextResponse.json(
      { 
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

