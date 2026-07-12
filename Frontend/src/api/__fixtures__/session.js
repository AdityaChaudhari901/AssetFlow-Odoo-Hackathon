let fixtureIdentity = null;

const DEFAULT_FIXTURE_IDENTITY = Object.freeze({
  id: "emp-aditya",
  full_name: "Aditya Chaudhari",
  email: "aditya@assetflow.demo",
  department_id: "dep-engineering",
  department_name: "Engineering",
  role: "admin",
  capabilities: ["audits.view"],
});

export function setFixtureIdentity(profile) {
  fixtureIdentity = profile
    ? {
        id: profile.id,
        full_name: profile.full_name,
        email: profile.email,
        department_id: profile.department_id ?? null,
        department_name: profile.department_name ?? null,
        role: profile.role ?? "employee",
        capabilities: profile.capabilities ?? [],
      }
    : null;
}

export function getFixtureIdentity() {
  return fixtureIdentity ?? DEFAULT_FIXTURE_IDENTITY;
}

export function fixtureActor() {
  const identity = getFixtureIdentity();
  return { id: identity.id, full_name: identity.full_name };
}

export function matchesFixtureIdentity(candidate = {}) {
  const identity = getFixtureIdentity();
  return Boolean(
    (candidate.id && candidate.id === identity.id) ||
      (candidate.email &&
        identity.email &&
        candidate.email.toLowerCase() === identity.email.toLowerCase()) ||
      ((candidate.full_name || candidate.name) &&
        (candidate.full_name || candidate.name).toLowerCase() ===
          identity.full_name.toLowerCase()),
  );
}
