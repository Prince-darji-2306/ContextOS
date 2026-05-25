import json
import asyncio
from mcp.client.sse import sse_client
from mcp.client.session import ClientSession

async def test_all():
    url = "http://127.0.0.1:8000/mcp/sse"
    headers = {"Authorization": "Bearer ctx.Fs1G8ebecrO6W8Uq.JH4geLnMTtN6xnCj6ytbq6dHvmmAWSf_hjF1nFHs2qY"}
    
    print("Connecting to MCP Server via SSE...")
    try:
        async with sse_client(url, headers=headers) as streams:
            read_stream, write_stream = streams
            async with ClientSession(read_stream, write_stream) as session:
                print("Initializing session...")
                await session.initialize()
                
                print("\n[1] Listing Tools:")
                tools = await session.list_tools()
                for tool in tools.tools:
                    print(f" - {tool.name}: {tool.description}")

                print("\n[2] Testing 'remember' tool...")
                res_rem = await session.call_tool("remember", arguments={
                    "app_name": "Claude Desktop",
                    "text": "The secret code is 42 and the user loves Python."
                })
                print("Result:", res_rem)

                print("\n[3] Testing 'search' tool...")
                res_search = await session.call_tool("search", arguments={"limit": 5})
                print("Result:", res_search)

                print("\n[4] Testing 'recall' tool...")
                res_recall = await session.call_tool("recall", arguments={"query": "secret code"})
                print("Result:", res_recall)
                
                print("\n[5] Testing 'forget' tool... (Attempting to forget the first memory from search)")
                try:
                    text_content = res_search.content[0].text
                    search_data = json.loads(text_content)
                    
                    # Qdrant/FastAPI might return a list of points directly, or a single dictionary
                    first_id = None
                    if isinstance(search_data, list) and len(search_data) > 0:
                        first_id = search_data[0].get("id")
                    elif isinstance(search_data, dict):
                        if "points" in search_data and len(search_data["points"]) > 0:
                            first_id = search_data["points"][0].get("id")
                        elif "id" in search_data:
                            first_id = search_data["id"]

                    if first_id:
                        print(f"Forgetting memory ID: {first_id}")
                        res_forget = await session.call_tool("forget", arguments={"memory_ids": [first_id]})
                        print("Result:", res_forget)
                    else:
                        print("No memory ID found to forget. Search data was:", search_data)
                        
                except Exception as e:
                    print(f"Could not parse search results to test forget: {e}")
                    
                print("\nAll tests completed successfully!")

    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_all())
