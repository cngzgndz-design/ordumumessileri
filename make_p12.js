const { execSync } = require('child_process');
const fs = require('fs');

// Önce resmi OpenSSL-Win64 yolunu kontrol edelim
const opensslPaths = [
    'C:\\Program Files\\OpenSSL-Win64\\bin\\openssl.exe',
    'openssl',
    'C:\\Program Files\\Git\\usr\\bin\\openssl.exe'
];

let opensslCmd = null;
for (const p of opensslPaths) {
    try {
        execSync(`"${p}" version`, { stdio: 'ignore' });
        opensslCmd = p;
        break;
    } catch (e) {}
}

if (!opensslCmd) {
    console.error("OpenSSL bulunamadı! Lütfen OpenSSL-Win64 yüklü olduğundan emin olun.");
    process.exit(1);
}

const password = 'deneme79'; 
// OpenSSL 3 uyumlu ve hatasız komut satırı
const command = `"${opensslCmd}" pkcs12 -export -inkey private.key -in ios_distribution.cer -out yeni_distribution.p12 -passout pass:${password}`;

try {
    execSync(command, { stdio: 'inherit' });
    console.log("\nBAŞARILI! yeni_distribution.p12 dosyası oluşturuldu.");
} catch (error) {
    console.error("Hata oluştu:", error.message);
}