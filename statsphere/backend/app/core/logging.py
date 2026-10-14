"""Logging setup. Application code must never log names, e-mail addresses, phone numbers or messages."""

from __future__ import annotations

import logging
import re

_EMAIL = re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+")


class RedactEmailFilter(logging.Filter):
    """Defence in depth: mask anything that looks like an e-mail address in log output."""

    def filter(self, record: logging.LogRecord) -> bool:
        if isinstance(record.msg, str):
            record.msg = _EMAIL.sub("[redacted-email]", record.msg)
        if isinstance(record.args, dict):
            record.args = {k: _EMAIL.sub("[redacted-email]", v) if isinstance(v, str) else v for k, v in record.args.items()}
        elif record.args:
            record.args = tuple(_EMAIL.sub("[redacted-email]", a) if isinstance(a, str) else a for a in record.args)
        return True


def configure_logging(level: str = "INFO") -> None:
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter("%(asctime)s %(levelname)s %(name)s: %(message)s"))
    handler.addFilter(RedactEmailFilter())
    root = logging.getLogger()
    root.handlers[:] = [handler]
    root.setLevel(level.upper())
    logging.getLogger("uvicorn.access").disabled = True  # replaced by our request logger (no query strings)
