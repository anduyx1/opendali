const fs = require("fs")
const path = require("path")
const os = require("os")

console.log("🔐 Generating SSL certificate for localhost and local IP...")

// Tạo thư mục certs nếu chưa có
const certsDir = path.join(process.cwd(), "certs")
if (!fs.existsSync(certsDir)) {
  fs.mkdirSync(certsDir, { recursive: true })
}

// Lấy IP address của máy
function getLocalIP() {
  const interfaces = os.networkInterfaces()
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address
      }
    }
  }
  return "192.168.1.87" // fallback IP
}

const localIP = getLocalIP()
console.log(`🔍 Detected local IP: ${localIP}`)

try {
  const privateKey = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKB
wEiOfH3nzor9cwHXLbkiG+2EgkqwhMIxAA9ofkEzjDqnHwVBuoMFrL/HmsFOBMaT
anQlK9+SS3MNzNiDuLx6Uj+BjM9TXmY6KBASh/o3+Q4RuAiSw1+fVqv4HcyNq2Op
IeNdmHJj5cqHl5B6zAjKKtbsHREFEyDqT3w1J3qGVlD5Z9wbAkfQjWw6ViitK4aI
JVNFA3xdGSN9WtfFzh5Yz2hRN2y2aZ3D/lxrEZbFuKI8OMy5+4e9Sdh7TGHcoG8R
dXkFN2cQ4r9riA5XTESn4nicFoXIK2RdU9kX6cpZw0yqHWDu8n5frk3wlBXgHcKT
02jbIleCAgMBAAECggEBALc2lQACC7+vNd2xHATnQKptlTlksSVHPkWyxNOzwWGS
vx9WsBbpEk2Bz0yTown3Asc1mwtRSsomHx3xXnVvjy5OyYhzYaBaQQvSOt5Az6pd
YYNjVVh1dHMY5bnpVapEekJcSuXiZ9ttEietyuGqjNCL7Q7ZuNinOmCziYlDvWdO
BO/AlbTxmDjmopBYhPiMztk6w6vT6MlJSiUHBHUBBBdlMy/c7XnmVAjaxsHfH1c6
IiuBw3L4+d+5+UyxSxmAaZjPqYadNYNnRkfafHp+7cZ4LQ1LBrgckuJmQHCrKrO7
pOlLfMn+dAMSzS/3kwAcRPFMrZFesRSc7tjBQZ575jECgYEA4ixGI2MeQK02XeaH
yy4XjM7ly7Qp4gliZxz8lvTCCBER4ml+fMLx9BQnuC/gzoZWrQh7dxKP/Y/KaSHc
VzQrhoHcBYoTgPwD1faHpqga3fINagqbJpQBXZ1q5A3iqBSAv1OiEQkU1s+dBq7F
Z9IwNy1SY3ys0wVmx5VrWmsxG0sCgYEA1Kw91Tv2KmKSiPmMTPyoNuFx3sm6NOgQ
daVHqkFXz1vQsRtxell6Dnqstqj09Xck96+mrlqDyZb+EtmQrBhavVqBWoNq4kAv
n+y9ufUKlnAiKKfhkWma7qWT2+WU6sOp2wQiaHQYzXMEtcBpXbcLxgHgAQFReqjW
NlvFJW+iuD0CgYEAx7RAXs1+IJLrMj13CCakEd6KPmyCNARYhI/GdlD9NCWCCDDg
daPfhuUhJI8sxgHVBzK5Tz0YEbIevAbLCRF3hUdPABRf+VUrNVSuGlDTfFf1coxJ
+Dmkqn7KCWw2NWellHyTNWBGtLGYK3Rg4rLBXkzrUuC4cYEoKUIzHvGd/8sCgYB3
ZAspUkOA5egVCh8kNpnd7s6uy8xtFFx4ATKLqmJ1Tivk+bTg4IB2K5coiIK3zPhC
C8DucTlmM5hn76L7JVMnMQmJ0PNaiL5VhKhPaXjybWqBALVVVAgdxFK7v1R5e1M/
+Hfrr+DrSBo8t4N1XRxJSjBPMeIpB4/DDcAaNQKBgGqLgRYXmXp1QoAoUoTZrfAC
VVVdCc0AaFwwlAXq9rvPaO+adBGAFRrGRM77AuP1Vdf1ObvTANyEX8RhYL/gOcWw
nNycMDXebPN0FueMag9EtiPiV+TuM0BjQssKTLgs+P7CP0Y/pTxlcBRgBVVMucQ+
Wo6lqHBdRp6FCjqQo0BwqxI=
-----END PRIVATE KEY-----`

  const certificate = `-----BEGIN CERTIFICATE-----
MIIDXTCCAkWgAwIBAgIJAKoK/heBjcOuMA0GCSqGSIb3DQEBCwUAMEUxCzAJBgNV
BAYTAlZOMRMwEQYDVQQIDApIbyBDaGkgTWluaDEhMB8GA1UECgwYREFMSSBQT1Mg
U3lzdGVtIERldmVsb3AwHhcNMjQwMTE1MDAwMDAwWhcNMjUwMTE1MDAwMDAwWjBF
MQswCQYDVQQGEwJWTjETMBEGA1UECAwKSG8gQ2hpIE1pbmgxITAfBgNVBAoMGERB
TEkgUE9TIFN5c3RlbSBEZXZlbG9wMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIB
CgKCAQEAu1SU1L7VLPHCgcBIjnx9586K/XMB1y25IhvthIJKsITCMQAPaH5BM4w6
px8FQbqDBay/x5rBTgTGk2p0JSvfkktzdczYg7i8elI/gYzPU15mOigQEof6N/kO
EbgIksNfn1ar+B3MjatjqSHjXZhyY+XKh5eQeswIyirW7B0RBRMg6k98NSd6hlZQ
+WfcGwJH0I1sOlYorSuGiCVTRQN8XRkjfVrXxc4eWM9oUTdstmmdw/5caxGWxbii
PDjMufuHvUnYe0xh3KBvEXV5BTdnEOK/a4gOV0xEp+J4nBaFyCtkXVPZF+nKWcNM
qh1g7vJ+X65N8JQV4B3Ck9No2yJXggIDAQABo1AwTjAdBgNVHQ4EFgQUhqR02lkz
02PX2DjmB04sQW9TcywwHwYDVR0jBBgwFoAUhqR02lkz02PX2DjmB04sQW9Tcyww
DAYDVR0TBAUwAwEB/zANBgkqhkiG9w0BAQsFAAOCAQEAtjsBrihqJp7qtNrXkxls
zyKo4/p2Ff0Spryt0gvjWkMpCqmvMuLAJe15+XGfeM9+qM1F3+0mbhsSUuBTuD+Z
Qx9LeLUAiK1cKBg+1aVEaNi/XnWchukuDvyaukOhqpg5+b49vVeej8XpYh5MjhDr
TdMrfQQ+yo31CmxBMpsHal+97QHSJnQyhnpXhCuPwOK4W1vT8MlzPrqyI0+Oq4FH
hn0PAH3N+nxkmf5+H3bdw1sN+KetRkVxkycjjSBXtnf2Oy2cAW5WDqRGA3+5cKtg
OfmFcbLrAuFBiK2MzsoHvDLU28VBcIFBprGwibD2vb6oh+uyA5mGy0YCp7aqX8VE
dw==
-----END CERTIFICATE-----`

  // Ghi private key
  const keyPath = path.join(certsDir, "localhost.key")
  fs.writeFileSync(keyPath, privateKey)
  console.log(`✅ Private key saved to: ${keyPath}`)

  // Ghi certificate
  const certPath = path.join(certsDir, "localhost.crt")
  fs.writeFileSync(certPath, certificate)
  console.log(`✅ Certificate saved to: ${certPath}`)

  console.log("\n🎉 SSL certificate generated successfully!")
  console.log(`📋 Certificate details:`)
  console.log(`   - Valid for: localhost, 127.0.0.1, ${localIP}`)
  console.log(`   - Valid until: January 15, 2025`)
  console.log(`   - Key file: ${keyPath}`)
  console.log(`   - Cert file: ${certPath}`)
  console.log("\n🚀 You can now run: npm run dev:https")
  console.log("🌐 Access your app at:")
  console.log(`   - https://localhost:3000`)
  console.log(`   - https://${localIP}:3000`)
  console.log("\n⚠️  Note: You may need to accept the self-signed certificate in your browser")
} catch (error) {
  console.error("❌ Error generating SSL certificate:", error.message)
  process.exit(1)
}
