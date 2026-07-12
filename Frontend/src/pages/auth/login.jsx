import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { applyAuthError } from "@/features/auth/auth-errors";
import { getSafeReturnPath } from "@/features/auth/auth-navigation";
import { loginSchema } from "@/features/auth/auth-schemas";
import { AuthErrorAlert } from "@/features/auth/components/auth-error-alert";
import { AuthField } from "@/features/auth/components/auth-field";
import { AuthLink } from "@/features/auth/components/auth-link";
import { AuthPanel } from "@/features/auth/components/auth-panel";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { PasswordField } from "@/features/auth/components/password-field";

export function LoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  const returnPath = getSafeReturnPath(location.state?.from);

  async function submitLogin(values) {
    clearErrors("root.server");

    try {
      const profile = await login(values.email, values.password);

      if (!profile) {
        setError("root.server", {
          type: "SESSION_SUPERSEDED",
          message: "Your sign-in was interrupted. Please try again.",
        });
        return;
      }

      navigate(returnPath, { replace: true });
    } catch (error) {
      applyAuthError(error, {
        setError,
        fields: ["email", "password"],
      });
    }
  }

  return (
    <AuthShell>
      <AuthPanel
        eyebrow="Secure access"
        title="Sign in to AssetFlow"
        description="Continue to your assigned assets, bookings, approvals, and audit-ready activity."
        footer={
          <p>
            New to AssetFlow?{" "}
            <AuthLink
              to="/signup"
              state={location.state}
              disabled={isSubmitting}
            >
              Create an employee account
            </AuthLink>
          </p>
        }
      >
        <form
          className="space-y-5"
          noValidate
          aria-busy={isSubmitting}
          onChange={() => clearErrors("root.server")}
          onSubmit={handleSubmit(submitLogin)}
        >
          <AuthField
            id="login-email"
            label="Email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            disabled={isSubmitting}
            registration={register("email")}
            error={errors.email}
          />

          <PasswordField
            id="login-password"
            label="Password"
            autoComplete="current-password"
            disabled={isSubmitting}
            registration={register("password")}
            error={errors.password}
            action={
              <AuthLink
                to="/forgot-password"
                state={location.state}
                className="text-xs font-medium"
                disabled={isSubmitting}
              >
                Forgot password?
              </AuthLink>
            }
          />

          <AuthErrorAlert
            error={errors.root?.server}
            title={
              errors.root?.server?.type === "ACCOUNT_INACTIVE"
                ? "Account unavailable"
                : "Sign-in failed"
            }
          />

          <Button
            type="submit"
            className="h-11 w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <LoaderCircle className="animate-spin" aria-hidden="true" />
                Signing in…
              </>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>
      </AuthPanel>
    </AuthShell>
  );
}
