import { ApiError } from "@/api/client";
import { getFixtureIdentity } from "@/api/__fixtures__/session";
import {
  fixtureDb,
  fixtureEnvelope,
  fixtureResult,
  nextFixtureId,
  paginateFixture,
} from "@/api/__fixtures__/store";

function normalized(value) {
  return String(value ?? "").trim().toLowerCase();
}

function nowIso() {
  return new Date().toISOString();
}

function duplicateResource(message, field = "name") {
  return new ApiError({
    code: "DUPLICATE_RESOURCE",
    message,
    status: 409,
    details: { field },
  });
}

function notFound(resource) {
  return new ApiError({
    code: "RESOURCE_NOT_FOUND",
    message: `${resource} could not be found.`,
    status: 404,
  });
}

function employeeSummary(employeeId) {
  if (!employeeId) {
    return null;
  }

  const employee = fixtureDb.employees.find((item) => item.id === employeeId);
  return employee ? { id: employee.id, full_name: employee.full_name } : null;
}

function departmentName(departmentId) {
  return (
    fixtureDb.departments.find((department) => department.id === departmentId)?.name ??
    null
  );
}

function refreshDepartmentEmployeeCounts() {
  for (const department of fixtureDb.departments) {
    department.employee_count = fixtureDb.employees.filter(
      (employee) =>
        employee.department_id === department.id && employee.status === "active",
    ).length;
  }
}

function assertUniqueName(rows, name, ignoredId, resourceLabel) {
  const duplicate = rows.some(
    (item) => item.id !== ignoredId && normalized(item.name) === normalized(name),
  );

  if (duplicate) {
    throw duplicateResource(`${resourceLabel} with this name already exists.`);
  }
}

export async function fixtureListDepartments(params = {}) {
  const search = normalized(params.search);
  const status = params.status;
  const rows = fixtureDb.departments
    .filter((department) => !status || department.status === status)
    .filter(
      (department) =>
        !search ||
        normalized(department.name).includes(search) ||
        normalized(department.description).includes(search),
    )
    .sort((left, right) => left.name.localeCompare(right.name));

  return fixtureResult(fixtureEnvelope(rows));
}

export async function fixtureCreateDepartment(payload) {
  assertUniqueName(fixtureDb.departments, payload.name, null, "A department");

  const timestamp = nowIso();
  const department = {
    id: nextFixtureId("dep"),
    name: payload.name,
    description: payload.description || null,
    head: employeeSummary(payload.head_id),
    parent_department_id: payload.parent_department_id || null,
    employee_count: 0,
    asset_count: 0,
    status: "active",
    created_at: timestamp,
    updated_at: timestamp,
  };

  fixtureDb.departments.push(department);
  return fixtureResult(fixtureEnvelope(department));
}

export async function fixtureUpdateDepartment(id, payload) {
  const department = fixtureDb.departments.find((item) => item.id === id);

  if (!department) {
    throw notFound("Department");
  }

  if (payload.parent_department_id === id) {
    throw new ApiError({
      code: "VALIDATION_ERROR",
      message: "A department cannot be its own parent.",
      status: 422,
      details: [
        {
          field: "body.parent_department_id",
          message: "Select a different parent department.",
        },
      ],
    });
  }

  if (payload.name !== undefined) {
    assertUniqueName(fixtureDb.departments, payload.name, id, "A department");
    department.name = payload.name;

    for (const employee of fixtureDb.employees) {
      if (employee.department_id === id) {
        employee.department_name = payload.name;
      }
    }

    for (const asset of fixtureDb.assets) {
      if (asset.department?.id === id) {
        asset.department.name = payload.name;
      }
    }
  }

  if (payload.description !== undefined) {
    department.description = payload.description || null;
  }

  if (payload.head_id !== undefined) {
    department.head = employeeSummary(payload.head_id);
  }

  if (payload.parent_department_id !== undefined) {
    department.parent_department_id = payload.parent_department_id || null;
  }

  if (payload.status !== undefined) {
    department.status = payload.status;
  }

  department.updated_at = nowIso();
  return fixtureResult(fixtureEnvelope(department));
}

export async function fixtureListCategories(params = {}) {
  const rows = fixtureDb.categories
    .filter((category) => !params.status || category.status === params.status)
    .sort((left, right) => left.name.localeCompare(right.name));

  return fixtureResult(fixtureEnvelope(rows));
}

export async function fixtureCreateCategory(payload) {
  assertUniqueName(fixtureDb.categories, payload.name, null, "A category");

  const timestamp = nowIso();
  const category = {
    id: nextFixtureId("cat"),
    name: payload.name,
    description: payload.description || null,
    custom_fields: payload.custom_fields ?? [],
    status: "active",
    created_at: timestamp,
    updated_at: timestamp,
  };

  fixtureDb.categories.push(category);
  return fixtureResult(fixtureEnvelope(category));
}

export async function fixtureUpdateCategory(id, payload) {
  const category = fixtureDb.categories.find((item) => item.id === id);

  if (!category) {
    throw notFound("Category");
  }

  if (payload.name !== undefined) {
    assertUniqueName(fixtureDb.categories, payload.name, id, "A category");
    category.name = payload.name;

    for (const asset of fixtureDb.assets) {
      if (asset.category?.id === id) {
        asset.category.name = payload.name;
      }
    }
  }

  if (payload.description !== undefined) {
    category.description = payload.description || null;
  }

  if (payload.custom_fields !== undefined) {
    category.custom_fields = payload.custom_fields;
  }

  if (payload.status !== undefined) {
    category.status = payload.status;
  }

  category.updated_at = nowIso();
  return fixtureResult(fixtureEnvelope(category));
}

export async function fixtureListEmployees(params = {}) {
  const search = normalized(params.search);
  const rows = fixtureDb.employees
    .filter(
      (employee) =>
        !search ||
        normalized(employee.full_name).includes(search) ||
        normalized(employee.email).includes(search),
    )
    .filter(
      (employee) =>
        !params.department_id || employee.department_id === params.department_id,
    )
    .filter((employee) => !params.role || employee.role === params.role)
    .filter((employee) => !params.status || employee.status === params.status)
    .sort((left, right) => left.full_name.localeCompare(right.full_name));
  const page = paginateFixture(rows, params);

  return fixtureResult(fixtureEnvelope(page.data, page.meta));
}

export async function fixtureGetEmployee(id) {
  const employee = fixtureDb.employees.find((item) => item.id === id);

  if (!employee) {
    throw notFound("Employee");
  }

  return fixtureResult(fixtureEnvelope(employee));
}

export async function fixtureUpdateEmployee(id, payload) {
  const employee = fixtureDb.employees.find((item) => item.id === id);

  if (!employee) {
    throw notFound("Employee");
  }

  const modifyingProtectedSelfField =
    id === getFixtureIdentity().id &&
    ((payload.role !== undefined && payload.role !== employee.role) ||
      (payload.status !== undefined && payload.status !== employee.status));

  if (modifyingProtectedSelfField) {
    throw new ApiError({
      code: "CANNOT_MODIFY_SELF",
      message: "You cannot change your own role or account status.",
      status: 409,
    });
  }

  if (payload.full_name !== undefined) {
    employee.full_name = payload.full_name;

    for (const department of fixtureDb.departments) {
      if (department.head?.id === id) {
        department.head.full_name = payload.full_name;
      }
    }
  }

  if (payload.role !== undefined) {
    employee.role = payload.role;
  }

  if (payload.department_id !== undefined) {
    employee.department_id = payload.department_id || null;
    employee.department_name = departmentName(payload.department_id);
  }

  if (payload.status !== undefined) {
    employee.status = payload.status;
  }

  refreshDepartmentEmployeeCounts();
  return fixtureResult(fixtureEnvelope(employee));
}
