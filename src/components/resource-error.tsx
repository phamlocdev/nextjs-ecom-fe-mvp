import { AlertTriangle } from "lucide-react";

export function ResourceError({
  title,
  message,
  details,
}: {
  title: string;
  message: string;
  details?: string[];
}) {
  return (
    <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm">
      <div className="flex gap-3">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
        <div className="space-y-2">
          <div>
            <p className="font-medium text-destructive">{title}</p>
            <p className="text-muted-foreground">{message}</p>
          </div>
          {details && details.length > 0 ? (
            <ul className="list-disc space-y-1 pl-4 text-muted-foreground">
              {details.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </div>
  );
}
