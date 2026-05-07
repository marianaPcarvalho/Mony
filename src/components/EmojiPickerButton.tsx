import { useState } from "react";
import EmojiPicker, { EmojiStyle, Theme } from "emoji-picker-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

interface Props {
  value: string;
  onChange: (emoji: string) => void;
  size?: "sm" | "md" | "lg";
  ariaLabel?: string;
}

export function EmojiPickerButton({ value, onChange, size = "md", ariaLabel = "Pick emoji" }: Props) {
  const [open, setOpen] = useState(false);
  const sizes = {
    sm: "h-8 w-8 text-base",
    md: "h-10 w-10 text-xl",
    lg: "h-14 w-14 text-3xl",
  };
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={`${sizes[size]} p-0 shrink-0`}
          aria-label={ariaLabel}
        >
          <span aria-hidden="true">{value || "📦"}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 border-none bg-transparent shadow-xl w-auto" align="start">
        <EmojiPicker
          onEmojiClick={(e) => {
            onChange(e.emoji);
            setOpen(false);
          }}
          emojiStyle={EmojiStyle.NATIVE}
          theme={Theme.AUTO}
          searchPlaceholder="Search emoji…"
          width={320}
          height={400}
          previewConfig={{ showPreview: false }}
          lazyLoadEmojis
        />
      </PopoverContent>
    </Popover>
  );
}
