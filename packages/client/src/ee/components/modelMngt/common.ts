import moment from 'moment';

const parseDate = (time:string) => {
  if (!time) {
    return undefined;
  }
  const n = Number(time);
  if (Number.isNaN(n)) {
    return undefined;
  }
  const d = new Date(n);
  if (!d) {
    return undefined;
  }

  return d;
}

export function formatTimestamp(time:string) {
  const d = parseDate(time);
  if (!d) {
    return '-';
  }

  return moment(d).format('YYYY-MM-DD HH:mm:ss');
}

export function compareTimestamp(left:string, right:string) {
  const dLeft = parseDate(left);
  const dRight = parseDate(right);

  if (!dLeft) {
    return -1;
  } else if(!dRight) {
    return 1;
  } else {
    return dLeft.getTime() - dRight.getTime();
  }
}
