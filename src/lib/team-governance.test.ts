import { describe, it, expect } from "vitest";
import { canManageMember, canAssignOwner, canHandOver, confirmMatches } from "./team-governance";

const master = { callerId: "M", masterOwnerId: "M" };
const owner = { callerId: "O", masterOwnerId: "M" };

describe("team governance", () => {
  it("regular Owner can manage non-owners", () => {
    expect(canManageMember(owner, { userId: "X", isOwner: false })).toBe(true);
  });
  it("regular Owner cannot manage another Owner", () => {
    expect(canManageMember(owner, { userId: "O2", isOwner: true })).toBe(false);
  });
  it("nobody can manage the Master Owner", () => {
    expect(canManageMember(owner, { userId: "M", isOwner: true })).toBe(false);
    expect(canManageMember(master, { userId: "M", isOwner: true })).toBe(false);
  });
  it("Master Owner can manage other Owners", () => {
    expect(canManageMember(master, { userId: "O", isOwner: true })).toBe(true);
  });
  it("no one manages themselves", () => {
    expect(canManageMember(owner, { userId: "O", isOwner: true })).toBe(false);
  });
  it("only the Master Owner can make Owners or hand over", () => {
    expect(canAssignOwner(master)).toBe(true);
    expect(canAssignOwner(owner)).toBe(false);
    expect(canHandOver(master)).toBe(true);
    expect(canHandOver(owner)).toBe(false);
  });
  it("with no Master Owner set, Owner tier is locked", () => {
    const none = { callerId: "O", masterOwnerId: null };
    expect(canAssignOwner(none)).toBe(false);
    expect(canManageMember(none, { userId: "O2", isOwner: true })).toBe(false);
  });
  it("handover confirmation matches business name ignoring case and spaces", () => {
    expect(confirmMatches(" ANAAR ", "anaar")).toBe(true);
    expect(confirmMatches("anar", "anaar")).toBe(false);
    expect(confirmMatches("", "")).toBe(false);
  });
});
