# Rivals TODO

## Current state
- Main menu, settings, lobby list, lobby preparation, castle view and map view render from EJS partials.
- Socket.IO lobby flow can create, list and join lobbies, with a default test lobby on server start.
- The map uses the existing hex grid and background image; a local player gets a starter human castle and a starter army.
- Basic UI templates now exist for menu items that were previously only alerts or no-op buttons.

## Next steps
1. Replace placeholder copy in Tutorial, Info, Support, Roadmap and Test with final product content.
2. Persist selected race, starting position and map choice in the lobby and send it to the server before game start.
3. Move the large inline `grid.js` map data to a compact JSON map endpoint and load it asynchronously.
4. Synchronize army movement and castle economy over sockets instead of keeping them client-local.
5. Add production/recruitment rules, validation messages and disabled states for unaffordable castle actions.
6. Add combat resolution when armies meet on the same or adjacent hex.
7. Add automated browser smoke tests for menu navigation, lobby join, castle build/recruit actions and map movement.
