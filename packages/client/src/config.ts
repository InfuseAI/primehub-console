import { pickBy } from 'lodash';

export interface Config {
  primehubMode: string;
}

const defaultConfigs = {
  primehubMode: 'ce'
};

const prodConfigs = {
  env: 'production'
};

export const createConfig = (): Config => {
  const envConfigs = pickBy({
    primehubMode: process.env.PRIMEHUB_MODE
  });

  const env = process.env.NODE_ENV || 'development';
  switch (env) {
    case 'production':
      return {...defaultConfigs, ...prodConfigs, ...envConfigs};
    default:
      return {...defaultConfigs, ...envConfigs};
  }
};

export default createConfig();
