import { NextResponse } from "next/server";
import crypto from "crypto";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password required" }, { status: 400 });
    }

    const inputHash = hashPassword(password);
    let isAuthenticated = false;

    // Try Firestore first
    if (isFirebaseConfigured && db) {
      try {
        const adminDoc = await Promise.race([
          getDoc(doc(db, "admin_credentials", username)),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Database login check timeout")), 3000)
          )
        ]);
        if (adminDoc.exists()) {
          const data = adminDoc.data();
          if (data.passwordHash === inputHash) {
            isAuthenticated = true;
          }
        }
      } catch (e) {
        console.warn("Firestore admin credential check failed or timed out, checking fallback:", e);
      }
    }

    // Fallback/Simulated local check if not authenticated via Firestore
    if (!isAuthenticated) {
      const fallbackUser = "admin";
      const fallbackHash = "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918"; // SHA256 of "admin"
      if (username === fallbackUser && inputHash === fallbackHash) {
        isAuthenticated = true;
      }
    }

    if (isAuthenticated) {
      const response = NextResponse.json({ success: true, username });
      // Set a session cookie (for production netlify / serverless environments)
      // Note: we can also verify this on `/admin` page
      response.cookies.set("chasha_admin_session", username, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24, // 1 day
        path: "/",
      });
      return response;
    } else {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }
  } catch (error: any) {
    console.error("Admin login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
