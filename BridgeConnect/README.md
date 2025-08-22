# Azure Function App: Node.js Hello World

This is the simplest possible Azure Function App using Node.js. It contains a single HTTP-triggered function that returns "Hello, World!".

## Structure
- `host.json`: Azure Functions host configuration
- `function.json`: Function binding configuration
- `index.js`: Function code
- `package.json`: Node.js project file

## Running Locally
1. Install [Azure Functions Core Tools](https://docs.microsoft.com/azure/azure-functions/functions-run-local) if not already installed.
2. Open a terminal in the `BridgeConnect` directory.
3. Run `npm install` (if you add dependencies).
4. Start the function app:
   ```
   func start
   ```
5. Call the endpoint (default: http://localhost:7071/api/ActivateDBSweep)

## Output
Returns:
```
Hello, World!
```
