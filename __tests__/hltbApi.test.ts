jest.mock('@decky/api', () => ({ fetchNoCors: jest.fn() }));
jest.mock('../src/hooks/Cache', () => ({
    getApiBootstrapCache: jest.fn(async () => ({
        searchUrl: '/api/search/site',
        nextJsKey: 'test-build',
    })),
    updateApiBootstrapCache: jest.fn(async () => {}),
    clearApiBootstrapCache: jest.fn(async () => {}),
}));

import { fetchNoCors } from '@decky/api';
import { fetchHltbGameStats } from '../src/hooks/HltbApi';

test('loads game stats when search init returns only a token', async () => {
    const request = fetchNoCors as jest.MockedFunction<typeof fetchNoCors>;
    request.mockImplementation(async (url) => {
        if (url.includes('/api/search/site/init?')) {
            return new Response(JSON.stringify({ token: 'current-token' }));
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

    const stats = await fetchHltbGameStats('Portal 2', 620);

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
    expect(search?.[1]?.headers).not.toHaveProperty('x-hp-key');
    expect(search?.[1]?.headers).not.toHaveProperty('x-hp-val');
    expect(JSON.parse(String(search?.[1]?.body))).not.toHaveProperty(
        'undefined'
    );
});
