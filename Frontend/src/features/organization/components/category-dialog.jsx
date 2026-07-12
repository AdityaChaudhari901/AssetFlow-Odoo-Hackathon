import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormErrorAlert } from "@/components/shared/form-error-alert";
import { FormField } from "@/components/shared/form-field";
import { CustomFieldsEditor } from "@/features/organization/components/custom-fields-editor";
import { applyOrganizationError } from "@/features/organization/organization-errors";
import {
  categoryPayload,
  categorySchema,
} from "@/features/organization/organization-schemas";
import {
  useCreateCategory,
  useUpdateCategory,
} from "@/hooks/queries/use-organization";

const EMPTY_VALUES = {
  name: "",
  description: "",
  customFields: [],
};

export function CategoryDialog({ open, onOpenChange, category }) {
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const editing = Boolean(category);
  const pending = createMutation.isPending || updateMutation.isPending;
  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: EMPTY_VALUES,
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    reset(
      category
        ? {
            name: category.name ?? "",
            description: category.description ?? "",
            customFields: category.custom_fields ?? [],
          }
        : EMPTY_VALUES,
    );
  }, [category, open, reset]);

  async function submit(values) {
    try {
      if (editing) {
        await updateMutation.mutateAsync({
          id: category.id,
          payload: categoryPayload(values),
        });
        toast.success(`${values.name} updated.`);
      } else {
        await createMutation.mutateAsync(categoryPayload(values));
        toast.success(`${values.name} created.`);
      }

      onOpenChange(false);
    } catch (error) {
      applyOrganizationError(error, setError, {
        fields: ["name", "description", "customFields"],
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !pending && onOpenChange(nextOpen)}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit category" : "Create category"}</DialogTitle>
          <DialogDescription>
            Define the reusable metadata collected when assets join this category.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-6" noValidate onSubmit={handleSubmit(submit)}>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="category-name" label="Name" required error={errors.name}>
              {(fieldProps) => (
                <Input
                  {...fieldProps}
                  className="h-11"
                  disabled={pending}
                  {...register("name")}
                />
              )}
            </FormField>

            <FormField
              id="category-description"
              label="Description"
              error={errors.description}
            >
              {(fieldProps) => (
                <Textarea
                  {...fieldProps}
                  className="min-h-20"
                  disabled={pending}
                  {...register("description")}
                />
              )}
            </FormField>
          </div>

          <CustomFieldsEditor
            control={control}
            register={register}
            errors={errors.customFields}
            disabled={pending}
          />

          <FormErrorAlert error={errors.root?.server} />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? (
                <>
                  <LoaderCircle className="animate-spin" aria-hidden="true" />
                  Saving…
                </>
              ) : editing ? (
                "Save changes"
              ) : (
                "Create category"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
