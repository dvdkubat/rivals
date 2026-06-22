# Rivals TODO

## Current state
- Main menu, settings, lobby list, lobby preparation, castle view and map view render from EJS partials.
- Tutorial, Info, Support, Roadmap and Test now contain product-facing content instead of placeholders.
- Socket.IO lobby flow can create, list and join lobbies, with a default test lobby on server start.
- The map is served through a compact JSON endpoint and loaded asynchronously by the client.
- Starter castle economy and army movement are broadcast over lobby sockets so connected clients can share the same current state.

## Next steps
1. Add server-side validation for army paths, movement costs, recruitment costs and building affordability.
2. Add turn ownership rules so only the active player can move armies or mutate castle economy.
3. Add battle resolution when armies meet on the same or adjacent hex.
4. Persist lobby game state across reconnects and server restarts.
5. Add automated browser smoke tests for menu navigation, lobby join, compact map loading, castle build/recruit actions and synchronized map movement.
