import * as fs from 'node:fs';

// eslint-disable-next-line import/extensions
import { formatJst } from './date-format.js';

/**
 * Class to generate battle (Regular/Bankara/X/Event) message.
 * Modernized port from bankara-misskey-bot: date-fns-tz → Temporal API.
 * @since v3.0.0
 * @param { Object } shift - Shift object from spla3 API.
 * @param { string } category - The category of the rules, e.g. "レギュラーマッチ".
 * @param { boolean } [now=true] - Whether this represents the current shift.
 */
const BattleMessageMaker = class {
  constructor(shift, category, now = true) {
    this.shift = shift;
    this.category = category;
    this.now = now;

    // ルールのバッジを選べるように
    /**
     * Object of rule badges.
     * @since v3.0.0
     * @type {Object}
     */
    this.ruleBadges = JSON.parse(fs.readFileSync('./JSON/rules.json'));

    /**
     * Object of category badges.
     * @since v3.0.0
     * @type {Object}
     */
    this.catBadges = JSON.parse(fs.readFileSync('./JSON/categories.json'));

    /**
     * Return stage string to post.
     * @since v3.0.0
     * @param {Object[]} shiftObj - Array of stage objects.
     * @returns {string} - Stage names joined with " / ".
     */
    this.stageMaker = (shiftObj) => {
      console.log('func: BattleMessageMaker.stageMaker');
      let res = '';
      shiftObj.forEach((obj, index, arr) => {
        res += obj.name;
        res += index !== arr.length - 1 ? ' / ' : '';
      });
      return res;
    };
  }

  // ルールバッジ存在チェック
  /**
   * Get rule or category badge tag.
   * @since v3.0.0
   * @param {string} name - Name of the rule or category.
   * @param {string} series - "rule" or anything else (treated as category).
   * @returns {string} - Badge image tag or blank string.
   */
  getBadgeId(name, series) {
    const obj = series === 'rule' ? this.ruleBadges : this.catBadges;
    return Reflect.has(obj, name) ? obj[name] : '';
  }

  /**
   * Make the rule/stage prefix line for Bankara Match.
   * @since v3.0.0
   * @param {string} cat - "OPEN" or "CHALLENGE".
   * @returns {string} - Rule line.
   */
  bankaraRuleStageMessageMaker(cat) {
    const text = cat === 'OPEN' ? 'オープン' : 'チャレンジ';
    return `**${text}** ${this.getBadgeId(this.shift.rule.name, 'rule')} ${this.shift.rule.name}\n`;
  }

  /**
   * Return the shift's time range line.
   * @since v3.0.0
   * @returns {string} - Formatted time-range line.
   */
  timeList() {
    console.log('func: BattleMessageMaker.timeList');
    return `・${formatJst(this.shift.start_time)} - ${formatJst(this.shift.end_time)}\n`;
  }

  /**
   * Make message to send.
   * @since v3.0.0
   * @returns {string} - Message body.
   */
  maker() {
    console.log('func: BattleMessageMaker.maker');
    /** @type {string} */
    const rule =
      this.category !== 'バンカラマッチ'
        ? `${this.getBadgeId(this.shift.rule.name, 'rule')} ${this.shift.rule.name}\n`
        : '';
    /** @type {string} */
    let msg = this.now ? '**ただいまの' : '**次の';
    msg += `${this.category + this.getBadgeId(this.category, 'cat')}**`;
    msg +=
      this.category !== 'イベントマッチ' && !this.now
        ? `\n${formatJst(this.shift.start_time)}スタート！`
        : '';
    msg += '\n';

    switch (this.category) {
      case 'バンカラマッチ（オープン）':
        msg += this.bankaraRuleStageMessageMaker('OPEN');
        msg += `ステージ: ${this.stageMaker(this.shift.stages)}`;
        break;
      case 'バンカラマッチ（チャレンジ）':
        msg += this.bankaraRuleStageMessageMaker('CHALLENGE');
        msg += `ステージ: ${this.stageMaker(this.shift.stages)}`;
        break;
      case 'イベントマッチ':
        msg += `**${this.shift.event.name}**\n`;
        msg += `<small>${this.shift.event.desc
          .replace(/<br \/>/g, '\n')
          .replace(/\n\n/g, '\n')}</small>\n`;
        msg += `${rule + this.timeList()}\n`;
        msg += `ステージ: ${this.stageMaker(this.shift.stages)}`;
        break;
      default:
        msg += rule;
        msg += `ステージ: ${this.stageMaker(this.shift.stages)}`;
    }
    return msg;
  }
};

export default BattleMessageMaker;
