import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, SelectUser } from "@/db/schema";


export async function GET(req: Request) {
  try {
    const usersList: SelectUser[] = await db.select().from(users);

    return NextResponse.json({ success: true, data: usersList }, { status: 200 });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
