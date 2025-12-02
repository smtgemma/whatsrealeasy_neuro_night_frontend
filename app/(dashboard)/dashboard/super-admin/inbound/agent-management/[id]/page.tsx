"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import FileUpload, { useFormUpload } from "@/components/FileUpload";
import { FormEvent, useState, useTransition } from "react";
import Button from "@/components/Button";
import { safeAsync } from "@/lib/safeAsync";
import { env } from "@/env";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function CreateInboundAgent() {
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const serviceId = decodeURIComponent(searchParams.get("serviceId") || "");
  const [voice, setVoice] = useState("male");

  const agentId = decodeURIComponent(searchParams.get("agentId") || "");

  const [formData, setFormData] = useState({
    serviceName: decodeURIComponent(searchParams.get("service") || ""),
    firstMessage: decodeURIComponent(searchParams.get("message") || ""),
    files: [] as File[],
  });

  const handleFormdataChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const { uploadForm, uploading } = useFormUpload({
    url: `${env.NEXT_PUBLIC_API_BASE_URL_AI_INBOUND}/service-knowledge/knowledge-base/file`,
  });

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    startTransition(async () => {
      await safeAsync(
        async () => {
          // return;
          toast.success("Updating agent...");

          // --- Update service ---
          await fetch(
            `${env.NEXT_PUBLIC_API_BASE_URL_AI_INBOUND}/services/update-service/?service_id=${serviceId}&voice_gender=${voice}&agent_id=${agentId}`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                serviceName: formData.serviceName,
                phoneNumber: decodeURIComponent(
                  searchParams.get("phone") || ""
                ),
              }),
            }
          );

          await fetch(
            `${env.NEXT_PUBLIC_API_BASE_URL_AI_INBOUND}/services/update-agent/${agentId}?voice_gender=${voice}`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                serviceName: formData.serviceName,
                phoneNumber: decodeURIComponent(
                  searchParams.get("phone") || ""
                ),
              }),
            }
          );

          // --- Upload file (optional) ---
          if (formData.files.length > 0) {
            await uploadForm({
              serviceId: serviceId,
              file: formData.files,
            });
          }

          // --- Prepare agent data ---
          const agentData = {
            params: {
              service_id: serviceId,
              call_type: "inbound",
            },
            body: {
              first_message: formData.firstMessage,
              max_duration_seconds: 300,
              stability: 0.9,
              speed: 0.9,
              similarity_boost: 0.7,
              llm: "gemini-2.5-flash",
              temperature: 0.9,
              daily_limit: 1000,
            },
          };

          // --- Update agent ---
          const updateAgent = await fetch(
            `${env.NEXT_PUBLIC_API_BASE_URL_AI_INBOUND}/services/create-agent/?service_id=${serviceId}&call_type=${agentData.params.call_type}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(agentData.body),
            }
          );

          const updateAgentResponse = await updateAgent.json();

          if (updateAgentResponse.status === "success") {
            toast.success("Agent updated successfully");
          } else {
            toast.error("Failed to update agent");
          }
        },
        { client: true }
      );
    });
  };
  return (
    <div>
      <form onSubmit={handleSubmit}>
        <fieldset
          disabled={isPending}
          className={cn(isPending && "opacity-50 cursor-progress")}
        >
          <div className="flex flex-col gap-4">
            <div className="flex gap-4">
              <Label className="flex-1">
                <Input
                  name="serviceName"
                  type="text"
                  placeholder="Service name"
                  value={formData.serviceName}
                  onChange={handleFormdataChange}
                />
              </Label>
              <Label className="flex-1">
                <Input
                  name="phoneNumber"
                  type="text"
                  placeholder="Phone number"
                  value={decodeURIComponent(searchParams.get("phone") || "")}
                  readOnly
                />
              </Label>
              <Select value={voice} onValueChange={setVoice}>
                <SelectTrigger>
                  <SelectValue placeholder="Select voice" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Textarea
              name="firstMessage"
              placeholder="Write a greeting message"
              value={formData.firstMessage}
              onChange={handleFormdataChange}
            />
            <div className="space-y-2">
              <h2 className="text-sm">AI Guide Document</h2>
              <FileUpload
                onFilesChange={(files) => setFormData({ ...formData, files })}
                disabled={uploading}
                accept=".txt,text/plain"
              />
            </div>
          </div>
          <div className="flex justify-center mt-10">
            <Button size="sm">
              {isPending ? "Updating Agent..." : "Update agent"}
            </Button>
          </div>
        </fieldset>
      </form>
    </div>
  );
}
