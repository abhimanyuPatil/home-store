# Home Store API

## Runtime compatibility

The API uses Express 4 with `serverless-http` 3.x. Express 4 is intentional:
`serverless-http` has known Express 5 compatibility concerns around middleware
and response handling. Keep Express and `@types/express` on the 4.x major line
until the adapter's Express 5 support is confirmed.

## Development checks

```bash
npm ci
npm run build
npm run lint
npm test
```

The test suite uses Supertest and may require permission to bind an ephemeral
localhost port in restricted environments.
