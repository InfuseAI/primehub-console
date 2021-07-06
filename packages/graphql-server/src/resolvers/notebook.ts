import { Context } from './interface';

export const notifyNotebookEvent = async (root, args, context: Context) => {
  const { notebookStartedAt, notebookGpu, notebookStatus, notebookDuration } = args.data;
  const { telemetry } = context;

  telemetry.track('Notebook Stopped', {
    notebookStartedAt,
    notebookGpu,
    notebookStatus,
    notebookDuration,
  });

  return 0;
};
