export const ADMIN_EMAIL = "coreyloftus@gmail.com";

export const isAdminEmail = (email: string | null | undefined) =>
  email === ADMIN_EMAIL;
