export const removePrivateFields = async ({ result, repository }, bind) => {
  const seen = new WeakSet();
  await Promise.all(
    result.map(
      (entrie) =>
        entrie &&
        processEntity(
          {
            entrie,
            metadata: repository.metadata,
          },
          bind,
          seen,
        ),
    ),
  );
  return result;
};

const processEntity = async ({ entrie, metadata }, bind, seen) => {
  if (!entrie || typeof entrie !== 'object' || seen.has(entrie)) {
    return;
  }
  seen.add(entrie);

  if (!metadata.columns || !Array.isArray(metadata.columns)) {
    return;
  }

  for (const column of metadata.columns) {
    const { propertyName } = column;
    const entityClass = metadata.target;
    const metadataValue = Reflect.getMetadata(
      'customMetadata',
      entityClass.prototype,
      propertyName,
    );
    if (metadataValue === 'private') {
      const { allow, id, key = 'id', name = 'auth' } = bind;
      const ownerId = entrie?.[name]?.[key];
      const equal =
        String(ownerId) === String(id) ||
        String(entrie?.[name + 'Id']) === String(id);
      if (!allow && !equal) {
        delete entrie[propertyName];
      }
    }
  }

  if (!metadata.relations || !Array.isArray(metadata.relations)) {
    return;
  }

  for (const relation of metadata.relations) {
    const relatedEntities = entrie[relation.propertyName];
    if (Array.isArray(relatedEntities)) {
      await Promise.all(
        relatedEntities.map(
          (relatedEntity) =>
            relatedEntity &&
            processEntity(
              {
                entrie: relatedEntity,
                metadata: relation.inverseEntityMetadata,
              },
              bind,
              seen,
            ),
        ),
      );
    } else if (relatedEntities) {
      await processEntity(
        {
          entrie: relatedEntities,
          metadata: relation.inverseEntityMetadata,
        },
        bind,
        seen,
      );
    }
  }
};
