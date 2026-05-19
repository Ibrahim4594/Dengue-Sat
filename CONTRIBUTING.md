# Contributing to DengueSat CIRO

Thanks for considering a contribution. DengueSat is open-source under MIT.

## Quick start
1. Fork + clone
2. `npm install` in root and `server/`
3. Copy `.env.example` to `.env.local` and fill keys
4. `npx expo start` for mobile, `vercel dev` in `server/` for backend

## Architecture
See `docs/superpowers/specs/2026-05-14-denguesat-max-power-design.md`

## Adding a new agent
1. Define system prompt in `server/lib/prompts.ts`
2. Define Zod output schema in `server/lib/schemas.ts`
3. Add entry to `AGENT_MAP` in `server/api/agent/tool/[name].ts`
4. Add tool definition to `TOOLS` array in `server/api/agent/orchestrate.ts`
5. Add agent class in `lib/agents/`
6. Update `AgentName` union in `lib/types.ts`
7. Map tool name to agent in `lib/antigravity.ts` `TOOL_TO_AGENT`

## Adding a signal source
1. Create proxy in `server/api/data/<name>.ts`
2. Create client in `lib/api/<name>.ts`
3. Wire into `lib/antigravity.ts` prefetch
4. Update SignalFuse prompt to weight new source

## Style
- TypeScript strict mode
- Use existing react-native-paper theme
- Phosphor icons for hero accents, Ionicons for tab bar
- Inter (body) + Sora (display) fonts

## Submitting a PR
1. Branch from `feat/max-power-refactor`
2. Run `tsc --noEmit` clean
3. Test on Android emulator (`expo run:android`)
4. Open PR with description + screenshot

## Security
- Never commit `.env.local`
- Anthropic key only in `server/.env.local`
- Report security issues to ibrahimsamad507@gmail.com
