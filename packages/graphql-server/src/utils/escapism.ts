/**
 * Only lowercase letters and digital are valid. If char is invalid,
 * escape char with prefix - and convert char to hex binary.
 */

export const ESCAPE_LABEL_PREFIX = 'escaped-';
export const ESCAPE_CHAR_PREFIX = '-';
const JUPYTER_PODNAME_ALLOW_CHARS = new Set('abcdefghijklmnopqrstuvwxyz0123456789'.split(''));

const isLowerCase = (char: string) => /^[a-z]$/.test(char);

const escapeChar = (charInUtf8: string, escape: string) => {
  return Array.from(Buffer.from(charInUtf8, 'utf8').values())
    .map(bytesInDecimal => {
      return `${escape}${bytesInDecimal.toString(16)}`;
    })
    .join('');
};

const escapeToDnsLabel = (input: string) => {
  return input.split('')
    .map(char => {
      // if it's not a lowercased char or number, escape the char
      return !isLowerCase(char) && !isFinite(char as any) ?
        escapeChar(char, ESCAPE_CHAR_PREFIX)
        : char;
    })
    .join('');
};

/*
  implement the safe-username rules from kubespawner
  https://github.com/jupyterhub/kubespawner/blob/master/kubespawner/spawner.py#L1404
*/
export const escapePodName = (input: string) => {
  return input.toLowerCase().split('').map(char => {
    if (JUPYTER_PODNAME_ALLOW_CHARS.has(char)) {
      return char;
    }
    return '-' + char.charCodeAt(0).toString(16);
  }).join('');
};

export const escapeToPrimehubLabel = (input: string) => {
  return `${ESCAPE_LABEL_PREFIX}${escapeToDnsLabel(input)}`;
};
