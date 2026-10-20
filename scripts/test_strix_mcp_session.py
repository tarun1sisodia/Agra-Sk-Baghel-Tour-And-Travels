# pyright: reportMissingImports=false
import asyncio
import os
import sys

# Configure environment
os.environ["STRIX_MCP_CONFIG"] = r"F:\AI\Strix\Data\mcp-servers.json"
os.environ["SUPERMEMORY_DATA_DIR"] = r"F:\AI\Supermemory\Data"

# Add Strix and its venv dependencies to sys.path
strix_venv_site = r"F:\AI\Strix\Source\.venv\Lib\site-packages"
if os.path.exists(strix_venv_site) and strix_venv_site not in sys.path:
    sys.path.insert(0, strix_venv_site)

strix_source = r"F:\AI\Strix\Source"
if os.path.exists(strix_source) and strix_source not in sys.path:
    sys.path.insert(0, strix_source)

from strix.tools.mcp.loader import load_user_mcp_configs  # type: ignore # pyright: ignore[reportMissingImports]
from strix.tools.mcp.session import SupervisedMcpSession  # type: ignore # pyright: ignore[reportMissingImports]

async def main():
    print("=== Step 1: Loading MCP configs from STRIX_MCP_CONFIG ===")
    configs = load_user_mcp_configs()   
    print("Configs loaded:", len(configs))
    assert len(configs) > 0, "No MCP configs loaded!"
    cfg = configs[0]
    print(f"Server Name: {cfg.name}, Transport: {cfg.transport}, Command: {cfg.command}")
    
    print("\n=== Step 2: Starting SupervisedMcpSession with Supermemory ===")
    session = SupervisedMcpSession(cfg)
    try:
        ready = await session.start()
        print(f"Session started, ready={ready}")
        assert ready, "Session failed to report ready!"
        
        print("\n=== Step 3: Discovering Supermemory Tools ===")
        tools = await session.list_tools()
        print(f"Discovered {len(tools)} tools from Supermemory:")
        for t in tools:
            print(f"  - {t.name}: {t.description}")
            
        tool_names = [t.name for t in tools]
        expected = ["save_finding", "retrieve_findings", "record_false_positive", "get_project_context"]
        for exp in expected:
            assert exp in tool_names, f"Expected tool {exp} missing!"
            
        print("\n=== Step 4: Dispatching get_project_context via MCP protocol ===")
        outcome = await session.dispatch(
            "get_project_context",
            {"project": "arena_customer"},
            label="supermemory/get_project_context"
        )
        print("Dispatch outcome result:")
        print(outcome)
            
        print("\n>>> STRIX-TO-SUPERMEMORY MCP PROTOCOL TEST: FULLY PASSED <<<")
    finally:
        await session.aclose()

if __name__ == "__main__":
    asyncio.run(main())
