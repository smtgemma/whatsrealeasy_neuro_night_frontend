

import { NextResponse } from "next/server";
import { getAccessToken } from "@/lib/getServerAuth";
import { safeAsync } from "@/lib/safeAsync";

export async function GET() {
  const token = await getAccessToken();

  const result = await safeAsync(async () => {
    const res = await fetch(
      `${process.env.API_BASE_URL}/appointments/auth/initiate`,
      {
        headers: {
          Authorization: token || "",
          "Content-Type": "application/json",
        },
      }
    );

    if (!res.ok) return Promise.reject("Failed request");

    const data = await res.json();
    return data;
  });

  console.log(result?.data)
  if (result.error) {
    console.error("Error:", result.error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }

  return NextResponse.json(result.data);
}