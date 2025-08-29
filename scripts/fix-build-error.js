const { execSync } = require("child_process")
const fs = require("fs")
const path = require("path")

console.log("🔧 Fixing Next.js build error...")

try {
  // Clear .next directory
  console.log("Clearing .next cache...")
  if (fs.existsSync(".next")) {
    fs.rmSync(".next", { recursive: true, force: true })
  }

  // Clear node_modules cache
  console.log("Clearing node_modules cache...")
  const cacheDir = path.join("node_modules", ".cache")
  if (fs.existsSync(cacheDir)) {
    fs.rmSync(cacheDir, { recursive: true, force: true })
  }

  // Check if pnpm or npm
  let packageManager = "npm"
  if (fs.existsSync("pnpm-lock.yaml")) {
    packageManager = "pnpm"
  }

  // Clear package manager cache
  console.log("Clearing package manager cache...")
  if (packageManager === "pnpm") {
    execSync("pnpm store prune", { stdio: "inherit" })
  } else {
    execSync("npm cache clean --force", { stdio: "inherit" })
  }

  // Reinstall dependencies
  console.log("Reinstalling dependencies...")
  execSync(`${packageManager} install`, { stdio: "inherit" })

  // Try build again
  console.log("Attempting build...")
  execSync(`${packageManager} run build`, { stdio: "inherit" })

  console.log("✅ Build completed successfully!")
} catch (error) {
  console.error("❌ Build failed:", error.message)
  console.log("\n🔍 Additional troubleshooting steps:")
  console.log("1. Try restarting your terminal/IDE")
  console.log("2. Check available disk space")
  console.log("3. Try building with --no-cache flag")
  console.log("4. Consider updating Node.js version")
  process.exit(1)
}
