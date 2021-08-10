import me from './fakeData/me';
import images from './fakeData/images';
import datasets from './fakeData/datasets';
import files from './fakeData/files';
import license from './fakeData/license';
import secrets from './fakeData/secrets';
import phJobs from './fakeData/phJobs';
import phSchedules from './fakeData/phSchedules';
import phDeployments from './fakeData/phDeployments';
import models from './fakeData/models';
import modelVersions from './fakeData/modelVersions';
import phApplications from './fakeData/phApplications';
import phAppTemplates from './fakeData/phAppTemplates';
import { groups, mlflow } from './fakeData/groups';
import { system } from './fakeData/system';

export const fakeData = {
  me,
  users: [
    {
      id: '12',
      username: 'test',
      email: 'test@test.local',
      firstName: 'Test',
      lastName: 'Demo',
      enabled: true,
      isAdmin: true
    },
    {
      id: '13',
      username: 'test2',
      email: 'test2@test.local',
      firstName: 'Test2',
      lastName: 'Demo',
      enabled: true,
      isAdmin: false
    }
  ],
  groups,
  secrets,
  phJobs,
  images,
  phSchedules,
  mlflow,
  models,
  modelVersions,
  phDeployments,
  phApplications,
  phAppTemplates,
  license,
  files,
  system,
  datasets,
};

export const schema = {
  me: { type: 'object' },
  users: {type: 'array', items: { type: 'object' } },
  secrets: { type: 'array', items: { type: 'object' } },
  groups: { type: 'array', items: { type: 'object' } },
  images: { type: 'array', items: { type: 'object' } },
  datasets: { type: 'array', items: { type: 'object' } },
  phJobs: { type: 'array', items: { type: 'object' } },
  phSchedules: { type: 'array', items: { type: 'object' } },
  phDeployments: { type: 'array', items: { type: 'object' } },
  mlflow: { type: 'object' },
  models: { type: 'array', items: { type: 'object' } },
  modelVersions: { type: 'array', items: { type: 'object' } },
  phApplications: { type: 'array', items: { type: 'object' } },
  phAppTemplates: { type: 'array', items: { type: 'object' } },
  license: { type: 'object' },
  files: { type: 'object' },
  system: { type: 'object' },
};
