export enum Phase {
  Pending = 'Pending',
  Preparing = 'Preparing',
  Running = 'Running',
  Succedded = 'Succedded',
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
    case Phase.Succedded:
    case Phase.Cancelled:
    case Phase.Failed:
    case Phase.Unknown:
    default:
      return 'Rerun';
  }
}