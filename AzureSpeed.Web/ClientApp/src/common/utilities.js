export function isFunction(value) {
  return typeof value === 'function';
}

export function newGuid() {
  var s4 = function () { return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1); };
  return (s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4());
}

export function getSizeStr(size, orgUnit, targetUnit, dif) {
  var v = getSize(size, orgUnit, targetUnit, dif);
  if (v) {
    return v.value + v.unit;
  }
  return null;
}

function getSize(size, orgUnit, targetUnit, dif) {
  if (!orgUnit) {
    orgUnit = 'B';
  }
  if (!targetUnit) {
    targetUnit = 'Auto';
  }
  if (dif) {
    size += dif;
  }
  var units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  var idx = -1;
  for (idx = 0; idx < units.length; idx++) {
    if (units[idx].toLowerCase() === orgUnit.toLowerCase()) {
      break;
    }
  }
  var dsize = size;
  targetUnit = targetUnit.toLowerCase();
  var unit;
  while (idx < units.length) {
    unit = units[idx];
    idx++;
    if (targetUnit !== 'auto' && unit.toLowerCase() === targetUnit) {
      break;
    }
    if (targetUnit === 'auto' && dsize < 1024) {
      break;
    }
    dsize = dsize / 1024;
  }
  unit = units[idx - 1];
  return { value: Math.round(dsize * 100) / 100 + ' ', unit: unit };
};

export default {
  isFunction,
  newGuid,
  getSizeStr
};