const Juejin = require('./juejin/index.js')
const pushMessage = require('./utils/pushMessage.js')
const { COOKIE } = require('./ENV.js')
const pushplus = require('./utils/pushplus.js')
const { EMAIL, AUTHORIZATION_CODE, PUSHPLUS_TOKEN, DINGDING_WEBHOOK, FEISHU_WEBHOOK } = require('./ENV.js')

const growth = {
  userName: '', // 用户名
  checkedIn: false, // 是否签到
  incrPoint: 0, // 签到获得矿石数
  sumPoint: 0, // 总矿石数
  contCount: 0, // 连续签到天数
  sumCount: 0, // 累计签到天数
  luckyValue: 0, // 总幸运值
  freeCount: 0, // 免费抽奖次数
  freeDrawed: false, // 是否免费抽奖
  lotteryName: '', // 奖品名称
  collectedBug: false, // 是否收集 Bug
  collectBugCount: 0, // 收集 Bug 的数量
}

const message = () => {
  return `
📎 Hello ${growth.userName}
${growth.checkedIn ? `签到 +${growth.incrPoint} 矿石` : '今日已签到'}
当前矿石数 ${growth.sumPoint}
连续签到天数 ${growth.contCount}
累计签到天数 ${growth.sumCount}
当前幸运值 ${growth.luckyValue}
免费抽奖次数 ${growth.freeCount}
`.trim()
}

const main = async () => {
  const juejin = new Juejin()

  // 登录
  try {
    await juejin.login(COOKIE)

    growth.userName = juejin.user.user_name
  } catch {
    PUSHPLUS_TOKEN &&
    pushplus(
      formatter(type, message, {
        style: 'markdown',
        bold: true,
        wordWrap: true,
      })
    )
    throw new Error('登录失败, 请尝试更新 Cookies')
  }

  // 签到
  const checkIn = await juejin.getTodayStatus()

  if (!checkIn.check_in_done) {
    const checkInResult = await juejin.checkIn()

    growth.checkedIn = true
    growth.incrPoint = checkInResult.incr_point
  }

  // 签到天数
  const counts = await juejin.getCounts()

  growth.contCount = counts.cont_count
  growth.sumCount = counts.sum_count

  // 免费抽奖
  const lotteryConfig = await juejin.getLotteryConfig()
  growth.freeCount = lotteryConfig.free_count || 0

  // 当前矿石数
  growth.sumPoint = await juejin.getCurrentPoint()

  // 当前幸运值
  const luckyResult = await juejin.getLucky()
  growth.luckyValue = luckyResult.total_value

  pushMessage({
    type: 'info',
    message: message(),
  })
}

main().catch(error => {
  pushMessage({
    type: 'error',
    message: error.stack,
  })
})
