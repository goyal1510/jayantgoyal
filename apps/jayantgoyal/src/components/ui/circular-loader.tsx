export function CircularLoader() {
  const text = "JAYANT GOYAL \u00B7 ";
  const characters = text.split("");
  const totalChars = characters.length;

  return (
    <div className="flex min-h-[200px] items-center justify-center">
      <div className="relative h-28 w-28 animate-[spin_8s_linear_infinite]">
        {characters.map((char, i) => (
          <span
            key={i}
            className="absolute left-1/2 top-0 inline-block origin-[0_56px] text-xs font-semibold tracking-widest text-muted-foreground uppercase"
            style={{ transform: `rotate(${(360 / totalChars) * i}deg)` }}
          >
            {char}
          </span>
        ))}
        <div className="absolute inset-0 m-auto h-2 w-2 rounded-full bg-muted-foreground/40" />
      </div>
    </div>
  );
}
