# Development

Fork releases are made from `fork/main`, not `main`.

## Build from source

Install [Node.js](https://nodejs.org/en/download) and pnpm. Then clone this fork and build it:

```bash
npm install -g pnpm
git clone https://github.com/beallio/hltb-for-deck.git
cd hltb-for-deck
git switch fork/main
pnpm install --frozen-lockfile
pnpm run build
```

`pnpm run build` puts the frontend files in `dist/`. To make a ZIP that Decky Loader can install, run `./build.sh` on Linux or macOS, or `build.bat` on Windows. Run it from the repository root. The scripts install dependencies, rebuild the plugin, and replace any existing local build and ZIP files.

## HLTB API check

The fork runs `Check HLTB API` every hour (at 17 minutes past the hour, UTC). It requests a search token, searches for Portal 2, and checks its game playtime data. Run it locally with Node.js 22 or newer:

```bash
node scripts/check-hltb-api.mjs
```

You can also start it from the Actions tab on `fork/main`. A failed check opens a tracking pull request with a link to the run. Further failures reuse that PR; a later successful check closes it. Do not merge the tracking PR. GitHub Actions must have permission to create pull requests in this fork's Actions settings. A failure can also mean GitHub's runner cannot reach HLTB, so inspect the run log before changing the plugin.

The monitor checks the homepage, auth token, Portal 2 search, and Portal 2 game data independently where possible. When a request fails, it also checks the site's JavaScript for an advertised search route. Its report names observed HTTP errors, missing fields, or a different search path; a 403 or timeout does not prove an API change. The PR gets a diagnostic comment on the first failure and another only when those findings change. Reports contain no auth tokens, response bodies, or build IDs. To save the same JSON report locally, set `HLTB_REPORT_PATH` to a writable file before running the command above.

## Theming with CSS Loader

The bar uses CSS custom properties for its colors and sizes. A CSS Loader theme can change them without replacing the bar's CSS rules:

```css
.hltb-info {
    --hltb-bar-alpha: 0.75 !important;
    --hltb-link-color: #dcdedf !important;
}
```

Use `!important` to override a choice made in the Quick Access Menu. Those choices are applied directly to the bar.

Supported properties:

| Property                        | Default                                                          |
| ------------------------------- | ---------------------------------------------------------------- |
| `--hltb-bar-alpha`              | `0.25` for Default, `0.5` for the Clean styles                   |
| `--hltb-bar-rgb`                | `14 20 27`                                                       |
| `--hltb-bar-bg`                 | unset — set it to override the whole background, e.g. a gradient |
| `--hltb-text-color`             | `inherit`                                                        |
| `--hltb-text-shadow`            | `none`                                                           |
| `--hltb-link-color`             | `#67c1f5`                                                        |
| `--hltb-link-color-focus`       | `#ffffff`                                                        |
| `--hltb-text-scale`             | `1`                                                              |
| `--hltb-stat-size`              | `16px`                                                           |
| `--hltb-label-size`             | `10px`                                                           |
| `--hltb-stat-scale-clean`       | `1.25`                                                           |
| `--hltb-pad-x` / `--hltb-pad-y` | `35px` / `5px`                                                   |
| `--hltb-border-width`           | `2px` in the default layout, `0` in the "Clean" layouts          |
| `--hltb-border-color`           | `rgba(61, 68, 80, .54)`                                          |
| `--hltb-radius`                 | `0`                                                              |

`--hltb-clean-top` and `--hltb-clean-inset` control the position of the Clean styles. They may change in later releases, so avoid using them in themes.

## Submitting an update to the Decky Plugin Database

The [Decky Plugin Database](https://github.com/SteamDeckHomebrew/decky-plugin-database) gets HLTB for Deck from `morwy/hltb-for-deck`. The steps below update **upstream** in the Decky Store. They do not add this fork's changes. If you want to propose this fork for the Decky Store, first ask the database maintainers about changing the plugin source. You can install the [fork ZIP](https://github.com/beallio/hltb-for-deck/releases) without doing any of this.

For an upstream plugin update:

1. Fork and clone the database. You do not need to clone every plugin:

   ```bash
   gh repo fork SteamDeckHomebrew/decky-plugin-database --clone
   cd decky-plugin-database
   git switch -c update-hltb-for-deck
   ```

2. Download only the HLTB plugin and update it to the latest upstream `main` commit:

   ```bash
   git submodule update --init plugins/hltb-for-deck
   git -C plugins/hltb-for-deck fetch origin main
   git -C plugins/hltb-for-deck checkout origin/main
   ```

3. If the plugin changed, commit the update and open a pull request:

   ```bash
   git add plugins/hltb-for-deck
   git commit -m "Update hltb-for-deck submodule"
   git push -u origin update-hltb-for-deck
   gh pr create --repo SteamDeckHomebrew/decky-plugin-database --fill
   ```

Follow the database pull-request template. Do not point its HLTB entry at `fork/main` without changing the plugin source and getting approval from the database maintainers.
