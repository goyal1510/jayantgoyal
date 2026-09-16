type PublicBoardViewProps = {
  slug: string;
  projection: {
    board?: { name?: string; key?: string };
    columns?: Array<{ id: string; name: string; category: string }>;
    cards?: Array<{ number: number; title: string; column_id: string; priority: string }>;
  };
};

export function PublicBoardView({ slug, projection }: PublicBoardViewProps) {
  const columns = projection.columns ?? [];
  const cards = projection.cards ?? [];
  const columnNameById = new Map(columns.map((column) => [column.id, column.name]));

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <header className="space-y-1 border-b pb-4">
        <p className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
          Public board · {projection.board?.key}
        </p>
        <h1 className="text-2xl font-semibold">{projection.board?.name ?? slug}</h1>
        <p className="text-sm text-muted-foreground">Read-only projection. Assignees and comments are excluded.</p>
      </header>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {columns.map((column) => (
          <section key={column.id} className="rounded-lg border bg-muted/20 p-3">
            <h2 className="mb-2 text-sm font-semibold">{column.name}</h2>
            <ul className="space-y-2">
              {cards
                .filter((card) => card.column_id === column.id)
                .map((card) => (
                  <li key={`${card.number}-${card.title}`} className="rounded-md border bg-background px-3 py-2 text-sm">
                    <p className="font-medium">#{card.number} {card.title}</p>
                    <p className="text-xs capitalize text-muted-foreground">{card.priority}</p>
                  </li>
                ))}
            </ul>
            {cards.filter((card) => card.column_id === column.id).length === 0 ? (
              <p className="text-xs text-muted-foreground">No cards</p>
            ) : null}
          </section>
        ))}
      </div>
      {columns.length === 0 ? (
        <p className="text-sm text-muted-foreground">This published board has no columns yet.</p>
      ) : null}
      {cards.some((card) => !columnNameById.has(card.column_id)) ? null : null}
    </div>
  );
}
