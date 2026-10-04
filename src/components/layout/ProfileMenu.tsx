import { Link } from "react-router-dom";
import { LogOut, Settings } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/AuthContext";
import { useCan } from "@/hooks/useCan";
import { RoleAvatar, roleStyle } from "./RoleAvatar";

/** Computer-only account menu next to the bell: who you are, your access, Settings, Sign out. */
export function ProfileMenu() {
  const { userRole, profile, signOut } = useAuth();
  const canSettings = useCan("manage_team") === true;
  if (!profile) return null;
  const name = profile.full_name || profile.email || "";
  const access = roleStyle(userRole).label;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Account menu — ${access}`}
        className="touch-target hidden md:inline-flex ml-1 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <RoleAvatar role={userRole} name={name} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center gap-3 py-2 font-normal">
          <RoleAvatar role={userRole} name={name} size="md" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{profile.full_name || "Welcome"}</p>
            <p className="truncate text-xs text-muted-foreground">{profile.email}</p>
            <p className="mt-1 text-[11px] font-medium text-foreground/80">Your access: {access}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {canSettings && (
          <DropdownMenuItem asChild>
            <Link to="/settings" className="cursor-pointer"><Settings className="mr-2 h-4 w-4" />Settings</Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onSelect={() => { void signOut(); }} className="cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
