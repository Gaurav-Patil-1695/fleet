"""First-administrator seed command.

Usage:
    python -m app.seed

Reads ADMIN_EMAIL and ADMIN_PASSWORD from the environment.
Idempotent: if a user with that email already exists, it is left unchanged.
"""

import asyncio
import os
import sys
import uuid

from sqlalchemy import select

from app.database import AsyncSessionLocal
from app.models.user import User
from app.utils.security import hash_password


async def seed_admin() -> None:
    admin_email = os.environ.get("ADMIN_EMAIL")
    admin_password = os.environ.get("ADMIN_PASSWORD")

    if not admin_email:
        print("ERROR: ADMIN_EMAIL environment variable is not set.", file=sys.stderr)
        sys.exit(1)

    if not admin_password:
        print("ERROR: ADMIN_PASSWORD environment variable is not set.", file=sys.stderr)
        sys.exit(1)

    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(User).where(User.email == admin_email)
        )
        existing_user = result.scalar_one_or_none()

        if existing_user is not None:
            print(
                f"User with email '{admin_email}' already exists (id={existing_user.id}). "
                "No changes made."
            )
            return

        password_hash = hash_password(admin_password)

        admin_user = User(
            id=uuid.uuid4(),
            depot_id=None,
            full_name="Administrator",
            email=admin_email,
            password_hash=password_hash,
            role="administrator",
            is_active=True,
        )

        session.add(admin_user)
        await session.commit()
        await session.refresh(admin_user)

        print(
            f"Administrator user created successfully: "
            f"email='{admin_user.email}', id={admin_user.id}, role={admin_user.role}"
        )


def main() -> None:
    asyncio.run(seed_admin())


if __name__ == "__main__":
    main()
