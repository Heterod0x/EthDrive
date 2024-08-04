export function buildRecursiveDirectoryQuery(maxDepth: number) {
  function generateSubdirectoryFields(
    currentDepth: number,
    maxDepth: number
  ): string {
    if (currentDepth > maxDepth) {
      return "";
    }

    return `
        subdirectories {
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

  const query = `
      query RecursiveMyDirectory {
        directories(where: { depth: 0 }) {
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
