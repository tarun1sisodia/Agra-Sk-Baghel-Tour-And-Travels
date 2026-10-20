# pyright: reportMissingImports=false
import asyncio
import os
import sys
import traceback

os.environ["STRIX_MCP_CONFIG"] = r"F:\AI\Strix\Data\mcp-servers.json"
os.environ["SUPERMEMORY_DATA_DIR"] = r"F:\AI\Supermemory\Data"

strix_venv_site = r"F:\AI\Strix\Source\.venv\Lib\site-packages"
if os.path.exists(strix_venv_site) and strix_venv_site not in sys.path:
    sys.path.insert(0, strix_venv_site)

strix_source = r"F:\AI\Strix\Source"
if os.path.exists(strix_source) and strix_source not in sys.path:
    sys.path.insert(0, strix_source)

from strix.tools.mcp.loader import load_user_mcp_configs  # type: ignore # pyright: ignore[reportMissingImports]
from strix.tools.mcp.client import _build_server  # type: ignore # pyright: ignore[reportMissingImports]

async def diag():
    configs = load_user_mcp_configs()
    cfg = configs[0]
    print("Config:", cfg)
    built = _build_server(cfg)
    server = built.server
    print("Server object:", type(server))
    try:
        print("Calling server.connect()...")
        await server.connect()
        print("Connect successful!")
        tools = await server.list_tools()
        print("Tools listed:", [t.name for t in tools])
        await server.cleanup()
        print("Cleanup successful!")
    except Exception as e:
        print("Exception during connect:")
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(diag())
