# HLTB for Deck

## Description

A plugin to show you game lengths according to How Long To Beat. Built with [Decky Loader](https://github.com/SteamDeckHomebrew/decky-loader).

Currently this is an actively maintained fork of [original HLTB for Deck plugin](https://github.com/hulkrelax/hltb-for-deck).
[hulkrelax](https://github.com/hulkrelax) is the original author of the plugin. Cheers and huge thanks to [safijari](https://github.com/safijari) / [SDH-Stewardship](https://github.com/SDH-Stewardship) for maintaining the plugin for a long time before this fork.

> [!IMPORTANT]  
> Please note that HLTB does not have an official public API. This plugin (and this fork in particular) is heavily depending on the API changes discovered and implemented in [HowLongToBeat-PythonAPI repository](https://github.com/ScrappyCocco/HowLongToBeat-PythonAPI). Every change done to API by HLTB might break this plugin workability. Unfortunately, there may and will be delays in restoring the plugin workability. However, recent changes were implemented to mitigate changes in the HLTB API and try to get the API name dynamically, bypassing the need for manual changes and a new version if possible.

## Features

-   On an app page, shows four main stats offered by How Long to Beat
-   Clicking **View Details** will take you to their site for the game
-   Results are cached for two hours (cache can be cleared from QAM page for HLTB for Deck)
-   Bar appearance is customizable from the QAM page, and overridable by CSS Loader themes

## Appearance

The **Appearance** section of the QAM page controls how the HLTB bar looks. It is
independent of **HLTB Style**, which only selects where the bar is positioned, so
any appearance setting applies to all four layouts.

| Setting              | Default    | Effect                                                                                                                                                                                                             |
| -------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Customize appearance | off        | Master switch. While off, the built-in defaults apply and your values are kept for later                                                                                                                           |
| Background opacity   | 25% / 50%  | Darkens the bar so the stats stay readable over bright hero art. Leave it alone to keep each layout's built-in value (25% for **Default**, 50% for the **"Clean"** layouts); move it to force one value everywhere |
| "View Details" color | Steam blue | Steam blue (`#67c1f5`) or the same color as the stats                                                                                                                                                              |
| Text shadow          | off        | Adds a shadow behind the text for extra contrast                                                                                                                                                                   |
| Text size            | 100%       | Scales the stat numbers and their labels together                                                                                                                                                                  |
| Bottom border        | on         | Shows the divider line under the bar                                                                                                                                                                               |
| Reset appearance     | —          | Returns every setting above to its default                                                                                                                                                                         |

**Clear Cache** removes cached game results only. It keeps your HLTB Style,
"Hide View Details", per-stat toggles and appearance settings.

## Theming with CSS Loader

The bar reads its colors and sizes from CSS custom properties, so a CSS Loader
theme can restyle it without redeclaring any rule:

```css
.hltb-info {
    --hltb-bar-alpha: 0.75 !important;
    --hltb-link-color: #dcdedf !important;
}
```

`!important` is required, because your QAM choices are applied inline on the same
element. A theme has to be explicit to override a setting you picked yourself.

Supported properties:

| Property                        | Default                                                          |
| ------------------------------- | ---------------------------------------------------------------- |
| `--hltb-bar-alpha`              | `0.25`, raised to `0.5` by the two `"Clean"` layouts             |
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

`--hltb-clean-top` and `--hltb-clean-inset` also exist, but they position the
"Clean" layouts and may change between releases. Do not rely on them.

## Screenshots

![Title image](images/image001.png)

## Manual installation in Decky

1. Proceed to **Decky Settings** &rarr; **General**.
2. Enable **Developer Mode**.
3. Then go to newly appeared **Developer** tab &rarr; **Install Plugin from ZIP File** and click **Browse**. Or you can try directly installing from via link by entering it to **Install Plugin from URL** text field.
4. Select the ZIP archive or enter following link: [https://github.com/morwy/hltb-for-deck/releases/latest/download/hltb-for-deck.zip](https://github.com/morwy/hltb-for-deck/releases/latest/download/hltb-for-deck.zip).
5. After installing go to **Plugins**.
6. Select **HLTB for Deck** settings and then click **Reload**.
7. **HLTB for Deck** plugin should change its version to latest one, indicating successful installation.

## Building from source

1. Download and install Node.js from [https://nodejs.org/en/download](https://nodejs.org/en/download).
2. Verify that installation was successful by running following command in terminal:

    ```bash
    node --version
    ```

3. Clone this repository and navigate to the project folder.
4. Install pnpm:

    ```bash
    npm install -g pnpm
    ```

5. Install project dependencies:

    ```bash
    pnpm install
    ```

6. Build the project:

    ```bash
    pnpm run build
    ```

A batch script `build.bat` that builds and packs the project into a ZIP archive for manual installation was created and located in the project root folder.

## Submitting update to Decky Plugin Database

1. Create a fork of [Decky Plugin Database repository](https://github.com/SteamDeckHomebrew/decky-plugin-database).
2. Checkout it locally. I suggest skipping the recursive checkout of submodules, because it may take forever.

   ```bash
   git clone https://github.com/morwy/decky-plugin-database.git
   ```

3. Verify that you are on the `main` branch.

   ```bash
   git checkout main
   ```

4. Create a new branch that contains the latest update from the plugin.

   ```bash
   git checkout -b update/hltb-2.0.10
   ```

5. Initialize the plugin submodule **if it is a fresh clone of the repository and there are no files in the folder**.

   ```bash
   git submodule update --init plugins\hltb-for-deck
   ```

6. Update the plugin submodule to the latest commit.

   ```bash
   cd plugins/hltb-for-deck && git checkout main && git pull && cd ../..
   ```

7. Add and commit your changes to the Git.

   ```bash
   git add plugins/hltb-for-deck && git commit -m "Updated hltb-for-deck to 2.0.10" && git push --set-upstream origin update/hltb-2.0.10
   ```

8. After new changes have landed on the GitHub, click on **Compare & pull request** button in your forked repository. It will automatically open a form for filling in the PR to the original repository.
9. Use correct form template and continue according to the provided instructions.
