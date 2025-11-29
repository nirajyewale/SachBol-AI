# multimodal_ingest.py - ENHANCED VERSION WITH RSS PARSING
import os
import httpx
import xml.etree.ElementTree as ET
from datetime import datetime
from typing import List, Dict

NEWSDATA_KEY = os.getenv("NEWSDATA_API_KEY", "")
GNEWS_KEY = os.getenv("GNEWS_API_KEY", "")
MEDIASTACK_KEY = os.getenv("MEDIASTACK_API_KEY", "")

RSS_FEEDS = [
    {"name": "BBC", "url": "https://feeds.bbci.co.uk/news/rss.xml"},
    {"name": "CNN", "url": "http://rss.cnn.com/rss/edition.rss"},
    {"name": "NPR", "url": "https://feeds.npr.org/1001/rss.xml"},
    {"name": "ABC News", "url": "https://abcnews.go.com/abcnews/topstories"}
]

async def _get_json(url: str, params: dict = None, timeout: int = 20):
    async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
        r = await client.get(url, params=params)
        r.raise_for_status()
        return r.json()

async def _get_text(url: str, timeout: int = 20):
    async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
        r = await client.get(url)
        r.raise_for_status()
        return r.text

def parse_rss_content(xml_content: str, source_name: str) -> List[Dict]:
    """Parse RSS XML and extract actual article content"""
    items = []
    try:
        root = ET.fromstring(xml_content)
        
        # Look for items in different RSS formats
        for item in root.findall('.//item') or root.findall('.//entry'):
            title_elem = item.find('title')
            description_elem = item.find('description') or item.find('summary') or item.find('content:encoded', {'content': 'http://purl.org/rss/1.0/modules/content/'})
            link_elem = item.find('link')
            pub_date_elem = item.find('pubDate') or item.find('published')
            
            title = title_elem.text if title_elem is not None else "No title"
            description = description_elem.text if description_elem is not None else ""
            link = link_elem.text if link_elem is not None else ""
            
            # Clean up description (remove HTML tags, etc.)
            import re
            description = re.sub('<[^<]+?>', '', description)
            
            if title and title != "No title":
                items.append({
                    "type": "text",
                    "source": source_name,
                    "title": title.strip(),
                    "text": description.strip()[:2000],  # Use actual content, not raw XML
                    "image_url": None,
                    "url": link,
                    "published": datetime.utcnow().isoformat()
                })
                
    except Exception as e:
        print(f"RSS parsing error for {source_name}: {e}")
    
    return items[:5]  # Return max 5 articles per feed

async def ingest_text_sources(query: str = "breaking OR rumor OR viral OR claim", limit: int = 10) -> List[Dict]:
    items = []
    
    # NewsData.io
    if NEWSDATA_KEY:
        try:
            js = await _get_json("https://newsdata.io/api/1/news", {"apikey": NEWSDATA_KEY, "q": query, "language": "en", "page": 1})
            for a in js.get("results", [])[:limit]:
                items.append({
                    "type": "text",
                    "source": a.get("source_id") or "newsdata",
                    "title": a.get("title"),
                    "text": (a.get("content") or a.get("description") or "")[:4000],
                    "image_url": a.get("image_url"),
                    "url": a.get("link"),
                    "published": a.get("pubDate") or datetime.utcnow().isoformat()
                })
        except Exception as e:
            print("NewsData ingest error:", e)

    # GNews
    if GNEWS_KEY:
        try:
            js = await _get_json("https://gnews.io/api/v4/search", {"q": query, "token": GNEWS_KEY, "max": limit})
            for a in js.get("articles", [])[:limit]:
                items.append({
                    "type": "text",
                    "source": a.get("source", {}).get("name", "gnews"),
                    "title": a.get("title"),
                    "text": (a.get("content") or a.get("description") or "")[:4000],
                    "image_url": a.get("image"),
                    "url": a.get("url"),
                    "published": a.get("publishedAt") or datetime.utcnow().isoformat()
                })
        except Exception as e:
            print("GNews ingest error:", e)

    # Mediastack
    if MEDIASTACK_KEY:
        try:
            js = await _get_json("http://api.mediastack.com/v1/news", {"access_key": MEDIASTACK_KEY, "keywords": query, "limit": limit})
            for a in js.get("data", [])[:limit]:
                items.append({
                    "type": "text",
                    "source": a.get("source", "mediastack"),
                    "title": a.get("title"),
                    "text": (a.get("description") or "")[:4000],
                    "image_url": a.get("image"),
                    "url": a.get("url"),
                    "published": a.get("published_at") or datetime.utcnow().isoformat()
                })
        except Exception as e:
            print("Mediastack ingest error:", e)

    # RSS fallback - WITH PROPER PARSING
    for feed in RSS_FEEDS:
        try:
            xml_content = await _get_text(feed["url"])
            if xml_content:
                parsed_items = parse_rss_content(xml_content, feed["name"])
                items.extend(parsed_items)
                print(f"✓ Successfully parsed {len(parsed_items)} articles from {feed['name']}")
            else:
                print(f"✗ Empty response from {feed['name']}")
        except Exception as e:
            print(f"RSS fetch error for {feed['name']}: {e}")

    print(f"🎯 Total articles ingested: {len(items)}")
    return items