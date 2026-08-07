export type RuntimeStatus = {
  readonly service: 'home-store-api';
  readonly status: 'ready';
};

export const getRuntimeStatus = (): RuntimeStatus => ({
  service: 'home-store-api',
  status: 'ready',
});
