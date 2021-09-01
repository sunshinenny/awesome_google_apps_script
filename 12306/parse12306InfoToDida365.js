/**
 * 提取12306邮件的车次信息，将其转为任务信息添加到滴答清单
 * 
 * @author: SunShinenny (少数派ID: SunShinenn)
 * @date: 2021/08/31
 * @copyright: 方便的话声明原作者名称即可～因为正则学的不咋样，宣称是我写的我还有些不好意思(´･ω･`)
 */
function parse12306InfoToDida365() {
  // 常量定义
  let didaEmail = `此处填写您的滴答清单邮箱@mail.dida365.com`;

  // 获取收件箱的线程
  let thread = GmailApp.getInboxThreads(0, 1)[0];
  if (thread == undefined || thread == null) {
    // 经测试,当没有未读邮件时将获取到undefined,其他情况暂未可知
    Logger.log("线程获取失败,停止后续操作。");
    return;
  }
  // 获取所有邮件
  let messages = thread.getMessages();
  Logger.log(`邮件共${messages.length}封。`);
  // 遍历所有邮件
  messages.forEach(msg => {
    // 统计几封未读的计数器
    let unreadCount = 0;
    // 检查是否未读
    if (msg.isUnread()) {
      // 输出未读邮件的主题与收件日期「供调试使用」
      Logger.log(`未读:${msg.getSubject()}-${msg.getDate()}`)
      // 未读计数 +1
      unreadCount += 1;
      // 如果未读,判断是否是12306发来的邮件
      let subject = msg.getSubject();
      // 此处偷懒直接根据主题中是不是包含了"网上购票系统"来判断是不是12306发送的邮件
      if (subject.indexOf("网上购票系统") != -1) {
        // 获取正文内容
        let plainBody = msg.getPlainBody();
        // 替换所有的空格，方便匹配正则
        let trimBody = plainBody.replace(/\s+/g, "");
        // 初步提取内容,将“您的姓名”改为您的真实姓名,用以匹配
        let completeInformation = String(trimBody.match(/您的姓名[，].*[站]*.*[检票口]?([0-9a-zA-Z]+)?为了/g))
        // 判断匹配后的长度,如果长度过少,说明匹配失败
        if (completeInformation.length < 3) {
          Logger.log("正则匹配失败,任务失败")
          return;
        }


        // 开始处理任务内容
        // 任务日期带时间
        let taskDateWithTime = completeInformation.match(/[\d]*年[\d]*月[\d]*日[\d]*[:]?[\d]*/g)
        // 任务时间
        let taskTime = completeInformation.match(/[\d]{2}:[\d]{2}/g)
        // 从哪去哪
        let whereToWhere = String(completeInformation.match(/[，][\s\S]{0,5}-[^，]{0,5}[，]?/g)).replace("，", "")
        // 车次号
        let trainNumber = completeInformation.match(/[0-9a-zA-Z]*[次列车].*[号]/g)
        // 检票口「可能为空」
        let ticketCheck = completeInformation.match(/(检票口)[0-9a-zA-Z]*/g)

        // 最后拼接的文本
        let finalTaskText = ""
        if (ticketCheck == null) {
          // 滴答清单需要一个完整的时间将其转为任务，故最后文本形如"2021年08月18日14:05[14:05]杭州东站-xx站,G1818次列车,18车18F号"
          finalTaskText = `${taskDateWithTime}[${taskTime}]${trainNumber}`.replace("，", "")
        } else {
          // 滴答清单需要一个完整的时间将其转为任务，故最后文本形如"2021年08月18日14:05[14:05]杭州东站-xx站,G1818次列车,18车18F号,检票口18A"
          finalTaskText = `${taskDateWithTime}[${taskTime}]${trainNumber},${ticketCheck}`.replace("，", "")
        }
        Logger.log(finalTaskText)
        GmailApp.sendEmail(didaEmail, finalTaskText, plainBody);

        // 标记为已读
        msg.markRead();
      }
    } else {
      Logger.log(`已读:${msg.getSubject()}-${msg.getDate()}`)
    }
    Logger.log(`未读邮件共${unreadCount}封`)
  })
}
