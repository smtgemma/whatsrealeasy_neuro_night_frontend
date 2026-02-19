// app/api/files/route.ts
import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import Papa from "papaparse";

// -------------------------------
// Types
// -------------------------------
type ParsedRow = Record<string, string | number | null | undefined>;
type ParsedData = ParsedRow[];

// -------------------------------
// Main Handler
// -------------------------------
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "No valid file provided" },
        { status: 400 },
      );
    }

    const buffer = await file.arrayBuffer();
    const filename = file.name.toLowerCase();
    let phoneRowCount = 0;

    if (filename.endsWith(".csv")) {
      // Handle CSV files
      const text = new TextDecoder().decode(buffer);
      const result = Papa.parse<ParsedRow>(text, {
        dynamicTyping: true,
        skipEmptyLines: true,
        header: true,
      });

      if (!Array.isArray(result.data)) {
        return NextResponse.json(
          { error: "Invalid CSV structure" },
          { status: 400 },
        );
      }

      phoneRowCount = countPhoneRows(result.data);
    } else if (filename.endsWith(".xlsx") || filename.endsWith(".xls")) {
      // Handle Excel files
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json<ParsedRow>(firstSheet, {
        raw: false,
        defval: null,
      });

      phoneRowCount = countPhoneRows(data);
    } else {
      return NextResponse.json(
        {
          error:
            "Unsupported file format. Only CSV, XLS, and XLSX are supported.",
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      filename: file.name,
      count: phoneRowCount,
    });
  } catch (error) {
    console.error("Error processing file:", error);
    return NextResponse.json(
      { error: "Failed to process file" },
      { status: 500 },
    );
  }
}

// -------------------------------
// Helpers
// -------------------------------

// ✅ Robust phone number regex
// Supports +, (), -, spaces, and requires ≥7 digits total
// Examples matched:
// +8801711223344, (02) 1234567, 01711-223344, +1 (555) 234-5678
const phoneRegex = /^\+?\s*(?:\(?\d{1,4}\)?[\s-]*)?(?:\d[\s-]*){6,}\d$/;

// -------------------------------
// Core Counting Logic
// -------------------------------
function countPhoneRows(data: ParsedData): number {
  return data.filter((row) =>
    Object.values(row).some((value) => {
      // Handle null/undefined
      if (value === null || value === undefined) return false;

      // Convert number or other values to string for regex testing
      const stringValue = String(value).trim();
      if (stringValue === "") return false;

      // Check single phone match
      if (phoneRegex.test(stringValue)) return true;

      // Check for multiple phones in one cell (e.g. "01711-223344 / 01833-445566")
      const phones = stringValue.split(/[\/,;|]+/).map((v) => v.trim());
      return phones.some((num) => phoneRegex.test(num));
    }),
  ).length;
}
