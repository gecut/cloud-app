import React from "react";
import { AlertTriangle, AlertCircle, Trash2, CheckCircle2, X } from "lucide-react";
import { Button } from "@gecut-cloud/ui/components/button";
import { ModalPortal } from "./modal-portal";

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info" | "success";
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "تأیید و ادامه",
  cancelText = "انصراف",
  variant = "danger",
  isLoading = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      iconBg: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
      icon: <Trash2 className="h-5 w-5" />,
      btn: "bg-rose-600 hover:bg-rose-500 text-white shadow-xs font-semibold",
    },
    warning: {
      iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
      icon: <AlertTriangle className="h-5 w-5" />,
      btn: "bg-amber-600 hover:bg-amber-500 text-white shadow-xs font-semibold",
    },
    info: {
      iconBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
      icon: <AlertCircle className="h-5 w-5" />,
      btn: "bg-blue-600 hover:bg-blue-500 text-white shadow-xs font-semibold",
    },
    success: {
      iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      icon: <CheckCircle2 className="h-5 w-5" />,
      btn: "bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs font-semibold",
    },
  }[variant];

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-150"
        onClick={(e) => {
          if (e.target === e.currentTarget && !isLoading) onClose();
        }}
      >
        <div className="relative w-full max-w-md m-auto rounded-2xl border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200 dir-rtl text-right">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-border/40">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl border ${variantStyles.iconBg}`}>
                {variantStyles.icon}
              </div>
              <div>
                <h3 className="font-bold text-sm text-foreground">{title}</h3>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="text-muted-foreground hover:text-foreground p-1 rounded-lg transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Content */}
          <div className="py-4 text-xs text-muted-foreground leading-relaxed">
            {description}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/40">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isLoading}
              className="rounded-xl text-xs cursor-pointer"
            >
              {cancelText}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                onConfirm();
              }}
              disabled={isLoading}
              className={`rounded-xl text-xs cursor-pointer ${variantStyles.btn}`}
            >
              {isLoading ? "در حال پردازش..." : confirmText}
            </Button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
