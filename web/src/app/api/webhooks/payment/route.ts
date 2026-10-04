import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("💳 Payment Webhook Received:", body);

    // Payload structure support for PayOS / Casso / SeABank
    const content = body.content || body.description || body.data?.description || "";
    const amount = Number(body.amount || body.data?.amount || 0);

    if (!content) {
      return NextResponse.json({ success: false, error: "Missing transaction content" }, { status: 400 });
    }

    // Match student token or name from transaction reference content (e.g. "Dong hoc phi 05/10 Nguyen Van A")
    const { data: students } = await supabase.from("students").select("*");

    let matchedStudent = null;
    if (students) {
      matchedStudent = students.find((s) => 
        content.toLowerCase().includes(s.name.toLowerCase()) || 
        (s.magic_token && content.includes(s.magic_token))
      );
    }

    if (matchedStudent) {
      // Mark all sessions in the current month for this student as COMPLETED
      await supabase
        .from("class_sessions")
        .update({ status: "COMPLETED" })
        .eq("student_name", matchedStudent.name);

      console.log(`✅ Webhook auto-matched student "${matchedStudent.name}" and marked tuition as PAID!`);

      return NextResponse.json({
        success: true,
        message: `Tuition paid for student ${matchedStudent.name}`,
        studentId: matchedStudent.id,
        amount,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Webhook received but no student matched content reference",
    });
  } catch (error: any) {
    console.error("❌ Payment Webhook Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
