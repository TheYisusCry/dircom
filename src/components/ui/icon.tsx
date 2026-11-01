import type { HTMLAttributes, SVGProps } from "react";

type IconProps = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
  size?: number;
};

type SvgIconProps = Omit<SVGProps<SVGSVGElement>, "children"> & {
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
export const LayoutDashboard = symbol("dashboard");
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

export function Eye({
  size = 20,
  className = "",
  style,
  ...props
}: SvgIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      style={style}
      {...props}
    >
      <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function EyeOff({
  size = 20,
  className = "",
  style,
  ...props
}: SvgIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      style={style}
      {...props}
    >
      <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
      <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
      <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  );
}

export function User({
  size = 20,
  className = "",
  style,
  ...props
}: SvgIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      style={style}
      {...props}
    >
      <circle cx="12" cy="8" r="5" />
      <path d="M20 21a8 8 0 0 0-16 0" />
    </svg>
  );
}

export function AlertTriangle({
  size = 20,
  className = "",
  style,
  ...props
}: SvgIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      style={style}
      {...props}
    >
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" x2="12" y1="9" y2="13" />
      <line x1="12" x2="12.01" y1="17" y2="17" />
    </svg>
  );
}

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
