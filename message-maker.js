import * as fs from 'node:fs';

// 日本語の曜日ラベル。Temporal.ZonedDateTime.dayOfWeek は 1=月曜 ... 7=日曜。
/**
 * Japanese short weekday labels indexed by Temporal dayOfWeek (1-7).
 * @since v2.0.0
 * @type {string[]}
 */
const WEEKDAYS_JA = ['月', '火', '水', '木', '金', '土', '日'];

/**
 * Format an ISO datetime string into a JST string like "5月25日(月) 10:00".
 * Uses the built-in Temporal API, so no external date library is required.
 * @since v2.0.0
 * @param {string} isoString - ISO 8601 datetime string.
 * @returns {string} - Formatted JST datetime, e.g. "5月25日(月) 10:00".
 */
const formatJst = (isoString) => {
  const zdt = Temporal.Instant.fromEpochMilliseconds(Date.parse(isoString)).toZonedDateTimeISO(
    'Asia/Tokyo'
  );
  const weekday = WEEKDAYS_JA[zdt.dayOfWeek - 1];
  const hour = String(zdt.hour).padStart(2, '0');
  const minute = String(zdt.minute).padStart(2, '0');
  return `${zdt.month}月${zdt.day}日(${weekday}) ${hour}:${minute}`;
};

// ランダム支給ブキは API の name が金?・緑?どちらも「ランダム」で区別できないため、
// 画像の SplatNet3 リソース ID（ハッシュ）で判別する。ハッシュは av5ja SDK 準拠で固定。
/**
 * Map of random-weapon image hashes to Misskey emoji badges.
 * @since v3.0.2
 * @type {Object.<string, string>}
 */
const RANDOM_WEAPON_BADGES = {
  // 金?: クマサン印のブキ・ランダム (RandomGold)
  '9d7272733ae2f2282938da17d69f13419a935eef42239132a02fcf37d8678f10': ':random_gold:',
  // 緑?: 通常ランダム (RandomGreen)
  '473fffb2442075078d8bb7125744905abdeae651b6a5b7453ae295582e45f7d1': ':random_green:',
};

/**
 * Extract the SplatNet3 resource hash from a weapon image URL.
 * @since v3.0.2
 * @param {string} image - Weapon image URL.
 * @returns {string|null} - 64-hex resource hash, or null if not found.
 */
const weaponImageHash = (image) => {
  const matched = String(image ?? '').match(/ui_img\/([0-9a-f]{64})/);
  return matched ? matched[1] : null;
};

/**
 * Class to generate message.
 * @since v1.0.0
 * @param { Object } shift - Shift object.
 * @param { int } [restOfHours = 40] - Rest of hours of this shift.
 * @param { boolean } [isCountDown = false] - Flag of count down.
 * @param { boolean } [isNext = false] - Flag of Next shift.
 * @param { boolean } [isBigRun = false] - Flag of BigRun.
 * @param { boolean } [isContest = false] - Flag of Contest.
 * @param { boolean } [isFutureBigRun = false] - Flag of Future shift of Big Run.
 */
const MessageMaker = class {
  constructor(
    shift,
    restOfHours = 40,
    isCountDown = false,
    isNext = false,
    isBigRun = false,
    isContest = false,
    isFutureBigRun = false
  ) {
    this.shift = shift;
    this.restOfHours = restOfHours;
    this.isCountDown = isCountDown;
    this.isNext = isNext;
    this.isBigRun = isBigRun;
    this.isContest = isContest;
    this.isFutureBigRun = isFutureBigRun;

    // ステージのバッジを選べるように
    /**
     * Object of stage badges.
     * @since v1.0.0
     * @type {Object}
     */
    this.stageBadges = JSON.parse(fs.readFileSync('./JSON/stages.json'));

    // ブキのバッジを選べるように
    /**
     * Object of weapon badges.
     * @since v1.0.0
     * @type {Object}
     */
    this.weaponBadges = JSON.parse(fs.readFileSync('./JSON/weapons.json'));
  }

  // ステージバッジ存在チェック
  /**
   * Getter: Get stage badge tag.
   * @since v1.0.0
   * @returns {string} - Badge image tag or blank string
   */
  get stageBadgeId() {
    let result;

    if (Reflect.has(this.stageBadges, this.shift.stage.name)) {
      result = this.stageBadges[this.shift.stage.name];
    } else {
      result = '';
    }

    return result;
  }

  // ステージ名返却
  /**
   * Getter: Cleaned up stage name.
   * @since v1.0.0
   * @returns {string} - Stage name or undef-text.
   */
  get stageName() {
    let stage = '不明';

    if (this.shift.stage !== '') {
      stage = this.shift.stage.name;
    }

    return stage;
  }

  // ブキバッジ存在チェック
  /**
   * Generate weapon badge tag. ランダム支給ブキは name が金?・緑?共通で
   * 判別できないため、まず画像ハッシュで金?/緑?を確定し、無ければ name で検索する。
   * @since v1.0.0
   * @param {Object} weapon - Weapon object ({ name, image }).
   * @returns {string} - Badge image tag or weapon name
   */
  weaponBadgeIdMaker = (weapon) => {
    const hash = weaponImageHash(weapon.image);
    if (hash && Reflect.has(RANDOM_WEAPON_BADGES, hash)) {
      return RANDOM_WEAPON_BADGES[hash];
    }

    if (Reflect.has(this.weaponBadges, weapon.name)) {
      return this.weaponBadges[weapon.name];
    }

    return weapon.name;
  };

  // マルチにしたもの
  /**
   * Make message to send.
   * @since v1.0.0
   * @returns {string} - Message to send
   */
  maker() {
    console.log('func: message.maker');
    /** @type {string} */
    let msg = '';

    if (this.isBigRun) {
      msg += ':big_run: ';
    }

    if (this.isCountDown) {
      msg += '$[shake まもなく終了！]';
      msg += '\n';
    }

    if (this.isBigRun) {
      msg += ':big_run_badge_gold:';
    } else if (this.isContest) {
      msg += ':btc_gold:';
    } else {
      msg += ':grizzco_bronze:';
    }

    msg += ' ';

    if (this.isNext && this.isContest) {
      msg += ':eggstra_work:**のお知らせ**';
      msg += ':btc_gold:';
    } else if (this.isNext && !this.isContest) {
      msg += '**次のシフト**';
    } else if (this.isFutureBigRun) {
      msg += '**ビッグランのお知らせ**';
    } else if (this.isBigRun) {
      msg += '**ただいまのビッグラン**';
    } else if (this.isContest) {
      msg += '**開催中の**:eggstra_work:';
      msg += ':btc_gold:';
    } else {
      msg += '**ただいまのシフト**';
    }

    msg += '\n';

    if (this.isNext || this.isFutureBigRun) {
      msg += `${formatJst(this.shift.start_time)}スタート！`;
    } else {
      msg += `残りおよそ **${this.restOfHours}時間**`;
    }

    msg += '\n';
    msg += 'ステージ: ';
    if (!this.isBigRun) {
      msg += `${this.stageBadgeId}`;
    }
    msg += ` **${this.stageName}**`;
    msg += '\n';

    // ブキを並べる
    msg += '支給ブキ: ';

    const { weapons } = this.shift;
    // eslint-disable-next-line no-restricted-syntax
    for (const weapon of weapons) {
      const weaponBadge = this.weaponBadgeIdMaker(weapon);
      msg += weaponBadge;
      msg += ' ';
    }

    if (this.isNext || this.isFutureBigRun) {
      msg += '\n';
      msg += `${formatJst(this.shift.end_time)}まで`;
    }

    return msg;
  }
};

export default MessageMaker;
