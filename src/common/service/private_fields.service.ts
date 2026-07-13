export const removePrivateFields = (result: any | any[], bind: any): any | any[] => {
  const seen = new WeakSet();
  if (Array.isArray(result)) {
    result.forEach((entry) => entry && processDto(entry, bind, seen));
  } else if (result && typeof result === 'object') {
    processDto(result, bind, seen);
  }
  return result;
};

const processDto = (dto: any, bind: any, seen: WeakSet<object>): void => {
  if (!dto || typeof dto !== 'object' || seen.has(dto)) return;
  seen.add(dto);

  const proto = dto.constructor?.prototype;

  for (const key of Object.keys(dto)) {
    const metadataValue = proto
      ? Reflect.getMetadata('customMetadata', proto, key)
      : undefined;

    if (metadataValue === 'private') {
      const { allow, id, key: bindKey = 'id', name = 'auth' } = bind;
      const ownerId = dto?.[name]?.[bindKey];
      const ownerIdFallback = dto?.[name + 'Id'];
      const equal =
        String(ownerId) === String(id) ||
        String(ownerIdFallback) === String(id);
      if (!allow && !equal) {
        delete dto[key];
        continue;
      }
    }

    const value = dto[key];
    if (value && typeof value === 'object') {
      if (Array.isArray(value)) {
        value.forEach((item) => item && processDto(item, bind, seen));
      } else if (
        value.constructor &&
        value.constructor !== Object &&
        value.constructor !== Date
      ) {
        processDto(value, bind, seen);
      }
    }
  }
};
