const isSpaceInteger = space =>
  Number.isInteger(Math.floor(space / 1024)) ? Math.floor(space / 1024) : 0

const takeSpace = (space, unit) => {
  return space + unit
}

const sortCards = (first, second) => first.createdAt > second.createdAt ? 1 : -1

const formatToISOFromat = (day, t) => t === 1
  ? new Date(day).toISOString()
  : new Date(day).toISOString().slice(0, 10)

const removeDateSeconds = date => new Date(date).setSeconds(0, 0)

export {
  isSpaceInteger,
  takeSpace,
  sortCards,
  formatToISOFromat,
  removeDateSeconds
}
