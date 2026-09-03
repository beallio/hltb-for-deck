import { extractSearchUrlFromScript } from '../src/hooks/HltbApi';

// Minified excerpts that keep the shape of the real howlongtobeat.com bundle.
const NESTED_ENDPOINT_SCRIPT = `let ei=async()=>{try{let e=await fetch(\`/api/search/site/init?t=\${Date.now()}\`);if(e.ok){let t=await e.json();return ee({token:t.token,hpKey:t.hpKey,hpVal:t.hpVal}),t}}catch(e){}};let n={searchType:_,searchTerms:x.trim().split(" "),searchPage:Y,size:20,searchOptions:{games:{userId:0,platform:b},users:{},filter:M,sort:0,randomizer:0}};let l=await fetch("/api/search/site",{method:"POST",headers:{"Content-Type":"application/json","x-auth-token":t,"x-hp-key":a,"x-hp-val":i},body:JSON.stringify(n)});`;

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
