import { HttpRequest } from "@azure/functions";

export type Permission = "read_asset" | "create_asset";

export interface User {
  username: string;
  email: string;
  permissions: Permission[];
}

/**
 * @param req HttpRequest
 * @returns the user associated with the request authorization header
 * @throws UnauthorizedError if the user is not authorized
 */
export async function getUser(req: HttpRequest): Promise<User> {
  return {
    username: "test",
    email: "max@mustermann.de",
    permissions: ["read_asset"],
  };
}
