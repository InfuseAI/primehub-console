import moment from 'moment';

export function formatTimestamp(time:string) {
  if (!time) {
    return '-';
  }
  const n = Number(time);
  if (Number.isNaN(n)) {
    return '-';
  }
  const d = new Date(n);
  if (!d) {
    return '-';
  }

  return moment(d).format('YYYY-MM-DD HH:mm:ss');
}
