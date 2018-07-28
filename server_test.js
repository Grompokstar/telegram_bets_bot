process.env["NTBA_FIX_319"] = 1;
const express        = require('express');
const MongoClient    = require('mongodb').MongoClient;
const bodyParser     = require('body-parser');
const db             = require('./config/db');
const app            = express();
const TelegramBot = require('node-telegram-bot-api');
const { InlineKeyboard, ReplyKeyboard, ForceReply } = require('telegram-keyboard-wrapper');
const rp = require('request-promise');
const _ = require('lodash');
const mainToken = '515855036:AAEY-jgjNUA8ZKu7DyiLhXqY71PVKj4nxK4';
const testToken = '571233425:AAEuaeoImFHtepoZxIjKxV9DP-T4M-zAgu0';
//const bot = new TelegramBot(testToken, {polling: true});
const testChannelName = '@test_telegram_bots';
const mainChannelName = '@roma_best_football_bets';
const testChannelId = -1001259208814;

const unicodeScores = ['\u0030\u20E3', '\u0031\u20E3', '\u0032\u20E3', '\u0033\u20E3', '\u0034\u20E3', '\u0035\u20E3', '\u0036\u20E3', '\u0037\u20E3'];
let showedEvents = [];

MongoClient.connect("mongodb://localhost:27017/", (err, database) => {
  const myAwesomeDB = database.db('bets');

  if (err) return console.log(err);

  function start() {
    let item = {
      name: "Roman",
      passport: {
        seria: 9207,
        number: 510142

      }
    }
    myAwesomeDB.collection('notes').insert(item, (err, result) => {
      if (err) {
        console.log(err);
      } else {
        console.log(result.ops[0]);
      }
    });
  }

  start();


  setInterval(start, 60000);
})



