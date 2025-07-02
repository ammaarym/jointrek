import React from "react";
import { cn } from "@/lib/utils";

interface StarBorderProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function StarBorder({ children, className, onClick }: StarBorderProps) {
  return (
    <div 
      className={cn("relative inline-block", onClick && "cursor-pointer", className)}
      onClick={onClick}
    >
      <div
        className="relative overflow-hidden rounded-full p-[1px] backdrop-blur-3xl"
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
        <div className="relative z-10 flex h-full w-full items-center justify-center rounded-full backdrop-blur-xl px-12 py-5 text-2xl font-bold transition-transform hover:scale-105" style={{ backgroundColor: '#F5F0E8', color: '#8A6F47' }}>
          {children}
        </div>
      </div>
    </div>
  );
}