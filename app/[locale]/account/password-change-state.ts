// Plain (non-"use server") module for the password-change wizard's action
// state. A "use server" file may only export async functions, so the shared
// state shape + initial value live here.

export type PasswordStepState = {
  ok: boolean;
  note: string;
};

export const initialPasswordStepState: PasswordStepState = {
  ok: false,
  note: "",
};
