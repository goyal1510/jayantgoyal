import Link from "next/link";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-muted-foreground">
        The short URL you&apos;re looking for doesn&apos;t exist or has been
        deactivated.
      </p>
      <Link
        href="/admin"
        className="text-sm text-primary underline underline-offset-4 hover:text-primary/80"
      >
        Go to Admin
      </Link>
    </div>
  );
}
