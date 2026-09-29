import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

// Run the real monitor with controlled HTTP responses. No test-only code is added to it.
const responses = `
const scenario = process.env.HLTB_TEST_SCENARIO;
const json = (value, status = 200) => new Response(JSON.stringify(value), { status });
const origin = 'https://howlongtobeat.com';
globalThis.fetch = async (url, options = {}) => {
    const path = new URL(url).pathname;
    if (path === '/') {
        if (scenario === 'blocked-homepage') return new Response('', { status: 403 });
        return new Response('<script src="/_next/static/build-id/_buildManifest.js"></script><script src="/_next/static/chunks/search.js"></script>');
    }
    if (path === '/_next/static/chunks/search.js') {
        const route = scenario === 'token-changed' || scenario === 'moved-endpoint' ? '/api/search/v2' : '/api/search/site';
        return new Response('searchTerms searchOptions fetch(\"' + route + '/init\") fetch(\"' + route + '\",{method:\"POST\"})');
    }
    if (path === '/api/search/site/init') {
        if (scenario === 'null-auth') return json(null);
        if (scenario === 'token-changed') return json({ session: 'secret-session' });
        if (scenario === 'hp-auth') return json({ token: 'secret-token', challengeKey: 'requestField', challengeVal: 'secret-value' });
        if (scenario === 'partial-hp-auth') return json({ token: 'secret-token', challengeKey: 'requestField' });
        return json({ token: 'secret-token' });
    }
    if (path === '/api/search/site') {
        const body = JSON.parse(options.body);
        if (body.searchOptions?.games?.modifier !== 'hide_dlc') return new Response('', { status: 400 });
        if (scenario === 'hp-auth' &&
            (options.headers['x-hp-key'] !== 'requestField' ||
             options.headers['x-hp-val'] !== 'secret-value' ||
             body.requestField !== 'secret-value'))
            return new Response('', { status: 401 });
        if ((scenario === 'healthy' || scenario === 'partial-hp-auth') &&
            ('x-hp-key' in options.headers || 'x-hp-val' in options.headers ||
             'requestField' in body || 'undefined' in body || 'null' in body))
            return new Response('', { status: 401 });
        if (scenario === 'null-search') return json(null);
        if (scenario === 'moved-endpoint') return new Response('', { status: 404 });
        if (scenario === 'search-shape') return json({ data: [{ game_id: 7231, game_name: 'Portal 2' }] });
        return json({ data: [{ game_id: 7231, game_name: 'Portal 2', comp_all_count: 100 }] });
    }
    if (path === '/_next/data/build-id/game/7231.json') {
        if (scenario === 'null-game') return json(null);
        const game = { game_id: 7231, profile_steam: 620, comp_main: 28800,
            comp_plus: 43200, comp_100: 72000, comp_all: 36000 };
        if (scenario === 'game-shape') delete game.comp_main;
        return json({ pageProps: { game: { data: { game: [game] } } } });
    }
    throw new Error('Unexpected HTTP request: ' + path);
};
`;

function run(scenario) {
    const dir = mkdtempSync(join(tmpdir(), 'hltb-monitor-'));
    const path = join(dir, 'report.json');
    try {
        const processResult = spawnSync(
            process.execPath,
            [
                '--import',
                `data:text/javascript,${encodeURIComponent(responses)}`,
                new URL('./check-hltb-api.mjs', import.meta.url).pathname,
            ],
            {
                encoding: 'utf8',
                env: {
                    ...process.env,
                    HLTB_TEST_SCENARIO: scenario,
                    HLTB_REPORT_PATH: path,
                },
            }
        );
        assert.equal(processResult.error, undefined);
        const report = JSON.parse(readFileSync(path, 'utf8'));
        assert.doesNotMatch(
            JSON.stringify(report) +
                processResult.stdout +
                processResult.stderr,
            /secret-token|secret-session|secret-value/
        );
        return {
            code: processResult.status,
            findings: report.findings,
            output: processResult.stdout + processResult.stderr,
        };
    } finally {
        rmSync(dir, { recursive: true, force: true });
    }
}

test('healthy search and game page produce a clean diagnostic report', () => {
    const { code, findings } = run('healthy');
    assert.equal(code, 0);
    assert.deepEqual(findings, []);
});

test('paired HP auth fields are sent with a DLC-filtered search', () => {
    const { code, findings } = run('hp-auth');
    assert.equal(code, 0);
    assert.deepEqual(findings, []);
});

test('an incomplete HP challenge is ignored for token-only search', () => {
    const { code, findings } = run('partial-hp-auth');
    assert.equal(code, 0);
    assert.deepEqual(findings, []);
});

test('missing auth token and changed advertised endpoint are reported independently of game data', () => {
    const { code, findings } = run('token-changed');
    assert.equal(code, 1);
    assert.deepEqual(findings, [
        'Auth init: token missing or not a nonempty string',
        'Site scripts advertise /api/search/v2 instead of /api/search/site',
    ]);
});

test('moved search endpoint reports HTTP status and discovered route', () => {
    const { code, findings } = run('moved-endpoint');
    assert.equal(code, 1);
    assert.deepEqual(findings, [
        'Search /api/search/site: HTTP 404',
        'Site scripts advertise /api/search/v2 instead of /api/search/site',
    ]);
});

test('search and game response field changes name the missing fields', () => {
    const search = run('search-shape');
    assert.equal(search.code, 1);
    assert.deepEqual(search.findings, [
        'Search: missing or invalid fields: comp_all_count',
    ]);
    const game = run('game-shape');
    assert.equal(game.code, 1);
    assert.deepEqual(game.findings, [
        'Game data: missing or invalid fields: comp_main',
    ]);
});

test('a valid JSON null at any stage is a failure, not a successful response', () => {
    for (const [scenario, expected] of [
        ['null-auth', 'Auth init: token missing or not a nonempty string'],
        ['null-search', 'Search: data array missing'],
        ['null-game', 'Game data: single-game array missing'],
    ]) {
        const { code, findings } = run(scenario);
        assert.equal(code, 1, scenario);
        assert.deepEqual(findings, [expected], scenario);
    }
});

test('a blocked homepage is not reported as an API schema change', () => {
    const { code, findings } = run('blocked-homepage');
    assert.equal(code, 1);
    assert.deepEqual(findings, ['Homepage: HTTP 403']);
});
