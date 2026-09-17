const fs = require('fs');
const path = require('path');

const targetFile = 'C:/Users/İBRAHİM/Desktop/isg-projesi - Copy/src/components/modals/InitialLegalConsentModal.jsx';
if (!fs.existsSync(targetFile)) {
  console.error("Target file does not exist:", targetFile);
  process.exit(1);
}

let content = fs.readFileSync(targetFile, 'utf8');

// Replace handleConfirmAndProceed and sendContractsDispatch to be non-blocking
const targetSection = `  const handleConfirmAndProceed = async () => {
    if (!agreeTerms || !agreeKvkk || !signature) {
      alert('Lütfen tüm yasal şartları onaylayıp dijital imzanızı atınız.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Arka planda sözleşme e-postasını tetikle (hem kullanıcıya hem admin'e)
      await sendContractsDispatch(signature);
    } catch (e) {
      console.warn('E-posta gönderim adımı devam ediyor:', e);
    }

    // Kullanıcının imza ve onayını tamamla
    onComplete(signature);
    setIsSubmitting(false);
  };`;

const newSection = `  const handleConfirmAndProceed = async () => {
    if (!agreeTerms || !agreeKvkk || !signature) {
      alert('Lütfen tüm yasal şartları onaylayıp dijital imzanızı atınız.');
      return;
    }

    setIsSubmitting(true);

    if (currentUser?.username) {
      try {
        localStorage.setItem(\`isg_user_signature_\${currentUser.username}\`, signature);
        localStorage.setItem(\`isg_legal_accepted_\${currentUser.username}\`, 'true');
      } catch {}
    }

    // Kullanıcının imza ve onayını hemen tamamla - Kullanıcı kilitli bekletilmez!
    onComplete(signature);

    // Arka planda sözleşme e-postasını asenkron tetikle (fire-and-forget)
    sendContractsDispatch(signature).catch(e => {
      console.warn('Sözleşme e-postası arka plan iletim uyarısı:', e);
    }).finally(() => {
      setIsSubmitting(false);
    });
  };`;

if (content.includes(targetSection)) {
  content = content.replace(targetSection, newSection);
  console.log("Updated handleConfirmAndProceed in InitialLegalConsentModal.jsx.");
} else {
  console.warn("Could not find exact handleConfirmAndProceed target, checking regex...");
  content = content.replace(
    /const handleConfirmAndProceed = async \(\) => \{[\s\S]*?onComplete\(signature\);\s*setIsSubmitting\(false\);\s*\};/,
    newSection
  );
}

// Also add timeout signal in sendContractsDispatch
const oldFetch = `          const res = await fetch(endpoint, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({
              email: customerEmail,
              name: customerName,
              phone: currentUser?.phone || '',
              orderId,
              purchaseDate: new Date().toLocaleString('tr-TR'),
              userSignature: sigData,
              customerSignature: sigData
            })
          });`;

const newFetch = `          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 12000);
          const res = await fetch(endpoint, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({
              email: customerEmail,
              name: customerName,
              phone: currentUser?.phone || '',
              orderId,
              purchaseDate: new Date().toLocaleString('tr-TR'),
              userSignature: sigData,
              customerSignature: sigData
            }),
            signal: controller.signal
          });
          clearTimeout(timeoutId);`;

if (content.includes(oldFetch)) {
  content = content.replace(oldFetch, newFetch);
  console.log("Added AbortController timeout to sendContractsDispatch.");
}

fs.writeFileSync(targetFile, content, 'utf8');
console.log("Successfully patched InitialLegalConsentModal.jsx!");
