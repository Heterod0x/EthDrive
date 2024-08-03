export function buildRecursiveDirectoryQuery(
  maxDepth: number,
  id?: string,
  holder?: string
) {
  function generateSubdirectoryFields(
    currentDepth: number,
    maxDepth: number
  ): string {
    if (currentDepth > maxDepth) {
      return "";
    }

    // Only include where clause if holder is defined
    const subdirectoryFilter = holder ? `where: { holder: "${holder}" }` : "";

    return `
        subdirectories${subdirectoryFilter ? `(${subdirectoryFilter})` : ""} {
          path
          name
          tokenId
          tokenBountAccount
          holder
          depth
          ${generateSubdirectoryFields(currentDepth + 1, maxDepth)}
        }
      `;
  }

  // Only include filters if id, holder, or depth are defined
  const whereClause = [];
  if (id) {
    whereClause.push(`id: "${id}"`);
  } else {
    whereClause.push(`depth: 0`);
  }
  if (holder) whereClause.push(`holder: "${holder}"`);

  const query = `
      query RecursiveMyDirectory {
        directories${
          whereClause.length ? `(where: { ${whereClause.join(", ")} })` : ""
        } {
          path
          name
          tokenId
          tokenBountAccount
          holder
          depth
          ${generateSubdirectoryFields(1, maxDepth)}
        }
      }
    `;

  return query;
}
