export const phJobs = [
  {
    id: 'it1',
    name: 'IT1',
    displayName: 'IT1',
    schedule: 'it1',
    phase: 'Succeeded',
    groupid: 'groupId1',
    groupName: 'group1',
    createTime: '2019-10-04T14:48:00.000Z',
    startTime: '2019-10-04T14:48:00.000Z',
    finishTime: '2019-10-04T15:48:00.000Z',
    message: `batch1
    batch2
    batch3
    batch4
    `,
    command: `fdsf`,
    instanceType: {
      id: 'everyone-it',
      name: 'it',
      displayName: 'gpu0',
      gpuLimit: 0,
      cpuLimit: 0.5,
      memoryLimit: 4,
    },
    artifact: {
      prefix: 'groups/group1/jobArtifacts/it1',
      items: [
        {
          name: 'sub/test.txt',
          size: 32623,
          lastModified: '2020-09-25T01:53:36.212Z'
        },
        {
          name: 'test.txt',
          size: 32852353,
          lastModified: '2020-09-25T01:53:36.216Z'
        }
      ]
    },
  }, {
    id: 'it2',
    name: 'IT2',
    groupId: 'group2',
    groupName: 'group2',
    instanceType: {
      id: 'no-instanceType',
      name: 'it',
      displayName: 'gpu0',
      gpuLimit: 0,
      cpuLimit: 0.5,
      memoryLimit: 4,
    },
    displayName: 'IT2',
    phase: 'Failed',
    createTime: '2021-03-30T14:48:00.000Z',
    startTime: '2021-03-30T14:48:00.000Z',
    finishTime: '2021-03-31T15:48:00.000Z',
    message: `
    batch1
    batch2
    batch3
    batch4`,
    reason: 'PodFailed'
  }, {
    id: 'it3',
    name: 'IT3',
    displayName: 'IT3',
    groupid: 'groupId1',
    groupName: 'group1',
    phase: 'Failed',
    message: `
    batch1
    batch2
    batch3
    batch4
    Traceback (most recent call last):
    File "<stdin>", line 1, in <module>
    File "<stdin>", line 3, in divide
  TypeError: unsupported operand type(s) for /: 'str' and 'str'`
  }, {
    id: 'it4',
    name: 'IT4',
    displayName: 'IT4',
    groupid: 'groupId1',
    groupName: 'group1',
    phase: 'Failed',
    message: `Traceback (most recent call last):
    File "<stdin>", line 1, in <module>
    File "<stdin>", line 3, in divide
  TypeError: unsupported operand type(s) for /: 'str' and 'str'TypeError: unsupported operand type(s) for /: 'str' and 'str'
`
  }, {
    id: 'it5',
    name: 'IT5',
    displayName: 'IT5',
    groupid: 'groupId1',
    groupName: 'group1',
    phase: 'Cancelled',
    message: `Traceback (most recent call last):
    File "<stdin>", line 1, in <module>
    File "<stdin>", line 3, in divide
  TypeError: unsupported operand type(s) for /: 'str' and 'str'TypeError: unsupported operand type(s) for /: 'str' and 'str'
`
  }
];

export default phJobs;
