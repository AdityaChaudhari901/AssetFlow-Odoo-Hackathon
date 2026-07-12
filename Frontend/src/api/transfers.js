import {
  fixtureApproveTransfer,
  fixtureCreateTransfer,
  fixtureListTransfers,
  fixtureRejectTransfer,
} from "@/api/__fixtures__/transfers";
import { request } from "@/api/transport";

export const listTransfers = (params, signal) =>
  request({ method: "get", url: "/transfers", params, signal }, () =>
    fixtureListTransfers(params),
  );

export const createTransfer = (payload) =>
  request({ method: "post", url: "/transfers", data: payload }, () =>
    fixtureCreateTransfer(payload),
  );

export const approveTransfer = (id) =>
  request({ method: "post", url: `/transfers/${id}/approve` }, () =>
    fixtureApproveTransfer(id),
  );

export const rejectTransfer = (id, payload) =>
  request({ method: "post", url: `/transfers/${id}/reject`, data: payload }, () =>
    fixtureRejectTransfer(id, payload),
  );
