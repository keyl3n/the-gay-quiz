import { select, multiselect, confirm, text, isCancel, spinner, log, progress } from "@clack/prompts";
import chalk from "chalk";
import boxen from "boxen";
import readline from "readline";
import randomInRange from './functions/randomInRange.js'

console.clear();
console.log(boxen(chalk.bold('The Gay Quiz'), { padding: 1.75, margin: 2, borderStyle: 'double', borderColor: 'blueBright', title: 'AndySoft presents', float: true }));

// --- Emergency exit: 3 Ctrl+C presses within 1 second quits the script. ---
let ctrlCTimes = [];
function registerCtrlC() {
    const now = Date.now();
    ctrlCTimes = ctrlCTimes.filter(t => now - t < 1000); // keep only the last second
    ctrlCTimes.push(now);
    if (ctrlCTimes.length >= 3) {
        process.exit(0);
    }
}

// During a prompt the terminal is in raw mode, so Ctrl+C is a keypress...
readline.emitKeypressEvents(process.stdin);
process.stdin.on('keypress', (_str, key) => {
    if (key && key.ctrl && key.name === 'c') registerCtrlC();
});
// ...and between prompts (e.g. during the spinner) it's a normal SIGINT.
process.on('SIGINT', registerCtrlC);

/**
 * A single quiz question. `type` picks the @clack/prompts prompt to render and
 * decides how `points` is read (see `scoreOf`).
 * @typedef {object} Question
 * @property {'select' | 'multiselect' | 'confirm' | 'number'} type
 * @property {string} name
 * @property {string} message
 * @property {string[]} [choices] select/multiselect: the value of a choice is its index
 * @property {boolean} [initial] confirm: which side starts selected
 * @property {string} [active] confirm: label for `true`
 * @property {string} [inactive] confirm: label for `false`
 * @property {string} [placeholder] number: greyed-out hint shown while empty
 * @property {number} [min] number
 * @property {number} [max] number
 * @property {(input: string) => string | undefined} [validate] number: return a
 *   message to reject the input, or `undefined` to accept it
 * @property {*} [points]
 */

/**
 * The inquiries that shall be inquired
 * @type {Question[]}
 */
const questions = [
    {
        type: 'select',
        name: 'femininity',
        message: 'How much of a FEMBOY are you?',
        choices: [
            'Not fem at all',
            'A little bit fem',
            'Kinda fem',
            'Fem',
            'Very fem',
            'Wasshoi'
        ],
        // One array entry per choice, aligned by index.
        points: [0, 1, 2, 4, 5, 8],
    },
    {
        type: 'confirm',
        name: 'likesBoys',
        message: 'Do you like BOYS?',
        initial: true,
        active: 'yes',
        inactive: 'no',
        points: { active: 10, inactive: 0 },
    },
    {
        type: 'multiselect',
        name: 'whoToCrack',
        message: 'Out of all these people, WHO are you CRACKING?',
        choices: [
            'Shade',
            'Stormy',
            'bmc',
            'Wasshoi',
            'I_HaF',
            'phoenix',
            'LaziestDonut',
            'Talcility',
            'Claire'
        ],
        // Points for each selected choice are summed together.
        points: [3, 3, 3, 3, 3, 3, 3, 3, -3],
    },
    {
        type: 'select',
        name: 'politicalLean',
        message: 'Which of these terms best describe your political beliefs?',
        choices: [
            'Far-left',
            'Left',
            'Center-left',
            'Center',
            'Center-right',
            'Right',
            'Far-right'
        ],
        points: [2, 3, 2, 1, 0, -1, 0],
    },
    {
        type: 'number',
        name: 'limit',
        message: `For each ${chalk.italic('y')}, ${chalk.italic('x')} is being divided by 2. What is the limit of ${chalk.italic('x')} as ${chalk.italic('y')} approaches ∞?`,
        validate: a => a.trim() === '0' ? undefined : 'WRONG!!!'
    },
    {
        type: 'multiselect',
        name: 'apps',
        message: 'Which of these apps do you use regularly?',
        choices: [
            'TikTok',
            'Instagram',
            'Snapchat',
            'Facebook',
            'Discord',
            'Reddit',
            'Pinterest',
            'Tumblr',
            'Twitter'
        ],
        points: [2, -1, -2, -4, 2, 0, 4, 4, 4]
    },
    {
        type: 'select',
        name: 'whichGame',
        message: 'Which of these ROBLOX games sounds most enticing to you?',
        choices: [
            'Fem RNG',
            'Crack Shade',
            'Undress Shade to Impress',
            'Homo Tycoon'
        ],
        points: [3, 6, 5, 4]
    },
    {
        type: 'number',
        name: 'minCash',
        message: `What's the MINIMUM amount of money you would accept to get cracked? ${chalk.gray('(You can choose anyone to crack you)')}`,
        min: 0,
        max: 1000000000000,
        points: [
            { below: 1, points: 7 },
            { below: 10, points: 6 },
            { below: 100, points: 5 },
            { below: 1000, points: 4 },
            { below: 10000, points: 3 },
            { below: 100000, points: 2 },
            { below: 1000000, points: 1 }
        ]
    },
    {
        type: 'select',
        name: 'whichGenre',
        message: `What is the name of the genre that involves romantic and/or sexual relations between two or more men and is written by men?\n${chalk.gray('(You will receive points for getting this right)')}`,
        choices: [
            "Yaoi",
            "Gei komi",
            "MLM",
            "Boy's love",
            "Dih Reads 🥀"
        ],
        points: [
            0, 5, 0, 0, 1
        ]
    },
    {
        type: 'select',
        name: 'whatBodyType',
        message: 'What is your (gay) body type?',
        choices: [
            "Bear",
            "Cub",
            "Otter",
            "Twink",
            "None of the above fit me",
        ],
        points: [
            2, 5, 5, 1, 0
        ]

    },
    {
        type: 'select',
        name: 'favBl?',
        message: 'What is your favorite bl?',
        choices: [
            "Bj Alex",
            "Jinx",
            "Killing Stalking",
            "Yarichin B Club",
            "Haikyuu",
            "Yuri on Ice",
            "Citrus",
            "WHAT ARE THESE???",
        ],
        points: [
            2, 1, 1, 1, 0, 1, -5, 0
        ]
    }
];

/**
 * Score a single answer based on the question's `points` config.
 * - select:      points[chosenIndex]
 * - multiselect: sum of points[i] for every selected index
 * - confirm:     points.active / points.inactive by the boolean value
 * - number:      points[i].points of the first tier the answer is `below`
 * - anything else (open-ended, or no `points`): 0
 * @param {Question} q
 * @param {*} value the answer for this question
 * @returns {number}
 */
function scoreOf(q, value) {
    if (q.points == null || value == null) return 0;

    switch (q.type) {
        case 'select':
            return q.points[value] ?? 0;
        case 'multiselect':
            return value.reduce((sum, i) => sum + (q.points[i] ?? 0), 0);
        case 'confirm':
            return value ? (q.points.active ?? 0) : (q.points.inactive ?? 0);
        case 'number':
            return q.points.find(tier => value < tier.below)?.points ?? 0;
        default:
            return 0; // open-ended: text
    }
}

/**
 * The best score a question can possibly award, mirroring `scoreOf`.
 * - select:      the highest single choice
 * - multiselect: every positive choice picked, negatives left alone
 * - confirm:     whichever side is worth more
 * - number:      the richest tier
 * - anything else (open-ended, or no `points`): 0
 * @param {Question} q
 * @returns {number}
 */
function maxScoreOf(q) {
    if (q.points == null) return 0;

    switch (q.type) {
        case 'select':
            return Math.max(...q.points);
        case 'multiselect':
            return q.points.reduce((sum, p) => sum + Math.max(p, 0), 0);
        case 'confirm':
            return Math.max(q.points.active ?? 0, q.points.inactive ?? 0);
        case 'number':
            return Math.max(...q.points.map(tier => tier.points));
        default:
            return 0; // open-ended: text
    }
}

/** Resolves after `ms`, so the loop pauses until the spinner finishes. */
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * clack takes `{ value, label }` options rather than bare strings. Using the
 * index as the value keeps answers aligned with the `points` arrays.
 * @param {string[]} choices
 */
const toOptions = choices => choices.map((label, value) => ({ value, label }));

/**
 * `@clack/prompts` doesn't ship a number prompt, so this is a text prompt that
 * enforces the numeric bounds up front and hands back an actual number.
 * @param {Question} q
 * @returns {Promise<number | symbol>} the cancel symbol if the user bailed
 */
async function askNumber(q) {
    const input = await text({
        message: q.message,
        placeholder: q.placeholder,
        validate: value => {
            const trimmed = (value ?? '').trim();
            if (trimmed === '' || !Number.isFinite(Number(trimmed))) return 'Numbers only lil bro';

            const n = Number(trimmed);
            if (q.min != null && n < q.min) return `Has to be at least ${q.min.toLocaleString()}`;
            if (q.max != null && n > q.max) return `Has to be at most ${q.max.toLocaleString()}`;

            return q.validate?.(trimmed);
        }
    });

    return isCancel(input) ? input : Number(input);
}

/**
 * Render one question with the matching clack prompt.
 * @param {Question} q
 * @returns {Promise<*>} the answer, or clack's cancel symbol if the user bailed
 */
function ask(q) {
    switch (q.type) {
        case 'select':
            return select({ message: q.message, options: toOptions(q.choices) });
        case 'multiselect':
            // `required: false` so picking nobody stays a valid (0 point) answer.
            return multiselect({ message: q.message, options: toOptions(q.choices), required: false });
        case 'confirm':
            return confirm({
                message: q.message,
                initialValue: q.initial,
                active: q.active,
                inactive: q.inactive
            });
        case 'number':
            return askNumber(q);
        default:
            throw new Error(`The "${q.name}" question has an unknown type "${q.type}".`);
    }
}

/**
 * Holds the window open on the results until Enter is pressed, so a
 * double-clicked exe doesn't flash the score and vanish.
 *
 * Raw mode means the terminal no longer turns Ctrl+C into a SIGINT that kills
 * us, so the only ways out are Enter, closing the window, or the 3x Ctrl+C
 * emergency exit above — which is exactly what we want here.
 */
function pressEnterToExit() {
    console.log(chalk.gray('Press enter to exit'));

    return new Promise(resolve => {
        function onKeypress(_str, key) {
            // '\r' arrives as `return`, '\n' (piped input) as `enter`.
            if (!key || (key.name !== 'return' && key.name !== 'enter')) return;

            process.stdin.off('keypress', onKeypress);
            if (process.stdin.isTTY) process.stdin.setRawMode(false);
            process.stdin.pause(); // stop holding the event loop open
            console.log(); // raw mode ate the echo, so end the line ourselves
            resolve();
        }

        process.stdin.on('keypress', onKeypress);
        if (process.stdin.isTTY) process.stdin.setRawMode(true);
        process.stdin.resume();
    });
}

/**
 * Ask a single question, refusing to move on until it's actually answered.
 * clack resolves with its cancel symbol on Ctrl+C / Esc instead of throwing,
 * so we detect that and re-ask rather than letting the user skip.
 * @param {Question} q
 */
async function askUntilAnswered(q) {
    while (true) {
        const value = await ask(q);
        if (!isCancel(value)) return value;

        log.message('Stop being a baby and answer lil bro', { symbol: chalk.redBright('✘') });
    }
}

/**
 * Logs the custom message(s) for specific answers of specific questions.
 * @param {Question} question - The question object in the `questions` array
 * @param {*} value - The user's answer to that question
 */
function customMessage(question, value) {
    const messages = [
        {
            qName: 'politicalLean',
            // we only need one of these for it to show a custom message
            reqAnswers: ['Far-left', 'Far-right'],
            msg: 'You aren\'t tuff lil bro'
        },
        {
            qName: 'whatBodyType',
            reqAnswers: ['Cub', 'Otter'],
            msg: 'I know what you are...'
        },
        {
            qName: 'favBl?',
            reqAnswers: ['Jinx', 'Killing Stalking', 'Yarichin B Club'],
            msg: 'Interesting... (not judging tho)'
        },
        {
            qName: 'favBl?',
            reqAnswers: ['Citrus'],
            msg: 'That\'s girls love you idiot not boys love'
        },
        {
            qName: 'favBl?',
            reqAnswers: ['WHAT ARE THESE???'],
            msg: 'You don\'t wanna know... oh the horrors...'
        }
    ];

    const matches = messages.filter(m => m.qName == question.name);
    if (matches.length === 0) return;

    // select hands back the chosen index, multiselect an array of them.
    const answers = (Array.isArray(value) ? value : [value]).map(i => question.choices[i]);

    for (const m of matches) {
        if (m.reqAnswers.some(a => answers.includes(a))) log.warn(m.msg);
    }
}

async function main() {
    let answers = {};
    let totalScore = 0;
    let maxPossibleScore = 0;
    let i = 0;

    for (const q of questions) {
        i++;
        const value = await askUntilAnswered(q);
        answers[q.name] = value;

        const points = scoreOf(q, value);
        totalScore += points;
        maxPossibleScore += maxScoreOf(q);
        const s = spinner();
        s.start('Processing answer...');
        await wait(1500);
        s.stop('Answer processed');

        customMessage(q, value);

        // last question only
        if (i == questions.length) {
            // `progress` is a spinner underneath, so it has to be started before
            // `advance` has a line to draw the bar on — and stopped afterwards.
            const p = progress({ max: 100 });
            p.start('Gathering results');
            await wait(randomInRange(3000, 5000));
            p.advance(randomInRange(20, 40), 'Compiling chart');
            await wait(randomInRange(2500, 4000));
            p.advance(randomInRange(20, 40), 'Injecting woke mind virus');
            await wait(randomInRange(2000, 3500));
            p.advance(100, 'Injecting woke mind virus'); // clamped to max, so the bar always fills
            await wait(randomInRange(500, 1000));
            p.stop('Generated results');
        }

        await wait(1000);
    }

    console.log(boxen(chalk.bold.hex('#61ed84')(`Your score: ${totalScore} / ${maxPossibleScore}. You're ${((totalScore / maxPossibleScore) * 100).toLocaleString()}% gay!`), {
        padding: 1,
        margin: 1,
        borderStyle: 'double',
        borderColor: '#61ed84',
        title: 'Results',
        float: 'center',
    }));

    await pressEnterToExit();
}

main().catch(err => {
    log.error(String(err));
    process.exit(1);
});
