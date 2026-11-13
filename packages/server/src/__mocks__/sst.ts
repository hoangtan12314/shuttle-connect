// Jest manual mock for the `sst` package, picked up automatically for every test (a __mocks__
// folder under `roots` mocks the node module of the same name). The real package is ESM-only,
// which ts-jest's CommonJS output can't load, and its Resource reads env vars SST only sets inside
// `sst dev`/a deployed Lambda. Every linked resource resolves to a predictable fake.
export const Resource = new Proxy(
  {},
  {
    get: (_target, name) => ({
      name: `test-${String(name)}`,
      url: `https://${String(name)}.test`,
    }),
  },
);
