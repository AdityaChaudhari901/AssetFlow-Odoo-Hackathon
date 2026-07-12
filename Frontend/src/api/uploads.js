import { request } from "@/api/transport";

export function uploadFile(file, folder, onUploadProgress) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);

  return request(
    {
      method: "post",
      url: "/uploads",
      data: formData,
      onUploadProgress,
    },
    async () => ({
      data: {
        url: URL.createObjectURL(file),
        path: `fixtures/${folder}/${file.name}`,
      },
    }),
  );
}
