# Flickleaf project conventions

- Apply shared reader changes to the web app, Firefox extension, and Chrome extension together. Keep the tokenizer, playback engine, and reader UI in shared src modules rather than copying fixes between targets.
- For reader changes, build and check all targets. Publish the web update at miguelbarroso.com/flickleaf and provide refreshed Firefox and Chrome packages. Keep web About/setup documentation accurate.
- Preserve the quiet reading state across heading cards. Titles must not reveal surrounding controls automatically or move the reading focal point.
- Shell commands use rtk, as instructed by /Users/mb/.codex/RTK.md.

- Keep pace limits and scroll modes directly visible; do not put them behind a settings disclosure.
