/** supertest parser that collects a binary body into a Buffer */
export function binaryParser(res, callback) {
  const chunks = [];
  res.on("data", (chunk) => chunks.push(chunk));
  res.on("end", () => callback(null, Buffer.concat(chunks)));
}

export function countPdfPages(buffer) {
  return (buffer.toString("latin1").match(/\/Type \/Page\b/g) || []).length;
}
