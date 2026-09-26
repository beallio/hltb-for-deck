// Exercise the same public auth, search, and game-data endpoints used by the plugin.
// Run with Node 22 or newer: node scripts/check-hltb-api.mjs
import { writeFile } from 'node:fs/promises';

const origin = 'https://howlongtobeat.com';
const searchPath = '/api/search/site';
const gameId = 7231; // Portal 2: a stable fixture, even when search is broken.
const headers = {
    'Content-Type': 'application/json',
    Origin: origin,
    Referer: `${origin}/`,
    'User-Agent':
        'Chrome: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.113 Safari/537.36',
};
const findings = [];
const invalidJson = Symbol('invalid JSON');

async function request(label, url, options = {}) {
    try {
        const response = await fetch(url, {
            headers,
            ...options,
            signal: AbortSignal.timeout(15000),
        });
        if (response.ok) return response;
        findings.push(`${label}: HTTP ${response.status}`);
    } catch {
        findings.push(`${label}: request failed or timed out`);
    }
    return null;
}

async function parseJson(label, response) {
    try {
        return await response.json();
    } catch {
        findings.push(`${label}: invalid JSON`);
        return invalidJson;
    }
}

// Mirror the plugin's endpoint discovery without treating minified source as a diagnosis.
function searchEndpoint(script) {
    if (!script.includes('searchTerms') || !script.includes('searchOptions'))
        return null;
    const pattern =
        /fetch\s*\(\s*["'`]\/api\/([a-zA-Z0-9_/]+)[^"'`]*["'`]\s*,\s*{[^}]*method:\s*["'`]POST["'`]/gi;
    let candidate = null;
    for (const match of script.matchAll(pattern)) {
        const path = match[1].replace(/\/+$/, '').replace(/\/init$/i, '');
        if (!path || path.length > 100) continue;
        const route = `/api/${path}`;
        if (script.includes(`${route}/init`)) return route;
        candidate ??= route;
    }
    return candidate;
}

async function checkAdvertisedEndpoint(html) {
    const scripts = /<script\b[^>]*\bsrc=(["'])(.*?)\1[^>]*>/gi;
    for (const match of html.matchAll(scripts)) {
        let url;
        try {
            url = new URL(match[2], `${origin}/`);
        } catch {
            continue;
        }
        if (url.origin !== origin || !url.pathname.endsWith('.js')) continue;
        // Optional probe: missing assets must not hide the primary HTTP/JSON failure.
        let response;
        try {
            response = await fetch(url, {
                headers,
                signal: AbortSignal.timeout(15000),
            });
        } catch {
            continue;
        }
        if (!response.ok) continue;
        const path = searchEndpoint(await response.text());
        if (!path) continue;
        if (path !== searchPath) {
            findings.push(
                `Site scripts advertise ${path} instead of ${searchPath}`
            );
        }
        return;
    }
    findings.push('Site scripts: search endpoint not found');
}

async function check() {
    const homepage = await request('Homepage', origin);
    let html = null;
    let buildId = null;
    if (homepage) {
        try {
            html = await homepage.text();
            buildId = html.match(
                /\/_next\/static\/([^/"']+)\/(?:_ssgManifest|_buildManifest)\.js/
            )?.[1];
            if (!buildId)
                findings.push('Homepage: game-data build ID not found');
        } catch {
            findings.push('Homepage: response could not be read');
        }
    }

    const init = await request(
        `Auth init ${searchPath}/init`,
        `${origin}${searchPath}/init?t=${Date.now()}`
    );
    let token = null;
    if (init) {
        const data = await parseJson('Auth init', init);
        if (data !== invalidJson) {
            if (typeof data?.token === 'string' && data.token)
                token = data.token;
            else
                findings.push(
                    'Auth init: token missing or not a nonempty string'
                );
        }
    }

    let searchOk = false;
    if (token) {
        const search = await request(
            `Search ${searchPath}`,
            `${origin}${searchPath}`,
            {
                method: 'POST',
                headers: {
                    ...headers,
                    Authority: 'howlongtobeat.com',
                    'x-auth-token': token,
                },
                body: JSON.stringify({
                    searchType: 'games',
                    searchTerms: ['Portal', '2'],
                    searchPage: 1,
                    size: 20,
                    searchOptions: {
                        games: {
                            userId: 0,
                            platform: '',
                            sortCategory: 'name',
                            rangeCategory: 'main',
                            rangeTime: { min: 0, max: 0 },
                            gameplay: {
                                perspective: '',
                                flow: '',
                                genre: '',
                                difficulty: '',
                            },
                            modifier: 'hide_dlc',
                        },
                        users: {},
                        filter: '',
                        sort: 0,
                        randomizer: 0,
                    },
                }),
            }
        );
        if (search) {
            const results = await parseJson('Search', search);
            if (results !== invalidJson) {
                if (!Array.isArray(results?.data)) {
                    findings.push('Search: data array missing');
                } else {
                    const item =
                        results.data.find(
                            (value) => value?.game_name === 'Portal 2'
                        ) ?? results.data[0];
                    if (!item) {
                        findings.push('Search: Portal 2 not found');
                    } else {
                        const missing = [
                            'game_id',
                            'game_name',
                            'comp_all_count',
                        ].filter(
                            (field) =>
                                typeof item[field] !==
                                (field === 'game_name' ? 'string' : 'number')
                        );
                        if (missing.length)
                            findings.push(
                                `Search: missing or invalid fields: ${missing.join(
                                    ', '
                                )}`
                            );
                        else if (
                            item.game_name !== 'Portal 2' ||
                            item.game_id !== gameId
                        ) {
                            findings.push(
                                `Search: Portal 2 (game ${gameId}) not found`
                            );
                        } else searchOk = true;
                    }
                }
            }
        }
    }

    // Use the known game ID so game-data failures are visible even when auth/search fails.
    if (buildId) {
        const page = await request(
            'Game data',
            `${origin}/_next/data/${buildId}/game/${gameId}.json`
        );
        if (page) {
            const result = await parseJson('Game data', page);
            if (result !== invalidJson) {
                const games = result?.pageProps?.game?.data?.game;
                if (!Array.isArray(games) || games.length !== 1) {
                    findings.push('Game data: single-game array missing');
                } else {
                    const game = games[0];
                    const missing = [
                        'game_id',
                        'profile_steam',
                        'comp_main',
                        'comp_plus',
                        'comp_100',
                        'comp_all',
                    ].filter(
                        (field) =>
                            typeof game?.[field] !== 'number' ||
                            !Number.isFinite(game[field])
                    );
                    if (missing.length)
                        findings.push(
                            `Game data: missing or invalid fields: ${missing.join(
                                ', '
                            )}`
                        );
                    else if (game.game_id !== gameId)
                        findings.push(
                            'Game data: game ID does not match request'
                        );
                }
            }
        }
    }

    if (!searchOk && html !== null) await checkAdvertisedEndpoint(html);
}

try {
    await check();
} catch {
    findings.push('Monitor: unexpected error while checking HLTB');
}

// Only stable labels, HTTP status codes, and verified same-origin paths leave this process.
// Never store auth tokens, response bodies, cookies, or volatile build IDs.
if (process.env.HLTB_REPORT_PATH) {
    await writeFile(
        process.env.HLTB_REPORT_PATH,
        JSON.stringify({ findings }) + '\n'
    );
}
if (findings.length) {
    console.error(
        'HLTB API check failed:\n' +
            findings.map((item) => `- ${item}`).join('\n')
    );
    process.exitCode = 1;
} else {
    console.log(`HLTB search and game data OK (Portal 2, game ${gameId})`);
}
