import { fixtureDb, fixtureEnvelope, fixtureResult, paginateFixture } from "@/api/__fixtures__/store";

export async function listActivityFixtures(params = {}) {
  let rows = fixtureDb.activityLogs;
  if (params.actor_id) rows = rows.filter((item) => item.actor?.id === params.actor_id);
  if (params.entity_type) rows = rows.filter((item) => item.entity_type === params.entity_type);
  if (params.action) rows = rows.filter((item) => item.action.toLowerCase().includes(params.action.toLowerCase()));
  if (params.from) rows = rows.filter((item) => item.created_at >= params.from);
  if (params.to) {
    const upperBound = params.to.length === 10 ? `${params.to}T23:59:59.999Z` : params.to;
    rows = rows.filter((item) => item.created_at <= upperBound);
  }
  const page = paginateFixture(rows, params);
  return fixtureResult(fixtureEnvelope(page.data, page.meta));
}
