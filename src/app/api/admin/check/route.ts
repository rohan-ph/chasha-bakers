import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const session = cookieStore.get("chasha_admin_session");
  
  if (session && session.value) {
    return NextResponse.json({ authenticated: true, username: session.value });
  }
  
  return NextResponse.json({ authenticated: false }, { status: 401 });
}
