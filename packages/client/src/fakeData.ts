import me from './fakeData/me';
import images from './fakeData/images';
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
import groups from './fakeData/groups';

export const fakeData = {
  me,
  groups,
  secrets,
  phJobs,
  images,
  phSchedules,
  models,
  modelVersions,
  phDeployments,
  phApplications,
  phAppTemplates,
  license,
  files,
};

export const schema =  {
  me: {type: 'object'},
  secrets: {type: 'array', items: {type: 'object'}},
  groups: {type: 'array', items: {type: 'object'}},
  images: {type: 'array', items: {type: 'object'}},
  phJobs: {type: 'array', items: {type: 'object'}},
  phSchedules: {type: 'array', items: {type: 'object'}},
  phDeployments: {type: 'array', items: {type: 'object'}},
  models: {type: 'array', items: {type: 'object'}},
  modelVersions: {type: 'array', items: {type: 'object'}},
  phApplications: {type: 'array', items: {type: 'object'}},
  phAppTemplates: {type: 'array', items: {type: 'object'}},
  license: {type: 'object'},
  files: {type: 'object'},
};
