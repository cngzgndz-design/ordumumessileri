const { execSync } = require('child_process');
const fs = require('fs');

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
    console.error("OpenSSL bulunamadı! Lütfen OpenSSL yolunu kontrol edin.");
    process.exit(1);
}

const password = 'deneme79'; 
// macOS ile tam uyumlu klasik şifreleme algoritmaları
const command = `"${opensslCmd}" pkcs12 -export -inkey private.key -in ios_distribution.cer -out yeni_distribution.p12 -passout pass:${password} -keypbe PBE-SHA1-3DES -certpbe PBE-SHA1-3DES -macalg sha1`;

try {
    execSync(command, { stdio: 'inherit' });
    console.log("\nBAŞARILI! yeni_distribution.p12 dosyası macOS uyumlu olarak oluşturuldu.");
} catch (error) {
    console.error("Hata oluştu:", error.message);
}