"use client";

import { PopoverWrapper } from "@/components/Popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { LucideAlarmClock } from "lucide-react";
import { useEffect, useState } from "react";
import CallSettingsForm from "./CallSettingsForm";
import { useSchedule } from "../context/ScheduleContext";

export default function CalendarSchedule() {
  const { state, dispatch } = useSchedule();
  const [date, setDate] = useState<Date | undefined>(new Date(state?.callDate));

  useEffect(() => {
    if (date) {
      dispatch({
        type: "SET_CALL_DATE",
        payload: { type: "date", value: date.toDateString() },
      });
    }
  }, [date, dispatch]);

  return (
    <PopoverWrapper
      trigger={
        <Button>
          <LucideAlarmClock /> Schedule
        </Button>
      }
      side="bottom"
      align="end"
    >
      <Calendar mode="single" selected={date} onSelect={setDate} />
      <CallSettingsForm />
    </PopoverWrapper>
  );
}
