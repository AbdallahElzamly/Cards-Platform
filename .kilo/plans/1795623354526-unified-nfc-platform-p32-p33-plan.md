# Plan: Import `ai-design-skills` into Project and Global Kilo Config

## Overview
Clone `https://github.com/elayadesign/ai-design-skills.git` temporarily, inspect skill structures, copy them into project local skills (`.agents/skills/`) and global Kilo skills directory (`C:\Users\55\.config\kilo/skills/`), add local skill exclusions to `.gitignore`, and clean up the temporary clone.

## Detailed Steps & File Plan
1. **Temporary Clone (`_temp-design-skills`):**
   - Run `git clone https://github.com/elayadesign/ai-design-skills.git _temp-design-skills` using bash (in implementation mode).
2. **Inspect & Distribute Skills:**
   - Scan `_temp-design-skills` for skill directories containing `SKILL.md`.
   - Copy discovered skills to project local `.agents/skills/` (matching existing convention in `cards-platform`).
   - Copy discovered skills to global user Kilo config directory (`C:\Users\55\.config\kilo/skills/`).
3. **Cleanup & Git Ignore:**
   - Remove `_temp-design-skills` directory.
   - Update `.gitignore` to ignore temporary or untracked skill artifacts if needed.
4. **Validation:**
   - Verify skill directories and `SKILL.md` files exist correctly in both locations.
