import { AuthPlaceholder } from "@/components/shared/auth-placeholder";

export function SignupPage() {
  return (
    <AuthPlaceholder
      title="Create your employee account"
      description="Every new account starts as an Employee. Admins assign elevated roles from the employee directory."
      alternateAction={{ to: "/login", label: "Return to sign in" }}
    />
  );
}
