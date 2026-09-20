const fs = require('fs');
const path = require('path');

const appPath = path.resolve('C:/Users/İBRAHİM/Desktop/isg-projesi - mobile/src/App.jsx');
let code = fs.readFileSync(appPath, 'utf8');

console.log('Current code length:', code.length);

// 1. Update adjustPageSizes in WebReportEditor
const oldWebAdjustPageSizes = `  const adjustPageSizes = (index, delta) => {
    const newSizes = [...pageSizes];
    const currentVal = newSizes[index];
    const newVal = currentVal + delta;

    if (newVal < 1) return;

    let sumBefore = 0;
    for (let i = 0; i < index; i++) {
      sumBefore += newSizes[i];
    }

    const totalItems = assessment?.risks?.length || 0;
    if (sumBefore + newVal > totalItems) return;

    newSizes[index] = newVal;

    let remaining = totalItems - (sumBefore + newVal);
    let nextIdx = index + 1;
    while (remaining > 0) {
      if (nextIdx < newSizes.length) {
        newSizes[nextIdx] = Math.min(remaining, itemsPerPage);
        remaining -= newSizes[nextIdx];
        nextIdx++;
      } else {
        const newPageSize = Math.min(remaining, itemsPerPage);
        newSizes.push(newPageSize);
        remaining -= newPageSize;
      }
    }
    newSizes.splice(nextIdx);
    updatePageSizes(newSizes);
    if (typeof onCustomPaginationTrigger === 'function') {
      onCustomPaginationTrigger(true);
    }
  };`;

const newWebAdjustPageSizes = `  const adjustPageSizes = (index, delta) => {
    const newSizes = [...pageSizes];
    const totalItems = assessment?.risks?.length || 0;
    if (totalItems === 0) return;

    if (delta === -1) {
      // Madde Eksiltme: Asla madde silinmez! Kalan madde sıradaki veya yeni açılan sayfaya aktarılır.
      if (newSizes[index] <= 1) return; // Sayfada en az 1 madde kalmalı!
      newSizes[index] -= 1;
      if (index + 1 < newSizes.length) {
        newSizes[index + 1] += 1;
      } else {
        // Son sayfadan eksiltildiyse yeni sayfa aç ve son maddeyi oraya aktar
        newSizes.push(1);
      }
    } else if (delta === 1) {
      // Madde Artırma: Sıradaki sayfadan 1 madde alıp bu sayfaya çeker
      if (index + 1 < newSizes.length) {
        newSizes[index] += 1;
        newSizes[index + 1] -= 1;
        if (newSizes[index + 1] <= 0) {
          newSizes.splice(index + 1, 1);
        }
      } else {
        return;
      }
    }

    const cleaned = newSizes.filter(s => s > 0);
    // Güvenlik Kilidi: Toplam madde sayısı daima tam korunur (hiçbir madde kaybolamaz!)
    const currentSum = cleaned.reduce((a, b) => a + b, 0);
    if (currentSum < totalItems) {
      cleaned[cleaned.length - 1] += (totalItems - currentSum);
    }

    updatePageSizes(cleaned);
    if (typeof onCustomPaginationTrigger === 'function') {
      onCustomPaginationTrigger(true);
    }
  };`;

if (!code.includes(oldWebAdjustPageSizes)) {
  console.error('Could not find oldWebAdjustPageSizes');
  process.exit(1);
}
code = code.replace(oldWebAdjustPageSizes, newWebAdjustPageSizes);
console.log('WebReportEditor adjustPageSizes successfully updated');

// 2. Update adjustPageSizes in SahaZiyaretEditor
const oldSahaAdjustPageSizes = `  const adjustPageSizes = (index, delta) => {
    const newSizes = [...pageSizes];
    const currentVal = newSizes[index];
    const newVal = currentVal + delta;

    if (newVal < 1) return;

    let sumBefore = 0;
    for (let i = 0; i < index; i++) {
      sumBefore += newSizes[i];
    }

    const totalItems = assessment?.risks?.length || 0;
    if (sumBefore + newVal > totalItems) return;

    newSizes[index] = newVal;

    let remaining = totalItems - (sumBefore + newVal);
    let nextIdx = index + 1;
    while (remaining > 0) {
      if (nextIdx < newSizes.length) {
        newSizes[nextIdx] = Math.min(remaining, limit);
        remaining -= newSizes[nextIdx];
        nextIdx++;
      } else {
        const newPageSize = Math.min(remaining, limit);
        newSizes.push(newPageSize);
        remaining -= newPageSize;
      }
    }
    newSizes.splice(nextIdx);
    updatePageSizes(newSizes);
    if (typeof onCustomPaginationTrigger === 'function') {
      onCustomPaginationTrigger(true);
    }
  };`;

const newSahaAdjustPageSizes = `  const adjustPageSizes = (index, delta) => {
    const newSizes = [...pageSizes];
    const totalItems = assessment?.risks?.length || 0;
    if (totalItems === 0) return;

    if (delta === -1) {
      if (newSizes[index] <= 1) return;
      newSizes[index] -= 1;
      if (index + 1 < newSizes.length) {
        newSizes[index + 1] += 1;
      } else {
        newSizes.push(1);
      }
    } else if (delta === 1) {
      if (index + 1 < newSizes.length) {
        newSizes[index] += 1;
        newSizes[index + 1] -= 1;
        if (newSizes[index + 1] <= 0) {
          newSizes.splice(index + 1, 1);
        }
      } else {
        return;
      }
    }

    const cleaned = newSizes.filter(s => s > 0);
    const currentSum = cleaned.reduce((a, b) => a + b, 0);
    if (currentSum < totalItems) {
      cleaned[cleaned.length - 1] += (totalItems - currentSum);
    }

    updatePageSizes(cleaned);
    if (typeof onCustomPaginationTrigger === 'function') {
      onCustomPaginationTrigger(true);
    }
  };`;

if (code.includes(oldSahaAdjustPageSizes)) {
  code = code.replace(oldSahaAdjustPageSizes, newSahaAdjustPageSizes);
  console.log('SahaZiyaretEditor adjustPageSizes successfully updated');
}

fs.writeFileSync(appPath, code, 'utf8');
console.log('Successfully wrote updated App.jsx! New length:', code.length);
