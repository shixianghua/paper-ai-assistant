import { hasDsKey } from "./deepseek"
import { demoOutline, generateFullDoc as demoFullDoc } from "./generator"
import { realFullDoc, realOutline } from "./realgen"
import { DOC_TYPES } from "../data/catalog"

export async function smartOutline(params, handlers) {
  if (hasDsKey()) return realOutline(params, handlers)
  return demoOutline(params, handlers)
}

export async function smartFullDoc(params, handlers) {
  if (hasDsKey()) {
    const type = DOC_TYPES.find((t) => t.key === params.typeKey)
    return realFullDoc(
      {
        ...params,
        typeLabel: type ? type.label : "毕业论文",
      },
      handlers,
    )
  }
  return demoFullDoc(params, handlers)
}
