import { BotAvatar } from "bot-avatars";

/** Owner's square bot picture — calm: no idle jumps, small head turn, no pointer play. */
export default function OwnerBot({ size }: { size: number }) {
  return <BotAvatar type="square" size={size} jumpEvery={0} turn={0.5} interactive={false} />;
}
