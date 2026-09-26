jest.mock('@decky/api', () => ({ fetchNoCors: jest.fn() }));
jest.mock('localforage', () => {
    const items = new Map<string, unknown>();
    return {
        config: jest.fn(),
        getItem: jest.fn(async (key: string) => items.get(key) ?? null),
        setItem: jest.fn(async (key: string, value: unknown) => {
            items.set(key, value);
            return value;
        }),
        removeItem: jest.fn(async (key: string) => {
            items.delete(key);
        }),
    };
});

let request: jest.MockedFunction<typeof import('@decky/api').fetchNoCors>;
let api: typeof import('../src/hooks/HltbApi');
let cache: typeof import('../src/hooks/Cache');
let initResponse: Record<string, unknown>;

beforeEach(async () => {
    jest.resetModules();
    request = (await import('@decky/api')).fetchNoCors as typeof request;
    api = await import('../src/hooks/HltbApi');
    cache = await import('../src/hooks/Cache');
    initResponse = { token: 'current-token' };
    await cache.updateApiBootstrapCache({
        searchUrl: '/api/search/site',
        nextJsKey: 'test-build',
    });

    request.mockImplementation(async (url) => {
        if (url.includes('/api/search/site/init?')) {
            return new Response(JSON.stringify(initResponse));
        }
        if (url.endsWith('/api/search/site')) {
            return new Response(
                JSON.stringify({
                    data: [
                        {
                            game_id: 7231,
                            game_name: 'Portal 2',
                            comp_all_count: 100,
                        },
                    ],
                })
            );
        }
        if (url.endsWith('/_next/data/test-build/game/7231.json')) {
            return new Response(
                JSON.stringify({
                    pageProps: {
                        game: {
                            data: {
                                game: [
                                    {
                                        game_id: 7231,
                                        profile_steam: 620,
                                        comp_main: 28800,
                                        comp_plus: 43200,
                                        comp_100: 72000,
                                        comp_all: 36000,
                                    },
                                ],
                            },
                        },
                    },
                })
            );
        }
        return new Response('', { status: 404 });
    });
});

async function expectGameStats(hasHp: boolean) {
    const stats = await api.fetchHltbGameStats('Portal 2', 620);
    expect(stats).toMatchObject({
        gameId: 7231,
        mainStat: '8.0',
        mainPlusStat: '12.0',
        completeStat: '20.0',
        allStylesStat: '10.0',
    });
    const search = request.mock.calls.find(([url]) =>
        url.endsWith('/api/search/site')
    );
    expect(search?.[1]?.headers).toMatchObject({
        'x-auth-token': 'current-token',
    });
    const body = JSON.parse(String(search?.[1]?.body));
    const storedAuth = (await cache.getApiBootstrapCache())?.searchAuth;
    expect(storedAuth).toMatchObject({
        searchUrl: '/api/search/site',
        token: 'current-token',
    });
    expect(body).not.toHaveProperty('undefined');

    if (hasHp) {
        expect(search?.[1]?.headers).toMatchObject({
            'x-hp-key': 'challenge-field',
            'x-hp-val': 'challenge-value',
        });
        expect(body['challenge-field']).toBe('challenge-value');
        expect(storedAuth).toMatchObject({
            hpKey: 'challenge-field',
            hpVal: 'challenge-value',
        });
    } else {
        expect(search?.[1]?.headers).not.toHaveProperty('x-hp-key');
        expect(search?.[1]?.headers).not.toHaveProperty('x-hp-val');
        expect(body).not.toHaveProperty('challenge-field');
        expect(storedAuth).not.toHaveProperty('hpKey');
        expect(storedAuth).not.toHaveProperty('hpVal');
    }
}

test.each([
    { name: 'only a token', fields: {}, hasHp: false },
    {
        name: 'a complete hp pair',
        fields: { hpKey: 'challenge-field', hpVal: 'challenge-value' },
        hasHp: true,
    },
    {
        name: 'a complete hp pair with renamed fields',
        fields: {
            challengeKey: 'challenge-field',
            challengeVal: 'challenge-value',
        },
        hasHp: true,
    },
    {
        name: 'only an hp key',
        fields: { hpKey: 'challenge-field' },
        hasHp: false,
    },
    {
        name: 'only an hp value',
        fields: { hpVal: 'challenge-value' },
        hasHp: false,
    },
    {
        name: 'an empty hp value',
        fields: { hpKey: 'challenge-field', hpVal: '' },
        hasHp: false,
    },
    {
        name: 'a non-string hp value',
        fields: { hpKey: 'challenge-field', hpVal: 123 },
        hasHp: false,
    },
])('loads game stats when init returns $name', async ({ fields, hasHp }) => {
    initResponse = { token: 'current-token', ...fields };
    await expectGameStats(hasHp);
});

test.each([
    { name: 'token-only', fields: {}, hasHp: false },
    {
        name: 'legacy',
        fields: { hpKey: 'challenge-field', hpVal: 'challenge-value' },
        hasHp: true,
    },
    { name: 'incomplete', fields: { hpKey: 'challenge-field' }, hasHp: false },
])('reuses $name cached authentication', async ({ fields, hasHp }) => {
    await cache.updateApiBootstrapCache({
        searchAuth: {
            searchUrl: '/api/search/site',
            token: 'current-token',
            ...fields,
        },
    });

    await expectGameStats(hasHp);
    expect(request.mock.calls.some(([url]) => url.includes('/init?'))).toBe(
        false
    );
});
