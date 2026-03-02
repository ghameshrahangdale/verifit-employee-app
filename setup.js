const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const ask = (q) => new Promise((res) => rl.question(q, res));

(async () => {
  const appName = await ask('App display name (e.g. My Client App): ');
  const packageName = await ask('Package name (e.g. com.client.myapp): ');
  const projectName = appName.replace(/\s+/g, '_').toLowerCase();

  rl.close();

  // 1️⃣ Update app.json
  const appJsonPath = path.join(__dirname, 'app.json');
  const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));

  appJson.name = projectName;
  appJson.displayName = appName;
  appJson.package = packageName;

  fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2));

  console.log('✅ app.json updated');

  // 2️⃣ Rename Android package
  const oldPackage = 'com.verifiit';
  const newPackagePath = packageName.replace(/\./g, '/');

  const androidSrc = path.join(
    __dirname,
    'android/app/src/main/java'
  );

  const oldPath = path.join(androidSrc, 'com.verifiit');
  const newPath = path.join(androidSrc, newPackagePath);

  fs.mkdirSync(path.dirname(newPath), { recursive: true });
  fs.renameSync(oldPath, newPath);

  console.log('✅ Android package folder renamed');

  // 3️⃣ Replace package references
  const filesToUpdate = [
    'android/app/build.gradle',
    'android/app/src/main/AndroidManifest.xml',
    'android/app/src/main/java/**',
  ];

  const replaceInFile = (file) => {
    const content = fs.readFileSync(file, 'utf8');
    fs.writeFileSync(
      file,
      content.replace(/com\.verifiit/g, packageName)
    );
  };

  const walk = (dir) => {
    fs.readdirSync(dir).forEach((f) => {
      const p = path.join(dir, f);
      if (fs.statSync(p).isDirectory()) walk(p);
      else if (p.endsWith('.java') || p.endsWith('.kt') || p.endsWith('.xml')) {
        replaceInFile(p);
      }
    });
  };

  walk(path.join(__dirname, 'android'));

  console.log('✅ Package references updated');

  // 4️⃣ Update strings.xml (App Name)
  const stringsXml = path.join(
    __dirname,
    'android/app/src/main/res/values/strings.xml'
  );

  let xml = fs.readFileSync(stringsXml, 'utf8');
  xml = xml.replace(
    /<string name="app_name">.*<\/string>/,
    `<string name="app_name">${appName}</string>`
  );

  fs.writeFileSync(stringsXml, xml);

  console.log('🎉 Setup complete! Run npm run android --reset-cache');
})();
