# Git hooks

Enable the repository hooks once per local checkout:

```bash
git config core.hooksPath .githooks
```

The pre-commit hook runs format and lint checks for both `backend/` and `frontend/`.
