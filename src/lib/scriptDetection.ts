import type { DisplayLabels, ScriptFamily } from "@/lib/types"

const LATIN_RANGE = /[\u0000-\u024F]/u

export function isLatinScript(text: string): boolean {
  const letters = [...text].filter((char) => /\p{L}/u.test(char))
  if (letters.length === 0) {
    return true
  }

  const latinCount = letters.filter((char) => LATIN_RANGE.test(char)).length
  return latinCount / letters.length > 0.8
}

/** Em space between words — survives HTML whitespace collapsing unlike regular spaces. */
const LATIN_LABEL_WORD_GAP = "\u2003"

function letterSpaceWord(word: string): string {
  return [...word.toUpperCase()].join(" ")
}

export function formatCityLabel(text: string): string {
  if (!isLatinScript(text)) {
    return text
  }

  const words = text.trim().split(/\s+/).filter((word) => word.length > 0)
  if (words.length === 0) {
    return text
  }

  return words.map(letterSpaceWord).join(LATIN_LABEL_WORD_GAP)
}

export function formatCoordinates(latitude: number, longitude: number): string {
  const latDir = latitude >= 0 ? "N" : "S"
  const lonDir = longitude >= 0 ? "E" : "W"
  return `${Math.abs(latitude).toFixed(4)}° ${latDir}, ${Math.abs(longitude).toFixed(4)}° ${lonDir}`
}

function hasCodepoint(text: string, pattern: RegExp): boolean {
  return pattern.test(text)
}

const JAPANESE_KANA = /[\u3040-\u30ff]/u
const HANGUL = /[\uac00-\ud7af]/u
const HAN = /[\u3400-\u9fff]/u
const SIMPLIFIED_HINT = /[万与东乐书买云亚产亿仅从众优会体何余们传伤伦伟侧侨儿党兰关兴养册写军农冲决况净凉减几凤刘刚创别务动励劳华协单卖卢卫厅历压县参双叶号后吗启员国图圆圣场块坏坝坟墙声壳处备够头奖妈宁宝实审宪对尔层岁岛岭岚带帮庄庆库应庙广归张强弹录彻忆怀态总恋惊户执扩扫扬扰报拟择挂挤挥损摇摆摄敌断时晋晓暂杂权条来杨极构枪查标样树桥检楼欢欧步汉汤沟没泽洁浓济测湾灭灯灵点炼热爷牵现环琼电画盐矿码砖确礼离种积称稳笼类紧级续维网罗罚职联肃胁胆胜胀胶脑腾舰节苏苹获营虾虽蚀补袭见观规触誉译证评诉诊词误说课调谢谚谱谷贝贞负财责贤败账货质购贯费贺资赋赌赛赵赶趋车轨转轮软载较辅辆边辽达迁过迈运还这进远违连迟选递遗邮邻郑酿释鉴钥钱钳钢钥钦针钟钾铅铆铃铜铲银铭铺链销锁锅锐错锡锣锦镇镜长门闭问间阅队际陆陈阳阴阶险随隐雾静顶顺须顾顿颂预领频题颜风飞饭饮馆驱验骂鱼鸟鸡麦黄齐齿龙龟]/u

export function detectScriptFamily(
  localName: string,
  options: { countryCode?: string } = {},
): ScriptFamily | null {
  const value = localName.trim()
  if (!value) {
    return null
  }

  if (options.countryCode?.toLowerCase() === "hk") {
    return "hk"
  }
  if (options.countryCode?.toLowerCase() === "jp") {
    return "jp"
  }
  if (options.countryCode?.toLowerCase() === "kr") {
    return "kr"
  }
  if (hasCodepoint(value, HANGUL)) {
    return "kr"
  }
  if (hasCodepoint(value, JAPANESE_KANA)) {
    return "jp"
  }
  if (hasCodepoint(value, HAN)) {
    return SIMPLIFIED_HINT.test(value) ? "sc" : "tc"
  }
  return null
}

export interface PosterDisplayLine {
  local?: string
  latin?: string
  applyLatinTracking: boolean
}

export interface PosterDisplayLines {
  isPairLayout: boolean
  city: PosterDisplayLine
  country: PosterDisplayLine
}

export function formatPosterDisplayLines(display: DisplayLabels): PosterDisplayLines {
  const isPairLayout = Boolean(display.hasPlaceLocalName ?? display.scriptFamily)
  if (!isPairLayout) {
    return {
      isPairLayout: false,
      city: {
        local: formatCityLabel(display.city),
        applyLatinTracking: isLatinScript(display.city),
      },
      country: {
        local: display.country,
        applyLatinTracking: false,
      },
    }
  }

  const countryLocal = display.country.trim() ? display.country : undefined
  return {
    isPairLayout: true,
    city: {
      local: display.city,
      latin: display.cityLatin,
      applyLatinTracking: false,
    },
    country: {
      local: countryLocal,
      latin: display.countryLatin,
      applyLatinTracking: false,
    },
  }
}
