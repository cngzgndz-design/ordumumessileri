const { execSync } = require('child_process');
const fs = require('fs');

// OpenSSL'in Windows üzerinde genellikle bulunduğu yollar
const opensslPaths = [
    'openssl',
    'C:\\Program Files\\OpenSSL-Win64\\bin\\openssl.exe',
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
    console.error("OpenSSL bulunamadı! Lütfen Git Bash OpenSSL yolunu kontrol edin.");
    process.exit(1);
}

const password = 'CG1979cg'; // Buraya kendi belirleyeceğin şifreyi yazabilirsin
const command = `"${opensslCmd}" pkcs12 -export -inkey private.key -in ios_distribution.cer -out yeni_distribution.p12 -passout pass:${password}`;

try {
    execSync(command, { stdio: 'inherit' });
    console.log("\nBAŞARILI! yeni_distribution.p12 dosyası oluşturuldu.");
} catch (error) {
    console.error("Hata oluştu:", error.message);
}