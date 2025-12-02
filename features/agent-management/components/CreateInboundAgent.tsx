"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import FileUpload, { useFormUpload } from "@/components/FileUpload";
import { FormEvent, useState, useTransition } from "react";
import Button from "@/components/Button";
import { safeAsync } from "@/lib/safeAsync";
import { env } from "@/env";
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
  const [formData, setFormData] = useState({
    serviceName: "",
    phoneNumber: "",
    greetingMessage: "",
    files: [] as File[],
  });

  const [voice, setVoice] = useState("male");

  const [isPending, startTransition] = useTransition();

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
          if (formData.files.length === 0) {
            toast.error("Please select a file");
            return;
          }

          toast.success("Creating agent...");

          // --- Create service ---
          const serviceCreate = await fetch(
            `${
              env.NEXT_PUBLIC_API_BASE_URL_AI_INBOUND
            }/services/create-service/?serviceName=${encodeURIComponent(
              formData.serviceName
            )}&phoneNumber=${encodeURIComponent(
              formData.phoneNumber
            )}&voice_gender=${voice}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          if (!serviceCreate.ok) {
            const errorBody = await serviceCreate.json().catch(() => null);
            toast.error(
              errorBody?.message || "Service creation failed. Please try again."
            );
            return;
          }

          const serviceCreateResponse: {
            db_record: { _id: string };
            message: string;
          } = await serviceCreate.json();

          if (
            "message" in serviceCreateResponse &&
            serviceCreateResponse.message.includes(
              "service already exists with that phone number"
            )
          ) {
            toast.error(serviceCreateResponse.message);
            return;
          }

          // --- Upload file ---
          await uploadForm({
            serviceId: serviceCreateResponse.db_record._id,
            file: formData.files,
          });

          // --- Prepare agent data ---
          const agentData = {
            params: {
              service_id: serviceCreateResponse.db_record._id,
              call_type: "inbound",
            },
            body: {
              first_message: formData.greetingMessage,
              max_duration_seconds: 300,
              stability: 0.9,
              speed: 0.9,
              similarity_boost: 0.7,
              llm: "gemini-2.5-flash",
              temperature: 0.9,
              daily_limit: 1000,
            },
          };

          // --- Create agent ---
          const createAgent = await fetch(
            `${env.NEXT_PUBLIC_API_BASE_URL_AI_INBOUND}/services/create-agent/?service_id=${serviceCreateResponse.db_record._id}&call_type=${agentData.params.call_type}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(agentData.body),
            }
          );

          if (!createAgent.ok) {
            toast.error("Failed to create agent");
            return;
          }

          await createAgent.json();
          toast.success("Agent created successfully");
        },
        { client: true }
      );
    });
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        <fieldset
          disabled={isPending}
          className={cn({ "opacity-50 cursor-progress": isPending })}
        >
          <div className="flex flex-col gap-4">
            <div className="flex gap-4">
              <Label className="flex-1">
                <Input
                  name="serviceName"
                  type="text"
                  placeholder="Service name"
                  onChange={handleFormdataChange}
                />
              </Label>
              <Label className="flex-1">
                <Input
                  name="phoneNumber"
                  type="text"
                  placeholder="Phone number"
                  onChange={handleFormdataChange}
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
              name="greetingMessage"
              placeholder="Write a greeting message"
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
              {isPending ? "Creating Agent..." : "Create Agent"}
            </Button>
          </div>
        </fieldset>
      </form>
    </>
  );
}
