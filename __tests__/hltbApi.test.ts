jest.mock('@decky/api', () => ({
    fetchNoCors: jest.fn(),
}));
jest.mock('../src/hooks/Cache', () => ({
    getApiBootstrapCache: jest.fn(async () => ({
        searchUrl: '/api/search/site',
        nextJsKey: 'test-build',
    })),
    updateApiBootstrapCache: jest.fn(async () => {}),
    clearApiBootstrapCache: jest.fn(async () => {}),
}));

import { fetchNoCors } from '@decky/api';
import {
    extractSearchUrlFromScript,
    fetchHltbGameStats,
} from '../src/hooks/HltbApi';

// Minified excerpts that keep the shape of the real howlongtobeat.com bundle.
const NESTED_ENDPOINT_SCRIPT = `let ei=async()=>{try{let e=await fetch(\`/api/search/site/init?t=\${Date.now()}\`);if(e.ok){let t=await e.json();return ee({token:t.token}),t}}catch(e){}};let n={searchType:_,searchTerms:x.trim().split(" "),searchPage:Y,size:20,searchOptions:{games:{userId:0,platform:b},users:{},filter:M,sort:0,randomizer:0}};let l=await fetch("/api/search/site",{method:"POST",headers:{"Content-Type":"application/json","x-auth-token":t},body:JSON.stringify(n)});`;

const SINGLE_SEGMENT_ENDPOINT_SCRIPT = `let ei=async()=>{let e=await fetch(\`/api/bleed/init?t=\${Date.now()}\`);return e.json()};let n={searchType:_,searchTerms:x.trim().split(" "),searchOptions:{games:{}}};let l=await fetch("/api/bleed",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(n)});`;

describe('extractSearchUrlFromScript()', () => {
    test('keeps every segment of a nested search endpoint', () => {
        expect(extractSearchUrlFromScript(NESTED_ENDPOINT_SCRIPT)).toBe(
            '/api/search/site'
        );
    });

    test('still resolves a single-segment search endpoint', () => {
        expect(extractSearchUrlFromScript(SINGLE_SEGMENT_ENDPOINT_SCRIPT)).toBe(
            '/api/bleed'
        );
    });

    test('ignores scripts that do not build a search request', () => {
        expect(
            extractSearchUrlFromScript(
                'let l=await fetch("/api/user/profile",{method:"POST"});'
            )
        ).toBeNull();
    });
});

test('gets game stats when search init supplies only a token', async () => {
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
    const searchRequest = request.mock.calls.find(([url]) =>
        url.endsWith('/api/search/site')
    );
    expect(searchRequest?.[1]?.headers).toMatchObject({
        'x-auth-token': 'current-token',
    });
    expect(searchRequest?.[1]?.headers).not.toHaveProperty('x-hp-key');
    expect(searchRequest?.[1]?.headers).not.toHaveProperty('x-hp-val');
    expect(JSON.parse(String(searchRequest?.[1]?.body))).not.toHaveProperty(
        'undefined'
    );
});
