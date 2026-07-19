import { CircularLoader } from "@repo/ui/circular-loader";

export default function Loading() {
  return (
    <div className="flex min-h-svh items-center justify-center">
      <CircularLoader />
    </div>
  );
}
