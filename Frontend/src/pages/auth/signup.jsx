import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, UserRoundCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { applyAuthError } from "@/features/auth/auth-errors";
import { getSafeReturnPath } from "@/features/auth/auth-navigation";
import {
  PASSWORD_REQUIREMENT,
  signupSchema,
} from "@/features/auth/auth-schemas";
import { AuthErrorAlert } from "@/features/auth/components/auth-error-alert";
import { AuthField } from "@/features/auth/components/auth-field";
import { AuthLink } from "@/features/auth/components/auth-link";
import { AuthPanel } from "@/features/auth/components/auth-panel";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { PasswordField } from "@/features/auth/components/password-field";

export function SignupPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signup } = useAuth();
  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  const returnPath = getSafeReturnPath(location.state?.from);

  async function submitSignup(values) {
    clearErrors("root.server");

    try {
      await signup({
        full_name: values.fullName,
        email: values.email,
        password: values.password,
      });

      reset();
      toast.success("Your employee account is ready.");
      navigate(returnPath, { replace: true });
    } catch (error) {
      applyAuthError(error, {
        setError,
        fields: ["fullName", "email", "password", "confirmPassword"],
        fieldByCode: {
          EMAIL_ALREADY_REGISTERED: "email",
          PASSWORD_POLICY_VIOLATION: "password",
          WEAK_PASSWORD: "password",
        },
      });
    }
  }

  return (
    <AuthShell>
      <AuthPanel
        eyebrow="Employee onboarding"
        title="Create your account"
        description="Set up your AssetFlow identity. Your organization can assign responsibilities after you join."
        footer={
          <p>
            Already registered?{" "}
            <AuthLink
              to="/login"
              state={location.state}
              disabled={isSubmitting}
            >
              Sign in
            </AuthLink>
          </p>
        }
      >
        <form
          className="space-y-5"
          noValidate
          aria-busy={isSubmitting}
          onChange={() => clearErrors("root.server")}
          onSubmit={handleSubmit(submitSignup)}
        >
          <AuthField
            id="signup-full-name"
            label="Full name"
            type="text"
            autoComplete="name"
            disabled={isSubmitting}
            registration={register("fullName")}
            error={errors.fullName}
          />

          <AuthField
            id="signup-email"
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
            id="signup-password"
            label="Password"
            autoComplete="new-password"
            disabled={isSubmitting}
            registration={register("password")}
            error={errors.password}
            hint={PASSWORD_REQUIREMENT}
          />

          <PasswordField
            id="signup-confirm-password"
            label="Confirm password"
            autoComplete="new-password"
            disabled={isSubmitting}
            registration={register("confirmPassword")}
            error={errors.confirmPassword}
          />

          <div className="flex gap-3 rounded-lg border border-primary/20 bg-accent/70 px-4 py-3 text-accent-foreground">
            <UserRoundCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <p className="text-xs leading-5">
              You’ll join as an Employee. Admins assign elevated roles from
              the employee directory.
            </p>
          </div>

          <AuthErrorAlert error={errors.root?.server} />

          <Button
            type="submit"
            className="h-11 w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <LoaderCircle className="animate-spin" aria-hidden="true" />
                Creating account…
              </>
            ) : (
              "Create employee account"
            )}
          </Button>
        </form>
      </AuthPanel>
    </AuthShell>
  );
}
