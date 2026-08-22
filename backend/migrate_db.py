import asyncio
import logging
from sqlalchemy import text
from app.db.session import engine, init_db

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("migrate_db")


async def run_migration():
    logger.info("Running database column migrations for users table...")
    async with engine.begin() as conn:
        try:
            await conn.execute(text("ALTER TABLE users ADD COLUMN phone_number VARCHAR(30);"))
            logger.info("Added phone_number column to users table.")
        except Exception as e:
            logger.info(f"phone_number column check: {e}")

        try:
            await conn.execute(text("ALTER TABLE users ADD COLUMN password_hash VARCHAR(255);"))
            logger.info("Added password_hash column to users table.")
        except Exception as e:
            logger.info(f"password_hash column check: {e}")

    await init_db()
    logger.info("Database migration complete!")


if __name__ == "__main__":
    asyncio.run(run_migration())
