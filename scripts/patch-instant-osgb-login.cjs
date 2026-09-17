const fs = require('fs');
const path = require('path');

// Target file candidates
const candidates = [
  'C:/Users/İBRAHİM/Desktop/isg-projesi - mobile/src/App.jsx',
  'C:/Users/İBRAHİM/Desktop/isg-projesi - Copy/src/App.jsx'
];

let targetPath = candidates.find(p => fs.existsSync(p));
if (!targetPath) {
  console.error('Target App.jsx not found!');
  process.exit(1);
}

console.log('>>> Target resolved to:', targetPath);
let content = fs.readFileSync(targetPath, 'utf8');

// =========================================================================
// 1. PATCH: Initial activeView state for OSGB manager session
// =========================================================================
console.log('1. Patching initial activeView state...');
const oldActiveViewState = `  const [activeView, setActiveView] = useState('main'); // 'main', 'checkout', 'admin'`;
const newActiveViewState = `  const [activeView, setActiveView] = useState(() => {
    try {
      const rawUser = localStorage.getItem('isg_landing_current_user_v1') ||
                      localStorage.getItem('isg_current_user') ||
                      localStorage.getItem('isg_active_user') ||
                      localStorage.getItem('currentUser') ||
                      localStorage.getItem('user');
      if (rawUser) {
        const parsed = JSON.parse(rawUser);
        const decUser = (typeof decryptUser === 'function') ? decryptUser(parsed) : parsed;
        const isMgr = Boolean(
          decUser?.isOsgbManager === true ||
          decUser?.isOsgbManager === 'true' ||
          decUser?.role === 'osgb_manager' ||
          decUser?.isManager === true ||
          (decUser?.managedOsgbName && String(decUser.managedOsgbName).trim() !== '')
        );
        if (isMgr) return 'osgbpanel';
        if (decUser?.username === 'admin') return 'admin';
      }
    } catch (_) {}
    return 'main';
  });`;

if (content.includes(oldActiveViewState)) {
  content = content.replace(oldActiveViewState, newActiveViewState);
  console.log('✔ Initial activeView state patched');
} else {
  console.log('Note: Initial activeView state already customized or not matching exact pattern.');
}

// =========================================================================
// 2. PATCH: Firestore users onSnapshot to run even before login
// =========================================================================
console.log('2. Patching Firestore users onSnapshot listener...');
const oldSnapshotPattern = /useEffect\(\(\)\s*=>\s*\{\s*if\s*\(!db\s*\|\|\s*!currentUser\)\s*return;\s*const\s+unsubscribe\s*=\s*onSnapshot\(collection\(db,\s*['"]users['"]\),\s*\(snap\)\s*=>\s*\{/;

const newSnapshotStart = `useEffect(() => {
    if (!db) return;
    const unsubscribe = onSnapshot(collection(db, 'users'), (snap) => {`;

if (oldSnapshotPattern.test(content)) {
  content = content.replace(oldSnapshotPattern, newSnapshotStart);
  console.log('✔ Removed !currentUser check from users onSnapshot listener');
} else {
  console.log('Note: users onSnapshot check pattern not found or already modified');
}

// =========================================================================
// 3. PATCH: handleLogin - Instant Firestore read & Instant OSGB Manager Activation
// =========================================================================
console.log('3. Patching handleLogin...');

// Let's replace the foundUser matching and DB fallback in handleLogin
const oldLoginSearchBlock = `    let foundUser = users.find(u => {
      if (cleanUsername(u.username) !== normalizedUsername) return false;
      const decPass = decryptData(u.password);
      return (u.password === password || decPass === password || (hashedPassword && (u.password === hashedPassword || decPass === hashedPassword)));
    });
    if (!foundUser && db) {`;

const newLoginSearchBlock = `    let foundUser = users.find(u => {
      if (cleanUsername(u.username) !== normalizedUsername) return false;
      const decPass = decryptData(u.password);
      return (u.password === password || decPass === password || (hashedPassword && (u.password === hashedPassword || decPass === hashedPassword)));
    });

    // Her girişte Firestore veritabanından en güncel yetki ve yöneticilik durumunu anlık oku
    if (db) {
      try {
        let cloudDocSnap = null;
        try {
          const directSnap = await getDoc(doc(db, 'users', normalizedUsername));
          if (directSnap && directSnap.exists()) {
            cloudDocSnap = directSnap;
          }
        } catch (_) {}

        if (!cloudDocSnap) {
          const uQuery = query(collection(db, 'users'), where('username', '==', normalizedUsername));
          const uSnap = await getDocs(uQuery);
          if (!uSnap.empty) {
            cloudDocSnap = uSnap.docs[0];
          }
        }

        if (cloudDocSnap) {
          const cloudRaw = decryptUser({ id: cloudDocSnap.id, ...cloudDocSnap.data() });
          const cloudPass = cloudRaw.password;
          const isPasswordValid = (
            cloudRaw.password === password ||
            cloudPass === password ||
            (hashedPassword && (cloudRaw.password === hashedPassword || cloudPass === hashedPassword)) ||
            (foundUser && (foundUser.password === password || decryptData(foundUser.password) === password))
          );

          if (isPasswordValid) {
            const isManager = Boolean(
              cloudRaw.isOsgbManager === true ||
              cloudRaw.isOsgbManager === 'true' ||
              cloudRaw.role === 'osgb_manager' ||
              cloudRaw.isManager === true ||
              (cloudRaw.managedOsgbName && String(cloudRaw.managedOsgbName).trim() !== '') ||
              (foundUser && (foundUser.isOsgbManager || foundUser.role === 'osgb_manager'))
            );

            foundUser = {
              ...(foundUser || {}),
              ...cloudRaw,
              isOsgbManager: isManager,
              managedOsgbName: cloudRaw.managedOsgbName || (foundUser && foundUser.managedOsgbName) || '',
              role: (cloudRaw.role === 'admin' || (foundUser && foundUser.role === 'admin'))
                ? 'admin'
                : (isManager ? 'osgb_manager' : (cloudRaw.role || (foundUser && foundUser.role) || 'uzman'))
            };

            const updatedList = [...users.filter(u => cleanUsername(u.username) !== normalizedUsername), foundUser];
            setUsers(updatedList);
            try {
              localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedList.map(u => encryptUser(u))));
            } catch (_) {}
          }
        }
      } catch (dbErr) {
        console.warn('Login Firestore fetch note:', dbErr);
      }
    }

    if (!foundUser && db) {`;

if (content.includes(oldLoginSearchBlock)) {
  content = content.replace(oldLoginSearchBlock, newLoginSearchBlock);
  console.log('✔ Upgraded handleLogin with instant Firestore fetch on every login');
} else {
  console.log('Note: oldLoginSearchBlock not matched directly, checking if already patched');
}

// 4. Update the redirection logic after foundUser is verified
const oldRedirectBlock = `      if (foundUser.isOsgbManager) {
        setActiveView('osgbpanel');
      } else if (foundUser.username === 'admin') {`;

const newRedirectBlock = `      const isOsgbManagerAccount = Boolean(
        foundUser.isOsgbManager === true ||
        foundUser.isOsgbManager === 'true' ||
        foundUser.role === 'osgb_manager' ||
        foundUser.isManager === true ||
        (foundUser.managedOsgbName && String(foundUser.managedOsgbName).trim() !== '')
      );

      if (isOsgbManagerAccount) {
        foundUser.isOsgbManager = true;
        if (foundUser.role !== 'admin') foundUser.role = 'osgb_manager';
        setCurrentUser(foundUser);
        try {
          localStorage.setItem('currentUser', JSON.stringify(encryptUser(foundUser)));
          localStorage.setItem('user', JSON.stringify(encryptUser(foundUser)));
          localStorage.setItem('isg_active_user', JSON.stringify(foundUser));
        } catch (e) {}
        setActiveView('osgbpanel');
      } else if (foundUser.username === 'admin') {`;

if (content.includes(oldRedirectBlock)) {
  content = content.replace(oldRedirectBlock, newRedirectBlock);
  console.log('✔ Upgraded login redirection to activate OSGB panel instantly for OSGB managers');
} else {
  console.log('Note: oldRedirectBlock not matched directly');
}

// 5. Ensure View Router accepts all OSGB manager variants
const oldViewRouterCheck = `if ((isOsgbManager || currentUser?.isOsgbManager) && activeView === 'osgbpanel') {`;
const newViewRouterCheck = `if ((isOsgbManager || currentUser?.isOsgbManager || currentUser?.role === 'osgb_manager' || (currentUser?.managedOsgbName && String(currentUser.managedOsgbName).trim() !== '')) && activeView === 'osgbpanel') {`;

if (content.includes(oldViewRouterCheck)) {
  content = content.replace(oldViewRouterCheck, newViewRouterCheck);
  console.log('✔ Upgraded View Router check for OSGB Panel');
}

// 6. Ensure Dashboard OSGB panel button is ALWAYS visible for OSGB managers
const oldDashboardBtnCheck = `{(isOsgbManager || currentUser?.isOsgbManager) && onOsgbPanelClick && (`;
const newDashboardBtnCheck = `{(isOsgbManager || currentUser?.isOsgbManager || currentUser?.role === 'osgb_manager' || (currentUser?.managedOsgbName && String(currentUser.managedOsgbName).trim() !== '')) && onOsgbPanelClick && (`;

if (content.includes(oldDashboardBtnCheck)) {
  content = content.replace(oldDashboardBtnCheck, newDashboardBtnCheck);
  console.log('✔ Upgraded Dashboard OSGB Panel button condition');
}

// 7. Ensure Drawer OSGB panel button is ALWAYS visible for OSGB managers
const oldDrawerBtnCheck = `{isOsgbManager && (
                <button
                  onClick={() => {
                    setActiveView('osgbpanel');`;

const newDrawerBtnCheck = `{(isOsgbManager || currentUser?.isOsgbManager || currentUser?.role === 'osgb_manager' || (currentUser?.managedOsgbName && String(currentUser.managedOsgbName).trim() !== '')) && (
                <button
                  onClick={() => {
                    setActiveView('osgbpanel');`;

if (content.includes(oldDrawerBtnCheck)) {
  content = content.replace(oldDrawerBtnCheck, newDrawerBtnCheck);
  console.log('✔ Upgraded Drawer OSGB Panel button condition');
}

// Write back
fs.writeFileSync(targetPath, content, 'utf8');
console.log('🎉 Successfully applied all OSGB Manager login and sync patches to:', targetPath);
