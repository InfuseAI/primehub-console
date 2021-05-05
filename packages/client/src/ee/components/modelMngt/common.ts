import moment from 'moment';
import {isNumber} from 'lodash';

const parseDate = (time:string) => {
  if (!time) {
    return undefined;
  }
  const n = Number(time);
  if (!isNumber(n)) {
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

export function buildModelURI(name, version) {
  return `models:/${encodeURIComponent(name)}/${encodeURIComponent(version)}`;
}

export function openMLflowUI(mlflow, path) {
  let uiUrl = mlflow.uiUrl ? mlflow.uiUrl : mlflow.trackingUri
  if(!uiUrl || !uiUrl.startsWith('http')) {
    alert('Invalid MLFlow UI url: ' + uiUrl);
    return;
  }

  if (uiUrl.endsWith('/')) {
    uiUrl = uiUrl.slice(0, -1);
  }

  const mlflowPath = uiUrl + path;
  window.open(mlflowPath, '_blank')
}
