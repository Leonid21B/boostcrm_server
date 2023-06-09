import nodemailer from 'nodemailer'

class MailService {
  constructor () {
    this.trasporter = nodemailer.createTransport({
      host: 'smtp.yandex.ru',
      port: '587',
      secure: false,
      auth: {
        user: 'support@boostcrm.ru',
        pass: 'Antony2103951314'
      }
    })
  }
  async sendRebuildPassword(userEmail,link){
    return this.trasporter.sendMail({
        from: 'support@boostcrm.ru',
        to: userEmail,
        subject: 'Смена пароля',
        html:
                  `
              <div>
                  <h1 style="color=#73AAFC;text-transform=uppercase">Сменить пароль.</h1>
                  <a target="_blank" href=${link}>Для сброса пароля нажмите СЮДА.</a>
                  <strong color='#73AAFC' display='block'> Новый пароль придет в следующем письме!</strong>
              </div>
          `
      })
  }
  async sendLink (userEmail, password, link) {
    if(link){
      return this.trasporter.sendMail({
        from: 'support@boostcrm.ru',
        to: userEmail,
        subject: 'Confirm Email',
        html:
                  `
              <div>
                  <h1 style="color=#73AAFC;text-transform=uppercase">Вам необходимо подтвердить свою почту!</h1>
                  <div display='block'>
                    <a target="_blank" href=${link}>Нажмите СЮДА для подтверждения.</a>
                    <strong color='#73AAFC' display='block'> Ваш пароль: ${password}</strong>
                  </div>
              </div>
          `
      })
    }else{
      return this.trasporter.sendMail({
        from: 'support@boostcrm.ru',
        to: userEmail,
        subject: 'Confirm Email',
        html:
                  `
              <div>
                  <h1 style="color=#73AAFC;text-transform=uppercase">Ваш пароль успешно изменен!</h1>
                  <strong color='#73AAFC' display='block'> Новый пароль: ${password}</strong>
              </div>
          `
      })
    }
  }

  async sendInvite (userEmail, password, link) {
    console.log(`link`, link)
    const sendInviteLink = await this.trasporter.sendMail({
      from: 'support@boostcrm.ru',
      to: userEmail,
      subject: 'Confirm invite',
      html:
                `
            <div>
                <h1>Confirm Invite</h1>
                <a target="_blank" href=${link}>Перейди</a>
                <strong> Ваша почта ${userEmail}</strong>
                <strong> Ваш пароль ${password}</strong>
            </div>
        `
    })
    return sendInviteLink
  }

  async sendStatement (from, thema, comment, type) {
    await this.trasporter.sendMail({
      from: 'support@boostcrm.ru',
      to: 'antonthegod@yandex.ru',
      subject: 'Help',
      html:
                `
                <div>
                    <h1 style="color:#73AAFC;text-transform: uppercase;word-spacing: 10px;">${thema}</h1>
                    <p style="font-family: Nunito Sans;font-weight: 400;font-size: 20px;line-height: 24px;color: #333342;">${comment}
                    </p>
                    <strong style="font-weight: 400;font-size: 20px;">${type}</strong>
                </div>
            `
    })
  }
  async sendTarifSize (from, size,emailUs){
    await this.trasporter.sendMail({
      from: 'support@boostcrm.ru',
      to: emailUs,
      subject: 'Help',
      html:
                `
                <div>
                    <h1 style="color:#73AAFC;text-transform: uppercase;word-spacing: 10px;">У вас заканчивается память</h1>
                    <p style="font-family: Nunito Sans;font-weight: 400;font-size: 20px;line-height: 24px;color: #333342;">Осталось ${size}
                    </p>
                </div>
            `
    })
  }
  async sendTarifTime (from, time, emailUs){
    await this.trasporter.sendMail({
      from: 'support@boostcrm.ru',
      to: emailUs,
      subject: 'Help',
      html:
                `
                <div>
                    <h1 style="color:#73AAFC;text-transform: uppercase;word-spacing: 10px;">У вас заканчивается время</h1>
                    <p style="font-family: Nunito Sans;font-weight: 400;font-size: 20px;line-height: 24px;color: #333342;">Осталось ${time} дней.
                    </p>
                </div>
            `
    })
  }
}

export const mailService = new MailService()
