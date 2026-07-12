import { AuthPlaceholder } from "@/components/shared/auth-placeholder";

export function ResetPasswordPage() {
  return (
    <AuthPlaceholder
      title="Choose a new password"
      description="Complete the secure recovery flow and return to your operations workspace."
      alternateAction={{ to: "/login", label: "Return to sign in" }}
    />
  );
}
