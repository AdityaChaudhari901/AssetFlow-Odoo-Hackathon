import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createCategory,
  listCategories,
  updateCategory,
} from "@/api/categories";
import {
  createDepartment,
  listDepartments,
  updateDepartment,
} from "@/api/departments";
import { getEmployee, listEmployees, updateEmployee } from "@/api/employees";
import { queryKeys } from "@/hooks/queries/query-keys";

export function useDepartments(params = {}) {
  return useQuery({
    queryKey: queryKeys.departments(params),
    queryFn: ({ signal }) => listDepartments(params, signal),
  });
}

export function useCategories(params = {}) {
  return useQuery({
    queryKey: queryKeys.categories(params),
    queryFn: ({ signal }) => listCategories(params, signal),
  });
}

export function useEmployees(params = {}) {
  return useQuery({
    queryKey: queryKeys.employees(params),
    queryFn: ({ signal }) => listEmployees(params, signal),
    placeholderData: keepPreviousData,
  });
}

export function useEmployee(id, enabled = true) {
  return useQuery({
    queryKey: ["employee", id],
    queryFn: ({ signal }) => getEmployee(id, signal),
    enabled: Boolean(id && enabled),
  });
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createDepartment,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ["departments"] }),
        queryClient.invalidateQueries({ queryKey: ["employees"] }),
        queryClient.invalidateQueries({ queryKey: ["assets"] }),
        queryClient.invalidateQueries({ queryKey: ["asset"] }),
        queryClient.invalidateQueries({ queryKey: ["allocations"] }),
        queryClient.invalidateQueries({ queryKey: ["reports"] }),
      ]),
  });
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }) => updateDepartment(id, payload),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ["departments"] }),
        queryClient.invalidateQueries({ queryKey: ["employees"] }),
        queryClient.invalidateQueries({ queryKey: ["assets"] }),
        queryClient.invalidateQueries({ queryKey: ["asset"] }),
        queryClient.invalidateQueries({ queryKey: ["allocations"] }),
        queryClient.invalidateQueries({ queryKey: ["reports"] }),
      ]),
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCategory,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }) => updateCategory(id, payload),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ["categories"] }),
        queryClient.invalidateQueries({ queryKey: ["assets"] }),
        queryClient.invalidateQueries({ queryKey: ["asset"] }),
        queryClient.invalidateQueries({ queryKey: ["reports"] }),
      ]),
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }) => updateEmployee(id, payload),
    onSuccess: (_, variables) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ["employees"] }),
        queryClient.invalidateQueries({ queryKey: ["employee", variables.id] }),
        queryClient.invalidateQueries({ queryKey: ["departments"] }),
        queryClient.invalidateQueries({ queryKey: ["assets"] }),
        queryClient.invalidateQueries({ queryKey: ["asset"] }),
        queryClient.invalidateQueries({ queryKey: ["allocations"] }),
        queryClient.invalidateQueries({ queryKey: ["transfers"] }),
        queryClient.invalidateQueries({ queryKey: ["reports"] }),
      ]),
  });
}
