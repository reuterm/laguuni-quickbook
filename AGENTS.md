When working on UI components, stories, visual regressions, or Storybook docs, use the `storybook` MCP tools before making changes or answering questions about component behavior.

- Never assume component props, states, or supported usage patterns. Check Storybook documentation and stories first.
- Use `list-all-documentation` to discover documented components and docs pages.
- Use `get-documentation` for the specific component or doc page you are changing.
- Use `get-storybook-story-instructions` before creating or updating stories so new stories follow current project conventions.
- Use `run-story-tests` to verify story behavior after Storybook-related changes when the dev server is running.

If Storybook is unavailable or the requested component is not documented, say so clearly instead of guessing.
