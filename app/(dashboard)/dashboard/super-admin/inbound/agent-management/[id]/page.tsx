"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import FileUpload, { useFormUpload } from "@/components/FileUpload";
import { useState } from "react";
import Button from "@/components/Button";
import { safeAsync } from "@/lib/safeAsync";
import { env } from "@/env";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

export default function CreateInboundAgent() {
  const searchParams = useSearchParams();

  const [formData, setFormData] = useState({
    serviceName: decodeURIComponent(searchParams.get("service") || ""),
    phoneNumber: decodeURIComponent(searchParams.get("phone") || ""),
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await safeAsync(
      async () => {
        toast.success("Updating agent...");
        const serviceCreate = await fetch(
          `${env.NEXT_PUBLIC_API_BASE_URL_AI_INBOUND}/services/create-service/?serviceName=${formData.serviceName}&phoneNumber=${formData.phoneNumber}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        const serviceCreateResponse: { db_record: { _id: string } } =
          await serviceCreate.json();

        if (formData.files.length > 0) {
          await uploadForm({
            serviceId: serviceCreateResponse.db_record._id,
            file: formData.files,
          });
        }

        const agentData = {
          params: {
            service_id: serviceCreateResponse.db_record._id,
            call_type: "inbound",
          },
          body: {
            first_message: formData.firstMessage,
            max_duration_seconds: 300,
            stability: 0.9,
            speed: 0.9,
            similarity_boost: 0.7,
            llm: "gemini-2.0-flash-lite",
            temperature: 0.9,
            daily_limit: 1000,
          },
        };

        const updateAgent = await fetch(
          `${env.NEXT_PUBLIC_API_BASE_URL_AI_INBOUND}/services/create-agent/?service_id=${agentData.params.service_id}&call_type=${agentData.params.call_type}`,
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
  };
  return (
    <div>
      <form onSubmit={handleSubmit}>
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
                value={formData.phoneNumber}
                onChange={handleFormdataChange}
              />
            </Label>
          </div>

          <Textarea
            name="greetingMessage"
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
          <Button size="sm">Update Agent</Button>
        </div>
      </form>
    </div>
  );
}
