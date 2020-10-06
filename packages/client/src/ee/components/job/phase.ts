export enum Phase {
  Pending = 'Pending',
  Preparing = 'Preparing',
  Running = 'Running',
  Succeeded = 'Succeeded',
  Failed = 'Failed',
  Cancelled = 'Cancelled',
  Unknown = 'Unknown',
}

export function getActionByPhase(phase: Phase) {
  switch (phase) {
    case Phase.Pending:
    case Phase.Preparing:
    case Phase.Running:
      return 'Cancel';
    case Phase.Succeeded:
    case Phase.Cancelled:
    case Phase.Failed:
    case Phase.Unknown:
    default:
      return 'Rerun';
  }
}
