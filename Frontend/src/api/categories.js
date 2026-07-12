import { request } from "@/api/transport";
import {
  fixtureCreateCategory,
  fixtureListCategories,
  fixtureUpdateCategory,
} from "@/api/__fixtures__/organization";

export function listCategories(params = {}, signal) {
  return request(
    { method: "GET", url: "/categories", params, signal },
    () => fixtureListCategories(params),
  );
}

export function createCategory(payload) {
  return request(
    { method: "POST", url: "/categories", data: payload },
    () => fixtureCreateCategory(payload),
  );
}

export function updateCategory(id, payload) {
  return request(
    { method: "PATCH", url: `/categories/${id}`, data: payload },
    () => fixtureUpdateCategory(id, payload),
  );
}
