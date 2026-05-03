// fonts.js — Unicode font engine (uses [...str] spread, never split('') on Unicode)
'use strict';

const DEFAULT_TEXT = 'Font Generator';

// ── character-by-character map helper ──────────────────────────────────────
// IMPORTANT: Both normal and target are spread with [...] to handle multi-byte chars correctly
function makeMap(normal, target) {
  const nArr = [...normal];
  const tArr = [...target];
  const m = {};
  nArr.forEach((ch, i) => { if (tArr[i]) m[ch] = tArr[i]; });
  return m;
}

function applyMap(text, map) {
  return [...text].map(c => map[c] ?? c).join('');
}

// ── base alphabet ───────────────────────────────────────────────────────────
const ALPHA_UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const ALPHA_LOWER = 'abcdefghijklmnopqrstuvwxyz';
const DIGITS      = '0123456789';
const NORMAL      = ALPHA_UPPER + ALPHA_LOWER + DIGITS;

// ── Unicode target strings (each char is one glyph) ────────────────────────
// Bold Serif
const T_BOLD        = '𝐀𝐁𝐂𝐃𝐄𝐅𝐆𝐇𝐈𝐉𝐊𝐋𝐌𝐍𝐎𝐏𝐐𝐑𝐒𝐓𝐔𝐕𝐖𝐗𝐘𝐙𝐚𝐛𝐜𝐝𝐞𝐟𝐠𝐡𝐢𝐣𝐤𝐥𝐦𝐧𝐨𝐩𝐪𝐫𝐬𝐭𝐮𝐯𝐰𝐱𝐲𝐳𝟎𝟏𝟐𝟑𝟒𝟓𝟔𝟕𝟖𝟗';
// Italic Serif
const T_ITALIC      = '𝐴𝐵𝐶𝐷𝐸𝐹𝐺𝐻𝐼𝐽𝐾𝐿𝑀𝑁𝑂𝑃𝑄𝑅𝑆𝑇𝑈𝑉𝑊𝑋𝑌𝑍𝑎𝑏𝑐𝑑𝑒𝑓𝑔ℎ𝑖𝑗𝑘𝑙𝑚𝑛𝑜𝑝𝑞𝑟𝑠𝑡𝑢𝑣𝑤𝑥𝑦𝑧0123456789';
// Bold Italic Serif
const T_BOLD_ITALIC = '𝑨𝑩𝑪𝑫𝑬𝑭𝑮𝑯𝑰𝑱𝑲𝑳𝑴𝑵𝑶𝑷𝑸𝑹𝑺𝑻𝑼𝑽𝑾𝑿𝒀𝒁𝒂𝒃𝒄𝒅𝒆𝒇𝒈𝒉𝒊𝒋𝒌𝒍𝒎𝒏𝒐𝒑𝒒𝒓𝒔𝒕𝒖𝒗𝒘𝒙𝒚𝒛0123456789';
// Script / Cursive
const T_SCRIPT      = '𝒜ℬ𝒞𝒟ℰℱ𝒢ℋℐ𝒥𝒦ℒℳ𝒩𝒪𝒫𝒬ℛ𝒮𝒯𝒰𝒱𝒲𝒳𝒴𝒵𝒶𝒷𝒸𝒹ℯ𝒻ℊ𝒽𝒾𝒿𝓀𝓁𝓂𝓃ℴ𝓅𝓆𝓇𝓈𝓉𝓊𝓋𝓌𝓍𝓎𝓏0123456789';
// Bold Script / Cursive Bold
const T_SCRIPT_BOLD = '𝓐𝓑𝓒𝓓𝓔𝓕𝓖𝓗𝓘𝓙𝓚𝓛𝓜𝓝𝓞𝓟𝓠𝓡𝓢𝓣𝓤𝓥𝓦𝓧𝓨𝓩𝓪𝓫𝓬𝓭𝓮𝓯𝓰𝓱𝓲𝓳𝓴𝓵𝓶𝓷𝓸𝓹𝓺𝓻𝓼𝓽𝓾𝓿𝔀𝔁𝔂𝔃0123456789';
// Gothic / Fraktur
const T_GOTHIC      = '𝔄𝔅ℭ𝔇𝔈𝔉𝔊ℌℑ𝔍𝔎𝔏𝔐𝔑𝔒𝔓𝔔ℜ𝔖𝔗𝔘𝔙𝔚𝔛𝔜ℨ𝔞𝔟𝔠𝔡𝔢𝔣𝔤𝔥𝔦𝔧𝔨𝔩𝔪𝔫𝔬𝔭𝔮𝔯𝔰𝔱𝔲𝔳𝔴𝔵𝔶𝔷0123456789';
// Gothic Bold
const T_GOTHIC_BOLD = '𝕬𝕭𝕮𝕯𝕰𝕱𝕲𝕳𝕴𝕵𝕶𝕷𝕸𝕹𝕺𝕻𝕼𝕽𝕾𝕿𝖀𝖁𝖂𝖃𝖄𝖅𝖆𝖇𝖈𝖉𝖊𝖋𝖌𝖍𝖎𝖏𝖐𝖑𝖒𝖓𝖔𝖕𝖖𝖗𝖘𝖙𝖚𝖛𝖜𝖝𝖞𝖟0123456789';
// Double-struck
const T_DOUBLE      = '𝔸𝔹ℂ𝔻𝔼𝔽𝔾ℍ𝕀𝕁𝕂𝕃𝕄ℕ𝕆ℙℚℝ𝕊𝕋𝕌𝕍𝕎𝕏𝕐ℤ𝕒𝕓𝕔𝕕𝕖𝕗𝕘𝕙𝕚𝕛𝕜𝕝𝕞𝕟𝕠𝕡𝕢𝕣𝕤𝕥𝕦𝕧𝕨𝕩𝕪𝕫𝟘𝟙𝟚𝟛𝟜𝟝𝟞𝟟𝟠𝟡';
// Monospace
const T_MONO        = '𝙰𝙱𝙲𝙳𝙴𝙵𝙶𝙷𝙸𝙹𝙺𝙻𝙼𝙽𝙾𝙿𝚀𝚁𝚂𝚃𝚄𝚅𝚆𝚇𝚈𝚉𝚊𝚋𝚌𝚍𝚎𝚏𝚐𝚑𝚒𝚓𝚔𝚕𝚖𝚗𝚘𝚙𝚚𝚛𝚜𝚝𝚞𝚟𝚠𝚡𝚢𝚣𝟶𝟷𝟸𝟹𝟺𝟻𝟼𝟽𝟾𝟿';
// Sans-serif
const T_SANS        = '𝖠𝖡𝖢𝖣𝖤𝖥𝖦𝖧𝖨𝖩𝖪𝖫𝖬𝖭𝖮𝖯𝖰𝖱𝖲𝖳𝖴𝖵𝖶𝖷𝖸𝖹𝖺𝖻𝖼𝖽𝖾𝖿𝗀𝗁𝗂𝗃𝗄𝗅𝗆𝗇𝗈𝗉𝗊𝗋𝗌𝗍𝗎𝗏𝗐𝗑𝗒𝗓𝟢𝟣𝟤𝟥𝟦𝟧𝟨𝟩𝟪𝟫';
// Sans-serif Bold
const T_SANS_BOLD   = '𝗔𝗕𝗖𝗗𝗘𝗙𝗚𝗛𝗜𝗝𝗞𝗟𝗠𝗡𝗢𝗣𝗤𝗥𝗦𝗧𝗨𝗩𝗪𝗫𝗬𝗭𝗮𝗯𝗰𝗱𝗲𝗳𝗴𝗵𝗶𝗷𝗸𝗹𝗺𝗻𝗼𝗽𝗾𝗿𝘀𝘁𝘂𝘃𝘄𝘅𝘆𝘇𝟬𝟭𝟮𝟯𝟰𝟱𝟲𝟳𝟴𝟵';
// Sans-serif Italic
const T_SANS_ITALIC = '𝘈𝘉𝘊𝘋𝘌𝘍𝘎𝘏𝘐𝘑𝘒𝘓𝘔𝘕𝘖𝘗𝘘𝘙𝘚𝘛𝘜𝘝𝘞𝘟𝘠𝘡𝘢𝘣𝘤𝘥𝘦𝘧𝘨𝘩𝘪𝘫𝘬𝘭𝘮𝘯𝘰𝘱𝘲𝘳𝘴𝘵𝘶𝘷𝘸𝘹𝘺𝘻0123456789';
// Sans Bold Italic
const T_SANS_BI     = '𝘼𝘽𝘾𝘿𝙀𝙁𝙂𝙃𝙄𝙅𝙆𝙇𝙈𝙉𝙊𝙋𝙌𝙍𝙎𝙏𝙐𝙑𝙒𝙓𝙔𝙕𝙖𝙗𝙘𝙙𝙚𝙛𝙜𝙝𝙞𝙟𝙠𝙡𝙢𝙣𝙤𝙥𝙦𝙧𝙨𝙩𝙪𝙫𝙬𝙭𝙮𝙯0123456789';
// Full-width
const T_WIDE        = 'ＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚ０１２３４５６７８９';

// ── Prebuilt maps ───────────────────────────────────────────────────────────
const MAP_BOLD        = makeMap(NORMAL, T_BOLD);
const MAP_ITALIC      = makeMap(NORMAL, T_ITALIC);
const MAP_BOLD_ITALIC = makeMap(NORMAL, T_BOLD_ITALIC);
const MAP_SCRIPT      = makeMap(NORMAL, T_SCRIPT);
const MAP_SCRIPT_BOLD = makeMap(NORMAL, T_SCRIPT_BOLD);
const MAP_GOTHIC      = makeMap(NORMAL, T_GOTHIC);
const MAP_GOTHIC_BOLD = makeMap(NORMAL, T_GOTHIC_BOLD);
const MAP_DOUBLE      = makeMap(NORMAL, T_DOUBLE);
const MAP_MONO        = makeMap(NORMAL, T_MONO);
const MAP_SANS        = makeMap(NORMAL, T_SANS);
const MAP_SANS_BOLD   = makeMap(NORMAL, T_SANS_BOLD);
const MAP_SANS_ITALIC = makeMap(NORMAL, T_SANS_ITALIC);
const MAP_SANS_BI     = makeMap(NORMAL, T_SANS_BI);
const MAP_WIDE        = makeMap(NORMAL, T_WIDE);

// ── Lookup tables for special styles ───────────────────────────────────────
const SMALL_CAPS = {
  a:'ᴀ',b:'ʙ',c:'ᴄ',d:'ᴅ',e:'ᴇ',f:'ꜰ',g:'ɢ',h:'ʜ',i:'ɪ',j:'ᴊ',k:'ᴋ',l:'ʟ',
  m:'ᴍ',n:'ɴ',o:'ᴏ',p:'ᴘ',q:'ǫ',r:'ʀ',s:'ꜱ',t:'ᴛ',u:'ᴜ',v:'ᴠ',w:'ᴡ',x:'x',y:'ʏ',z:'ᴢ',
  A:'ᴀ',B:'ʙ',C:'ᴄ',D:'ᴅ',E:'ᴇ',F:'ꜰ',G:'ɢ',H:'ʜ',I:'ɪ',J:'ᴊ',K:'ᴋ',L:'ʟ',
  M:'ᴍ',N:'ɴ',O:'ᴏ',P:'ᴘ',Q:'ǫ',R:'ʀ',S:'ꜱ',T:'ᴛ',U:'ᴜ',V:'ᴠ',W:'ᴡ',X:'x',Y:'ʏ',Z:'ᴢ'
};

const BUBBLE = {
  a:'ⓐ',b:'ⓑ',c:'ⓒ',d:'ⓓ',e:'ⓔ',f:'ⓕ',g:'ⓖ',h:'ⓗ',i:'ⓘ',j:'ⓙ',k:'ⓚ',l:'ⓛ',
  m:'ⓜ',n:'ⓝ',o:'ⓞ',p:'ⓟ',q:'ⓠ',r:'ⓡ',s:'ⓢ',t:'ⓣ',u:'ⓤ',v:'ⓥ',w:'ⓦ',x:'ⓧ',y:'ⓨ',z:'ⓩ',
  A:'Ⓐ',B:'Ⓑ',C:'Ⓒ',D:'Ⓓ',E:'Ⓔ',F:'Ⓕ',G:'Ⓖ',H:'Ⓗ',I:'Ⓘ',J:'Ⓙ',K:'Ⓚ',L:'Ⓛ',
  M:'Ⓜ',N:'Ⓝ',O:'Ⓞ',P:'Ⓟ',Q:'Ⓠ',R:'Ⓡ',S:'Ⓢ',T:'Ⓣ',U:'Ⓤ',V:'Ⓥ',W:'Ⓦ',X:'Ⓧ',Y:'Ⓨ',Z:'Ⓩ',
  '0':'⓪','1':'①','2':'②','3':'③','4':'④','5':'⑤','6':'⑥','7':'⑦','8':'⑧','9':'⑨'
};

const BUBBLE_FILLED = {
  a:'🅐',b:'🅑',c:'🅒',d:'🅓',e:'🅔',f:'🅕',g:'🅖',h:'🅗',i:'🅘',j:'🅙',k:'🅚',l:'🅛',
  m:'🅜',n:'🅝',o:'🅞',p:'🅟',q:'🅠',r:'🅡',s:'🅢',t:'🅣',u:'🅤',v:'🅥',w:'🅦',x:'🅧',y:'🅨',z:'🅩',
  A:'🅐',B:'🅑',C:'🅒',D:'🅓',E:'🅔',F:'🅕',G:'🅖',H:'🅗',I:'🅘',J:'🅙',K:'🅚',L:'🅛',
  M:'🅜',N:'🅝',O:'🅞',P:'🅟',Q:'🅠',R:'🅡',S:'🅢',T:'🅣',U:'🅤',V:'🅥',W:'🅦',X:'🅧',Y:'🅨',Z:'🅩'
};

const UPSIDE_DOWN_MAP = {
  a:'ɐ',b:'q',c:'ɔ',d:'p',e:'ǝ',f:'ɟ',g:'ƃ',h:'ɥ',i:'ᴉ',j:'ɾ',k:'ʞ',l:'l',
  m:'ɯ',n:'u',o:'o',p:'d',q:'b',r:'ɹ',s:'s',t:'ʇ',u:'n',v:'ʌ',w:'ʍ',x:'x',y:'ʎ',z:'z',
  A:'∀',B:'ᴮ',C:'Ɔ',D:'ᗡ',E:'Ǝ',F:'Ⅎ',G:'פ',H:'H',I:'I',J:'ɾ',K:'ʞ',L:'˥',
  M:'W',N:'N',O:'O',P:'Ԁ',Q:'Q',R:'ɹ',S:'S',T:'┴',U:'∩',V:'Λ',W:'M',X:'X',Y:'⅄',Z:'Z',
  '0':'0','1':'Ɩ','2':'ᄅ','3':'Ɛ','4':'ㄣ','5':'ϛ','6':'9','7':'L','8':'8','9':'6',
  ' ':' ','!':'¡','?':'¿','.':'˙',',':'\'','\'':','
};

const MIRROR_MAP = {
  a:'ɒ',b:'d',c:'ɔ',d:'b',e:'ɘ',f:'ʇ',g:'ϱ',h:'ʜ',i:'i',j:'ʟ',k:'ʞ',l:'l',
  m:'m',n:'n',o:'o',p:'q',q:'p',r:'ɿ',s:'ƨ',t:'ƚ',u:'u',v:'v',w:'w',x:'x',y:'γ',z:'ƹ',
  A:'A',B:'ᴟ',C:'Ɔ',D:'ᗡ',E:'Ǝ',F:'ᖵ',G:'⅁',H:'H',I:'I',J:'ᒐ',K:'ʞ',L:'⅃',
  M:'M',N:'И',O:'O',P:'ꟼ',Q:'Ϙ',R:'Я',S:'Ƨ',T:'T',U:'U',V:'V',W:'W',X:'X',Y:'Y',Z:'Ƹ'
};

const SUPERSCRIPT_MAP = {
  a:'ᵃ',b:'ᵇ',c:'ᶜ',d:'ᵈ',e:'ᵉ',f:'ᶠ',g:'ᵍ',h:'ʰ',i:'ⁱ',j:'ʲ',k:'ᵏ',l:'ˡ',
  m:'ᵐ',n:'ⁿ',o:'ᵒ',p:'ᵖ',r:'ʳ',s:'ˢ',t:'ᵗ',u:'ᵘ',v:'ᵛ',w:'ʷ',x:'ˣ',y:'ʸ',z:'ᶻ',
  A:'ᴬ',B:'ᴮ',C:'ᶜ',D:'ᴰ',E:'ᴱ',F:'ᶠ',G:'ᴳ',H:'ᴴ',I:'ᴵ',J:'ᴶ',K:'ᴷ',L:'ᴸ',
  M:'ᴹ',N:'ᴺ',O:'ᴼ',P:'ᴾ',R:'ᴿ',S:'ˢ',T:'ᵀ',U:'ᵁ',V:'ᵛ',W:'ᵂ',X:'ˣ',Y:'ʸ',Z:'ᶻ',
  '0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹'
};

// ── Diacritic styles (combining chars added AFTER base char) ────────────────
function addDiacritic(text, ...marks) {
  return [...text].map(c => c === ' ' ? ' ' : c + marks.join('')).join('');
}

function strikethrough(t)   { return addDiacritic(t, '\u0336'); }
function underline(t)       { return addDiacritic(t, '\u0332'); }
function overline(t)        { return addDiacritic(t, '\u0305'); }
function doubleStrike(t)    { return addDiacritic(t, '\u0336', '\u0335'); }
function wavyUnder(t)       { return addDiacritic(t, '\u0330'); }
function dotAbove(t)        { return addDiacritic(t, '\u0307'); }
function ringAbove(t)       { return addDiacritic(t, '\u030A'); }
function tilde(t)           { return addDiacritic(t, '\u0303'); }
function doubleUnder(t)     { return addDiacritic(t, '\u0333'); }
function boxed(t)           { return addDiacritic(t, '\u20DE'); }

// ── Glitch / Zalgo ─────────────────────────────────────────────────────────
const COMBINING_ABOVE = ['\u0300','\u0301','\u0302','\u0303','\u0308','\u030B','\u033F','\u035B','\u0352','\u0307','\u0306','\u0311'];
const COMBINING_BELOW = ['\u0316','\u0317','\u0318','\u0319','\u031C','\u031D','\u031E','\u031F','\u0320','\u0332','\u0333'];
const COMBINING_MID   = ['\u0334','\u0335','\u0336','\u0337','\u0338'];

function glitchText(text, intensity = 3) {
  const rand = arr => arr[Math.floor(Math.random() * arr.length)];
  return [...text].map(c => {
    if (c === ' ') return ' ';
    let o = c;
    for (let i = 0; i < intensity; i++) o += rand(COMBINING_ABOVE);
    for (let i = 0; i < Math.ceil(intensity / 2); i++) o += rand(COMBINING_BELOW);
    return o;
  }).join('');
}

function zalgoText(text) {
  const ABOVE = ['\u030d','\u030e','\u0304','\u0305','\u033f','\u0311','\u0306','\u0310','\u0352','\u0357','\u0351','\u0307','\u0308','\u030a','\u0342','\u0300','\u0301','\u030b','\u030f','\u0312','\u0313','\u0314','\u033d','\u0309','\u0363','\u0364','\u0365','\u0366','\u0367','\u0368','\u0369','\u036a','\u036b','\u036c','\u036d','\u036e','\u036f','\u033e','\u035b','\u0346','\u031a'];
  const MID   = ['\u0315','\u031b','\u0340','\u0341','\u0358','\u0321','\u0322','\u0327','\u0328','\u0334','\u0335','\u0336','\u034f','\u035c','\u035d','\u035e','\u035f','\u0360','\u0362','\u0338','\u0337','\u0361','\u0489'];
  const BELOW = ['\u0316','\u0317','\u0318','\u0319','\u031c','\u031d','\u031e','\u031f','\u0320','\u0324','\u0325','\u0326','\u0329','\u032a','\u032b','\u032c','\u032d','\u032e','\u032f','\u0330','\u0331','\u0332','\u0333','\u0339','\u033a','\u033b','\u033c','\u0345','\u0347','\u0348','\u0349','\u034d','\u034e','\u0353','\u0354','\u0355','\u0356','\u0359','\u035a','\u0323'];
  const rand = arr => arr[Math.floor(Math.random() * arr.length)];
  return [...text].map(c => {
    if (c === ' ') return ' ';
    let o = c;
    const n = Math.floor(Math.random() * 5) + 3;
    for (let i = 0; i < n; i++) o += rand(ABOVE);
    for (let i = 0; i < 2; i++) o += rand(MID);
    for (let i = 0; i < n; i++) o += rand(BELOW);
    return o;
  }).join('');
}

function upsideDown(text) {
  // IMPORTANT: use [...] spread on the mapped result too — never split('') on Unicode
  return [...([...text].map(c => UPSIDE_DOWN_MAP[c] ?? c).join(''))].reverse().join('');
}

function mirrorText(text) {
  return [...text].reverse().map(c => MIRROR_MAP[c] ?? c).join('');
}

// ── Decorative wrappers ─────────────────────────────────────────────────────
const DECO = [
  ['✦', '✦'], ['★', '★'], ['♡', '♡'], ['◈', '◈'],
  ['「', '」'], ['〜', '〜'], ['✿', '✿'], ['♔', '♔'],
  ['⚡', '⚡'], ['🔥', '🔥'], ['✨', '✨'], ['☽', '☾'],
  ['『', '』'], ['【', '】'], ['❝', '❞'], ['♫', '♫'],
];

// ── Master FONT_STYLES array ────────────────────────────────────────────────
const FONT_STYLES = [
  // ── BOLD ──
  { id:'bold',        label:'Bold Serif',        cat:'bold',    fn: t => applyMap(t, MAP_BOLD) },
  { id:'italic',      label:'Italic Serif',       cat:'bold',    fn: t => applyMap(t, MAP_ITALIC) },
  { id:'bold-italic', label:'Bold Italic Serif',  cat:'bold',    fn: t => applyMap(t, MAP_BOLD_ITALIC) },
  { id:'sans-bold',   label:'Sans Bold',          cat:'bold',    fn: t => applyMap(t, MAP_SANS_BOLD) },
  { id:'sans-italic', label:'Sans Italic',        cat:'bold',    fn: t => applyMap(t, MAP_SANS_ITALIC) },
  { id:'sans-bi',     label:'Sans Bold Italic',   cat:'bold',    fn: t => applyMap(t, MAP_SANS_BI) },
  { id:'sans',        label:'Sans Serif',         cat:'bold',    fn: t => applyMap(t, MAP_SANS) },
  { id:'double',      label:'Double Struck',      cat:'bold',    fn: t => applyMap(t, MAP_DOUBLE) },
  { id:'mono',        label:'Monospace',          cat:'bold',    fn: t => applyMap(t, MAP_MONO) },

  // ── CURSIVE ──
  { id:'script',      label:'Cursive Script',     cat:'cursive', fn: t => applyMap(t, MAP_SCRIPT) },
  { id:'script-bold', label:'Cursive Bold',       cat:'cursive', fn: t => applyMap(t, MAP_SCRIPT_BOLD) },
  { id:'script-star', label:'Cursive ⭑ Starred',  cat:'cursive', fn: t => '⭑ ' + applyMap(t, MAP_SCRIPT_BOLD) + ' ⭑' },
  { id:'script-heart',label:'Cursive ♡',          cat:'cursive', fn: t => '♡ ' + applyMap(t, MAP_SCRIPT) + ' ♡' },
  { id:'script-under',label:'Cursive Underline',  cat:'cursive', fn: t => underline(applyMap(t, MAP_SCRIPT)) },
  { id:'italic2',     label:'Elegant Italic',     cat:'cursive', fn: t => applyMap(t, MAP_ITALIC) },

  // ── GOTHIC ──
  { id:'gothic',      label:'Gothic Fraktur',     cat:'gothic',  fn: t => applyMap(t, MAP_GOTHIC) },
  { id:'gothic-bold', label:'Gothic Bold',        cat:'gothic',  fn: t => applyMap(t, MAP_GOTHIC_BOLD) },
  { id:'gothic-bolt', label:'Gothic ⚡',           cat:'gothic',  fn: t => '⚡' + applyMap(t, MAP_GOTHIC_BOLD) + '⚡' },
  { id:'gothic-skull',label:'Gothic 💀',           cat:'gothic',  fn: t => '💀 ' + applyMap(t, MAP_GOTHIC) + ' 💀' },
  { id:'gothic-str',  label:'Gothic Strikethrough',cat:'gothic', fn: t => strikethrough(applyMap(t, MAP_GOTHIC)) },

  // ── BUBBLE ──
  { id:'bubble',      label:'Bubble Circle',      cat:'bubble',  fn: t => [...t].map(c => BUBBLE[c] ?? c).join('') },
  { id:'bubble-fill', label:'Bubble Filled',      cat:'bubble',  fn: t => [...t].map(c => BUBBLE_FILLED[c] ?? c).join('') },
  { id:'bubble-under',label:'Bubble Underline',   cat:'bubble',  fn: t => underline([...t].map(c => BUBBLE[c] ?? c).join('')) },
  { id:'wide',        label:'Wide / Fullwidth',   cat:'bubble',  fn: t => applyMap(t, MAP_WIDE) },
  { id:'small-caps',  label:'Small Caps',         cat:'bubble',  fn: t => [...t].map(c => SMALL_CAPS[c] ?? c).join('') },
  { id:'superscript', label:'Superscript',        cat:'bubble',  fn: t => [...t].map(c => SUPERSCRIPT_MAP[c] ?? c).join('') },
  { id:'spaced',      label:'S p a c e d',        cat:'bubble',  fn: t => [...t].join(' ') },
  { id:'spaced2',     label:'S  p  a  c  e  d  2',cat:'bubble', fn: t => [...t].join('  ') },

  // ── GLITCH ──
  { id:'strike',      label:'Strikethrough',      cat:'glitch',  fn: strikethrough },
  { id:'underline',   label:'Underline',          cat:'glitch',  fn: underline },
  { id:'overline',    label:'Overline',           cat:'glitch',  fn: overline },
  { id:'dbl-strike',  label:'Double Strike',      cat:'glitch',  fn: doubleStrike },
  { id:'wavy',        label:'Wavy Underline',     cat:'glitch',  fn: wavyUnder },
  { id:'dot-above',   label:'Dot Above',          cat:'glitch',  fn: dotAbove },
  { id:'ring-above',  label:'Ring Above',         cat:'glitch',  fn: ringAbove },
  { id:'tilde',       label:'Tilde',              cat:'glitch',  fn: tilde },
  { id:'dbl-under',   label:'Double Underline',   cat:'glitch',  fn: doubleUnder },
  { id:'boxed',       label:'Boxed',              cat:'glitch',  fn: boxed },
  { id:'glitch-mild', label:'Glitch (Mild)',      cat:'glitch',  fn: t => glitchText(t, 2) },
  { id:'glitch',      label:'Glitch (Medium)',    cat:'glitch',  fn: t => glitchText(t, 4) },
  { id:'glitch-heavy',label:'Glitch (Heavy)',     cat:'glitch',  fn: t => glitchText(t, 7) },
  { id:'zalgo',       label:'Zalgo / Cursed',     cat:'glitch',  fn: zalgoText },
  { id:'upside-down', label:'Upside Down',        cat:'glitch',  fn: upsideDown },
  { id:'mirror',      label:'Mirror / Reversed',  cat:'glitch',  fn: mirrorText },

  // ── FANCY COMBOS ──
  ...[
    ['bold-star',    'bold',    '★ Bold ★',          t => '★ ' + applyMap(t, MAP_BOLD) + ' ★'],
    ['bold-fire',    'bold',    '🔥 Bold Fire',       t => '🔥 ' + applyMap(t, MAP_SANS_BOLD) + ' 🔥'],
    ['cursive-fire', 'cursive', '🔥 Cursive Fire',    t => '🔥 ' + applyMap(t, MAP_SCRIPT_BOLD) + ' 🔥'],
    ['gothic-fire',  'gothic',  '🔥 Gothic Fire',     t => '🔥 ' + applyMap(t, MAP_GOTHIC_BOLD) + ' 🔥'],
    ['sparkle',      'fancy',   '✨ Sparkle ✨',      t => '✨ ' + t + ' ✨'],
    ['crown',        'fancy',   '♔ Royal ♔',          t => '♔ ' + t + ' ♔'],
    ['diamonds',     'fancy',   '◈ Diamond ◈',        t => '◈ ' + t + ' ◈'],
    ['waves',        'fancy',   '〜 Waves 〜',         t => '〜 ' + t + ' 〜'],
    ['flowers',      'fancy',   '✿ Flowers ✿',        t => '✿ ' + t + ' ✿'],
    ['music',        'fancy',   '♫ Music ♫',          t => '♫ ' + t + ' ♫'],
    ['lightning',    'fancy',   '⚡ Lightning ⚡',     t => '⚡ ' + t + ' ⚡'],
    ['moon',         'fancy',   '☽ Moon ☾',           t => '☽ ' + t + ' ☾'],
    ['brackets',     'fancy',   '「 Brackets 」',       t => '「' + t + '」'],
    ['book',         'fancy',   '『 Book 』',           t => '『' + t + '』'],
    ['quotes',       'fancy',   '❝ Quoted ❞',         t => '❝' + t + '❞'],
    ['bold-under',   'bold',    'Bold Underline',      t => underline(applyMap(t, MAP_BOLD))],
    ['italic-over',  'cursive', 'Cursive Overline',    t => overline(applyMap(t, MAP_SCRIPT))],
    ['wide-bold',    'bold',    'Bold Fullwidth',      t => applyMap(t, MAP_WIDE)],
    ['dot-sep',      'fancy',   '· Dot Spaced ·',      t => '· ' + [...t].join(' · ') + ' ·'],
    ['aesthetic',    'fancy',   'Aesthetic',           t => [...t].map(c => MAP_WIDE[c] ?? c).join('')],
  ].map(([id, cat, label, fn]) => ({ id, cat, label, fn })),
];
