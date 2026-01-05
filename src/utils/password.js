import bcrypt from "bcrypt";
import { env } from "../config/env.js";

export const hashPassword = async (plain) => bcrypt.hash(plain, env.bcryptSaltRounds);

export const comparePassword = async (plain, hash) => bcrypt.compare(plain, hash);