const fs = require("fs")
const path = require("path")
const { execSync } = require("child_process")

console.log("🔧 Fixing webpack build error...")

try {
  // Clear .next directory
  const nextDir = path.join(process.cwd(), ".next")
  if (fs.existsSync(nextDir)) {
    console.log("Clearing .next cache...")
    fs.rmSync(nextDir, { recursive: true, force: true })
  }

  // Clear node_modules cache
  const cacheDir = path.join(process.cwd(), "node_modules", ".cache")
  if (fs.existsSync(cacheDir)) {
    console.log("Clearing node_modules cache...")
    fs.rmSync(cacheDir, { recursive: true, force: true })
  }

  // Clear turbo cache
  const turboDir = path.join(process.cwd(), ".turbo")
  if (fs.existsSync(turboDir)) {
    console.log("Clearing Turbo cache...")
    fs.rmSync(turboDir, { recursive: true, force: true })
  }

  // Check if pnpm or npm is available
  let packageManager = "npm"
  try {
    execSync("pnpm --version", { stdio: "ignore" })
    packageManager = "pnpm"
  } catch (e) {
    // Use npm as fallback
  }

  console.log(`Using ${packageManager} as package manager...`)

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

  // Try build
  console.log("Attempting build...")
  execSync(`${packageManager} run build`, { stdio: "inherit" })

  console.log("✅ Build completed successfully!")
} catch (error) {
  console.error("❌ Build fix failed:", error.message)
  console.log("\n💡 Manual steps to try:")
  console.log("1. Delete .next folder manually")
  console.log("2. Delete node_modules folder")
  console.log("3. Run: npm install (or pnpm install)")
  console.log("4. Run: npm run build (or pnpm run build)")
  process.exit(1)
}
