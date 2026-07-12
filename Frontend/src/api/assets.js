import { request } from "@/api/transport";
import {
  fixtureChangeAssetStatus,
  fixtureCreateAsset,
  fixtureGetAsset,
  fixtureGetAssetHistory,
  fixtureListAssets,
  fixtureUpdateAsset,
} from "@/api/__fixtures__/assets";

export function listAssets(params = {}, signal) {
  return request(
    { method: "get", url: "/assets", params, signal },
    () => fixtureListAssets(params),
  );
}

export function getAsset(id, signal) {
  return request(
    { method: "get", url: `/assets/${id}`, signal },
    () => fixtureGetAsset(id),
  );
}

export function createAsset(payload) {
  return request(
    { method: "post", url: "/assets", data: payload },
    () => fixtureCreateAsset(payload),
  );
}

export function updateAsset(id, payload) {
  return request(
    { method: "patch", url: `/assets/${id}`, data: payload },
    () => fixtureUpdateAsset(id, payload),
  );
}

export function changeAssetStatus(id, payload) {
  return request(
    { method: "post", url: `/assets/${id}/status`, data: payload },
    () => fixtureChangeAssetStatus(id, payload),
  );
}

export function getAssetHistory(id, signal) {
  return request(
    { method: "get", url: `/assets/${id}/history`, signal },
    () => fixtureGetAssetHistory(id),
  );
}
