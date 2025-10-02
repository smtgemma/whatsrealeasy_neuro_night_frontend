"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import Selector from "@/components/Selector";
import { Slider } from "@/components/ui/slider";
import { useSchedule } from "@/features/schedule/context/ScheduleContext";
import { Input } from "@/components/ui/input";
import Button from "@/components/Button";
import { toast } from "sonner";

export default function ScheduleForm() {
  const { state, dispatch } = useSchedule();
  const { calculateTotalCalls } = useSchedule();
  const totalCallsToday = calculateTotalCalls();

  // Dispatch helpers
  const handleDurationChange = (val: number[]) => {
    dispatch({
      type: "SET_CALL_DURATION",
      payload: { type: "duration", value: val[0] },
    });
  };

  const handleGapChange = (val: number[]) => {
    dispatch({
      type: "SET_CALL_GAP",
      payload: { type: "duration", value: val[0] },
    });
  };

  const handleStartTimeChange = (time24: string) => {
    dispatch({
      type: "SET_CALL_START",
      payload: { type: "time", value: time24 },
    });
  };

  const handleEndTimeChange = (time24: string) => {
    dispatch({
      type: "SET_CALL_END",
      payload: { type: "time", value: time24 },
    });
  };

  const handleBatchNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({
      type: "SET_BATCH_NUMBER",
      payload: e.target.value,
    });
  };

  return (
    <div className="flex flex-col gap-6 mt-6 text-white">
      {/* Start Time */}
      <div className="flex flex-col gap-2">
        <Label>Start Time:</Label>
        <CallTimePicker
          initialSeconds={state.callStartTime}
          onChange={handleStartTimeChange}
        />
      </div>

      {/* End Time */}
      <div className="flex flex-col gap-2">
        <Label>End Time:</Label>
        <CallTimePicker
          initialSeconds={state.callEndTime}
          onChange={handleEndTimeChange}
        />
      </div>

      {/* Call Duration */}
      <div className="flex flex-col gap-2">
        <Label>
          Call Duration ({state.MIN_CALL_DURATION / 60}m –{" "}
          {state.MAX_CALL_DURATION / 60}m)
        </Label>
        <Slider
          min={state.MIN_CALL_DURATION}
          max={state.MAX_CALL_DURATION}
          step={40}
          value={[state.callDuration]}
          onValueChange={handleDurationChange}
        />
        <span className="text-sm text-gray-400">
          {(state.callDuration / 60).toFixed(1)} min – (
          {((state.callDuration / 60) * 60).toFixed(0)} sec)
        </span>
      </div>

      {/* Call Gap */}
      <div className="flex flex-col gap-2">
        <Label>
          Call Gap ({state.MIN_CALL_GAP}s – {state.MAX_CALL_GAP}s)
        </Label>
        <Slider
          min={5}
          max={15}
          step={1}
          value={[state.callGap || 5]}
          onValueChange={handleGapChange}
        />
        <span className="text-sm text-gray-400">{state.callGap || 5} sec</span>
      </div>
      <div className="flex flex-col gap-2">
        <Label>Total Numbers in Each Batch</Label>
        <Input
          defaultValue={state.batchNumber}
          onChange={handleBatchNumberChange}
          placeholder="7"
          max={10}
          min={1}
          type="number"
        />
      </div>
      <Button
        onClick={() => {
          toast.success(`All calls have been calculated ${totalCallsToday}`);
        }}
        size="sm"
      >
        Calculate Calls
      </Button>
    </div>
  );
}

// ---- Time Picker Component ----

const to24HourFormat = (hour: string, minute: string, ampm: string) => {
  let h = parseInt(hour, 10);
  if (ampm === "PM" && h !== 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${minute}`;
};

function CallTimePicker({
  onChange,
  initialSeconds, // 👈 pass unix seconds here
}: {
  onChange?: (time24: string) => void;
  initialSeconds?: number;
}) {
  // --- derive initial values ---
  const getTimeFromSeconds = (seconds?: number) => {
    const date = seconds ? new Date(seconds * 1000) : new Date();
    let h = date.getHours();
    const m = String(date.getMinutes()).padStart(2, "0");
    const ampmVal = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return {
      hour: String(h),
      minute: m,
      ampm: ampmVal,
    };
  };

  const initial = getTimeFromSeconds(initialSeconds);

  // --- state ---
  const [hour, setHour] = React.useState(initial.hour);
  const [minute, setMinute] = React.useState(initial.minute);
  const [ampm, setAmPm] = React.useState(initial.ampm);

  // Sync state when initialSeconds changes
  React.useEffect(() => {
    const newTime = getTimeFromSeconds(initialSeconds);
    setHour(newTime.hour);
    setMinute(newTime.minute);
    setAmPm(newTime.ampm);
  }, [initialSeconds]);

  React.useEffect(() => {
    // trigger onChange once on mount
    onChange?.(to24HourFormat(initial.hour, initial.minute, initial.ampm));
  }, []);

  const handleHour = (val: string | ((prevState: string) => string)) => {
    const newHour = typeof val === "function" ? val(hour) : val;
    setHour(newHour);
    onChange?.(to24HourFormat(newHour, minute, ampm));
  };

  const handleMinute = (val: string | ((prevState: string) => string)) => {
    const newMinute = typeof val === "function" ? val(minute) : val;
    setMinute(newMinute);
    onChange?.(to24HourFormat(hour, newMinute, ampm));
  };

  const handleAmPm = (val: string | ((prevState: string) => string)) => {
    const newAmPm = typeof val === "function" ? val(ampm) : val;
    setAmPm(newAmPm);
    onChange?.(to24HourFormat(hour, minute, newAmPm));
  };

  return (
    <div className="flex items-center">
      <Selector
        className="flex-1"
        options={Array.from({ length: 12 }, (_, i) => String(i + 1))}
        value={hour}
        setValue={handleHour}
      />
      <span className="text-2xl mx-1">:</span>
      <Selector
        className="flex-1"
        options={Array.from({ length: 60 }, (_, i) =>
          String(i).padStart(2, "0")
        )}
        value={minute}
        setValue={handleMinute}
      />
      <Selector
        className="flex-1 ml-2"
        options={["AM", "PM"]}
        value={ampm}
        setValue={handleAmPm}
      />
    </div>
  );
}