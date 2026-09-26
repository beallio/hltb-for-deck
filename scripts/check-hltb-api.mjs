// Exercise the same public auth, search, and game-data endpoints used by the plugin.
// Run with Node 22 or newer: node scripts/check-hltb-api.mjs
const origin = 'https://howlongtobeat.com';
const headers = {
    'Content-Type': 'application/json',
    Origin: origin,
    Referer: `${origin}/`,
    'User-Agent':
        'Chrome: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.113 Safari/537.36',
};

async function get(url, options = {}) {
    const response = await fetch(url, {
        headers,
        ...options,
        signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) {
        throw new Error(`${new URL(url).pathname}: HTTP ${response.status}`);
    }
    return response;
}

try {
    const init = await get(`${origin}/api/search/site/init?t=${Date.now()}`, {
        headers,
    });
    const { token } = await init.json();
    if (typeof token !== 'string' || !token) {
        throw new Error('Search init did not return a token');
    }

    const search = await get(`${origin}/api/search/site`, {
        method: 'POST',
        headers: { ...headers, Authority: 'howlongtobeat.com', 'x-auth-token': token },
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
    });
    const results = await search.json();
    const game = results?.data?.find(
        (item) => item.game_name === 'Portal 2' && Number.isInteger(item.game_id)
    );
    if (!game) {
        throw new Error('Search did not return Portal 2 with a game ID');
    }

    const homepage = await get(origin, { headers });
    const html = await homepage.text();
    const buildId = html.match(
        /\/_next\/static\/([^/"']+)\/(?:_ssgManifest|_buildManifest)\.js/
    )?.[1];
    if (!buildId) {
        throw new Error('Homepage did not provide a game-data build ID');
    }

    const gamePage = await get(
        `${origin}/_next/data/${buildId}/game/${game.game_id}.json`
    );
    const data = (await gamePage.json())?.pageProps?.game?.data?.game;
    if (
        !Array.isArray(data) ||
        data.length !== 1 ||
        data[0].game_id !== game.game_id ||
        !Number.isFinite(data[0].comp_main) ||
        !Number.isFinite(data[0].comp_plus) ||
        !Number.isFinite(data[0].comp_100) ||
        !Number.isFinite(data[0].comp_all) ||
        !Number.isInteger(data[0].profile_steam)
    ) {
        throw new Error('Game page did not return usable playtime data');
    }

    console.log(`HLTB search and game data OK (Portal 2, game ${game.game_id})`);
} catch (error) {
    console.error('HLTB API check failed:', error);
    process.exitCode = 1;
}
