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
          id
          depth
          ${generateSubdirectoryFields(currentDepth + 1, maxDepth)}
        }
      `;
  }

  const query = `
      query MyQuery {
        directories(where: { depth: 0 }) {
          id
          depth
          ${generateSubdirectoryFields(1, maxDepth)}
        }
      }
    `;

  return query;
}
