import { AuthPlaceholder } from "@/components/shared/auth-placeholder";

export function LoginPage() {
  return (
    <AuthPlaceholder
      title="Sign in to AssetFlow"
      description="Access assigned assets, bookings, approvals, and audit-ready activity."
      alternateAction={{ to: "/signup", label: "Create an employee account" }}
    />
  );
}
