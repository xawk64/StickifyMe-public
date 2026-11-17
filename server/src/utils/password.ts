import bcrypt from "bcryptjs";

export const BCRYPT_ROUNDS = 12;

// Hash compared against when the user does not exist, so that a missing
// account takes as long to reject as a wrong password (no timing oracle).
const DUMMY_HASH = bcrypt.hashSync("dummy-password-for-timing", BCRYPT_ROUNDS);

export const hashPassword = (password: string): Promise<string> =>
  bcrypt.hash(password, BCRYPT_ROUNDS);

export const verifyPassword = (
  password: string,
  hash: string | undefined,
): Promise<boolean> => bcrypt.compare(password, hash || DUMMY_HASH);
