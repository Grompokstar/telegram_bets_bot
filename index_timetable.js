process.env["NTBA_FIX_319"] = 1;
const TelegramBot = require('node-telegram-bot-api');
const Agent = require('socks5-https-client/lib/Agent');
const { InlineKeyboard, ReplyKeyboard, ForceReply } = require('telegram-keyboard-wrapper');
const rp = require('request-promise');
const _ = require('lodash');
const token = '656200648:AAHDYBeyUZkHg3HOCbuVnDcxZVbpgZd9cPg';
const bot = new TelegramBot(token, {
  polling: true,
  request: {
    agentClass: Agent,
    agentOptions: {
      socksHost: '45.32.154.68',
      socksPort: 40801,
      socksUsername: 'romachervontsev',
      socksPassword: '39dk39dk3'
    }
  }
});
const testChannelId = -1001259208814;
const mainTestChannel = '@betbomb_test_channel';
const zaryadPlusCommonChannel = '@betbomb_zaryad_common';
const API = 'https://api.betsapi.com/v2/events/upcoming?sport_id=1&token=8334-BCLtMmtKT698vk';

Date.prototype.toLocaleDateString = function (lang) {
  this.setDate(this.getDate() + 1);

  if (lang === 'ru') {
    let date  = this.getDate().toString();
    if (date.length === 1) {
      date = '0' + date;
    }

    let month  = (this.getMonth() + 1).toString();
    if (month.length === 1) {
      month = '0' + month;
    }
    return `${date}.${month}.${this.getFullYear()}`;

  } else if (lang === 'filter') {
    let date  = this.getDate().toString();
    if (date.length === 1) {
      date = '0' + date;
    }

    let month  = (this.getMonth() + 1).toString();
    if (month.length === 1) {
      month = '0' + month;
    }
    return `${this.getFullYear()}${month}${date}`;
  }

};

function start() {
  let timeNow = new Date().toLocaleString('ru', {hour:'numeric', minute:'numeric'});

  if (timeNow === '22:00') {
    let filterDate = new Date().toLocaleDateString('filter');
    console.log(filterDate);

    rp(API + '&day=' + filterDate)
      .then(function (response) {
        console.log('запрос upcoming');
        let pager = JSON.parse(response).pager;
        let results = [];
        let message = '';

        let date = new Date().toLocaleDateString('ru');
        message += '\u{1F4C5} <b>Расписание на ' + date +'</b>\n\n';

        let pages = parseInt(pager.total/pager.per_page) + 1;
        let page = 1;

        function getEvents(pageNumber) {
          rp(API + '&day=' + filterDate + '&page=' + pageNumber)
            .then((response) => {
              let currentResponse = JSON.parse(response).results;
              results = results.concat(currentResponse);

              if (pageNumber === pages) {

                let groupedResults = _.groupBy(results, function(item) {
                  return item.time;
                });

                _.forEach(groupedResults, function(item, key) {
                  let time = new Date(parseInt(key) * 1000).toLocaleString('ru', {hour:'numeric', minute:'numeric'});

                  if (item.length >= 3) {
                    if (item.length >= 25 && item.length < 50) {
                      message +=  '<b>' + time + '  —  ' + item.length + '</b>\u2757\n'
                    } else if (item.length >= 50 && item.length < 100) {
                      message +=  '<b>' + time + '  —  ' + item.length + '</b>\u203C\n'
                    } else if (item.length >= 100) {
                      message +=  '<b>' + time + '  —  ' + item.length + '</b>\u2757\u2757\u2757\n'
                    } else {
                      message += time + '  —  ' + item.length + '\n'
                    }
                  }

                });

                message += '\n\u26BD Всего матчей: <b>' + results.length + '</b>';

                let options = Object.assign({}, {parse_mode: 'HTML'});

                bot.sendMessage(mainTestChannel, message, options);
                bot.sendMessage(zaryadPlusCommonChannel, message, options);
              } else {
                getEvents(++pageNumber)
              }

            })
            .catch(function (err) {
              console.log('request upcoming failed' + err)
            });
        }

        getEvents(page);

      })
      .catch(function (err) {
        console.log('request upcoming failed' + err)
      });
  }

}

start();


setInterval(start, 60000);
