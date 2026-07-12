import { Component } from "react";

import { Button } from "@/components/ui/button";

export class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    if (import.meta.env.DEV) {
      console.error("AssetFlow render failure", error, info);
    }
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <main className="grid min-h-screen place-items-center px-4 py-12 sm:px-6">
        <section className="max-w-lg space-y-5 text-center" role="alert">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-destructive">
            Interface error
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            AssetFlow could not display this screen
          </h1>
          <p className="text-base leading-7 text-muted-foreground">
            Reload the workspace to recover. No workflow action was submitted by this error screen.
          </p>
          <Button onClick={() => window.location.reload()}>Reload AssetFlow</Button>
        </section>
      </main>
    );
  }
}
