import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";

export function AuthPanel({ eyebrow, title, description, children, footer }) {
  return (
    <Card className="gap-0 border border-border/80 bg-card py-0 ring-0">
      <CardHeader className="gap-2 px-5 pb-5 pt-6 sm:px-7 sm:pt-7">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          {eyebrow}
        </p>
        <h1 className="text-2xl font-semibold tracking-[-0.025em] sm:text-[1.75rem]">
          {title}
        </h1>
        <CardDescription className="max-w-sm text-sm leading-6">
          {description}
        </CardDescription>
      </CardHeader>

      <CardContent className="px-5 pb-6 sm:px-7 sm:pb-7">{children}</CardContent>

      {footer ? (
        <CardFooter className="justify-center bg-muted/30 px-5 py-4 text-center text-sm sm:px-7">
          {footer}
        </CardFooter>
      ) : null}
    </Card>
  );
}
