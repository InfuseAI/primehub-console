export const phSchedules = [{
  id: 'it1',
  name: 'IT1',
  displayName: 'IT1',
  nextRunTime: '2019-12-26T14:24:22Z',
  recurrence: {
    type: 'weekly',
    cron: '* */2 * * *',
  },
  invalid: true,
  message: 'Something happened',
  command: 'haha',
  userId: 'userId',
  userName: 'phadmin',
  groupId: 'groupId1',
  groupName: 'groupName1',
  image: 'image name',
  instanceType: {
    id: 'g-it1',
    name: 'it',
    displayName: 'gpu0',
    gpuLimit: 0,
    cpuLimit: 0.5,
    memoryLimit: 4,
  },
}];

export default phSchedules;
