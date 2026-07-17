export type SignOutScope = "local" | "global";

type SignOutClient<Result> = {
  auth: {
    signOut(options: { scope: SignOutScope }): Promise<Result>;
  };
};

export function signOutSession<Result>(
  client: SignOutClient<Result>,
  scope: SignOutScope = "local",
): Promise<Result> {
  return client.auth.signOut({ scope });
}
