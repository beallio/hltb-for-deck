# HLTB for Deck (beallio fork)

[![Latest release](https://img.shields.io/github/v/release/beallio/hltb-for-deck?label=version)](https://github.com/beallio/hltb-for-deck/releases)
[![License](https://img.shields.io/github/license/beallio/hltb-for-deck)](LICENSE)

HLTB for Deck shows estimated play times from HowLongToBeat on your Steam game pages. Select **View Details** to see more on the HowLongToBeat website. The plugin runs in [Decky Loader](https://github.com/SteamDeckHomebrew/decky-loader).

This is a fork of [morwy/hltb-for-deck](https://github.com/morwy/hltb-for-deck). The regular Decky Store has the original version, not the changes listed below. Install this fork from the custom store or from a [release ZIP](https://github.com/beallio/hltb-for-deck/releases/latest).

## What this fork adds

These changes are not in upstream v2.0.11. Each one first appeared in the published [v2.0.11-beallio.1 fork release](https://github.com/beallio/hltb-for-deck/releases/tag/v2.0.11-beallio.1) and is also in the [latest fork release](https://github.com/beallio/hltb-for-deck/releases/latest). None has been submitted upstream as a separate change. Checked on 2026-09-24.

| Change | What it does | First fork release |
| --- | --- | --- |
| Bar appearance | Change the background opacity, link color, text shadow, text size, and bottom border from the Quick Access Menu. | `v2.0.11-beallio.1` |
| Changes appear right away | Changes to the bar's style, appearance, and shown stats appear on an open game page without reopening it. | `v2.0.11-beallio.1` |
| Settings stay saved | Opening the settings again keeps your bar style and **Hide View Details** choice. **Clear Cache** keeps these settings, your choices of which stats to show, and your appearance settings. | `v2.0.11-beallio.1` |
| CSS Loader themes | CSS Loader themes can change the bar's colors and size. | `v2.0.11-beallio.1` |

HowLongToBeat does not provide a supported way for plugins to get game times. If its website changes, game searches may stop working until the plugin is updated.

## Install or update this fork

### Use the custom store

1. In Decky Loader, open **Settings → General**.
2. Set **Store Channel** to **Custom**.
3. Set the custom store URL to `https://decky-extended-plugins.beallio.com/plugins.json`.
4. Open the Decky Store and find **HLTB for Deck**. Select a version with `-beallio` in its name to install or update this fork.

The [custom store website](https://decky-extended-plugins.beallio.com/) has setup instructions. Its home page is for browsing; Decky Loader needs the `plugins.json` URL above.

### Install a ZIP

1. Download `hltb-for-deck.zip` from this fork's [latest release](https://github.com/beallio/hltb-for-deck/releases/latest).
2. In Decky Loader, open **Settings → General** and turn on **Developer Mode**.
3. Open **Settings → Developer → Install Plugin from ZIP File** and select the ZIP. Or use **Install Plugin from URL** with this [direct ZIP link](https://github.com/beallio/hltb-for-deck/releases/latest/download/hltb-for-deck.zip).
4. If the new version does not appear, open **Plugins → HLTB for Deck** and select **Reload**.

To update a ZIP installation, install the latest ZIP over the current copy. The upstream and fork versions have the same plugin name. You can install only one at a time.

## Use the plugin

The bar shows four play-time estimates. In the Quick Access Menu, open **HLTB for Deck** to choose a bar style, show or hide individual stats, and clear saved game results. The plugin keeps each game's result for two hours before it looks again.

## Change how the bar looks

Open **Appearance** in the HLTB for Deck Quick Access Menu. Your choices apply to all four bar styles.

- **Customize appearance** is off by default. Turn it on to use your choices. Turning it off keeps your choices for later.
- **Background opacity** controls how dark the bar is. By default, the **Default** style uses 25% and the **Clean** styles use 50%. Move the slider to use one value for every style.
- **View Details color** can be Steam blue or the same color as the other text.
- **Text shadow** adds contrast behind the text. It is off by default.
- **Text size** changes the numbers and labels together. It starts at 100%.
- **Bottom border** shows a line under the bar. It is on by default.
- **Reset appearance** restores the defaults.

**Clear Cache** removes saved game results. It does not reset your settings.

CSS Loader theme authors can find the [CSS customization guide](DEVELOPER.MD#theming-with-css-loader) in the developer documentation.

## Screenshots

![Title image](images/image001.png)

## For developers

See [DEVELOPER.MD](DEVELOPER.MD) for build instructions and Decky Plugin Database submission guidance.

## License

This plugin is available under the [MIT License](LICENSE). The license names hulkrelax as the 2022 copyright holder. Keep the license and copyright notice with copies of the software.

## Credits

- [hulkrelax](https://github.com/hulkrelax/hltb-for-deck) created the original plugin.
- [safijari](https://github.com/safijari) and [SDH-Stewardship](https://github.com/SDH-Stewardship) maintained the plugin after its original release.
- [morwy](https://github.com/morwy) and the [upstream contributors](https://github.com/morwy/hltb-for-deck/graphs/contributors) maintain the upstream project. [beallio](https://github.com/beallio) maintains this fork.
- Research in [HowLongToBeat-PythonAPI](https://github.com/ScrappyCocco/HowLongToBeat-PythonAPI) has helped maintain the plugin when HowLongToBeat changed its website.
