import { NextResponse } from "next/server";
import crypto from "crypto";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { doc, setDoc, deleteDoc } from "firebase/firestore";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export async function POST(request: Request) {
  try {
    // 1. Verify active session
    const sessionCookie = request.headers
      .get("cookie")
      ?.split("; ")
      .find((row) => row.startsWith("chasha_admin_session="))
      ?.split("=")[1];

    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { oldUsername, newUsername, newPassword } = await request.json();

    if (!oldUsername || !newUsername || !newPassword) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const newHash = hashPassword(newPassword);

    if (isFirebaseConfigured && db) {
      try {
        await Promise.race([
          (async () => {
            // Create new credentials document
            await setDoc(doc(db, "admin_credentials", newUsername), {
              username: newUsername,
              passwordHash: newHash,
            });

            // If username changed, delete the old document
            if (oldUsername !== newUsername) {
              await deleteDoc(doc(db, "admin_credentials", oldUsername));
            }
          })(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Database write timeout")), 3000)
          ),
        ]);
      } catch (err: any) {
        console.warn("Firestore credential update failed or timed out:", err);
        return NextResponse.json({
          error: "Database update timed out. This usually happens because Cloud Firestore is disabled or not set up in your Firebase Console (project: chasha-bakers). Please enable Cloud Firestore in your console, or use the default credentials (admin / admin)."
        }, { status: 504 });
      }
    }

    // Return success response. We can clear the cookie to force re-login with new credentials!
    const response = NextResponse.json({ success: true });
    response.cookies.set("chasha_admin_session", "", {
      httpOnly: true,
      expires: new Date(0),
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Change credentials error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
