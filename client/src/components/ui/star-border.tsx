import React from "react";
import { cn } from "@/lib/utils";

interface StarBorderProps {
  children: React.ReactNode;
  className?: string;
}

export function StarBorder({ children, className }: StarBorderProps) {
  return (
    <div className={cn("relative inline-block", className)}>
      <div
        className="relative overflow-hidden rounded-2xl p-[1px] backdrop-blur-3xl"
        style={{
          background: `
            linear-gradient(90deg, transparent, #B8956B, transparent),
            linear-gradient(90deg, transparent, #9B7F56, transparent)
          `,
        }}
      >
        <div
          className="animate-rotate absolute inset-0 h-full w-full rounded-full"
          style={{
            background: `
              conic-gradient(
                from 0deg,
                transparent,
                #B8956B,
                #9B7F56,
                #B8956B,
                transparent
              )
            `,
          }}
        />
        <div className="relative z-10 flex h-full w-full items-center justify-center rounded-2xl bg-white/95 backdrop-blur-xl px-8 py-3 text-lg font-bold" style={{ color: '#8A6F47' }}>
          {children}
        </div>
      </div>
    </div>
  );
}