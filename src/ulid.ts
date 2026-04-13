const CROCKFORD_BASE32 = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

function encodeBase32(value: number, length: number): string {
  let remaining = value;
  let result = "";

  for (let index = 0; index < length; index += 1) {
    const characterIndex = remaining % 32;
    result = `${CROCKFORD_BASE32[characterIndex]}${result}`;
    remaining = Math.floor(remaining / 32);
  }

  return result;
}

function randomBase32(length: number): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);

  let result = "";
  bytes.forEach((byte) => {
    result += CROCKFORD_BASE32[byte % 32];
  });

  return result;
}

export function generateUlid(timestamp = Date.now()): string {
  return `${encodeBase32(timestamp, 10)}${randomBase32(16)}`;
}
