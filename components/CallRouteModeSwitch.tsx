"use client";

import { useState, useEffect } from "react";
import { Loader2, CheckCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import * as path from "@/paths";
import { usePathname, useRouter } from "next/navigation";
import { useSidebar } from "@/features/dashboard/layout";
import { CallIcon } from "./Icons";
import { motion } from "framer-motion";

interface SuccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inBound: boolean;
  outBound: boolean;
}

const INBOUND = "dashboard/super-admin/inbound";
const OUTBOUND = "dashboard/super-admin/outbound";
const MODAL_DURATION = 1000;

export default function CallRouteModeSwitch() {
  const pathname = usePathname();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isInbound = pathname.includes(INBOUND);
  const isOutbound = pathname.includes(OUTBOUND);

  const { isExpanded } = useSidebar();

  // Determine button text dynamically
  const buttonText = isInbound
    ? "Switch to Outbound call"
    : isOutbound
    ? "Switch to Inbound call"
    : "Switch to Inbound call";

  return (
    <div className="bg-blue rounded overflow-hidden">
      <button
        className={cn(
          "flex items-center whitespace-nowrap h-10 p-0! gap-0! bg-transparent cursor-pointer overflow-hidden"
        )}
        onClick={() => setIsModalOpen(true)}
      >
        <span className="flex h-10 w-12 shrink-0 items-center justify-center">
          <CallIcon className="size-4" />
        </span>

        {isExpanded && <AnimatedLabel>{buttonText}</AnimatedLabel>}
      </button>

      <SuccessModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        inBound={isInbound}
        outBound={isOutbound}
      />
    </div>
  );
}

export function SuccessModal({
  open,
  onOpenChange,
  inBound,
  outBound,
}: SuccessModalProps) {
  const [isSuccess, setIsSuccess] = useState(false);
  const [showSuccessText, setShowSuccessText] = useState(false);
  const router = useRouter();

  // Dynamic texts based on call type
  const title = inBound
    ? "Switching to Outbound Call"
    : outBound
    ? "Switching to Inbound Call"
    : "Processing Request";
  const processingMessage = inBound
    ? "Switching your call to Outbound..."
    : outBound
    ? "Switching your call to Inbound..."
    : "Processing your request...";
  const successMessage = inBound
    ? "Outbound call activated successfully!"
    : outBound
    ? "Inbound call activated successfully!"
    : "Request completed successfully!";

  useEffect(() => {
    if (!open) return;

    setIsSuccess(false);
    setShowSuccessText(false);

    const timer = setTimeout(() => {
      setIsSuccess(true);

      const nextTimer = setTimeout(() => {
        setShowSuccessText(true);

        if (inBound) router.push(path.superAdminOutboundAnalyticsPath());
        if (outBound) router.push(path.superAdminInboundAnalyticsPath());

        handleClose();
      }, 200);

      return () => clearTimeout(nextTimer);
    }, MODAL_DURATION);

    return () => clearTimeout(timer);
  }, [open, inBound, outBound, router]);

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setIsSuccess(false);
      setShowSuccessText(false);
    }, 200);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md text-center bg-slate-900 border-slate-800"
        showCloseButton={false}
      >
        <div className="flex flex-col items-center justify-center space-y-6 py-8">
          {/* Icon */}
          <div className="relative">
            {!isSuccess ? (
              <Loader2
                className={cn(
                  "h-16 w-16 text-primary animate-spin transition-all duration-500",
                  isSuccess && "opacity-0 scale-95"
                )}
              />
            ) : (
              <CheckCircle
                className={cn(
                  "h-16 w-16 transition-all duration-500",
                  isSuccess
                    ? "text-green-500 opacity-100 scale-100"
                    : "text-primary opacity-0 scale-95"
                )}
              />
            )}
          </div>

          <DialogTitle className="sr-only">
            {isSuccess ? "Success" : title}
          </DialogTitle>

          <div className="space-y-2">
            <DialogDescription asChild>
              <p
                className={cn(
                  "text-lg font-medium transition-opacity duration-300 text-white",
                  !isSuccess ? "opacity-100" : "opacity-0"
                )}
              >
                {processingMessage}
              </p>
            </DialogDescription>

            <p
              className={cn(
                "text-lg font-medium text-green-600 transition-opacity duration-300",
                showSuccessText ? "opacity-100" : "opacity-0"
              )}
            >
              {successMessage}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const animatedLabelVariants = {
  collapsed: {
    opacity: 0,
  },
  expanded: {
    opacity: 1,
  },
};

function AnimatedLabel({ children }: React.PropsWithChildren) {
  const { isExpanded } = useSidebar();

  return (
    isExpanded && (
      <motion.span
        variants={animatedLabelVariants}
        initial="collapsed"
        animate="expanded"
      >
        {children}
      </motion.span>
    )
  );
}
