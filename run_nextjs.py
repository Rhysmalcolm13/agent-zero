import asyncio
from functools import wraps
import os
from pathlib import Path
import threading
import uuid
from quart import Quart, request, jsonify, Response
from quart_cors import cors
from agent import AgentContext
from initialize import initialize
from python.helpers.files import get_abs_path
from python.helpers.print_style import PrintStyle
from python.helpers.log import Log
from dotenv import load_dotenv
import subprocess
import shutil

# Initialize the internal Quart server
app = Quart("app")
app = cors(app, allow_origin="*")
lock = threading.Lock()

# Set up basic authentication, name and password from .env variables
app.config['BASIC_AUTH_USERNAME'] = os.environ.get('BASIC_AUTH_USERNAME') or "admin"  # default name
app.config['BASIC_AUTH_PASSWORD'] = os.environ.get('BASIC_AUTH_PASSWORD') or "admin"  # default pass

# Start Next.js frontend by running npm run dev
def start_nextjs_frontend():
    frontend_dir = get_abs_path("C:/Users/Rhysm/Desktop/agentric/agent-zero/frontend/")
    npm_path = shutil.which("npm")
    if not npm_path:
        print("npm is not installed or not in the system PATH.")
        return

    try:
        print(f"Starting Next.js development server in {frontend_dir}...")

        # Run "npm run dev" to start the development server
        subprocess.run([npm_path, "run", "dev"], cwd=frontend_dir, check=True)
        print("Next.js development server is now running.")

    except subprocess.CalledProcessError as e:
        print(f"Failed to start Next.js development server: {e}")
    except Exception as e:
        print(f"Unexpected error while starting Next.js development server: {e}")

# Get context to run agent zero in
def get_context(ctxid: str):
    with lock:
        if not ctxid:
            return AgentContext.first() or AgentContext(config=initialize())
        return AgentContext.get(ctxid) or AgentContext(config=initialize(), id=ctxid)

# Now you can use @requires_auth function decorator to require login on certain pages
def requires_auth(f):
    @wraps(f)
    async def decorated(*args, **kwargs):
        auth = request.authorization
        if not auth or not (
                auth.username == app.config['BASIC_AUTH_USERNAME'] and auth.password == app.config['BASIC_AUTH_PASSWORD']):
            return Response(
                'Could not verify your access level for that URL.\n'
                'You have to login with proper credentials', 401,
                {'WWW-Authenticate': 'Basic realm="Login Required"'})
        return await f(*args, **kwargs)
    return decorated

# Simple health check, just return OK to see the server is running
@app.route('/ok', methods=['GET', 'POST'])
async def health_check():
    return "OK"

# Additional health check endpoint for StatusSection
@app.route('/health', methods=['GET'])
async def health():
    return jsonify({"status": "ok"})

# Handle message to agent (async UI)
@app.route('/msg', methods=['POST'])
async def handle_message_async():
    return await handle_message(False)

# Handle message to agent (synchronous API)
@app.route('/msg_sync', methods=['POST'])
async def handle_msg_sync():
    return await handle_message(True)

async def handle_message(sync: bool):
    try:
        input = await request.get_json()
        text = input.get("text", "")
        ctxid = input.get("context", "")
        blev = input.get("broadcast", 1)

        context = get_context(ctxid)

        PrintStyle(background_color="#6C3483", font_color="white", bold=True, padding=True).print(f"User message:")
        PrintStyle(font_color="white", padding=False).print(f"> {text}")
        context.log.log(type="user", heading="User message", content=text)

        if sync:
            context.communicate(text)
            if context.process:
                result = await context.process.result()
                response = {"ok": True, "message": result}
            else:
                response = {"ok": False, "message": "No process found in context"}
        else:
            context.communicate(text)
            response = {"ok": True, "message": "Message received."}

    except Exception as e:
        response = {"ok": False, "message": str(e)}

    return jsonify(response)

# Pausing/unpausing the agent
@app.route('/pause', methods=['POST'])
async def pause():
    try:
        input = await request.get_json()
        paused = input.get("paused", False)
        ctxid = input.get("context", "")

        context = get_context(ctxid)
        context.paused = paused

        response = {
            "ok": True,
            "message": "Agent paused." if paused else "Agent unpaused.",
            "pause": paused
        }
    except Exception as e:
        response = {"ok": False, "message": str(e)}

    return jsonify(response)

# Restarting with new agent0
@app.route('/reset', methods=['POST'])
async def reset():
    try:
        input = await request.get_json()
        ctxid = input.get("context", "")

        context = get_context(ctxid)
        context.reset()

        response = {"ok": True, "message": "Agent restarted."}
    except Exception as e:
        response = {"ok": False, "message": str(e)}

    return jsonify(response)

# Killing context
@app.route('/remove', methods=['POST'])
async def remove():
    try:
        input = await request.get_json()
        ctxid = input.get("context", "")

        AgentContext.remove(ctxid)

        response = {"ok": True, "message": "Context removed."}
    except Exception as e:
        response = {"ok": False, "message": str(e)}

    return jsonify(response)

# Web UI polling
@app.route('/poll', methods=['POST'])
async def poll():
    try:
        input = await request.get_json()
        ctxid = input.get("context", uuid.uuid4())
        from_no = input.get("log_from", 0)

        context = get_context(ctxid)
        logs = context.log.output(start=from_no)

        ctxs = [
            {
                "id": ctx.id,
                "no": ctx.no,
                "log_guid": ctx.log.guid,
                "log_version": len(ctx.log.updates),
                "log_length": len(ctx.log.logs),
                "paused": ctx.paused
            }
            for ctx in AgentContext._contexts.values()
        ]

        response = {
            "ok": True,
            "context": context.id,
            "contexts": ctxs,
            "logs": logs,
            "log_guid": context.log.guid,
            "log_version": len(context.log.updates),
            "paused": context.paused
        }

    except Exception as e:
        response = {"ok": False, "message": str(e)}

    return jsonify(response)

# Run the internal server and Next.js frontend
if __name__ == "__main__":
    load_dotenv()

    # Start Next.js frontend in development mode
    threading.Thread(target=start_nextjs_frontend, daemon=True).start()

    # Run the Quart API server with Uvicorn
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("FLASK_PORT", 5000)))
