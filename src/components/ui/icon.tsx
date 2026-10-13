import type { HTMLAttributes } from "react";

type IconProps = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
  size?: number;
};

/** One local icon font for every navigation, form and action control. */
function symbol(name: string) {
  return function RoundedIcon({
    size = 20,
    className = "",
    style,
    ...props
  }: IconProps) {
    return (
      <span
        {...props}
        aria-hidden="true"
        className={`rounded-icon ${className}`}
        style={{ fontSize: size, width: size, height: size, ...style }}
      >
        {name}
      </span>
    );
  };
}

export const ArrowRight = symbol("arrow_forward");
export const ArrowUpRight = symbol("arrow_outward");
export const Cake = symbol("cake");
export const CalendarDays = symbol("calendar_month");
export const CalendarClock = symbol("event_upcoming");
export const PartyPopper = symbol("celebration");
export const CheckCircle2 = symbol("check_circle");
export const Clock3 = symbol("schedule");
export const Coffee = symbol("coffee");
export const CircleHelp = symbol("help");
export const LockKeyhole = symbol("lock");
export const MapPin = symbol("location_on");
export const Medal = symbol("workspace_premium");
export const Menu = symbol("menu");
export const MessageCircle = symbol("chat_bubble");
export const MessagesSquare = symbol("forum");
export const Plus = symbol("add");
export const Sparkles = symbol("auto_awesome");
export const Sprout = symbol("spa");
export const Trophy = symbol("emoji_events");
export const Users = symbol("groups");
export const Utensils = symbol("restaurant");
export const Vote = symbol("how_to_vote");
export const X = symbol("close");

const emoji = {
  cake: "🎂",
  party: "🎉",
  sparkles: "✨",
  trophy: "🏆",
  crown: "👑",
  gold: "🥇",
  silver: "🥈",
  bronze: "🥉",
  coffee: "☕",
  food: "🥟",
  social: "🎉",
} as const;

/** Colorful accents from the reference, paired with the rounded interface icons. */
export function IllustratedIcon({
  name,
  size = 24,
  className = "",
}: {
  name: keyof typeof emoji;
  size?: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`illustrated-icon ${className}`}
      style={{ fontSize: size }}
    >
      {emoji[name]}
    </span>
  );
}
