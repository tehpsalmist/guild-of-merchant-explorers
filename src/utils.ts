export const range = (num: number) =>
  Array<number>(num)
    .fill(0)
    .map((_, i) => i)

export const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms))

export const randomSelection = <T>(list: T[], quantity: number) => {
  let selection: T[] = []
  while (selection.length < quantity) {
    selection.push(list[Math.floor(Math.random() * list.length)])
    selection = [...new Set(selection)]
  }

  return selection
}
