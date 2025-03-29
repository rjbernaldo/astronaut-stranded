/**
 * Script to check if a Next.js development server is already running on port 3000
 * If a server is detected, exits the process with a message
 */

const { execSync } = require("child_process");
const net = require("net");

const PORT = 3000;

// Function to check if port is in use
function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once("error", (err) => {
      if (err.code === "EADDRINUSE") {
        // Port is in use
        resolve(true);
      } else {
        // Other error
        resolve(false);
      }
    });

    server.once("listening", () => {
      // Port is free, close the server
      server.close();
      resolve(false);
    });

    server.listen(port);
  });
}

// Main function
async function main() {
  try {
    const inUse = await isPortInUse(PORT);

    if (inUse) {
      console.log(
        `\x1b[33m⚠️  Port ${PORT} is already in use. A development server is likely running.\x1b[0m`
      );
      console.log(
        `\x1b[33m   To start a new server, stop the existing one first.\x1b[0m`
      );

      // Try to find the process using the port
      try {
        let command;
        let processInfo;

        if (process.platform === "win32") {
          // Windows
          command = `netstat -ano | findstr :${PORT}`;
          processInfo = execSync(command).toString().trim();
        } else {
          // macOS / Linux
          command = `lsof -i :${PORT} | grep LISTEN`;
          processInfo = execSync(command).toString().trim();
        }

        if (processInfo) {
          console.log(`\x1b[33m   Process info: ${processInfo}\x1b[0m`);
        }
      } catch (error) {
        // Couldn't get process info, just continue
      }

      // Exit with non-zero code to prevent the chain command (&&) from executing
      process.exit(1);
    } else {
      console.log(
        `\x1b[32m✓ Port ${PORT} is available. Starting development server...\x1b[0m`
      );
      // Exit with success code to allow the next command to run
      process.exit(0);
    }
  } catch (error) {
    console.error("Error checking port:", error);
    // Don't block the server from starting if there's an error in our check
    process.exit(0);
  }
}

main();
