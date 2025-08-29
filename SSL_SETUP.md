# HTTPS/SSL Setup Guide

## Hướng dẫn thiết lập HTTPS cho Development

### 1. Tạo SSL Certificate
 thêm vào package.json
 \\  "generate-ssl": "node scripts/generate-ssl.js",
  \\ "install-ssl-deps": "echo \"Please add the command to install SSL dependencies here.\""\\
\\  chạy thêm 'npm install cross-env --save-dev'\\

\`\`\`bash
npm run generate-ssl
\`\`\`

Script này sẽ:
- Tự động phát hiện IP address của máy
- Tạo self-signed SSL certificate
- Hỗ trợ cả localhost và IP máy local

### 2. Khởi động HTTPS Server

\`\`\`bash
npm run dev:https
\`\`\`

### 3. Truy cập ứng dụng

- **Local**: https://localhost:3000
- **Network**: https://[IP-máy]:3000

### 4. Trust Certificate trong Browser

#### Chrome:
1. Khi thấy warning "Your connection is not private"
2. Click "Advanced"
3. Click "Proceed to localhost (unsafe)"

#### Firefox:
1. Khi thấy warning "Warning: Potential Security Risk Ahead"
2. Click "Advanced"
3. Click "Accept the Risk and Continue"

#### Safari:
1. Click "Show Details"
2. Click "visit this website"
3. Click "Visit Website"

### 5. Cài đặt Certificate vào System (Tùy chọn)

#### Windows:
1. Double-click file `certs/localhost.crt`
2. Click "Install Certificate"
3. Choose "Local Machine"
4. Select "Place all certificates in the following store"
5. Browse và chọn "Trusted Root Certification Authorities"

#### macOS:
\`\`\`bash
sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain certs/localhost.crt
\`\`\`

#### Linux:
\`\`\`bash
sudo cp certs/localhost.crt /usr/local/share/ca-certificates/
sudo update-ca-certificates
\`\`\`

### 6. Troubleshooting

#### Lỗi "OpenSSL not found":
- **Windows**: Download từ https://slproweb.com/products/Win32OpenSSL.html
- **macOS**: `brew install openssl`
- **Linux**: `sudo apt-get install openssl`

#### Lỗi "EADDRINUSE":
- Port 3000 đang được sử dụng
- Thay đổi port: `PORT=3001 npm run dev:https`

#### Certificate không được trust:
- Xóa thư mục `certs` và chạy lại `npm run generate-ssl`
- Restart browser sau khi trust certificate

### 7. Production Deployment

Đối với production, sử dụng certificate từ Let's Encrypt hoặc CA authority thay vì self-signed certificate.

### 8. Files được tạo

\`\`\`
certs/
├── localhost.key  # Private key
└── localhost.crt  # SSL certificate
\`\`\`

**Lưu ý**: Không commit thư mục `certs/` vào git. Thêm vào `.gitignore`:
\`\`\`
certs/
