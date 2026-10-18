# Fork development

This fork follows upstream [`morwy/hltb-for-deck`](https://github.com/morwy/hltb-for-deck) `main`. Its only addition is the HLTB API check below. For build, installation, and Decky Plugin Database instructions, see [Readme.md](Readme.md).

## HLTB API check

The fork runs `Check HLTB API` every hour (at 17 minutes past the hour, UTC). It requests a search token, searches for Portal 2, and checks its game playtime data. Run it locally with Node.js 22 or newer:

```bash
node scripts/check-hltb-api.mjs
```

Run its tests with:

```bash
node --test scripts/check-hltb-api.test.mjs
```

You can also start it from the Actions tab on `fork/main`. A failed check opens a tracking pull request with a link to the run. Further failures reuse that PR; a later successful check closes it. Do not merge the tracking PR. GitHub Actions must have permission to create pull requests in this fork's Actions settings. A failure can also mean GitHub's runner cannot reach HLTB, so inspect the run log before changing the plugin.

The monitor checks the homepage, auth token, Portal 2 search, and Portal 2 game data independently where possible. When auth or search fails, it also checks the site's JavaScript for an advertised search route. Its report names observed HTTP errors, missing fields, or a different search path; a 403 or timeout does not prove an API change. The PR gets a diagnostic comment on the first failure and another only when those findings change. Reports contain no auth tokens, response bodies, or build IDs. To save the same JSON report locally, set `HLTB_REPORT_PATH` to a writable file before running the command above.

When auth init supplies both HP fields, the monitor sends them with the search. A token alone is enough, and the search keeps the plugin's DLC filter.

Upstream's own `HLTB API check` workflow runs only on pull requests. It does not replace this scheduled check.
