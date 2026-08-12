import { NextRequest, NextResponse } from "next/server";
import {
  checkPassword,
  createSessionToken,
  getSessionCookieName,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const password = String(body.password ?? "");

  if (!checkPassword(password)) {
    return NextResponse.json({ error: "Sai mật khẩu" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(getSessionCookieName(), await createSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
