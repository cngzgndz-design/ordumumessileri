const forge = require('node-forge');
const fs = require('fs');

try {
    // 1. Private key metin olarak okunuyor
    const privateKeyPem = fs.readFileSync('private.key', 'utf8');
    const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);

    // 2. .cer dosyası binary (DER) olarak okunuyor ve certificate objesine çevriliyor
    const cerBuffer = fs.readFileSync('ios_distribution.cer');
    const certificate = forge.pki.certificateFromAsn1(forge.asn1.fromDer(cerBuffer.toString('binary')));

    // 3. PKCS#12 (p12) paketi oluşturuluyor (Şifre: 123456)
    const pAsn1 = forge.pkcs12.toPkcs12Asn1(
        privateKey, [certificate], '123456', { algorithm: '3des' }
    );
    const p12Der = forge.asn1.toDer(pAsn1).getBytes();

    // 4. Kaydediliyor
    fs.writeFileSync('distribution.p12', Buffer.from(p12Der, 'binary'));
    console.log("BAŞARILI: distribution.p12 dosyası oluşturuldu!");
} catch (error) {
    console.error("Hata oluştu:", error);
}