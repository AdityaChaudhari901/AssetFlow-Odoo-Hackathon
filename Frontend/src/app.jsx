import { Navigate, Route, Routes } from "react-router";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16 text-foreground">
            <Card className="w-full max-w-3xl">
              <CardHeader>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  AssetFlow
                </p>
                <CardTitle className="text-4xl font-semibold tracking-tight sm:text-6xl">
                  <h1>Frontend foundation is ready.</h1>
                </CardTitle>
                <CardDescription className="max-w-2xl text-base leading-7 sm:text-lg">
                  React Router, Tailwind CSS, and shadcn/ui are configured for
                  the AssetFlow interface.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild size="lg">
                  <a
                    href="https://ui.shadcn.com/docs/components"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Browse shadcn components
                  </a>
                </Button>
              </CardContent>
            </Card>
          </main>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
