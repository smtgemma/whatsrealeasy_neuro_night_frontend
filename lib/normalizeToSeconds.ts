import { logError } from "./logger";

export default function normalizeToSeconds(
  type: "date" | "time" | "datetime" | "duration",
  value: string | number
): number {
  try {
    switch (type) {
      case "date": {
        const d = new Date(value as string);
        d.setHours(0, 0, 0, 0);
        return Math.floor(d.getTime() / 1000);
      }
      case "time": {
        const [hours, minutes] = (value as string).split(":").map(Number);
        const d = new Date();
        d.setHours(hours, minutes, 0, 0);
        return Math.floor(d.getTime() / 1000);
      }
      case "datetime": {
        const d = new Date(value as string);
        return Math.floor(d.getTime() / 1000);
      }
      case "duration": {
        return Math.floor(Number(value));
      }
      default:
        throw new Error(`Unsupported type: ${type}`);
    }
  } catch (err) {
    logError("normalizeToSeconds error:", err);
    return 0;
  }
}
