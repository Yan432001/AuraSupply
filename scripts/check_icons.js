const fs = require('fs');

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const importMatch = content.match(/import\s*\{([\s\S]*?)\}\s*from\s*['"]@ant-design\/icons['"]/);
  if (!importMatch) {
    console.log(filePath, ': No @ant-design/icons import found');
    return;
  }
  const importedIcons = new Set(importMatch[1].split(/[,\s]+/).map(s => s.trim()).filter(Boolean));
  // Find all <IconName and icon={<IconName
  const tagIcons = [...content.matchAll(/<([A-Za-z0-9]+Outlined)[\s\/>]/g)].map(m => m[1]);
  const propIcons = [...content.matchAll(/icon=\{<([A-Za-z0-9]+Outlined)/g)].map(m => m[1]);
  const usedIcons = new Set([...tagIcons, ...propIcons]);

  const missing = [];
  for (const icon of usedIcons) {
    if (!importedIcons.has(icon)) {
      missing.push(icon);
    }
  }

  if (missing.length > 0) {
    console.log(filePath, 'MISSING ICONS:', missing);
  } else {
    console.log(filePath, 'All', usedIcons.size, 'icons properly imported!');
  }
}

checkFile('AuraTheme/src/pages/admins/BpasInventoryWorkspace.jsx');
checkFile('AuraTheme/src/pages/admins/BpasPurchaseOrdersWorkspace.jsx');
checkFile('AuraTheme/src/pages/admins/BpasAddPurchaseOrderPage.jsx');
checkFile('AuraTheme/src/pages/admins/BpasEditPurchaseOrderPage.jsx');
checkFile('AuraTheme/src/pages/admins/BpasPurchaseRequestsWorkspace.jsx');
checkFile('AuraTheme/src/pages/admins/BpasAddPurchaseRequestPage.jsx');
checkFile('AuraTheme/src/pages/admins/BpasEditPurchaseRequestPage.jsx');
