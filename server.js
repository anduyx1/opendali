const { createServer } = require("https")
const { parse } = require("url")
const next = require("next")
const fs = require("fs")
const path = require("path")

const dev = process.env.NODE_ENV !== "production"
const hostname = process.env.HOSTNAME || "0.0.0.0"
const port = Number.parseInt(process.env.PORT || "3000", 10)

// Khởi tạo Next.js app
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

// Đường dẫn đến SSL certificates
const httpsOptions = {
  key: fs.readFileSync(path.join(process.cwd(), "certs", "localhost.key")),
  cert: fs.readFileSync(path.join(process.cwd(), "certs", "localhost.crt")),
}

app.prepare().then(() => {
  createServer(httpsOptions, async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error("Error occurred handling", req.url, err)
      res.statusCode = 500
      res.end("internal server error")
    }
  })
    .once("error", (err) => {
      console.error(err)
      process.exit(1)
    })
    .listen(port, hostname, () => {
      console.log(`🚀 HTTPS Server ready on https://${hostname}:${port}`)
      console.log(`🌐 Local access: https://localhost:${port}`)

      // Hiển thị IP addresses có thể truy cập
      const os = require("os")
      const interfaces = os.networkInterfaces()
      console.log("📱 Network access:")

      Object.keys(interfaces).forEach((name) => {
        interfaces[name].forEach((iface) => {
          if (iface.family === "IPv4" && !iface.internal) {
            console.log(`   - https://${iface.address}:${port}`)
          }
        })
      })
    })
})
