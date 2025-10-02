"use client";

import { toast } from "sonner";
import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  type ReactNode,
  type Dispatch,
} from "react";
import normalizeToSeconds from "@/lib/normalizeToSeconds";

interface ScheduleProviderProps {
  children: ReactNode;
}

type State = {
  callDuration: number; // in seconds
  callGap: number; // in seconds
  callStartTime: number; // timestamp in seconds
  callEndTime: number; // timestamp in seconds
  callDate: number; // timestamp in seconds
  batchNumber: number; // number of simultaneous calls per batch
  MIN_CALL_DURATION: number;
  MAX_CALL_DURATION: number;
  MIN_CALL_GAP: number;
  MAX_CALL_GAP: number;
};

type Action =
  | { type: "SET_CALL_DURATION"; payload: { type: "duration"; value: number } }
  | { type: "SET_CALL_GAP"; payload: { type: "duration"; value: number } }
  | {
      type: "SET_CALL_START";
      payload: { type: "time" | "datetime"; value: string };
    }
  | {
      type: "SET_CALL_END";
      payload: { type: "time" | "datetime"; value: string };
    }
  | { type: "SET_CALL_DATE"; payload: { type: "date"; value: string } }
  | { type: "SET_BATCH_NUMBER"; payload: string }
  | { type: "RESET"; payload: {} };

interface ScheduleContextValue {
  state: State;
  dispatch: Dispatch<Action>;
  calculateTotalCalls: () => number;
}

const LOCAL_STORAGE_KEY = "scheduleState";

const DEFAULT_STATE: State = {
  callDuration: 150,
  callGap: 10,
  callStartTime: 0,
  callEndTime: 0,
  callDate: 0,
  batchNumber: 7,
  MIN_CALL_DURATION: 150,
  MAX_CALL_DURATION: 600,
  MIN_CALL_GAP: 5,
  MAX_CALL_GAP: 15,
};

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "SET_CALL_DURATION":
      return {
        ...state,
        callDuration: normalizeToSeconds("duration", action.payload.value),
      };
    case "SET_CALL_GAP":
      return {
        ...state,
        callGap: normalizeToSeconds("duration", action.payload.value),
      };
    case "SET_CALL_START": {
  const startTime = normalizeToSeconds(
    action.payload.type,
    action.payload.value
  );

  let newEndTime = state.callEndTime;

  // If current end time is not valid or too early, auto-adjust it
  if (!newEndTime || newEndTime < startTime + 600) {
    newEndTime = startTime + 600;
  }

  return {
    ...state,
    callStartTime: startTime,
    callEndTime: newEndTime,
  };
};
    case "SET_CALL_END":
      return {
        ...state,
        callEndTime: normalizeToSeconds(
          action.payload.type,
          action.payload.value
        ),
      };
    case "SET_CALL_DATE":
      return {
        ...state,
        callDate: normalizeToSeconds("date", action.payload.value),
      };
    case "SET_BATCH_NUMBER":
      return { ...state, batchNumber: Number(action.payload) };
    case "RESET":
      return DEFAULT_STATE;
    default:
      return state;
  }
};

const ScheduleContext = createContext<ScheduleContextValue | null>(null);

export default function ScheduleProvider({ children }: ScheduleProviderProps) {
  const [state, dispatch] = useReducer(reducer, DEFAULT_STATE, (initial) => {
    if (typeof window === "undefined") return initial;
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      return stored ? JSON.parse(stored) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.error("Failed to save schedule state:", err);
    }
  }, [state]);

  // -------------------- Total calls calculation --------------------
  const calculateTotalCalls = (): number => {
    const { callStartTime, callEndTime, callDuration, callGap, batchNumber } =
      state;

    if (!callStartTime || !callEndTime || callEndTime <= callStartTime)
      return 0;

    const timeDifference = callEndTime - callStartTime; // in seconds
    const totalCallTime = callDuration + callGap; // seconds per call
    const totalCalls = (timeDifference / totalCallTime) * batchNumber;

    return Math.floor(totalCalls); // return integer
  };

  return (
    <ScheduleContext.Provider value={{ state, dispatch, calculateTotalCalls }}>
      {children}
    </ScheduleContext.Provider>
  );
}

export function useSchedule() {
  const context = useContext(ScheduleContext);
  if (!context) {
    toast.error("useSchedule must be used within a ScheduleProvider");
    throw new Error("useSchedule must be used within a ScheduleProvider");
  }
  return context;
}
