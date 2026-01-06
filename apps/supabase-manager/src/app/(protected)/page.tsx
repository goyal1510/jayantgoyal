import Link from "next/link";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Page() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <h1 className="text-4xl font-bold">Welcome to Supabase Manager</h1>
      <p className="text-muted-foreground text-lg">
        Manage multiple Supabase projects from one place
      </p>
      <Link href="/users">
        <Button size="lg" className="gap-2">
          <Users className="h-5 w-5" />
          Manage Users
        </Button>
      </Link>
    </div>
  );
}

