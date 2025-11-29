# multimodal_agent.py - MODIFIED
import os
import asyncio
from multimodal_ingest import ingest_text_sources
from multimodal_analyzer import analyze_text_item
from verifier import verify_claim
from publisher_realtime import publish_realtime_only

async def _handle_item(item):
    text_claims = await analyze_text_item(item)
    for c in text_claims:
        verification = await verify_claim(c)
        await publish_realtime_only(verification, origin=item.get("url"))  # ✅ Storage-free

async def run_agent():
    while True:
        try:
            await cycle_once()
        except Exception as e:
            print("agent cycle error:", e)
        await asyncio.sleep(60)

# Keep the rest of the agent logic the same

CHECK_INTERVAL = int(os.getenv("AGENT_CHECK_INTERVAL", "60"))
INITIALIZE_DB = True

async def _handle_item(item):
    # analyze text
    text_claims = await analyze_text_item(item)
    for c in text_claims:
        verification = await verify_claim(c)
        await publish_with_audiences(verification, origin=item.get("url"))
    # analyze image
    if item.get("image_url"):
        img_claims = await analyze_image_url(item["image_url"])
        for c in img_claims:
            verification = await verify_claim(c)
            await publish_with_audiences(verification, origin=item.get("image_url"))

async def cycle_once(query="breaking OR rumor OR viral OR claim", limit=12):
    items = await ingest_text_sources(query=query, limit=limit)
    tasks = []
    for it in items:
        tasks.append(asyncio.create_task(_handle_item(it)))
    if tasks:
        await asyncio.gather(*tasks, return_exceptions=True)

async def run_agent():
    if INITIALIZE_DB:
        storage.init_db()
    while True:
        try:
            await cycle_once()
        except Exception as e:
            print("agent cycle error:", e)
        await asyncio.sleep(CHECK_INTERVAL)

if __name__ == "__main__":
    asyncio.run(run_agent())
