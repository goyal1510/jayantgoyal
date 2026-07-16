import { CircularLoader } from "@/components/ui/circular-loader";

export default function LoaderPreview() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background text-foreground">
      <CircularLoader />
    </div>
  );
}
