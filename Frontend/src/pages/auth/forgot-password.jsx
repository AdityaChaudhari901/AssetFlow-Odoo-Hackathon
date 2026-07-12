import { AuthPlaceholder } from "@/components/shared/auth-placeholder";

export function ForgotPasswordPage() {
  return (
    <AuthPlaceholder
      title="Recover your account"
      description="Request a secure, single-use password recovery link for your AssetFlow account."
      alternateAction={{ to: "/login", label: "Return to sign in" }}
    />
  );
}
