/**
 * Owner-tier rules for Settings → Team. Mirrors the server checks in
 * change_member_role_atomic / delete_member_atomic / transfer_master_owner_atomic.
 * The server is the real gate; this only decides what the screen offers.
 */
export interface GovernanceCtx {
  callerId: string | null | undefined;
  masterOwnerId: string | null | undefined;
}
export interface GovTarget {
  userId: string;
  isOwner: boolean;
}

export const isMasterOwner = (ctx: GovernanceCtx, userId?: string | null) =>
  !!userId && !!ctx.masterOwnerId && ctx.masterOwnerId === userId;

const callerIsMaster = (ctx: GovernanceCtx) => isMasterOwner(ctx, ctx.callerId);

/** Can the caller change this member's job or remove them? */
export function canManageMember(ctx: GovernanceCtx, t: GovTarget): boolean {
  if (!ctx.callerId || t.userId === ctx.callerId) return false;
  if (isMasterOwner(ctx, t.userId)) return false;
  if (t.isOwner) return callerIsMaster(ctx);
  return true;
}

export const canAssignOwner = (ctx: GovernanceCtx) => callerIsMaster(ctx);
export const canHandOver = (ctx: GovernanceCtx) => callerIsMaster(ctx);

/** Same comparison as the server: trimmed, case-insensitive. */
export const confirmMatches = (typed: string, businessName: string) =>
  typed.trim().toLowerCase() === businessName.trim().toLowerCase() && businessName.trim() !== "";
