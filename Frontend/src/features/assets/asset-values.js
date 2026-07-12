export function assetToFormValues(asset) {
  return {
    name: asset?.name ?? "",
    categoryId: asset?.category?.id ?? "",
    serialNumber: asset?.serial_number ?? "",
    acquisitionDate: asset?.acquisition_date ?? "",
    acquisitionCost:
      asset?.acquisition_cost === null || asset?.acquisition_cost === undefined
        ? ""
        : String(asset.acquisition_cost),
    condition: asset?.condition ?? "good",
    location: asset?.location ?? "",
    departmentId: asset?.department?.id ?? "",
    isBookable: Boolean(asset?.is_bookable),
    imageUrl: asset?.image_url ?? null,
    customFieldValues: asset?.custom_field_values ?? {},
  };
}

export function formValuesToAssetPayload(values, category) {
  const fieldDefinitions = new Map(
    (category?.custom_fields ?? []).map((field) => [field.key, field]),
  );
  const customFieldValues = Object.fromEntries(
    Object.entries(values.customFieldValues ?? {}).flatMap(([key, value]) => {
      if (value === "" || value === null || value === undefined) {
        return [];
      }

      const definition = fieldDefinitions.get(key);
      if (definition?.type === "number") {
        return [[key, Number(value)]];
      }
      if (definition?.type === "boolean") {
        return [[key, Boolean(value)]];
      }
      return [[key, value]];
    }),
  );

  return {
    name: values.name,
    category_id: values.categoryId,
    serial_number: values.serialNumber || null,
    acquisition_date: values.acquisitionDate || null,
    acquisition_cost: values.acquisitionCost ? Number(values.acquisitionCost) : null,
    condition: values.condition,
    location: values.location || null,
    department_id: values.departmentId || null,
    is_bookable: values.isBookable,
    image_url: values.imageUrl || null,
    custom_field_values: customFieldValues,
  };
}
