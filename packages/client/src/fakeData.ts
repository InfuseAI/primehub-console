import me from './fakeData/me';
import images from './fakeData/images';
import files from './fakeData/files';
import license from './fakeData/license';
import secrets from './fakeData/secrets';
import phJobs from './fakeData/phJobs';
import phSchedules from './fakeData/phSchedules';
import phDeployments from './fakeData/phDeployments';
import phApplications from './fakeData/phApplications';
import phAppTemplates from './fakeData/phAppTemplates';

export const fakeData = {
  me,
  secrets,
  phJobs,
  images,
  phSchedules,
  phDeployments,
  phApplications,
  phAppTemplates,
  license,
  files,
};

export const schema =  {
  me: {type: 'object'},
  secrets: {type: 'array', items: {type: 'object'}},
  images: {type: 'array', items: {type: 'object'}},
  phJobs: {type: 'array', items: {type: 'object'}},
  phSchedules: {type: 'array', items: {type: 'object'}},
  phDeployments: {type: 'array', items: {type: 'object'}},
  phApplications: {type: 'array', items: {type: 'object'}},
  phAppTemplates: {type: 'array', items: {type: 'object'}},
  license: {type: 'object'},
  files: {type: 'object'},
};
