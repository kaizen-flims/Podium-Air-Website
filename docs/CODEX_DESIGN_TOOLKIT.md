# Shared design toolkit for Codex CLI and Codex Cloud

This repository includes AGENTS.md, which Codex can read from the repository in either environment. This PR does **not** install third-party software on your Mac or in a cloud container.

## Mac: Codex CLI

Install Node.js and Codex CLI through their official installation instructions, then open the cloned repository in Codex. To add the Vercel skill, inspect the upstream repository first, then run:

```bash
npx skills add vercel-labs/agent-skills --skill web-design-guidelines --agent codex
```

Other resources:
- Taste Skill: https://www.tasteskill.dev/
- Image to Code: https://github.com/Leonxlnx/taste-skill/blob/main/skills/image-to-code-skill/SKILL.md
- Awesome Design: https://github.com/VoltAgent/awesome-design-md/
- Playwright CLI: https://github.com/microsoft/playwright-cli

Check their current documentation for compatibility and commands. Don't assume all five are installable through the same skills command.

## Codex Cloud

Connect this GitHub repository to a Codex Cloud environment. Repository-level AGENTS.md is available when the branch is checked out. Personal skills and CLI dependencies installed on your Mac do not automatically transfer to the cloud.

For browser tests, install Playwright CLI in the appropriate environment only after reviewing its upstream docs. Browser binaries or sandbox permissions may need additional configuration.

## Suggested verification
1. Ask Codex to summarize AGENTS.md and the five resources.
2. Ask it to audit a page for mobile usability without changing code.
3. Review its proposed diff.
4. Run the project's existing build and browser tests.
5. Merge only after checking the results.
