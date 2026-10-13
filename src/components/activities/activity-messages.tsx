import { Avatar } from "@/components/ui/avatar";
import { formatTime } from "@/lib/dates";
import type { ActivityMessage } from "@/types";

export function ActivityMessages({
  messages,
  showTime = false,
}: {
  messages: readonly ActivityMessage[];
  showTime?: boolean;
}) {
  return (
    <ul className="space-y-2">
      {messages.map((message) => (
        <li
          key={message.id}
          className="flex items-start gap-2.5 rounded-xl bg-mist p-3"
        >
          <Avatar employee={message.author} size={28} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold">
                {message.author.name.split(" ")[0]}
              </span>
              {showTime && (
                <time
                  dateTime={message.sentAt}
                  className="text-[10px] text-muted"
                >
                  {formatTime(message.sentAt)}
                </time>
              )}
            </div>
            <p className="mt-1 break-words text-xs leading-5 text-muted">
              {message.text}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
