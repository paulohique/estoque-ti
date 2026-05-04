export async function registerItemImage(input: {
  itemId: number;
  fileName: string;
  filePath: string;
}) {
  // Implementar com MySQL e storage de arquivos.
  return {
    ...input,
    id: 0,
  };
}
