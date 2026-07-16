import prompts from "prompts";
import { createSpinner } from "nanospinner";
import chalk from "chalk";
import boxen from "boxen";
import readline from "readline";

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
 * The inquiries that shall be inquired
 * @type {import('prompts').PromptObject[]}
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
        type: 'toggle',
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
        points: [3, 3, 3, 3, 3, 3, 3, -3],
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
        validate: a => a == '0' ? true : 'WRONG!!!'
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
        points: [2, -1, -2, -4, 1, -1, 4, 4, 4]
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
        message: `What\'s the MINIMUM amount of money you would accept to get cracked?\n${chalk.gray('(You can choose anyone to crack you)')}\n${chalk.gray('(↑/↓: Increment by $100)')}`,
        increment: 100,
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
        message: `What is the name of the genre that involves romantic and/or sexual relations between two or more men and is written by men?\n${chalk.gray('(You will receive points for getting this right)')}\n`,
        choices: [
            "Yaoi",
            "Gei komi",
            "MLM",
            "Boy\'s love",
            "Dih Reads 🥀"
        ],
        points: [
            0, 5, 0, 0, 1
        ]
    }
];

/**
 * Score a single answer based on the question's `points` config.
 * - select:      points[chosenIndex]
 * - multiselect: sum of points[i] for every selected index
 * - toggle:      points.active / points.inactive by the boolean value
 * - number:      points[i].points of the first tier the answer is `below`
 * - anything else (open-ended, or no `points`): 0
 * @param {import('prompts').PromptObject & { points?: any }} q
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
        case 'toggle':
        case 'confirm':
            return value ? (q.points.active ?? 0) : (q.points.inactive ?? 0);
        case 'number':
            return q.points.find(tier => value < tier.below)?.points ?? 0;
        default:
            return 0; // open-ended: text / date
    }
}

/**
 * The best score a question can possibly award, mirroring `scoreOf`.
 * - select:      the highest single choice
 * - multiselect: every positive choice picked, negatives left alone
 * - toggle:      whichever side is worth more
 * - number:      the richest tier
 * - anything else (open-ended, or no `points`): 0
 * @param {import('prompts').PromptObject & { points?: any }} q
 * @returns {number}
 */
function maxScoreOf(q) {
    if (q.points == null) return 0;

    switch (q.type) {
        case 'select':
            return Math.max(...q.points);
        case 'multiselect':
            return q.points.reduce((sum, p) => sum + Math.max(p, 0), 0);
        case 'toggle':
        case 'confirm':
            return Math.max(q.points.active ?? 0, q.points.inactive ?? 0);
        case 'number':
            return Math.max(...q.points.map(tier => tier.points));
        default:
            return 0; // open-ended: text / date
    }
}

/** Resolves after `ms`, so the loop pauses until the spinner finishes. */
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Ask a single question, refusing to move on until it's actually answered.
 * Ctrl+C / Ctrl+D / Esc all resolve the prompt without setting the answer,
 * so we detect that and re-ask instead of letting the user skip.
 */
async function askUntilAnswered(q) {
    while (true) {
        // `prompts` catches BOTH a real user cancel and an internal crash and
        // routes both to onCancel, so onCancel can't tell them apart. A genuine
        // abort/exit always emits a `state` event first (see element.abort());
        // an internal crash throws before that. So we track whether the user
        // actually reached an aborted/exited state.
        let userAborted = false;
        const response = await prompts(
            {
                ...q,
                onState: state => {
                    if (state.aborted || state.exited) userAborted = true;
                }
            },
            { onCancel: () => { true } } // handled; we decide what to do below
        );

        // A real answer was given.
        if (response[q.name] !== undefined) return response;

        // User hit Ctrl+C / Ctrl+D / Esc — nag and re-ask.
        if (userAborted) {
            console.log(chalk.redBright('Stop being a baby and answer lil bro'));
            continue;
        }

        // No interaction happened, so the prompt itself crashed. Surface it
        // instead of looping forever and spamming the terminal.
        throw new Error(`The "${q.name}" prompt failed to run — check its config.`);
    }
}

async function main() {
    let responses = [];
    let totalScore = 0;
    let maxPossibleScore = 0;
    for (const q of questions) {
        const response = await askUntilAnswered(q);
        responses.push(response);

        const points = scoreOf(q, response[q.name]);
        totalScore += points;
        maxPossibleScore += maxScoreOf(q);

        const spinner = createSpinner('Processing answer...').start();
        await wait(1500);
        spinner.stop(); // no args -> clears the line so nothing is left behind

        if (points !== 0) {
            const label = `${points > 0 ? '+' : ''}${points} point${Math.abs(points) === 1 ? '' : 's'}`;
            //console.log((points > 0 ? chalk.greenBright : chalk.redBright)(label));
        }

        if (q.name == 'politicalLean' && ['Far-left', 'Far-right'].includes(questions.find(qu => qu.name == 'politicalLean').choices[response.politicalLean])) {
            console.log(chalk.yellowBright('You aren\'t tuff lil bro'))
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
}

main().catch(err => {
    console.error(chalk.redBright(err.message));
    process.exit(1);
});