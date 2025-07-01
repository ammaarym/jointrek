import { useState, useRef, useEffect } from "react";
import { ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  maxSelections?: number;
  className?: string;
}

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "Select options...",
  maxSelections,
  className,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOptionClick = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter(v => v !== optionValue));
    } else {
      if (maxSelections && value.length >= maxSelections) {
        return; // Don't add if max selections reached
      }
      onChange([...value, optionValue]);
    }
  };

  const removeTag = (tagValue: string) => {
    onChange(value.filter(v => v !== tagValue));
  };

  const selectedOptions = options.filter(option => value.includes(option.value));

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div
        className={cn(
          "flex min-h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
          "cursor-pointer focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
          isOpen && "ring-2 ring-ring ring-offset-2"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex flex-1 flex-wrap gap-1">
          {selectedOptions.length === 0 ? (
            <span className="text-muted-foreground">{placeholder}</span>
          ) : (
            selectedOptions.map((option) => (
              <span
                key={option.value}
                className="flex items-center gap-1 rounded-sm bg-orange-100 px-2 py-1 text-xs text-orange-800"
              >
                {option.label}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeTag(option.value);
                  }}
                  className="hover:bg-orange-200 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))
          )}
        </div>
        <ChevronDown className={cn("h-4 w-4 opacity-50 transition-transform", isOpen && "rotate-180")} />
      </div>

      {isOpen && (
        <div className="absolute top-full z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
          {maxSelections && (
            <div className="px-2 py-1 text-xs text-muted-foreground">
              {value.length}/{maxSelections} selected
            </div>
          )}
          {options.map((option) => {
            const isSelected = value.includes(option.value);
            const isDisabled = maxSelections && value.length >= maxSelections && !isSelected;
            
            return (
              <div
                key={option.value}
                className={cn(
                  "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none",
                  isSelected && "bg-orange-100 text-orange-900",
                  !isSelected && !isDisabled && "hover:bg-accent hover:text-accent-foreground",
                  isDisabled && "cursor-not-allowed opacity-50"
                )}
                onClick={() => !isDisabled && handleOptionClick(option.value)}
              >
                <div className={cn("mr-2 h-4 w-4 rounded border", isSelected && "bg-orange-600 border-orange-600")}>
                  {isSelected && <div className="h-full w-full flex items-center justify-center text-white text-xs">✓</div>}
                </div>
                {option.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}