import { Toaster } from "sonner";

import { useTheme } from "@/hooks/use-theme";

export function AppToaster() {
  const { resolvedTheme } = useTheme();

  return (
    <Toaster
      closeButton
      position="top-right"
      theme={resolvedTheme}
      toastOptions={{ duration: 4_000 }}
    />
  );
}
