import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, useLocation } from "react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { applyAuthError } from "@/features/auth/auth-errors";
import { forgotPasswordSchema } from "@/features/auth/auth-schemas";
import { AuthErrorAlert } from "@/features/auth/components/auth-error-alert";
import { AuthField } from "@/features/auth/components/auth-field";
import { AuthLink } from "@/features/auth/components/auth-link";
import { AuthPanel } from "@/features/auth/components/auth-panel";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { AuthSuccessState } from "@/features/auth/components/auth-success-state";

export function ForgotPasswordPage() {
  const location = useLocation();
  const { requestPasswordReset } = useAuth();
  const [requestSent, setRequestSent] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  async function submitRecoveryRequest(values) {
    clearErrors("root.server");

    try {
      await requestPasswordReset(values.email);
      setRequestSent(true);
      toast.success("If that email exists, a reset link is on the way.");
    } catch (error) {
      applyAuthError(error, {
        setError,
        fields: ["email"],
      });
    }
  }

  return (
    <AuthShell>
      <AuthPanel
        eyebrow="Account recovery"
        title={requestSent ? "Check your inbox" : "Recover your account"}
        description={
          requestSent
            ? "For privacy, AssetFlow shows the same response for every email address."
            : "Request a secure, single-use link to choose a new password."
        }
        footer={
          requestSent ? null : (
            <AuthLink
              to="/login"
              state={location.state}
              disabled={isSubmitting}
            >
              Return to sign in
            </AuthLink>
          )
        }
      >
        {requestSent ? (
          <AuthSuccessState
            title="Recovery request received"
            description="If that email exists, a reset link is on the way. Check your inbox and any spam or quarantine folder."
          >
            <Button asChild className="h-11 w-full">
              <Link to="/login" state={location.state}>
                Return to sign in
              </Link>
            </Button>
          </AuthSuccessState>
        ) : (
          <form
            className="space-y-5"
            noValidate
            aria-busy={isSubmitting}
            onChange={() => clearErrors("root.server")}
            onSubmit={handleSubmit(submitRecoveryRequest)}
          >
            <AuthField
              id="recovery-email"
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

            <AuthErrorAlert error={errors.root?.server} />

            <Button
              type="submit"
              className="h-11 w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle className="animate-spin" aria-hidden="true" />
                  Sending recovery link…
                </>
              ) : (
                "Send recovery link"
              )}
            </Button>
          </form>
        )}
      </AuthPanel>
    </AuthShell>
  );
}
