import { Injectable } from '@angular/core'

@Injectable({
  providedIn: 'root'
})
export class UtilsService {
  getRandomBlobName() {
    const time = new Date(Date.now())
    return `${time.getFullYear()}${time.getMonth()}${time.getDate()}${time.getHours()}${time.getMinutes()}${time.getSeconds()}${time.getMilliseconds()}`
  }

  getSize(size = 0, orgUnit = 'B', targetUnit = 'Auto', dif = 0) {
    if (!orgUnit) {
      orgUnit = 'B'
    }
    if (!targetUnit) {
      targetUnit = 'Auto'
    }
    if (dif) {
      size += dif
    }
    const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
    let idx = -1
    for (idx = 0; idx < units.length; idx++) {
      if (units[idx].toLowerCase() === orgUnit.toLowerCase()) {
        break
      }
    }
    let dsize = size
    targetUnit = targetUnit.toLowerCase()
    let unit
    while (idx < units.length) {
      unit = units[idx]
      idx++
      if (targetUnit !== 'auto' && unit.toLowerCase() === targetUnit) {
        break
      }
      if (targetUnit === 'auto' && dsize < 1024) {
        break
      }
      dsize = dsize / 1024
    }
    unit = units[idx - 1]
    return { value: Math.round(dsize * 100) / 100 + ' ', unit }
  }

  getSizeStr(size = 0, orgUnit = 'B', targetUnit = 'Auto', dif = 0) {
    const v = this.getSize(size, orgUnit, targetUnit, dif)
    if (v) {
      return v.value + v.unit
    }
    return null
  }
}
