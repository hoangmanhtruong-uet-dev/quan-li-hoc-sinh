import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHmac } from "crypto";

// Use service role key for webhook processing (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Verify HMAC-SHA256 signature from payment gateway (PayOS / Casso / SeABank)
 */
function verifyWebhookSignature(payload: string, signature: string): boolean {
  const checksumKey = process.env.WEBHOOK_CHECKSUM_KEY;
  if (!checksumKey) {
    console.warn("⚠️ WEBHOOK_CHECKSUM_KEY not configured — skipping signature verification (development mode)");
    return true; // In development, skip verification
  }

  const expectedSignature = createHmac("sha256", checksumKey)
    .update(payload)
    .digest("hex");

  return expectedSignature === signature;
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const body = JSON.parse(rawBody);

    // --- Step 1: Verify Webhook Signature ---
    const signature =
      request.headers.get("x-webhook-signature") ||
      request.headers.get("x-payos-signature") ||
      request.headers.get("x-casso-signature") ||
      "";

    if (!verifyWebhookSignature(rawBody, signature)) {
      console.error("❌ Webhook signature verification FAILED");
      return NextResponse.json(
        { success: false, error: "Invalid webhook signature" },
        { status: 403 }
      );
    }

    console.log("💳 Payment Webhook Received (verified):", body);

    // --- Step 2: Extract payment data ---
    const content = body.content || body.description || body.data?.description || "";
    const amount = Number(body.amount || body.data?.amount || 0);

    if (!content) {
      return NextResponse.json(
        { success: false, error: "Missing transaction content" },
        { status: 400 }
      );
    }

    // --- Step 3: Match student from transaction reference ---
    const { data: students } = await supabaseAdmin.from("students").select("*");

    let matchedStudent = null;
    if (students) {
      matchedStudent = students.find(
        (s) =>
          content.toLowerCase().includes(s.name.toLowerCase()) ||
          (s.magic_token && content.includes(s.magic_token))
      );
    }

    if (!matchedStudent) {
      return NextResponse.json({
        success: true,
        message: "Webhook received but no student matched content reference",
      });
    }

    // --- Step 4: Update INVOICE status (not sessions!) ---
    const currentMonth = new Date().toISOString().slice(0, 7); // "2026-10"

    const { data: invoice } = await supabaseAdmin
      .from("invoices")
      .select("*")
      .eq("student_id", matchedStudent.id)
      .eq("month", currentMonth)
      .single();

    if (invoice) {
      // Update existing invoice
      await supabaseAdmin
        .from("invoices")
        .update({
          status: amount >= Number(invoice.total_amount) ? "paid" : "partially_paid",
          paid_at: new Date().toISOString(),
          payment_reference: content,
        })
        .eq("id", invoice.id);
    } else {
      // Create invoice record if none exists
      await supabaseAdmin.from("invoices").insert({
        student_id: matchedStudent.id,
        month: currentMonth,
        total_amount: amount,
        status: "paid",
        paid_at: new Date().toISOString(),
        payment_reference: content,
      });
    }

    console.log(
      `✅ Webhook: Student "${matchedStudent.name}" — invoice marked as PAID (${amount.toLocaleString()} VNĐ)`
    );

    return NextResponse.json({
      success: true,
      message: `Tuition paid for student ${matchedStudent.name}`,
      studentId: matchedStudent.id,
      amount,
    });
  } catch (error: any) {
    console.error("❌ Payment Webhook Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
