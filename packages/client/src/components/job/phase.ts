export enum Phase {
  Pending = 'Pending',
  Ready = 'Ready',
  Running = 'Running',
  Succedded = 'Succedded',
  Failed = 'Failed',
  Cancelled = 'Cancelled',
  Unknown = 'Unknown',
}

export function getActionByPhase(phase: Phase) {
  switch (phase) {
    case Phase.Pending:
    case Phase.Ready:
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