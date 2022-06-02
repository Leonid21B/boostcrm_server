const isSpaceInteger = space => Math.floor(space * 1000) / 1000

const takeSpace = (space, unit) => {
  if (space + unit < 0){
    return 0
  }
  return Math.round((space + unit) * 1000) / 1000
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
