import { useLayoutEffect, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import {
  applyAuthError,
  isRecoveryTokenError,
} from "@/features/auth/auth-errors";
import {
  PASSWORD_REQUIREMENT,
  resetPasswordSchema,
} from "@/features/auth/auth-schemas";
import { consumeRecoveryToken } from "@/features/auth/recovery-token";
import { AuthErrorAlert } from "@/features/auth/components/auth-error-alert";
import { AuthLink } from "@/features/auth/components/auth-link";
import { AuthPanel } from "@/features/auth/components/auth-panel";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { PasswordField } from "@/features/auth/components/password-field";

export function ResetPasswordPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  const hasConsumedToken = useRef(false);
  const [recoveryState, setRecoveryState] = useState({
    status: "loading",
    token: null,
  });
  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  useLayoutEffect(() => {
    if (hasConsumedToken.current) {
      return;
    }

    hasConsumedToken.current = true;
    const token = consumeRecoveryToken();
    setRecoveryState({ status: token ? "ready" : "invalid", token });
  }, []);

  async function submitPasswordReset(values) {
    clearErrors("root.server");

    if (!recoveryState.token) {
      setRecoveryState({ status: "invalid", token: null });
      return;
    }

    try {
      await resetPassword({
        recovery_token: recoveryState.token,
        new_password: values.password,
      });
      toast.success("Password updated. Sign in with your new password.");
      navigate("/login", { replace: true, state: location.state });
    } catch (error) {
      if (isRecoveryTokenError(error)) {
        setRecoveryState({ status: "invalid", token: null });
        return;
      }

      applyAuthError(error, {
        setError,
        fields: ["password", "confirmPassword"],
        fieldByCode: {
          PASSWORD_POLICY_VIOLATION: "password",
          WEAK_PASSWORD: "password",
        },
      });
    }
  }

  let content;

  if (recoveryState.status === "loading") {
    content = (
      <div
        className="flex min-h-28 items-center justify-center gap-2 text-sm text-muted-foreground"
        role="status"
        aria-live="polite"
      >
        <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
        Preparing your secure reset…
      </div>
    );
  } else if (recoveryState.status === "invalid") {
    content = (
      <div className="space-y-5">
        <AuthErrorAlert
          title="Recovery link unavailable"
          focusOnMount
          error={{
            message:
              "This recovery link is missing, expired, or already used. Request a new link to continue.",
          }}
        />
        <Button asChild className="h-11 w-full">
          <Link to="/forgot-password" state={location.state}>
            Request a new recovery link
          </Link>
        </Button>
      </div>
    );
  } else {
    content = (
      <form
        className="space-y-5"
        noValidate
        aria-busy={isSubmitting}
        onChange={() => clearErrors("root.server")}
        onSubmit={handleSubmit(submitPasswordReset)}
      >
        <PasswordField
          id="reset-password"
          label="New password"
          autoComplete="new-password"
          disabled={isSubmitting}
          registration={register("password")}
          error={errors.password}
          hint={PASSWORD_REQUIREMENT}
        />

        <PasswordField
          id="reset-confirm-password"
          label="Confirm new password"
          autoComplete="new-password"
          disabled={isSubmitting}
          registration={register("confirmPassword")}
          error={errors.confirmPassword}
        />

        <AuthErrorAlert error={errors.root?.server} />

        <Button
          type="submit"
          className="h-11 w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <LoaderCircle className="animate-spin" aria-hidden="true" />
              Updating password…
            </>
          ) : (
            "Update password"
          )}
        </Button>
      </form>
    );
  }

  return (
    <AuthShell>
      <AuthPanel
        eyebrow="Secure recovery"
        title="Choose a new password"
        description="Use this single-use recovery link to set a new password and restore secure access to your workspace."
        footer={
          <AuthLink
            to="/login"
            state={location.state}
            disabled={isSubmitting}
          >
            Return to sign in
          </AuthLink>
        }
      >
        {content}
      </AuthPanel>
    </AuthShell>
  );
}
