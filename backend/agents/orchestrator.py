import logging
from typing import TypedDict
from langgraph.graph import StateGraph, START, END
from repos.postgres import insert_agent_log

# Import agents
from schemas import AgentState
from agents import (
    run_decay_agent,
    run_scorer_agent,
    run_consolidation_agent,
    run_summarization_agent
)

logger = logging.getLogger("orchestrator")

def build_orchestrator_graph(user_id: str):
    workflow = StateGraph(AgentState)
    workflow.add_node("consolidation_agent", run_consolidation_agent)
    workflow.add_node("summarization_agent", run_summarization_agent)
    workflow.add_node("context_scorer_agent", run_scorer_agent)
    workflow.add_node("decay_agent", run_decay_agent)
    workflow.add_edge(START, "consolidation_agent")
    workflow.add_edge("consolidation_agent", "summarization_agent")
    workflow.add_edge("summarization_agent", "context_scorer_agent")
    workflow.add_edge("context_scorer_agent", "decay_agent")
    workflow.add_edge("decay_agent", END)
    return workflow.compile()


# Define Node Actions

async def node_decay(state: AgentState) -> AgentState:
    try:
        affected_ids = await run_decay_agent(state["user_id"])
        state["memory_ids"].extend(affected_ids)
        state["status"] = "success"
    except Exception as e:
        logger.error(f"Decay Agent failed: {e}")
        state["status"] = "failed"
    return state

async def node_scorer(state: AgentState) -> AgentState:
    try:
        affected_ids = await run_scorer_agent(state["user_id"])
        state["memory_ids"].extend(affected_ids)
        state["status"] = "success"
    except Exception as e:
        logger.error(f"Scorer Agent failed: {e}")
        state["status"] = "failed"
    return state

async def node_consolidation(state: AgentState) -> AgentState:
    try:
        affected_ids = await run_consolidation_agent(state["user_id"])
        state["memory_ids"].extend(affected_ids)
        state["status"] = "success"
    except Exception as e:
        logger.error(f"Consolidation Agent failed: {e}")
        state["status"] = "failed"
        state["retries"] += 1
    return state

async def node_summarization(state: AgentState) -> AgentState:
    try:
        affected_ids = await run_summarization_agent(state["user_id"])
        state["memory_ids"].extend(affected_ids)
        state["status"] = "success"
    except Exception as e:
        logger.error(f"Summarization Agent failed: {e}")
        state["status"] = "failed"
    return state

async def node_log_result(state: AgentState) -> AgentState:
    # Final check and DB status logging
    await insert_agent_log(
        agent_name="orchestrator",
        user_id=state["user_id"],
        action="orchestrator_run_complete",
        memory_ids=state["memory_ids"],
        status=state["status"]
    )
    return state

# Setup StateGraph
graph = StateGraph(AgentState)

graph.add_node("decay", node_decay)
graph.add_node("scorer", node_scorer)
graph.add_node("consolidation", node_consolidation)
graph.add_node("summarization", node_summarization)
graph.add_node("log_result", node_log_result)

# Build edges
graph.set_entry_point("decay")
graph.add_edge("decay", "scorer")
graph.add_edge("scorer", "consolidation")

# Conditional Routing for consolidation retries
def route_after_consolidation(state: AgentState):
    if state["status"] == "failed" and state["retries"] < 3:
        return "retry"
    return "summarization"

graph.add_conditional_edges(
    "consolidation",
    route_after_consolidation,
    {
        "retry": "consolidation",
        "summarization": "summarization"
    }
)

graph.add_edge("summarization", "log_result")
graph.add_edge("log_result", END)

orchestrator_app = graph.compile()

async def trigger_full_agent_pipeline(user_id: str):
    """Entrypoint function to run the full pipeline asynchronously for a user."""
    initial_state = {
        "user_id": user_id,
        "task": "full_cleanup",
        "memory_ids": [],
        "status": "pending",
        "retries": 0,
        "result": {}
    }
    return await orchestrator_app.ainvoke(initial_state)
