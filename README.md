# Trafikinfo SE Alert Card (Deprecated)

This repository is deprecated.

The alert card has moved and is now bundled with the main integration:

https://github.com/Nicxe/homeassistant-trafikinfo-se

## Release note: card moved to the integration repository

Starting with the new integration-based distribution, this standalone card repository is no longer used for updates.

If you already use the card, migrate as follows:

1. Update **Trafikinfo SE** integration in HACS (repository: `Nicxe/homeassistant-trafikinfo-se`).
2. Remove/uninstall this deprecated HACS dashboard repository (`Nicxe/homeassistant-trafikinfo-se-card`).
3. Remove old Lovelace resources that point to this repo (for example `/hacsfiles/...` URLs), if present.
4. Keep your dashboard cards as they are. Card types are unchanged.
5. Restart Home Assistant once.
6. Hard-refresh the browser once (Ctrl/Cmd + Shift + R).

The integration now manages the card resource automatically and serves it from `/local/trafikinfo-se-alert-card.js`.

For current installation, configuration, and usage instructions, see:

https://github.com/Nicxe/homeassistant-trafikinfo-se

Please open all new issues and feature requests in the main repository:

https://github.com/Nicxe/homeassistant-trafikinfo-se/issues
