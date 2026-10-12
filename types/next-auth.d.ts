import type { DefaultSession } from "next-auth";
import type { Role } from "@/lib/access";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      mustChangePassword: boolean;
    } & DefaultSession["user"];
  }
  interface User {
    role?: Role;
    mustChangePassword?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    sub: string;
    role?: Role;
    mustChangePassword?: boolean;
  }
}
